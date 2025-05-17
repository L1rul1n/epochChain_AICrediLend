// 从 contracts.ts 中导入合约地址
import { getContractAddresses, CURRENT_NETWORK } from '../config/contracts';

// 获取 Sepolia 测试网的合约地址
const contractAddresses = getContractAddresses();

// 智能合约地址 - 使用 Sepolia 测试网地址
export const CORE_LENDING_ADDRESS = contractAddresses.coreLending; // Sepolia 测试网合约地址
export const LENDING_POOL_ADDRESS = contractAddresses.lendingPool; // Sepolia 测试网合约地址

// CoreLending合约ABI
export const CORE_LENDING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_lendingPool",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_blacklist",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_auctionManager",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "dueTime",
        "type": "uint256"
      }
    ],
    "name": "Borrowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "borrower",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Repaid",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateralAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "borrowWithoutCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// LendingPool合约ABI
export const LENDING_POOL_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_tokenB",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateralAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "name": "borrow",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "loanId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "liquidator",
        "type": "address"
      }
    ],
    "name": "liquidate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "needsAuction",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "shortage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserLoans",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "collateral",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "dueTime",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "liquidated",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          }
        ],
        "internalType": "struct LendingPool.Loan[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

/**
 * 生成区块浏览器链接
 * @param txHash 交易哈希
 * @returns 区块浏览器链接
 */
export const getEtherscanLink = (txHash: string) => {
  // 使用 contracts.ts 中的区块浏览器配置
  const { BLOCK_EXPLORER_URLS, CURRENT_NETWORK } = require('../config/contracts');
  
  // 获取当前网络的区块浏览器URL
  const baseUrl = BLOCK_EXPLORER_URLS[CURRENT_NETWORK];
  
  return `${baseUrl}/tx/${txHash}`;
};
