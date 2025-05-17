#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dusko 洗盘检测系统（文件输入版）
整合数据加载、图模型、检测算法、黑名单等功能
输入为CSV文件，输出对敲地址列表
"""

import os
import sys
import argparse
import pandas as pd
from collections import defaultdict, deque
import networkx as nx


# ===================== 数据加载模块 =====================
class TransactionLoader:
    """通用交易数据加载器"""

    @staticmethod
    def load_data(file_path):
        required_columns = {
            'from_address', 'to_address', 'value',
            'transaction_hash', 'timestamp'
        }

        try:
            df = pd.read_csv(file_path)
            missing_cols = required_columns - set(df.columns)
            if missing_cols:
                raise ValueError(f"CSV文件缺少必要字段: {missing_cols}")
            return df
        except Exception as e:
            print(f"数据加载失败: {str(e)}")
            sys.exit(1)


# ===================== 图模型模块 =====================
class TokenFlowGraph:
    """交易图模型（保持原有实现不变）"""

    def __init__(self, transactions_df=None):
        self.graph = nx.DiGraph()
        self.address_states = defaultdict(float)
        self.transactions = []
        if transactions_df is not None:
            self.build_graph(transactions_df)

    def build_graph(self, transactions_df):
        edge_data = defaultdict(lambda: {'weight': 0.0, 'transactions': []})
        for _, row in transactions_df.iterrows():
            from_address = row['from_address']
            to_address = row['to_address']
            value = float(row['value'])
            tx_hash = row['transaction_hash'] if 'transaction_hash' in row else row.get('tx_hash', '')
            timestamp = row['timestamp']
            edge_key = (from_address, to_address)
            edge_data[edge_key]['weight'] += value
            edge_data[edge_key]['transactions'].append({
                'tx_hash': tx_hash,
                'from_address': from_address,
                'to_address': to_address,
                'value': value,
                'timestamp': timestamp
            })
            self.address_states[from_address] -= value
            self.address_states[to_address] += value
            self.transactions.append({
                'tx_hash': tx_hash,
                'from_address': from_address,
                'to_address': to_address,
                'value': value,
                'timestamp': timestamp
            })
        all_addresses = set()
        for from_addr, to_addr in edge_data.keys():
            all_addresses.add(from_addr)
            all_addresses.add(to_addr)
        self.graph.add_nodes_from(all_addresses)
        for (from_addr, to_addr), data in edge_data.items():
            self.graph.add_edge(from_addr, to_addr, **data)

    def get_key_nodes(self, min_degree=5):
        key_nodes = []
        for node in self.graph.nodes():
            degree = self.graph.in_degree(node) + self.graph.out_degree(node)
            if degree >= min_degree:
                key_nodes.append(node)
        return key_nodes

    def get_node_neighbors(self, node):
        predecessors = list(self.graph.predecessors(node))
        successors = list(self.graph.successors(node))
        neighbors = list(set(predecessors + successors))
        return neighbors

    def get_node_map(self):
        node_map = {}
        predecessors = {node: list(self.graph.predecessors(node)) for node in self.graph.nodes()}
        successors = {node: list(self.graph.successors(node)) for node in self.graph.nodes()}
        for node in self.graph.nodes():
            node_map[node] = list(set(predecessors[node] + successors[node]))
        return node_map

    def get_transactions_between(self, node1, node2):
        transactions = []
        if self.graph.has_edge(node1, node2):
            transactions.extend(self.graph[node1][node2]['transactions'])
        if self.graph.has_edge(node2, node1):
            transactions.extend(self.graph[node2][node1]['transactions'])
        return transactions

    def is_wash_trade(self, nodes, transactions, threshold=0.8):
        # 简化版：只要环内资金流动比例大于阈值即判定为洗盘
        total_value = sum([tx['value'] for tx in transactions])
        state_change = sum([abs(self.address_states[node]) for node in nodes])
        if total_value == 0:
            return False
        rate = 1 - (state_change / total_value)
        return rate >= threshold

    def calculate_state_change_rate(self, nodes, transactions):
        total_value = sum([tx['value'] for tx in transactions])
        state_change = sum([abs(self.address_states[node]) for node in nodes])
        if total_value == 0:
            return 0.0
        return 1 - (state_change / total_value)

# ===================== 循环节点检测算法 =====================
class CircleNodeWashTradeDetector:
    def __init__(self, token_flow_graph, threshold=0.8):
        self.graph = token_flow_graph
        self.threshold = threshold
        self.cycles = []
        self.wash_trades = []

    def detect(self, max_nodes=None):
        self.cycles = []
        self.wash_trades = []
        node_map = self.graph.get_node_map()
        all_nodes = list(self.graph.graph.nodes())
        if max_nodes is not None and len(all_nodes) > max_nodes:
            node_degrees = {node: self.graph.graph.degree(node) for node in all_nodes}
            all_nodes = sorted(all_nodes, key=lambda n: node_degrees[n], reverse=True)[:max_nodes]
        for start_node in all_nodes:
            self._dfs_find_cycles(start_node, node_map)
        unique_cycles_set = set()
        unique_cycles = []
        for cycle in self.cycles:
            cycle_tuple = tuple(sorted(cycle))
            if cycle_tuple not in unique_cycles_set:
                unique_cycles_set.add(cycle_tuple)
                unique_cycles.append(list(cycle_tuple))
        self.cycles = unique_cycles
        for cycle in self.cycles:
            self._check_wash_trade(cycle)
        return self.wash_trades

    def _dfs_find_cycles(self, start_node, node_map, max_depth=5):
        stack = [(start_node, [start_node], {start_node})]
        while stack:
            node, path, path_set = stack.pop()
            if len(path) > max_depth:
                continue
            neighbors = node_map.get(node, [])
            for neighbor in reversed(neighbors):
                if neighbor == start_node and len(path) > 2:
                    self.cycles.append(path.copy())
                    continue
                if neighbor in path_set:
                    continue
                new_path = path + [neighbor]
                new_path_set = path_set.copy()
                new_path_set.add(neighbor)
                stack.append((neighbor, new_path, new_path_set))

    def _check_wash_trade(self, cycle):
        transactions = []
        node_pairs = set()
        for i in range(len(cycle)):
            node1 = cycle[i]
            node2 = cycle[(i + 1) % len(cycle)]
            pair = tuple(sorted([node1, node2]))
            if pair in node_pairs:
                continue
            node_pairs.add(pair)
            txs = self.graph.get_transactions_between(node1, node2)
            transactions.extend(txs)
        if not transactions:
            return
        if self.graph.is_wash_trade(cycle, transactions, self.threshold):
            self.wash_trades.append({
                'cycle': cycle,
                'transactions': transactions,
                'rate': self.graph.calculate_state_change_rate(cycle, transactions)
            })


# ===================== 邻居节点检测算法 =====================
class NeighborNodeWashTradeDetector:
    def __init__(self, token_flow_graph, threshold=0.8, min_degree=3):
        self.graph = token_flow_graph
        self.threshold = threshold
        self.min_degree = min_degree
        self.wash_trades = []
        self.visited = set()  # 新增全局访问记录

    def detect(self):
        self.wash_trades = []
        key_nodes = self.graph.get_key_nodes(self.min_degree)
        for start_node in key_nodes:
            if start_node not in self.visited:  # 避免重复检测
                self._detect_from_node(start_node)
        return self.wash_trades

    def _detect_from_node(self, start_node):
        queue = deque([start_node])
        self.visited.add(start_node)  # 记录已访问

        # 新增循环终止条件
        max_neighbors = 20  # 最大检测邻居数
        checked_pairs = set()  # 已检测节点对

        while queue and len(self.visited) < max_neighbors:
            current_node = queue.popleft()
            neighbors = self.graph.get_node_neighbors(current_node)

            for neighbor in neighbors:
                if len(self.visited) >= max_neighbors:
                    break

                if neighbor not in self.visited:
                    self.visited.add(neighbor)
                    queue.append(neighbor)

                    # 仅检测新节点与现有节点的关系（新增）
                    self._check_pair(current_node, neighbor, checked_pairs)

    def _check_pair(self, node1, node2, checked_pairs):
        """新增方法：检测节点对组合"""
        pair = tuple(sorted([node1, node2]))
        if pair in checked_pairs:
            return
        checked_pairs.add(pair)

        txs = self.graph.get_transactions_between(node1, node2)
        if txs and self.graph.is_wash_trade([node1, node2], txs, self.threshold):
            self.wash_trades.append({
                'nodes': [node1, node2],
                'transactions': txs,
                'rate': self.graph.calculate_state_change_rate([node1, node2], txs)
            })

# ===================== 黑名单模块 =====================
class WashTradeBlacklist:
    def __init__(self, wash_trades_df=None):
        self.blacklist = set()
        self.blacklist_info = {}
        self.wash_trades_df = wash_trades_df

    def generate_blacklist(self):
        if self.wash_trades_df is None or len(self.wash_trades_df) == 0:
            print("没有对敲交易数据，无法生成黑名单")
            return set()
        for _, row in self.wash_trades_df.iterrows():
            if 'cycle' in row:
                addresses = row['cycle'].split('->')
                for addr in addresses:
                    self._add_to_blacklist(addr, row)
            if 'from_address' in row and 'to_address' in row:
                self._add_to_blacklist(row['from_address'], row)
                self._add_to_blacklist(row['to_address'], row)
        print(f"已生成黑名单，包含 {len(self.blacklist)} 个地址")
        return self.blacklist

    def _add_to_blacklist(self, address, transaction):
        self.blacklist.add(address)
        if address not in self.blacklist_info:
            self.blacklist_info[address] = {
                'address': address,
                'wash_trade_count': 0,
                'wash_trade_volume': 0,
                'transactions': []
            }
        if 'tx_hash' in transaction and 'value' in transaction:
            tx_info = {
                'tx_hash': transaction['tx_hash'],
                'value': float(transaction['value'])
            }
            self.blacklist_info[address]['wash_trade_count'] += 1
            self.blacklist_info[address]['wash_trade_volume'] += tx_info['value']
            if tx_info not in self.blacklist_info[address]['transactions']:
                self.blacklist_info[address]['transactions'].append(tx_info)

    def save_blacklist(self, output_dir, token_symbol):
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        blacklist_file = os.path.join(output_dir, f"{token_symbol}_blacklist.txt")
        with open(blacklist_file, 'w') as f:
            for address in sorted(self.blacklist):
                f.write(f"{address}\n")
        print(f"黑名单已保存到 {blacklist_file}")
        return blacklist_file


# ===================== 主程序入口 =====================
def main():
    # 硬编码参数设置（可自行修改以下值）
    # 在Args类中增加超时参数（新增）
    class Args:
        input = "data.csv"
        output = "wash_trade_addresses.txt"
        threshold = 0.8
        min_degree = 3
        algorithm = "both"
        timeout = 60  # 新增超时设置（秒）

    args = Args()

    # 数据加载
    print(f"正在加载数据: {args.input}")
    try:
        df = TransactionLoader.load_data(args.input)
        print(f"成功加载 {len(df):,} 条交易记录")
    except Exception as e:
        print(f"数据加载失败，请检查文件路径: {str(e)}")
        return

    # 构建交易图
    print("构建交易网络...")
    graph = TokenFlowGraph(df)

    # 执行检测
    all_addresses = set()
    detectors = []

    if args.algorithm in ['circle', 'both']:
        print("执行循环节点检测...")
        circle_detector = CircleNodeWashTradeDetector(graph, args.threshold)
        circle_results = circle_detector.detect()
        for res in circle_results:
            all_addresses.update(res['cycle'])
        print(f"发现 {len(circle_results)} 个循环模式")

    if args.algorithm in ['neighbor', 'both']:
        print("执行邻居节点检测...")
        neighbor_detector = NeighborNodeWashTradeDetector(graph, args.threshold, args.min_degree)
        neighbor_results = neighbor_detector.detect()
        for res in neighbor_results:
            all_addresses.update(res['nodes'])
        print(f"发现 {len(neighbor_results)} 个集群模式")

    # 保存结果
    print(f"\n发现 {len(all_addresses)} 个可疑地址")
    # 读取已存在的地址
    existing = set()
    if os.path.exists(args.output):
        with open(args.output, 'r') as f:
            existing = {line.strip() for line in f.readlines()}

    # 合并新旧地址并去重
    all_addresses = existing.union(all_addresses)

    # 按字母顺序写入文件
    with open(args.output, 'w') as f:
        for addr in sorted(all_addresses):
            f.write(f"{addr}\n")

    print(f"结果已保存至: {os.path.abspath(args.output)}")


if __name__ == "__main__":
    main()