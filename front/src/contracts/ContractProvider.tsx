import React, { createContext, useContext, ReactNode, useState } from 'react';
import { ethers } from 'ethers';
import CoreLendingABI from './abi/CoreLending.json';
import { getContractAddresses, BLOCK_EXPLORER_URLS, CURRENT_NETWORK } from '../config/contracts';

// 从配置文件获取智能合约地址
const contractAddresses = getContractAddresses();
const CORE_LENDING_ADDRESS = contractAddresses.coreLending;
const LENDING_POOL_ADDRESS = contractAddresses.lendingPool;

// 获取 Etherscan 链接
const getEtherscanLink = (hash: string) => {
  return `${BLOCK_EXPLORER_URLS[CURRENT_NETWORK]}/tx/${hash}`;
};

// 创建合约上下文
interface ContractContextType {
  // 账户状态
  address?: string;
  isConnected: boolean;
  
  // 合约交互函数
  borrowWithoutCollateral: (amount: string, duration: number) => Promise<{ hash: string }>;
  borrow: (amount: string, collateralAmount: string, duration: number) => Promise<{ hash: string }>;
  repay: (loanId: number) => Promise<{ hash: string }>;
  txStatus: 'idle' | 'pending' | 'success' | 'error';
  txHash: string | null;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

// 合约提供者组件
export function ContractProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // 连接钱包
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 请求账户访问
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(accounts[0]);
        setIsConnected(true);
        return accounts[0];
      } catch (error) {
        console.error('连接钱包失败:', error);
        throw error;
      }
    } else {
      throw new Error('请安装 MetaMask!');
    }
  };
  
  // 检查网络是否是 Sepolia
  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = network.chainId.toString(16);
      const currentChainIdHex = `0x${chainId}`;
      
      // Sepolia 测试网的 chainId 是 0xaa36a7 (十进制: 11155111)
      const targetChainId = '0xaa36a7'; // 十六进制
      const targetChainIdDecimal = 11155111; // 十进制
      
      console.log(`当前网络: ${currentChainIdHex}, 目标网络: ${targetChainId}, 网络名称: ${network.name}`);
      
      // 检查当前网络是否是 Sepolia
      // 允许多种形式的比较，因为不同的钱包可能返回不同格式的 chainId
      const currentChainIdDecimal = parseInt(chainId, 16);
      const isSepolia = currentChainIdHex === targetChainId || 
                       currentChainIdHex === `0x${targetChainIdDecimal.toString(16)}` || 
                       currentChainIdDecimal === targetChainIdDecimal;
      
      if (!isSepolia) {
        // 显示当前网络和目标网络的名称
        let currentNetworkName = '未知网络';
        
        // 根据 chainId 识别常见网络
        if (currentChainIdHex === '0x1' || currentChainIdDecimal === 1) currentNetworkName = 'Ethereum 主网';
        else if (currentChainIdHex === '0x5' || currentChainIdDecimal === 5) currentNetworkName = 'Goerli 测试网';
        // 删除了 Optimism 相关的网络检查
        else if (currentChainIdHex === '0x89' || currentChainIdDecimal === 137) currentNetworkName = 'Polygon 主网';
        else if (currentChainIdHex === '0x13881' || currentChainIdDecimal === 80001) currentNetworkName = 'Polygon Mumbai 测试网';
        
        const confirmed = window.confirm(`您当前连接的是 ${currentNetworkName} (${currentChainIdHex})\n\n本应用需要连接到 Sepolia 测试网 (${targetChainId})\n\n点击确定切换网络。`);
        
        if (confirmed) {
          try {
            // 尝试切换到 Sepolia 网络
            console.log(`尝试切换到 Sepolia 测试网 (chainId: ${targetChainId})...`);
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
            });
            
            // 等待一下，确保网络切换完成
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 再次检查网络
            const updatedProvider = new ethers.BrowserProvider(window.ethereum);
            const updatedNetwork = await updatedProvider.getNetwork();
            const updatedChainId = `0x${updatedNetwork.chainId.toString(16)}`;
            
            if (updatedChainId !== targetChainId) {
              throw new Error(`网络切换失败，当前网络仍然是 ${updatedChainId}`);
            }
            
            return true;
          } catch (switchError) {
            // 如果网络不存在，添加该网络
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: targetChainId,
                      chainName: 'Sepolia Testnet',
                      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
                      rpcUrls: ['https://sepolia.infura.io/v3/', 'https://rpc.sepolia.org'],
                      blockExplorerUrls: ['https://sepolia.etherscan.io']
                    },
                  ],
                });
                
                // 等待一下，确保网络添加完成
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 再次检查网络
                const updatedProvider = new ethers.BrowserProvider(window.ethereum);
                const updatedNetwork = await updatedProvider.getNetwork();
                const updatedChainId = `0x${updatedNetwork.chainId.toString(16)}`;
                
                if (updatedChainId !== targetChainId) {
                  throw new Error(`网络添加成功，但切换失败。请手动切换到 Sepolia 测试网。`);
                }
                
                return true;
              } catch (addError) {
                console.error('添加网络失败:', addError);
                alert(`添加 Sepolia 测试网失败: ${addError.message}\n\n请手动切换网络。`);
                throw new Error('添加 Sepolia 测试网失败，请手动切换网络。');
              }
            }
            console.error('切换网络失败:', switchError);
            alert(`切换到 Sepolia 测试网失败: ${switchError.message}\n\n请手动切换网络。`);
            throw new Error('切换到 Sepolia 测试网失败，请手动切换网络。');
          }
        } else {
          alert('请切换到 Sepolia 测试网以使用本应用。');
          throw new Error('请切换到 Sepolia 测试网以使用本应用。');
        }
      }
      
      return true;
    } else {
      throw new Error('请安装 MetaMask!');
    }
  };
  
  // 创建合约实例
  const getContract = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 强制检查网络是否是 Sepolia
        const networkCheck = await checkNetwork();
        if (!networkCheck) {
          alert('请切换到 Sepolia 测试网，应用将自动尝试切换');
          // 强制切换到 Sepolia 测试网
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
          // 等待网络切换
          await new Promise(resolve => setTimeout(resolve, 1500));
          // 再次检查网络
          const secondCheck = await checkNetwork();
          if (!secondCheck) {
            throw new Error('无法切换到 Sepolia 测试网，请手动切换');
          }
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return new ethers.Contract(CORE_LENDING_ADDRESS, CoreLendingABI, signer);
      } catch (error) {
        console.error('创建合约实例失败:', error);
        throw error;
      }
    } else {
      throw new Error('请安装 MetaMask!');
    }
  };
  
  // 无抵押借款
  const borrowWithoutCollateral = async (amount: string, duration: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      setTxStatus('pending');
      const contract = await getContract();
      const amountInWei = ethers.parseEther(amount);
      
      const tx = await contract.borrowWithoutCollateral(amountInWei, duration);
      setTxHash(tx.hash);
      
      // 等待交易确认
      await tx.wait();
      setTxStatus('success');
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('无抵押借款失败:', error);
      setTxStatus('error');
      throw error;
    }
  };
  
  // 有抵押借款
  const borrow = async (amount: string, collateralAmount: string, duration: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      setTxStatus('pending');
      const contract = await getContract();
      const amountInWei = ethers.parseEther(amount);
      const collateralInWei = ethers.parseEther(collateralAmount);
      
      const tx = await contract.borrow(amountInWei, collateralInWei, duration);
      setTxHash(tx.hash);
      
      // 等待交易确认
      await tx.wait();
      setTxStatus('success');
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('借款失败:', error);
      setTxStatus('error');
      throw error;
    }
  };
  
  // 还款
  const repay = async (loanId: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      setTxStatus('pending');
      const contract = await getContract();
      
      const tx = await contract.repay(loanId);
      setTxHash(tx.hash);
      
      // 等待交易确认
      await tx.wait();
      setTxStatus('success');
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('还款失败:', error);
      setTxStatus('error');
      throw error;
    }
  };
  
  const value = {
    address,
    isConnected,
    txStatus,
    txHash,
    borrowWithoutCollateral,
    borrow,
    repay,
  };
  
  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
}

// 使用合约的钩子
export function useContract() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
}
