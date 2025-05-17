import { ethers } from 'ethers';
import { store } from '../store/store';
import { 
  setWallet, 
  disconnectWallet, 
  updateBalance, 
  setBalanceLoading,
  updateTokenBalances, 
  setTokenBalancesLoading,
  setTransactionsLoading,
  updateTransactions,
  TokenBalance,
  Transaction
} from '../store/walletSlice';
import axios from 'axios';
import { CURRENT_NETWORK } from '../config/contracts';

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  
  // 强制使用 Sepolia 测试网
  private currentNetwork = 'sepolia'; // 只允许使用 Sepolia 测试网
  
  // 网络配置
  private networks = {
    mainnet: {
      chainId: '0x1',
      chainName: 'Ethereum Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.infura.io/v3/'],
      blockExplorerUrls: ['https://etherscan.io']
    },
    sepolia: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Testnet',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://sepolia.infura.io/v3/'],
      blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    localhost: {
      chainId: '0x7a69',
      chainName: 'Localhost 31337',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['http://localhost:8545'],
      blockExplorerUrls: ['']
    }
  };
  
  // 获取provider实例
  public getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }
  
  // 获取signer实例
  public getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  // 检查是否已安装MetaMask
  public isMetaMaskInstalled(): boolean {
    return window.ethereum !== undefined;
  }

  // 检查当前网络是否正确
  private async checkNetwork(): Promise<boolean> {
    try {
      if (!this.provider) return false;
      
      const network = await this.provider.getNetwork();
      const currentChainIdHex = `0x${network.chainId.toString(16)}`;
      const targetNetwork = this.networks[CURRENT_NETWORK];
      
      console.log(`当前网络: ${currentChainIdHex}, 目标网络: ${targetNetwork.chainId}`);
      
      if (currentChainIdHex !== targetNetwork.chainId) {
        const confirmed = window.confirm(`请切换到 ${targetNetwork.chainName} 网络以使用本应用。点击确定切换网络。`);
        
        if (confirmed) {
          return await this.switchNetwork();
        } else {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('检查网络失败:', error);
      return false;
    }
  }
  
  // 切换到指定网络
  private async switchNetwork(): Promise<boolean> {
    try {
      const targetNetwork = this.networks[CURRENT_NETWORK];
      
      try {
        // 尝试切换到现有网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetNetwork.chainId }],
        });
        return true;
      } catch (switchError) {
        // 如果网络不存在，添加该网络
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: targetNetwork.chainId,
                  chainName: targetNetwork.chainName,
                  nativeCurrency: targetNetwork.nativeCurrency,
                  rpcUrls: targetNetwork.rpcUrls,
                  blockExplorerUrls: targetNetwork.blockExplorerUrls
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error('添加网络失败:', addError);
            return false;
          }
        }
        console.error('切换网络失败:', switchError);
        return false;
      }
    } catch (error) {
      console.error('切换网络失败:', error);
      return false;
    }
  }

  // 连接钱包
  public async connectWallet(): Promise<boolean> {
    try {
      console.log('开始连接钱包...');
      
      if (!this.isMetaMaskInstalled()) {
        console.error('MetaMask未安装');
        alert('请安装MetaMask钱包插件');
        window.open('https://metamask.io/download/', '_blank');
        return false;
      }
      
      console.log('MetaMask已安装，window.ethereum:', window.ethereum);
      
      // 先尝试切换到 Sepolia 测试网，然后再连接钱包
      try {
        const targetNetwork = this.networks['sepolia'];
        console.log('尝试切换到 Sepolia 测试网...');
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetNetwork.chainId }],
          });
          console.log('Sepolia 测试网切换成功');
        } catch (switchError) {
          // 如果网络不存在，添加该网络
          if (switchError.code === 4902) {
            try {
              console.log('添加 Sepolia 测试网...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetNetwork.chainId,
                    chainName: targetNetwork.chainName,
                    nativeCurrency: targetNetwork.nativeCurrency,
                    rpcUrls: targetNetwork.rpcUrls,
                    blockExplorerUrls: targetNetwork.blockExplorerUrls
                  },
                ],
              });
              console.log('Sepolia 测试网添加成功');
            } catch (addError) {
              console.error('添加 Sepolia 测试网失败:', addError);
              alert(`添加 Sepolia 测试网失败: ${addError.message}\n请手动切换网络。`);
              return false;
            }
          } else {
            console.error('切换到 Sepolia 测试网失败:', switchError);
            alert(`切换到 Sepolia 测试网失败: ${switchError.message}\n请手动切换网络。`);
            return false;
          }
        }
      } catch (error) {
        console.error('切换网络过程中出错:', error);
      }
      
      try {
        // 创建provider
        console.log('创建provider...');
        this.provider = new ethers.BrowserProvider(window.ethereum);
        console.log('provider创建成功:', this.provider);
        
        // 请求用户连接 - 使用更直接的方法
        console.log('请求用户连接...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('获取到账户:', accounts);
        
        if (!accounts || accounts.length === 0) {
          console.error('未获取到账户');
          return false;
        }
        
        // 检查并切换到正确的网络
        const networkCorrect = await this.checkNetwork();
        if (!networkCorrect) {
          console.error('网络检查失败或用户取消切换');
          return false;
        }

        // 获取signer
        console.log('获取signer...');
        this.signer = await this.provider.getSigner();
        console.log('signer获取成功:', this.signer);
        
        const address = await this.signer.getAddress();
        console.log('获取到地址:', address);
        
        // 获取余额
        console.log('获取余额...');
        const balance = await this.provider.getBalance(address);
        const formattedBalance = ethers.formatEther(balance);
        console.log('余额:', formattedBalance, 'ETH');
        
        // 获取chainId
        console.log('获取chainId...');
        const network = await this.provider.getNetwork();
        const chainId = network.chainId.toString();
        console.log('链 ID:', chainId);

        // 更新Redux状态
        console.log('更新Redux状态...');
        store.dispatch(setWallet({
          address,
          balance: formattedBalance,
          chainId,
        }));

        // 监听账户变化
        console.log('设置账户变化监听器...');
        window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
        window.ethereum.on('accountsChanged', this.handleAccountsChanged);
        
        // 监听链变化
        console.log('设置链变化监听器...');
        window.ethereum.removeListener('chainChanged', this.handleChainChanged);
        window.ethereum.on('chainChanged', this.handleChainChanged);

        console.log('钱包连接成功!');
        return true;
      } catch (innerError) {
        console.error('连接钱包过程中出错:', innerError);
        alert(`连接钱包失败: ${innerError.message || '未知错误'}`);
        return false;
      }
    } catch (error) {
      console.error('连接钱包失败:', error);
      alert(`连接钱包失败: ${error.message || '未知错误'}`);
      return false;
    }
  }

  // 断开钱包连接
  public disconnectWallet(): void {
    // 移除事件监听器
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
    
    this.provider = null;
    this.signer = null;
    
    // 更新Redux状态
    store.dispatch(disconnectWallet());
  }

  // 处理账户变化
  private handleAccountsChanged = async (accounts: string[]): Promise<void> => {
    if (accounts.length === 0) {
      // 用户断开了连接
      this.disconnectWallet();
    } else {
      // 账户切换
      if (this.provider) {
        const newAddress = accounts[0];
        const balance = await this.provider.getBalance(newAddress);
        const formattedBalance = ethers.formatEther(balance);
        
        const network = await this.provider.getNetwork();
        const chainId = network.chainId.toString();

        store.dispatch(setWallet({
          address: newAddress,
          balance: formattedBalance,
          chainId,
        }));
      }
    }
  };

  // 处理链变化
  private handleChainChanged = (): void => {
    // 当链变化时，最简单的方法是刷新页面
    window.location.reload();
  };

  // 刷新钱包余额
  public async refreshBalance(): Promise<void> {
    try {
      const state = store.getState().wallet;
      
      if (!state.isConnected || !state.address || !this.provider) {
        return;
      }
      
      store.dispatch(setBalanceLoading(true));
      
      // 获取ETH余额
      const balance = await this.provider.getBalance(state.address);
      const formattedBalance = ethers.formatEther(balance);
      
      store.dispatch(updateBalance({
        balance: balance.toString(),
        formattedBalance
      }));
      
      // 获取代币余额
      await this.fetchTokenBalances();
      
      // 获取交易历史
      await this.fetchTransactionHistory();
      
      store.dispatch(setBalanceLoading(false));
    } catch (error) {
      console.error('刷新余额失败:', error);
      store.dispatch(setBalanceLoading(false));
    }
  }
  
  // 获取代币余额
  public async fetchTokenBalances(): Promise<void> {
    try {
      const state = store.getState().wallet;
      
      if (!state.isConnected || !state.address || !this.provider || !state.chainId) {
        return;
      }
      
      store.dispatch(setTokenBalancesLoading(true));
      
      // 定义常用稳定币地址（根据不同网络有所不同）
      const STABLECOIN_ADDRESSES: Record<string, Record<string, string>> = {
        // Ethereum Mainnet
        '1': {
          'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        },
        // Goerli Testnet
        '5': {
          'USDC': '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
          'USDT': '0x509ee0d083ddf8ac028f2a56731412edd63223b9',
          'DAI': '0x73967c6a0904aa032c103b4104747e88c566b1a2',
        },
        // Sepolia Testnet
        '11155111': {
          'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          'USDT': '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
          'DAI': '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
        },
      };
      
      // ERC20代币ABI（只包含我们需要的函数）
      const ERC20_ABI = [
        // 查询余额
        'function balanceOf(address owner) view returns (uint256)',
        // 查询代币名称
        'function name() view returns (string)',
        // 查询代币符号
        'function symbol() view returns (string)',
        // 查询代币精度
        'function decimals() view returns (uint8)',
      ];
      
      const stablecoins = STABLECOIN_ADDRESSES[state.chainId] || {};
      const tokenPromises = Object.entries(stablecoins).map(async ([symbol, tokenAddress]) => {
        try {
          const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
          const balance = await tokenContract.balanceOf(state.address);
          const name = await tokenContract.name();
          const decimals = await tokenContract.decimals();
          
          // 格式化余额（考虑代币精度）
          const formattedBalance = ethers.formatUnits(balance, decimals);
          
          return {
            symbol,
            name,
            address: tokenAddress,
            balance: balance.toString(),
            decimals,
            formattedBalance
          };
        } catch (error) {
          console.error(`获取${symbol}余额失败:`, error);
          return null;
        }
      });

      const results = await Promise.all(tokenPromises);
      const tokenBalances = results.filter((token): token is TokenBalance => token !== null);
      
      store.dispatch(updateTokenBalances(tokenBalances));
    } catch (error) {
      console.error('获取代币余额失败:', error);
      store.dispatch(setTokenBalancesLoading(false));
    }
  }
  
  // 获取交易历史
  public async fetchTransactionHistory(): Promise<void> {
    try {
      const state = store.getState().wallet;
      
      if (!state.isConnected || !state.address || !state.chainId) {
        return;
      }
      
      store.dispatch(setTransactionsLoading(true));
      
      // 使用Etherscan API获取交易历史（此处使用模拟数据，实际应用中需要使用真实API密钥）
      // const apiKey = 'YOUR_ETHERSCAN_API_KEY';
      // const apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${state.address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
      
      // 模拟数据
      const mockTransactions: Transaction[] = [
        {
          hash: '0x' + Math.random().toString(16).substr(2, 40),
          timestamp: Math.floor(Date.now() / 1000) - 3600, // 1小时前
          from: state.address!,
          to: '0x' + Math.random().toString(16).substr(2, 40),
          value: (0.1 * 1e18).toString(),
          gasUsed: (21000).toString(),
          status: 'success',
          type: 'send'
        },
        {
          hash: '0x' + Math.random().toString(16).substr(2, 40),
          timestamp: Math.floor(Date.now() / 1000) - 86400, // 1天前
          from: '0x' + Math.random().toString(16).substr(2, 40),
          to: state.address!,
          value: (0.5 * 1e18).toString(),
          gasUsed: (21000).toString(),
          status: 'success',
          type: 'receive'
        },
        {
          hash: '0x' + Math.random().toString(16).substr(2, 40),
          timestamp: Math.floor(Date.now() / 1000) - 172800, // 2天前
          from: state.address!,
          to: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC合约地址
          value: '0',
          gasUsed: (65000).toString(),
          status: 'success',
          type: 'contract'
        }
      ];
      
      // 实际应用中需要发送真实请求
      // const response = await axios.get(apiUrl);
      // const transactions = response.data.result.map((tx: any) => ({
      //   hash: tx.hash,
      //   timestamp: parseInt(tx.timeStamp),
      //   from: tx.from,
      //   to: tx.to,
      //   value: tx.value,
      //   gasUsed: tx.gasUsed,
      //   status: tx.isError === '0' ? 'success' : 'failed',
      //   type: tx.from.toLowerCase() === state.address.toLowerCase() ? 'send' : 'receive'
      // }));
      
      store.dispatch(updateTransactions(mockTransactions));
    } catch (error) {
      console.error('获取交易历史失败:', error);
      store.dispatch(setTransactionsLoading(false));
    }
  }
}

// 创建单例实例
const walletService = new WalletService();
export default walletService;

// 为TypeScript添加window.ethereum类型
// 注意：ethereum 类型已在 src/types/ethereum.d.ts 中定义
