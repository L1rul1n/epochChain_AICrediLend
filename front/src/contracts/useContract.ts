import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CORE_LENDING_ADDRESS, CORE_LENDING_ABI, LENDING_POOL_ADDRESS, LENDING_POOL_ABI, getEtherscanLink } from './contractConfig';
import { isBlacklisted, initBlacklistService } from '../services/blacklistService';

// 借款相关 Hook
export const useLending = () => {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  
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
  
  // 创建合约实例
  const getContract = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // 检查当前网络
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const chainId = network.chainId.toString(16);
        const currentChainIdHex = `0x${chainId}`;
        
        // Sepolia 测试网的 chainId 是 0xaa36a7 (11155111)
        const targetChainId = '0xaa36a7';
        
        // 如果不是 Sepolia网络，尝试切换
        if (currentChainIdHex !== targetChainId) {
          console.log(`当前网络不是 Sepolia，尝试切换... 当前: ${currentChainIdHex}, 目标: ${targetChainId}`);
          
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
            });
            
            // 等待网络切换
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 重新获取网络信息
            const updatedProvider = new ethers.BrowserProvider(window.ethereum);
            const signer = await updatedProvider.getSigner();
            return new ethers.Contract(CORE_LENDING_ADDRESS, CORE_LENDING_ABI, signer);
          } catch (error) {
            console.error('切换网络失败:', error);
            throw new Error('请切换到 Sepolia 测试网后再尝试');
          }
        }
        
        const signer = await provider.getSigner();
        return new ethers.Contract(CORE_LENDING_ADDRESS, CORE_LENDING_ABI, signer);
      } catch (error) {
        console.error('创建合约实例失败:', error);
        throw error;
      }
    } else {
      throw new Error('请安装 MetaMask!');
    }
  };
  
  // 创建借贷池合约实例
  const getLendingPoolContract = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
    } else {
      throw new Error('请安装 MetaMask!');
    }
  };
  
  // 监控交易状态
  const monitorTransaction = async (txHash: string) => {
    if (!txHash) return;
    
    try {
      setTxStatus('pending');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const receipt = await provider.waitForTransaction(txHash);
      
      if (receipt && receipt.status === 1) {
        setTxStatus('success');
      } else {
        setTxStatus('error');
      }
    } catch (error) {
      console.error('交易监控失败:', error);
      setTxStatus('error');
    }
  };
  
  // 监听交易状态变化
  useEffect(() => {
    if (txHash) {
      monitorTransaction(txHash);
    }
  }, [txHash]);
  
  // 获取用户贷款
  const fetchLoans = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      setLoading(true);
      
      const lendingPoolContract = await getLendingPoolContract();
      const userLoans = await lendingPoolContract.getUserLoans(address);
      
      if (userLoans) {
        const formattedLoans = userLoans.map((loan: any) => ({
          id: loan.id.toString(),
          amount: ethers.formatEther(loan.amount),
          collateral: ethers.formatEther(loan.collateral),
          duration: loan.duration.toString(),
          startTime: new Date(Number(loan.startTime) * 1000).toLocaleString(),
          isRepaid: loan.isRepaid,
        }));
        
        setLoans(formattedLoans);
      }
    } catch (error) {
      console.error('获取贷款失败:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);
  
  // 首次加载时获取贷款
  useEffect(() => {
    if (isConnected && address) {
      fetchLoans();
    }
  }, [isConnected, address, fetchLoans]);
  
  // 监听钱包连接状态
  useEffect(() => {
    // 检查是否已经连接
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('检查钱包连接失败:', error);
        }
      }
    };
    
    checkConnection();
    
    // 监听账户变化
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          fetchLoans();
        } else {
          setAddress(undefined);
          setIsConnected(false);
          setLoans([]);
        }
      });
    }
    
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [fetchLoans]);
  
  // 初始化黑名单服务
  useEffect(() => {
    initBlacklistService().catch(error => {
      console.error('初始化黑名单服务失败:', error);
    });
  }, []);

  // 借款  // 有抵押借款
  const borrow = useCallback(async (amount: string, collateralAmount: string, duration: number) => {
    if (!isConnected) {
      await connectWallet();
    }

    // 检查地址是否在黑名单中
    if (address && isBlacklisted(address)) {
      throw new Error('您的地址在黑名单中，无法借款。如有疑问，请联系客服。');
    }

    try {
      setTxStatus('pending');
      console.log(`调用借款函数: 金额=${amount}, 抵押品=${collateralAmount}, 期限=${duration}`);
      
      // 金额转换为 Wei
      const amountInWei = ethers.parseUnits(amount, 18);
      const collateralInWei = ethers.parseUnits(collateralAmount, 18);
      
      console.log(`金额转换为 Wei: ${amountInWei.toString()}, 抵押品: ${collateralInWei.toString()}`);
      
      // 调用合约
      const contract = await getContract();
      console.log('合约实例创建成功，准备调用 borrow 方法');
      
      // 调用合约的 borrow 方法
      const tx = await contract.borrow(amountInWei, collateralInWei, duration);
      console.log('借款交易已发送:', tx);
      
      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('借款交易已确认:', receipt);
      
      setTxStatus('success');
      
      // 刷新贷款列表
      fetchLoans();
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('借款失败:', error);
      setTxStatus('error');
      throw error;
    }
  }, [isConnected, connectWallet, fetchLoans, address]);
  
  // 无抵押借款
  const borrowWithoutCollateral = useCallback(async (amount: string, duration: number) => {
    if (!isConnected) {
      await connectWallet();
    }

    // 检查地址是否在黑名单中
    if (address && isBlacklisted(address)) {
      throw new Error('您的地址在黑名单中，无法借款。如有疑问，请联系客服。');
    }

    try {
      setTxStatus('pending');
      console.log(`调用无抵押借款函数: 金额=${amount}, 期限=${duration}`);
      
      // 金额转换为 Wei
      const amountInWei = ethers.parseUnits(amount, 18);
      console.log(`金额转换为 Wei: ${amountInWei.toString()}`);
      
      // 调用合约
      const contract = await getContract();
      console.log('合约实例创建成功，准备调用 borrowWithoutCollateral 方法');
      
      // 调用合约的 borrowWithoutCollateral 方法
      const tx = await contract.borrowWithoutCollateral(amountInWei, duration);
      console.log('无抵押借款交易已发送:', tx);
      
      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('无抵押借款交易已确认:', receipt);
      
      setTxStatus('success');
      
      // 刷新贷款列表
      fetchLoans();
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('无抵押借款失败:', error);
      setTxStatus('error');
      throw error;
    }
  }, [isConnected, connectWallet, fetchLoans, address]);

  // 还款
  const repay = useCallback(async (loanId: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      setTxStatus('pending');
      console.log(`调用还款函数: 贷款ID=${loanId}`);
      
      // 调用合约
      const contract = await getContract();
      console.log('合约实例创建成功，准备调用 repay 方法');
      
      // 调用合约的 repay 方法
      const tx = await contract.repay(loanId);
      console.log('还款交易已发送:', tx);
      
      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('还款交易已确认:', receipt);
      
      setTxStatus('success');
      
      // 刷新贷款列表
      fetchLoans();
      
      return { hash: tx.hash, etherscanLink: getEtherscanLink(tx.hash) };
    } catch (error) {
      console.error('还款失败:', error);
      setTxStatus('error');
      throw error;
    }
  }, [isConnected, connectWallet, fetchLoans, address]);

  return {
    address,
    isConnected,
    connectWallet,
    loans,
    loading,
    txHash,
    txStatus,
    borrow,
    borrowWithoutCollateral,
    repay,
    fetchLoans,
  };
};

