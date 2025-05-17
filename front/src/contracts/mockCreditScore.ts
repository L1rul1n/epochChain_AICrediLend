import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

// 信用评分因素权重
const SCORE_WEIGHTS = {
  tokenStaking: 0.25,    // 代币质押量
  loanRepayment: 0.30,   // 贷款还款记录
  activity: 0.20,        // 链上活跃度
  governanceTokens: 0.15, // 治理代币持有
  aiScore: 0.10          // AI模型评分
};

// 信用评分等级
export const CREDIT_LEVELS = {
  EXCELLENT: { min: 90, max: 100, name: '卓越', color: '#4caf50' },
  GOOD: { min: 80, max: 89, name: '优秀', color: '#8bc34a' },
  FAIR: { min: 70, max: 79, name: '良好', color: '#ffeb3b' },
  POOR: { min: 60, max: 69, name: '一般', color: '#ff9800' },
  BAD: { min: 0, max: 59, name: '很差', color: '#f44336' }
};

// 获取信用等级
export const getCreditLevel = (score: number) => {
  if (score >= CREDIT_LEVELS.EXCELLENT.min) return CREDIT_LEVELS.EXCELLENT;
  if (score >= CREDIT_LEVELS.GOOD.min) return CREDIT_LEVELS.GOOD;
  if (score >= CREDIT_LEVELS.FAIR.min) return CREDIT_LEVELS.FAIR;
  if (score >= CREDIT_LEVELS.POOR.min) return CREDIT_LEVELS.POOR;
  return CREDIT_LEVELS.BAD;
};

// 根据信用评分计算最大借款额度
export const calculateMaxLoanAmount = (creditScore: number) => {
  if (creditScore < 70) {
    // 信用评分较低，额度较小
    return Math.round((creditScore - 60) * 300);
  } else if (creditScore < 80) {
    // 中等信用评分
    return Math.round(3000 + (creditScore - 70) * 400);
  } else if (creditScore < 90) {
    // 良好信用评分
    return Math.round(7000 + (creditScore - 80) * 500);
  } else {
    // 优秀信用评分
    return Math.round(12000 + (creditScore - 90) * 800);
  }
};

// 模拟信用评分Hook
export const useCreditScore = (address?: string) => {
  const { address: connectedAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creditScore, setCreditScore] = useState<{
    score: number;
    level: string;
    factors: {
      tokenStaking: number;
      loanRepayment: number;
      activity: number;
      governanceTokens: number;
      aiScore: number;
    };
    maxLoanAmount: number;
  } | null>(null);

  // 计算信用评分
  const calculateCreditScore = useCallback(async (walletAddress: string) => {
    setLoading(true);
    setError('');
    
    try {
      // 在实际应用中，这里应该调用智能合约或API获取链上数据
      // 这里使用模拟数据进行演示
      
      // 1. 获取钱包地址的最后一个字符，用于模拟不同地址有不同的信用评分
      const lastChar = walletAddress.slice(-1).toLowerCase();
      
      // 2. 根据地址生成基础分数
      let baseScore = 65; // 默认分数
      
      if (lastChar >= '0' && lastChar <= '9') {
        baseScore = 60 + parseInt(lastChar) * 0.8;
      } else if (lastChar >= 'a' && lastChar <= 'f') {
        baseScore = 63 + (lastChar.charCodeAt(0) - 'a'.charCodeAt(0)) * 1.2;
      }
      
      // 3. 模拟贷款记录调整分数
      let loanRepaymentScore = 80;
      
      // 4. 计算各因素得分
      const factors = {
        tokenStaking: Math.min(100, baseScore + 5),
        loanRepayment: loanRepaymentScore,
        activity: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
        governanceTokens: Math.min(100, baseScore - 5),
        aiScore: Math.min(100, baseScore + Math.floor(Math.random() * 15) - 5)
      };
      
      // 5. 计算加权总分
      let totalScore = 0;
      totalScore += factors.tokenStaking * SCORE_WEIGHTS.tokenStaking;
      totalScore += factors.loanRepayment * SCORE_WEIGHTS.loanRepayment;
      totalScore += factors.activity * SCORE_WEIGHTS.activity;
      totalScore += factors.governanceTokens * SCORE_WEIGHTS.governanceTokens;
      totalScore += factors.aiScore * SCORE_WEIGHTS.aiScore;
      
      // 四舍五入到整数
      totalScore = Math.round(totalScore);
      
      // 确保分数在有效范围内
      totalScore = Math.max(0, Math.min(100, totalScore));
      
      // 获取信用等级
      const creditLevel = getCreditLevel(totalScore);
      
      // 计算最大借款额度
      const maxLoanAmount = calculateMaxLoanAmount(totalScore);
      
      // 设置信用评分结果
      setCreditScore({
        score: totalScore,
        level: creditLevel.name,
        factors,
        maxLoanAmount
      });
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        score: totalScore,
        level: creditLevel.name,
        factors,
        maxLoanAmount
      };
    } catch (err: any) {
      console.error('计算信用评分失败:', err);
      setError(err.message || '计算信用评分失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 查询信用评分
  const queryCreditScore = useCallback(async (walletAddress: string) => {
    return calculateCreditScore(walletAddress);
  }, [calculateCreditScore]);

  // 自动查询当前连接钱包的信用评分
  useEffect(() => {
    if (isConnected && connectedAddress && !address) {
      calculateCreditScore(connectedAddress);
    }
  }, [isConnected, connectedAddress, address, calculateCreditScore]);

  return {
    creditScore,
    loading,
    error,
    queryCreditScore,
    calculateCreditScore
  };
};
