import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Fade,
  Tabs,
  Tab,
  InputAdornment,
  Chip,
  useTheme,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Stack,
  alpha,
  IconButton,
  Tooltip,
  Slider,
  LinearProgress,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { ethers } from 'ethers';
// 导入智能合约相关hooks
import { useLending, useTokens, useBlacklist } from '../contracts/useContract';
import TeamIconImage from '../components/TeamIconImage';
import { styled } from '@mui/material/styles';
import { useWallet } from '../hooks/useWallet';
import TransactionStatus from '../components/TransactionStatus';
import {
  TeamLogo,
  ArrowBackTeamIcon as ArrowBackIcon,
  CreditTeamIcon as CreditScoreIcon,
  PercentTeamIcon as PercentIcon,
  ReceiptTeamIcon as ReceiptIcon,
  CalendarTeamIcon as CalendarIcon,
  MoneyTeamIcon as MoneyIcon,
  LocalAtmTeamIcon as LocalAtmIcon,
  CheckCircleTeamIcon as CheckCircleIcon,
  InfoTeamIcon as InfoIcon
} from '../components/TeamIcons';

// 样式化组件
const GlassCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.2)}`,
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, 0.3)}`,
  },
}));

const StyledStepLabel = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    fontWeight: 500,
  },
  '& .MuiStepLabel-label.Mui-active': {
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  '& .MuiStepLabel-label.Mui-completed': {
    fontWeight: 700,
    color: theme.palette.success.main,
  },
}));

const AnimatedInfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateX(5px)',
  },
}));

const LoanDetailItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5, 0),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const DataCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.5),
  backdropFilter: 'blur(5px)',
  borderRadius: theme.shape.borderRadius,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.common.black, 0.1)}`,
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, 0.3),
    boxShadow: `0 6px 25px 0 ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

const StepContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
}));

// 辅助函数
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const steps = ['填写借款信息', '确认借款详情', '完成借贷'];

interface LoanInfo {
  amount: number;
  duration: number;
  rate: number;
  totalInterest: number;
  totalRepayment: number;
  creditScore: number;
  maxAmount: number;
  dueDate: string;
  interestRate: number;
  // 新增字段
  riskPoolInterest: number; // 风险池分配利息
  lenderInterest: number; // 借款人分配利息
  // 移除抵押品金额字段
}