// 代币相关 Hook
export const useTokens = () => {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [balances, setBalances] = useState({
    tokenA: '0',
    tokenB: '0'
  });
  const [loading, setLoading] = useState(false);
  
  // 检查钱包连接状态
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('检查钱包连接失败:', error);
        }
      }
    };
    
    checkConnection();
    
    // 监听账户变化
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(undefined);
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // 获取代币余额
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) return;
    
    try {
      setLoading(true);
      
      // 这里应该从区块链获取代币余额
      // 目前使用模拟数据，后续应替换为真实数据
      setBalances({
        tokenA: '10000',
        tokenB: '15000'
      });
    } catch (error) {
      console.error('获取余额失败:', error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // 初始加载
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address, fetchBalances]);

  return {
    balances,
    loading,
    fetchBalances
  };
};

// 黑名单相关 Hook
export const useBlacklist = () => {
  const [address, setAddress] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 检查钱包连接状态
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('检查钱包连接失败:', error);
        }
      }
    };
    
    checkConnection();
    
    // 监听账户变化
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(undefined);
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  // 检查是否被列入黑名单
  const checkBlacklist = useCallback(async () => {
    if (!address || !isConnected) return;
    
    try {
      setLoading(true);
      // 这里应该从区块链检查黑名单状态
      // 目前使用模拟数据，后续应替换为真实数据
      setIsBlacklisted(false);
    } catch (error) {
      console.error('检查黑名单失败:', error);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // 初始加载
  useEffect(() => {
    if (isConnected && address) {
      checkBlacklist();
    }
  }, [isConnected, address, checkBlacklist]);

  return {
    isBlacklisted,
    loading,
    checkBlacklist
  };
};
