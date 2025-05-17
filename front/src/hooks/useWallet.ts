import { useSelector } from 'react-redux';
import { RootState } from '../store';
import walletService from '../services/walletService';
import { useCallback } from 'react';

export const useWallet = () => {
  const wallet = useSelector((state: RootState) => state.wallet);
  
  const connectWallet = useCallback(async () => {
    return await walletService.connectWallet();
  }, []);
  
  const disconnectWallet = useCallback(() => {
    walletService.disconnectWallet();
  }, []);
  
  const refreshBalance = useCallback(async () => {
    await walletService.refreshBalance();
  }, []);
  
  const isMetaMaskInstalled = useCallback(() => {
    return walletService.isMetaMaskInstalled();
  }, []);
  
  // 格式化地址显示
  const formatAddress = useCallback((address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);
  
  // 获取链名称
  const getChainName = useCallback((chainId: string | null) => {
    if (!chainId) return '未知网络';
    
    const chains: Record<string, string> = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
      '56': 'BNB Smart Chain',
      '97': 'BSC Testnet',
      '42161': 'Arbitrum One',
      '421613': 'Arbitrum Goerli',
      '43114': 'Avalanche C-Chain',
      '43113': 'Avalanche Fuji'
    };
    
    return chains[chainId] || `Chain ID: ${chainId}`;
  }, []);
  
  return {
    ...wallet,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    isMetaMaskInstalled,
    formatAddress,
    getChainName
  };
};