const Lending: React.FC = () => {
  const theme = useTheme();
  const { address, isConnected, connectWallet } = useWallet();
  // 使用 useLending hook 获取借款相关函数
  
  const [activeStep, setActiveStep] = useState(0);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanDuration, setLoanDuration] = useState('30');
  const [completed, setCompleted] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

  // 检查钱包连接状态
  useEffect(() => {
    if (!isConnected) {
      setError('请先连接钱包后再申请借款');
    } else {
      setError('');
    }
  }, [isConnected]);
  


  const handleNext = () => {
    if (activeStep === 0) {
      handleCalculateLoan();
    } else if (activeStep === 1) {
      handleConfirmLoan();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // 获取信用评分和最大借款额度
  const getCreditLimitInfo = () => {
    // 根据钱包地址获取信用评分
    // 在实际应用中，这里应该调用API获取真实的信用评分
    // 这里模拟不同地址有不同的信用评分
    const walletAddress = address || '';
    const lastChar = walletAddress.slice(-1).toLowerCase();
    
    // 根据地址最后一位字符生成不同的信用评分
    let creditScore = 75; // 默认信用评分
    
    if (lastChar >= '0' && lastChar <= '9') {
      // 如果最后一位是数字，根据数字大小调整信用评分
      creditScore = 70 + parseInt(lastChar) * 3;
    } else if (lastChar >= 'a' && lastChar <= 'f') {
      // 如果最后一位是字母 a-f，给予更高的信用评分
      creditScore = 85 + (lastChar.charCodeAt(0) - 'a'.charCodeAt(0)) * 2;
    }
    
    // 确保信用评分在有效范围内
    creditScore = Math.min(Math.max(creditScore, 60), 100);
    
    // 根据信用评分计算最大借款额度
    // 信用评分越高，可借额度越高
    // 使用非线性计算方式，使高信用评分获得更高的额度提升
    let maxAmount = 0;
    
    if (creditScore < 70) {
      // 信用评分较低，额度较小
      maxAmount = Math.round((creditScore - 60) * 300);
    } else if (creditScore < 80) {
      // 中等信用评分
      maxAmount = Math.round(3000 + (creditScore - 70) * 400);
    } else if (creditScore < 90) {
      // 良好信用评分
      maxAmount = Math.round(7000 + (creditScore - 80) * 500);
    } else {
      // 优秀信用评分
      maxAmount = Math.round(12000 + (creditScore - 90) * 800);
    }
    
    return { creditScore, maxAmount };
  };
  
  // 从智能合约中导入借款相关功能
  const { borrow, borrowWithoutCollateral, txStatus, txHash } = useLending();
  const { balances, fetchBalances } = useTokens();
  const { isBlacklisted } = useBlacklist();
  
  // 定义固定利率
  const interestRate = 10; // 10%
  
  // 监听交易状态变化
  useEffect(() => {
    if (txStatus === 'success' && txHash) {
      // 交易成功，更新界面状态
      setCompleted(true);
      setActiveStep(2);
      setLoading(false);
      // 更新代币余额
      fetchBalances();
    } else if (txStatus === 'error' && txHash) {
      // 交易失败，显示错误信息
      setError('交易失败，请查看详情');
      setLoading(false);
    }
  }, [txStatus, txHash, fetchBalances]);
  
  // 计算借款详情
  const handleCalculateLoan = async () => {
    if (!isConnected) {
      setError('请先连接钱包后再申请借款');
      return;
    }
    
    if (isBlacklisted) {
      setError('您的地址在黑名单中，无法申请借款');
      return;
    }
    
    if (!loanAmount) {
      setError('请填写借款金额');
      return;
    }

    if (parseInt(loanAmount) <= 0) {
      setError('借款金额必须大于0');
      return;
    }
    
    // 获取信用额度信息
    const { maxAmount } = getCreditLimitInfo();
    
    // 验证借款金额不能超过最大额度
    if (parseInt(loanAmount) > maxAmount) {
      setError(`借款金额不能超过您的可借额度 ${maxAmount} RToken`);
      return;
    }
    
    // 不再需要检查抵押品余额，因为借款不需要抵押

    setLoading(true);
    setError('');
    
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 获取用户的信用评分和可借额度信息
      const { creditScore, maxAmount } = getCreditLimitInfo();
      
      // 根据信用评分调整利率
      let rate = 0.08; // 基础利率
      if (creditScore >= 90) {
        rate = 0.05;
      } else if (creditScore >= 80) {
        rate = 0.06;
      } else if (creditScore >= 70) {
        rate = 0.07;
      }
      
      const amount = parseInt(loanAmount);
      const duration = parseInt(loanDuration);
      const totalInterest = amount * rate * (duration / 365);
      const totalRepayment = amount + totalInterest;
      
      // 计算到期日期
      const currentDate = new Date();
      const dueDate = new Date(currentDate.setDate(currentDate.getDate() + duration));
      const formattedDueDate = dueDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      // 计算利息分配 - 80%给借款人，20%进入风险池
      const riskPoolInterest = totalInterest * 0.2; // 20%进入风险池
      const lenderInterest = totalInterest * 0.8; // 80%给借款人
      
      const mockLoanInfo: LoanInfo = {
        amount,
        duration,
        rate,
        totalInterest,
        totalRepayment,
        creditScore,
        maxAmount,
        dueDate: formattedDueDate,
        interestRate: rate * 100, // 转换为百分比
        riskPoolInterest,
        lenderInterest
      };
      
      setLoanInfo(mockLoanInfo);
      setActiveStep(1);
    } catch (err) {
      setError('借贷计算失败');
    } finally {
      setLoading(false);
    }
  };

  // 确认借款 - 链上操作
  const handleConfirmLoan = async () => {
    if (!loanInfo) return;
    if (!isConnected) {
      setError('请先连接钱包');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 计算借款期限（秒）
      const durationInSeconds = loanInfo.duration * 24 * 60 * 60; // 天数转换为秒
      console.log(`准备调用无抵押借款: 金额=${loanInfo.amount.toString()}, 期限=${durationInSeconds}秒`);
      
      // 打印调试信息
      console.log('开始调用借款合约...');
      console.log('借款金额:', loanInfo.amount.toString());
      console.log('借款期限(秒):', durationInSeconds);
      
      // 检查钱包是否安装
      if (typeof window.ethereum === 'undefined') {
        alert('请安装 MetaMask 钱包插件');
        window.open('https://metamask.io/download/', '_blank');
        throw new Error('未安装 MetaMask');
      }
      
      // 请求用户连接
      console.log('请求用户连接钱包...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('获取到账户:', accounts);
      
      // 切换到 Sepolia 测试网
      console.log('切换到 Sepolia 测试网...');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia 测试网的 chainId
        });
        console.log('Sepolia 测试网切换成功');
      } catch (switchError) {
        // 如果网络不存在，添加该网络
        if (switchError.code === 4902) {
          console.log('添加 Sepolia 测试网...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              },
            ],
          });
          console.log('Sepolia 测试网添加成功');
        } else {
          console.error('切换到 Sepolia 测试网失败:', switchError);
          alert(`切换到 Sepolia 测试网失败: ${switchError.message}\n请手动切换网络。`);
          throw new Error('切换网络失败');
        }
      }
      
      // 直接调用合约
      console.log('创建 provider...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log('provider 创建成功');
      
      console.log('获取 signer...');
      const signer = await provider.getSigner();
      console.log('signer 获取成功:', await signer.getAddress());
      
      // 从合约配置中获取合约地址和 ABI
      const { CORE_LENDING_ADDRESS, CORE_LENDING_ABI } = require('../contracts/contractConfig');
      console.log('合约地址:', CORE_LENDING_ADDRESS);
      
      // 创建合约实例
      console.log('创建合约实例...');
      const contract = new ethers.Contract(CORE_LENDING_ADDRESS, CORE_LENDING_ABI, signer);
      console.log('合约实例创建成功');
      
      // 转换金额为 Wei - RToken 有 6 位小数
      const amountInWei = ethers.parseUnits(loanInfo.amount.toString(), 6);
      console.log('金额(Wei):', amountInWei.toString());
      
      // 调用合约的 borrowWithoutCollateral 方法
      console.log('调用 borrowWithoutCollateral 方法，金额:', amountInWei.toString(), '期限(秒):', durationInSeconds);
      
      let tx;
      try {
        // 先检查是否可以估算 gas
        const gasEstimate = await contract.borrowWithoutCollateral.estimateGas(amountInWei, durationInSeconds);
        console.log('Gas 估算成功，预计需要 gas:', gasEstimate.toString());
        
        // 发送交易，并增加 gas 限制
        tx = await contract.borrowWithoutCollateral(amountInWei, durationInSeconds, {
          gasLimit: parseInt(gasEstimate.toString()) * 2 // 增加 100% 的 gas 限制
        });
        console.log('交易已发送:', tx);
      } catch (error) {
        console.error('借款交易失败:', error);
        
        // 尝试直接发送交易，不估算 gas
        console.log('尝试直接发送交易，不估算 gas');
        tx = await contract.borrowWithoutCollateral(amountInWei, durationInSeconds, {
          gasLimit: 3000000 // 设置一个足够高的固定 gas 限制
        });
        console.log('交易已发送:', tx);
      }
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('交易已确认:', receipt);
      
      // 交易已发送，设置交易哈希和状态
      setTransactionHash(tx.hash);
      setActiveStep(2); // 移动到完成步骤
      setCompleted(true);
    } catch (err: any) {
      console.error('借款失败:', err);
      setError(err.message || '借款交易失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置借款流程
  const handleReset = () => {
    setActiveStep(0);
    setLoanInfo(null);
    setLoanAmount('');
    setLoanDuration('');
    setCompleted(false);
    setTransactionHash('');
    setError('');
  };
  
  // 格式化利率显示
  const formatRate = (rate: number) => {
    return (rate * 100).toFixed(2) + '%';
  };
  
  // 格式化金额显示
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // 风险评估函数
  const getRiskLevel = (amount: number): string => {
    if (!loanInfo) return '低';
    const maxAmount = loanInfo.maxAmount;
    const ratio = amount / maxAmount;
    
    // 将风险等级默认设置为低
    return '低';
  };
  
  const getRiskColor = (amount: number): 'success' | 'info' | 'warning' | 'error' => {
    if (!loanInfo) return 'success';
    const maxAmount = loanInfo.maxAmount;
    const ratio = amount / maxAmount;
    
    if (ratio < 0.3) return 'success';
    if (ratio < 0.6) return 'info';
    if (ratio < 0.8) return 'warning';
    return 'error';
  };

  // 渲染第一步 - 填写借款信息
  const renderStep1 = () => (
    <Fade in={activeStep === 0} timeout={800}>
      <Box>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <GlassCard>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TeamLogo color="primary" sx={{ fontSize: 28, mr: 1 }} />
                  <Typography variant="h5" component="h2" fontWeight="600">
                    借款申请
                  </Typography>
                </Box>
                
                {isConnected && (
                  <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 2, 
                    background: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main, mb: 1 }}>
                      您的信用状况
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          信用评分
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {getCreditLimitInfo().creditScore}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                          可借额度
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                          {getCreditLimitInfo().maxAmount} RToken
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                      借款金额 (RToken)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={loanAmount}
                      onChange={(e) => {
                        // 获取信用额度信息
                        const { maxAmount } = getCreditLimitInfo();
                        
                        // 验证输入的金额
                        const amount = parseInt(e.target.value);
                        if (amount > maxAmount) {
                          setError(`借款金额不能超过您的可借额度 ${maxAmount} RToken`);
                        } else {
                          setError('');
                        }
                        
                        setLoanAmount(e.target.value);
                      }}
                      placeholder="输入借款金额"
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><TeamLogo fontSize="small" /></InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                        mb: 2
                      }}
                      helperText={error ? error : ''}
                      error={!!error}
                    />
                    
                    {isConnected ? (
                      <Box sx={{ px: 1 }}>
                        <Slider
                          value={loanAmount ? parseFloat(loanAmount) : 0}
                          onChange={(_, value) => setLoanAmount(value.toString())}
                          min={100}
                          max={loanInfo ? loanInfo.maxAmount : getCreditLimitInfo().maxAmount}
                          step={100}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value} RToken`}
                          sx={{
                            color: theme.palette.primary.main,
                            '& .MuiSlider-thumb': {
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.primary.main, 0.16)}`
                              },
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ px: 1, mt: 2 }}>
                        <Alert severity="info" variant="outlined" sx={{ fontSize: '0.875rem' }}>
                          请先连接钱包以使用借款功能
                        </Alert>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      {isConnected ? (
                        <>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 500 }}>
                            可借额度: {loanInfo ? formatAmount(loanInfo.maxAmount) : formatAmount(getCreditLimitInfo().maxAmount)} RToken
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              风险等级:
                            </Typography>
                            <Chip 
                              label={getRiskLevel(loanAmount ? parseFloat(loanAmount) : 0)}
                              size="small"
                              color={getRiskColor(loanAmount ? parseFloat(loanAmount) : 0)}
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.5, fontSize: '0.7rem' } }}
                            />
                          </Box>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          请连接钱包查看可借额度
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                      借款期限 (天)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value="30"
                      disabled
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><TeamLogo fontSize="small" /></InputAdornment>,
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                        '& .Mui-disabled': {
                          opacity: 0.8,
                          '-webkit-text-fill-color': '#fff',
                        }
                      }}
                    />
                    <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 1, fontWeight: 500 }}>
                      借款期限固定为30天
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    disabled
                    startIcon={<ArrowBackIcon />}
                  >
                    返回
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    disabled={loading || !isConnected}
                    sx={{
                      py: 1.2,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(90deg, #00b09b, #96c93d)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #009688, #8bc34a)',
                      }
                    }}
                  >
                    {loading ? '计算中...' : '计算借款详情'}
                  </Button>
                </Box>
                
                {error && (
                  <Alert severity="error" sx={{ mt: 3 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </GlassCard>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              <GlassCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CreditScoreIcon color="primary" sx={{ fontSize: 24, mr: 1 }} />
                    <Typography variant="h6" fontWeight="600">
                      信用评分影响
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    您的链上信用评分将直接影响借款利率和可借额度。评分越高，利率越低，可借额度越高。
                  </Typography>
                </CardContent>
              </GlassCard>
              
              <GlassCard>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PercentIcon color="secondary" sx={{ fontSize: 24, mr: 1 }} />
                    <Typography variant="h6" fontWeight="600">
                      利率范围
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">优质信用</Typography>
                    <Typography variant="body2" fontWeight="600" color="success.main">5%</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">良好信用</Typography>
                    <Typography variant="body2" fontWeight="600" color="primary.main">6%</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">普通信用</Typography>
                    <Typography variant="body2" fontWeight="600" color="secondary.main">7%</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">一般信用</Typography>
                    <Typography variant="body2" fontWeight="600" color="warning.main">8%</Typography>
                  </Box>
                </CardContent>
              </GlassCard>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
  
  // 渲染第二步 - 确认借款详情
  const renderStep2 = () => {
    // 计算风险评分 (0-100)
    const riskScore = loanAmount ? Math.min(100, Math.round((parseFloat(loanAmount) / (loanInfo?.maxAmount || getCreditLimitInfo().maxAmount)) * 100)) : 0;
    
    // 获取风险评分颜色
    const getRiskScoreColor = (score: number) => {
      if (score < 30) return theme.palette.success.main;
      if (score < 60) return theme.palette.info.main;
      if (score < 80) return theme.palette.warning.main;
      return theme.palette.error.main;
    };
    
    return (
      <Fade in={activeStep === 1} timeout={800}>
        <Box>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <GlassCard>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <ReceiptIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
                    <Typography variant="h5" component="h2" fontWeight="600">
                      借款详情确认
                    </Typography>
                  </Box>
                  
                  {loanInfo && (
                    <Box>
                      <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <DataCard sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                                借款信息
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">借款金额</Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {formatAmount(loanInfo.amount)} RToken
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">借款期限</Typography>
                                  <Typography variant="body1" fontWeight="500">30天</Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">利率</Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {loanInfo.rate || '5.0'}%
                                  </Typography>
                                </Box>
                              </Stack>
                            </CardContent>
                          </DataCard>
                        </Grid>
                        
                        <Grid size={{ xs: 12, md: 6 }}>
                          <DataCard sx={{ height: '100%' }}>
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                                还款信息
                              </Typography>
                              <Divider sx={{ my: 1.5 }} />
                              
                              <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">应还总额</Typography>
                                  <Typography variant="body1" fontWeight="500" color={theme.palette.primary.main}>
                                    {formatAmount(loanInfo.totalRepayment)} RToken
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">还款日期</Typography>
                                  <Typography variant="body1" fontWeight="500">
                                    {loanInfo.dueDate || '30天后'}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">预计信用变化</Typography>
                                  <Chip 
                                    label="信用会提升" 
                                    color="success" 
                                    size="small" 
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Box>
                              </Stack>
                            </CardContent>
                          </DataCard>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          风险评估
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ flexGrow: 1, mr: 2 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={riskScore} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                backgroundColor: alpha(theme.palette.grey[300], 0.3),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getRiskScoreColor(riskScore),
                                  borderRadius: 4,
                                }
                              }}
                            />
                          </Box>
                          <Typography 
                            variant="body2" 
                            fontWeight="500"
                            sx={{ color: getRiskScoreColor(riskScore) }}
                          >
                            {riskScore}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          风险等级: {getRiskLevel(parseFloat(loanAmount) || 0)}
                        </Typography>
                      </Box>
                      
                      <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                        <Typography variant="body2">
                          借款将直接发放到您的钱包地址: {shortenAddress(address)}
                        </Typography>
                      </Alert>
                      
                      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant="outlined"
                          color="inherit"
                          onClick={handleBack}
                          startIcon={<ArrowBackIcon />}
                          disabled={loading}
                        >
                          返回修改
                        </Button>
                        
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleConfirmLoan}
                          disabled={loading || !isConnected || txStatus === 'pending'}
                          sx={{
                            py: 1.2,
                            px: 3,
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: 'linear-gradient(90deg, #00b09b, #96c93d)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #009688, #8bc34a)',
                            }
                          }}
                        >
                          {loading ? '处理中...' : '确认借款'}
                        </Button>
                        
                        {/* 交易状态显示 */}
                        {txHash && (
                          <Box sx={{ mt: 2 }}>
                            <TransactionStatus 
                              txHash={txHash} 
                              status={txStatus} 
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </GlassCard>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <InfoIcon color="primary" sx={{ fontSize: 24, mr: 1 }} />
                    <Typography variant="h6" fontWeight="600">
                      借贷说明
                    </Typography>
                  </Box>
                  
                  <AnimatedInfoItem>
                    <Typography variant="body2">
                      1. 本协议采用AI信用评分系统，根据您的链上行为自动评估信用等级
                    </Typography>
                  </AnimatedInfoItem>
                  
                  <AnimatedInfoItem>
                    <Typography variant="body2">
                      2. 借款利率根据信用等级动态调整，信用越好利率越低
                    </Typography>
                  </AnimatedInfoItem>
                  
                  <AnimatedInfoItem>
                    <Typography variant="body2">
                      3. 还款日期为借款期限到期日，退还全部本息
                    </Typography>
                  </AnimatedInfoItem>
                  
                  <AnimatedInfoItem>
                    <Typography variant="body2">
                      4. 违约将影响信用评分并可能触发治理代币惩罚机制
                    </Typography>
                  </AnimatedInfoItem>
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    );
  };
  
  // 获取用户的借款历史
  const { loans, loading: loansLoading, repay } = useLending();
  
  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 渲染第三步 - 完成借贷
  const renderStep3 = () => (
    <Fade in={activeStep === 2} timeout={800}>
      <Box sx={{ py: 4 }}>
        <GlassCard sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* 已移除logo */}
            <Typography variant="h4" component="h2" fontWeight="700" sx={{ mb: 2, color: theme.palette.success.main }}>
              借款成功！
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#fff' }}>
              您的借款已经成功处理。资金将在几分钟内到账。
            </Typography>
            
            {transactionHash && (
              <Box sx={{ mb: 3, p: 2, background: alpha(theme.palette.background.paper, 0.3), borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#fff' }}>
                  交易哈希
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#fff' }}>
                  {transactionHash}
                </Typography>
              </Box>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleReset}
              sx={{ 
                mt: 2,
                background: 'linear-gradient(90deg, #00b09b, #96c93d)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #009688, #8bc34a)',
                }
              }}
            >
              返回借款页面
            </Button>
          </CardContent>
        </GlassCard>
        
        {/* 借款历史记录 */}
        <GlassCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TeamIconImage size={28} color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2" fontWeight="600" sx={{ color: '#fff' }}>
                借款历史
              </Typography>
            </Box>
            
            {loansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : loans && loans.length > 0 ? (
              <Grid container spacing={2}>
                {loans.map((loan: any, index: number) => (
                  <Grid key={index} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      background: alpha(theme.palette.background.paper, 0.3),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      mb: 2 
                    }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#fff', mb: 1 }}>
                        借款 #{index + 1}
                      </Typography>
                      <Grid container spacing={1}>
                        <LoanDetailItem>
                          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                            借款利率
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ color: '#fff' }}>
                            {loan.interestRate.toFixed(2)}%
                          </Typography>
                        </LoanDetailItem>
                        
                        <LoanDetailItem>
                          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                            利息总额
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ color: '#fff' }}>
                            {formatAmount(loan.totalInterest)} RToken
                          </Typography>
                        </LoanDetailItem>
                        
                        <LoanDetailItem>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                              借款人分配利息 (80%)
                            </Typography>
                            <Tooltip title="利息的80%分配给借款人">
                              <InfoIcon fontSize="small" sx={{ ml: 1, color: alpha('#fff', 0.5) }} />
                            </Tooltip>
                          </Box>
                          <Typography variant="body1" fontWeight="500" sx={{ color: '#fff' }}>
                            {formatAmount(loan.lenderInterest)} RToken
                          </Typography>
                        </LoanDetailItem>
                        
                        <LoanDetailItem>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                              风险池分配利息 (20%)
                            </Typography>
                            <Tooltip title="利息的20%进入风险池，用于保护借款人">
                              <InfoIcon fontSize="small" sx={{ ml: 1, color: alpha('#fff', 0.5) }} />
                            </Tooltip>
                          </Box>
                          <Typography variant="body1" fontWeight="500" sx={{ color: '#fff' }}>
                            {formatAmount(loan.riskPoolInterest)} RToken
                          </Typography>
                        </LoanDetailItem>
                        
                        <LoanDetailItem>
                          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                            还款总额
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ color: '#fff' }}>
                            {formatAmount(loan.totalRepayment)} RToken
                          </Typography>
                        </LoanDetailItem>
                        
                        {/* 移除抵押品金额显示 */}
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                            状态
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: loan.liquidated ? 
                              theme.palette.success.main : 
                              new Date().getTime() > loan.dueTime * 1000 ? 
                                theme.palette.error.main : 
                                theme.palette.warning.main 
                          }}>
                            {loan.liquidated ? 
                              '已还款' : 
                              new Date().getTime() > loan.dueTime * 1000 ? 
                                '已逃期' : 
                                '未还款'}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {!loan.liquidated && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => repay(index)}
                          sx={{ 
                            mt: 2,
                            background: 'linear-gradient(90deg, #00b09b, #96c93d)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #009688, #8bc34a)',
                            }
                          }}
                          fullWidth
                        >
                          还款
                        </Button>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', color: '#fff', my: 4 }}>
                暂无借款记录
              </Typography>
            )}
          </CardContent>
        </GlassCard>
      </Box>
    </Fade>
  );

  return (
    <Box sx={{ py: 8, minHeight: 'calc(100vh - 64px)', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.secondary.dark, 0.1)} 100%)` }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={800}>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700, 
                textAlign: 'center',
                mb: 5,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              AI 赋能的链上无抵押信用借贷协议
            </Typography>
            
            <Stepper 
              activeStep={activeStep} 
              sx={{ 
                mb: 5,
                '& .MuiStepConnector-line': {
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                },
                '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
                  borderColor: theme.palette.primary.main,
                },
                '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StyledStepLabel>{label}</StyledStepLabel>
                </Step>
              ))}
            </Stepper>
            
            {activeStep === 0 && renderStep1()}
            {activeStep === 1 && renderStep2()}
            {activeStep === 2 && renderStep3()}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Lending;
