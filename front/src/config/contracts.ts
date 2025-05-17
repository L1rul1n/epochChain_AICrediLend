// 智能合约地址配置
export const CONTRACT_ADDRESSES = {
  // 主网合约地址
  mainnet: {
    coreLending: '0x0000000000000000000000000000000000000000', // 待部署后替换
    lendingPool: '0x0000000000000000000000000000000000000000', // 待部署后替换
    blackList: '0x0000000000000000000000000000000000000000', // 待部署后替换
    auctionManager: '0x0000000000000000000000000000000000000000', // 待部署后替换
    tokenA: '0x0000000000000000000000000000000000000000', // USDC 或其他稳定币
    tokenB: '0x0000000000000000000000000000000000000000', // ETH 或其他抵押品
  },
  
  // 测试网合约地址 (Sepolia)
  sepolia: {
    tokenA: '0xE00248ccc83a469A3476c2E212c726fcF938338B', // USDC
    tokenB: '0xfcb1cd4BB46878A21106D9430Ad5bcB4526a5bA4', // TEAM
    blackList: '0x37CBEB69A2Cd1e355C69B67b05D950AEdb05D148', // Blacklist
    lendingPool: '0x08fC27d28b7bbF8C9ae91D9F8e2793C7c17AF74A', // LendingPool
    auctionManager: '0x4834C550b211351a48760661492E849eecA5b23A', // AuctionManager
    coreLending: '0xE128555F42Dd6bE70d415D753ce2036e94675844' // CoreLending
  },
  
  // 本地开发网络
  localhost: {
    coreLending: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // 本地部署的默认地址
    lendingPool: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    blackList: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    auctionManager: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    tokenA: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9', // 模拟 USDC
    tokenB: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707', // 模拟 ETH
  }
};

// 当前网络
export const CURRENT_NETWORK = 'sepolia'; // 'mainnet', 'sepolia', 'localhost'

// 获取当前网络的合约地址
export const getContractAddresses = () => {
  return CONTRACT_ADDRESSES[CURRENT_NETWORK];
};

// 区块链浏览器链接
export const BLOCK_EXPLORER_URLS = {
  mainnet: 'https://etherscan.io',
  sepolia: 'https://sepolia.etherscan.io',
  localhost: '',
};

// 获取交易链接
export const getTransactionLink = (txHash: string) => {
  const explorerUrl = BLOCK_EXPLORER_URLS[CURRENT_NETWORK];
  if (!explorerUrl) return '';
  return `${explorerUrl}/tx/${txHash}`;
};

// 获取地址链接
export const getAddressLink = (address: string) => {
  const explorerUrl = BLOCK_EXPLORER_URLS[CURRENT_NETWORK];
  if (!explorerUrl) return '';
  return `${explorerUrl}/address/${address}`;
};
