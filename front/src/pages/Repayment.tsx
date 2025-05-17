import React, { useState, useEffect, FC } from 'react';
import { getContractAddresses } from '../config/contracts';
import { CORE_LENDING_ADDRESS, CORE_LENDING_ABI } from '../contracts/contractConfig';
import { ethers } from 'ethers';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Stack,
  Grid,
  Divider,
  Chip,
  Fade,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useWallet } from '../hooks/useWallet';
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
import TeamIconImage from '../components/TeamIconImage';
import { useNavigate } from 'react-router-dom';

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

const LoanItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'translateX(5px)',
  },
}));

interface Loan {
  id: string;
  amount: number;
  dueDate: string;
  interest: number;
  totalDue: number;
  status: 'active' | 'overdue' | 'paid';
  creditBoost: number;
  // 新增字段
  riskPoolInterest: number; // 风险池分配利息
  lenderInterest: number; // 借款人分配利息
  collateralAmount: number; // 抵押品金额
}

const Repayment: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { address: walletAddress, isConnected } = useWallet();
  const [address, setAddress] = useState(walletAddress || '');
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentDialogOpen, setRepaymentDialogOpen] = useState(false);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      setAddress(walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchLoans();
  }, [address]);

  const fetchLoans = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据 - 使用 ID 0 作为唯一贷款，以匹配合约中的数组索引
      const mockLoans: Loan[] = [
        {
          id: '0', // 使用 ID 0，对应合约中的第一个贷款索引
          amount: 1000,
          dueDate: '2025-06-15',
          interest: 5.75,
          totalDue: 1005.75,
          status: 'active',
          creditBoost: 2,
          riskPoolInterest: 1.15,
          lenderInterest: 4.60,
          collateralAmount: 1500
        }
      ];
      
      setLoans(mockLoans);
    } catch (error) {
      console.error('获取贷款列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRepaymentDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setRepaymentAmount(loan.totalDue.toString());
    setRepaymentDialogOpen(true);
  };

  const handleCloseRepaymentDialog = () => {
    setRepaymentDialogOpen(false);
    setSelectedLoan(null);
    setRepaymentAmount('');
    setError('');
  };

  const handleRepay = async () => {
    if (!selectedLoan) return;
    
    setRepaying(true);
    setError('');
    
    // 检查是否已经借款
    if (loans.length === 0 || loans.every(loan => loan.status === 'paid')) {
      setRepaying(false);
      setError('您没有任何未还清的贷款。请先在借款页面申请贷款。');
      setRepaymentDialogOpen(false);
      return;
    }
    
    try {
      console.log(`开始还款流程: 贷款ID=${selectedLoan.id}`);
      
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
      } catch (switchError: any) {
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
      
      // 创建 provider 和 signer
      console.log('创建 provider...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log('provider 创建成功');
      
      console.log('获取 signer...');
      const signer = await provider.getSigner();
      console.log('signer 获取成功:', await signer.getAddress());
      
      // 使用导入的合约地址和 ABI
      console.log('合约地址:', CORE_LENDING_ADDRESS);
      
      // 创建合约实例
      console.log('创建合约实例...');
      const contract = new ethers.Contract(CORE_LENDING_ADDRESS, CORE_LENDING_ABI, signer);
      console.log('合约实例创建成功');
      
      // 获取 RToken 代币合约地址
      const USDC_ADDRESS = getContractAddresses().tokenA;
      console.log('RToken 地址:', USDC_ADDRESS);
      
      // 创建 RToken 合约实例
      console.log('创建 RToken 合约实例...');
      const usdcAbi = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];
      const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, signer);
      console.log('RToken 合约实例创建成功');
      
      // 检查当前授权额度
      console.log('检查当前 RToken 授权额度...');
      const currentAllowance = await usdcContract.allowance(await signer.getAddress(), CORE_LENDING_ADDRESS);
      console.log('当前授权额度:', currentAllowance.toString());
      
      // 如果授权额度不足，授权更多
      if (currentAllowance.toString() === '0') {
        console.log('授权 RToken 给合约...');
        // 授权一个大额度，足以支付贷款和利息
        const approveAmount = ethers.parseUnits('10000', 6); // RToken 有 6 位小数
        const approveTx = await usdcContract.approve(CORE_LENDING_ADDRESS, approveAmount);
        console.log('RToken 授权交易已发送:', approveTx);
        
        console.log('等待 RToken 授权交易确认...');
        const approveReceipt = await approveTx.wait();
        console.log('RToken 授权交易已确认:', approveReceipt);
      } else {
        console.log('RToken 已经授权足够的额度');
      }
      
      // 尝试获取用户的贷款信息并执行还款
      let tx;
      try {
        // 创建 LendingPool 合约实例来检查贷款状态
        const LENDING_POOL_ADDRESS = getContractAddresses().lendingPool;
        console.log('LendingPool 地址:', LENDING_POOL_ADDRESS);
        
        // 简化的 LendingPool ABI，只包含我们需要的函数
        const LENDING_POOL_ABI = [
          "function loans(address user, uint256 loanId) external view returns (uint256 amount, uint256 collateral, bool liquidated, uint256 timestamp)"
        ];
        
        const lendingPoolContract = new ethers.Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
        
        // 获取用户地址
        const userAddress = await signer.getAddress();
        console.log('检查用户的贷款状态:', userAddress);
        
        // 尝试获取贷款 ID 0 的信息
        const loanInfo = await lendingPoolContract.loans(userAddress, 0);
        console.log('贷款信息:', loanInfo);
        
        // 检查贷款是否存在且未清算
        if (loanInfo && loanInfo.amount) {
          console.log('发现贷款，金额:', loanInfo.amount.toString(), '是否已清算:', loanInfo.liquidated);
          
          if (loanInfo.liquidated) {
            // 贷款已经被清算
            setLoading(false);
            setError('该贷款已经被还清或清算。请先在借款页面申请新的贷款。');
            setRepaymentDialogOpen(false);
            return;
          }
          
          // 调用合约的 repay 方法
          console.log('调用合约的 repay 方法，使用贷款 ID: 0');
          tx = await contract.repay(0);
          console.log('还款交易已发送:', tx);
        } else {
          console.log('没有找到贷款，尝试使用选定的贷款 ID');
          // 尝试使用选定的贷款 ID
          tx = await contract.repay(selectedLoan?.id || 0);
          console.log('还款交易已发送:', tx);
        }
      } catch (error) {
        console.error('检查贷款状态或调用还款函数时出错:', error);
        
        // 尝试使用不同的贷款 ID
        try {
          console.log('尝试使用不同的贷款 ID进行还款...');
          // 尝试使用选定的贷款 ID 或者其他可能的 ID
          const possibleIds = [selectedLoan?.id || 0, 1, 2, 3];
          
          for (const id of possibleIds) {
            try {
              console.log(`尝试使用贷款 ID: ${id}`);
              tx = await contract.repay(id);
              console.log(`使用贷款 ID ${id} 的还款交易已发送:`, tx);
              break; // 成功发送交易后退出循环
            } catch (idError) {
              console.error(`使用贷款 ID ${id} 还款失败:`, idError.message);
              // 继续尝试下一个 ID
            }
          }
          
          if (!tx) {
            throw new Error('您没有任何有效的贷款可以还款。请先在借款页面申请贷款，或者确保您的贷款尚未还清。');
          }
        } catch (finalError) {
          console.error('所有还款尝试都失败:', finalError);
          setLoading(false);
          setError('还款失败: ' + (finalError.message || String(finalError)));
          setRepaymentDialogOpen(false);
          return;
        }
      }
      
      // 如果成功发送交易，等待交易确认
      if (tx) {
        console.log('等待交易确认...');
        try {
          const receipt = await tx.wait();
          console.log('交易已确认:', receipt);
        } catch (confirmError) {
          console.error('交易确认失败:', confirmError);
          setLoading(false);
          setError('交易确认失败: ' + (confirmError.message || String(confirmError)));
          setRepaymentDialogOpen(false);
          return;
        }
      }
      
      // 更新贷款状态
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === selectedLoan.id 
            ? { ...loan, status: 'paid' } 
            : loan
        )
      );
      
      setSuccessMessage(`成功还款 ${parseFloat(repaymentAmount).toFixed(2)} RToken！您的信用评分已得到显著提升，借贷能力进一步增强。`);
      setSnackbarOpen(true);
      handleCloseRepaymentDialog();
    } catch (err: any) {
      console.error('还款失败:', err);
      setError(`还款失败: ${err.message || '请稍后再试'}`);
    } finally {
      setRepaying(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip label="进行中" color="primary" size="small" />;
      case 'overdue':
        return <Chip label="已逾期" color="error" size="small" />;
      case 'paid':
        return <Chip label="已还款" color="success" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">加载贷款数据中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.secondary.dark, 0.8)} 100%)`,
      py: 4
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/dashboard')}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.1)
              }
            }}
          >
            返回仪表盘
          </Button>
          <TeamIconImage size={40} />
        </Box>
        
        <Typography variant="h4" component="h1" sx={{ color: 'white', mb: 1, fontWeight: 'bold' }}>
          贷款还款
        </Typography>
        <Typography variant="subtitle1" sx={{ color: alpha(theme.palette.common.white, 0.8), mb: 4 }}>
          查看并管理您的贷款，按时还款以提高信用评分
        </Typography>
        
        {loans.length === 0 ? (
          <GlassCard sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <ReceiptIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.6) }} />
              <Typography variant="h6">没有找到贷款记录</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                您目前没有任何活跃的贷款记录
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/lending')}
              >
                申请新贷款
              </Button>
            </Box>
          </GlassCard>
        ) : (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Typography variant="h6">当前贷款</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  {loans.map((loan) => (
                    <LoanItem key={loan.id}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 0 } }}>
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '50%',
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2
                              }}
                            >
                              <MoneyIcon color="primary" />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                贷款 #{loan.id}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                {getStatusChip(loan.status)}
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                  {loan.dueDate}到期
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              贷款金额
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {loan.amount.toFixed(2)} RToken
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                            {loan.status === 'paid' ? (
                              <Chip 
                                icon={<CheckCircleIcon />} 
                                label="已还清" 
                                color="success" 
                                variant="outlined" 
                              />
                            ) : (
                              <Button
                                variant="contained"
                                color="primary"
                                disabled={loan.status === 'paid' as any}
                                onClick={() => handleOpenRepaymentDialog(loan)}
                              >
                                还款
                              </Button>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                      
                      <Divider sx={{ my: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            应还金额
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {loan.totalDue.toFixed(2)} RToken
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            利息
                          </Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                            {loan.interest.toFixed(2)} RToken
                            <Tooltip title="年化利率 5%">
                              <IconButton size="small">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            抵押品
                          </Typography>
                          <Typography variant="body1">
                            {loan.collateralAmount.toFixed(2)} RToken
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            信用提升
                          </Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', color: theme.palette.success.main }}>
                            +{loan.creditBoost} 分
                            <CreditScoreIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          </Typography>
                        </Grid>
                      </Grid>
                    </LoanItem>
                  ))}
                </Box>
              </GlassCard>
            </Grid>
            
            <Grid size={{ xs: 12, md: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>还款说明</Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemText
                      primary="按时还款提高信用"
                      secondary="每次按时还款将提高您的信用评分，解锁更多贷款额度和更低利率"
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemText
                      primary="逾期还款影响信用"
                      secondary="逾期还款将降低您的信用评分，并可能导致更高的未来借款利率"
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ mb: 2 }}>
                    <ListItemText
                      primary="抵押品返还"
                      secondary="成功还款后，您的抵押品将自动返还到您的钱包"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary="利息分配"
                      secondary="您支付的利息的80%将分配给借款人，20%将进入风险池"
                    />
                  </ListItem>
                </List>
              </GlassCard>
            </Grid>
          </Grid>
        )}
      </Container>
      
      <Dialog open={repaymentDialogOpen} onClose={handleCloseRepaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          确认还款
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            您即将还清贷款 #{selectedLoan?.id}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                贷款金额
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {selectedLoan?.amount.toFixed(2)} RToken
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="body2" color="text.secondary">
                利息
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {selectedLoan?.interest.toFixed(2)} RToken
              </Typography>
            </Grid>
          </Grid>
          
          <TextField
            label="还款金额 (RToken)"
            fullWidth
            value={repaymentAmount}
            onChange={(e) => setRepaymentAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon />
                </InputAdornment>
              ),
            }}
            disabled={repaying}
            sx={{ mb: 2 }}
          />
          
          <Alert severity="info" sx={{ mb: 2 }}>
            成功还款后，您的抵押品 {selectedLoan?.collateralAmount.toFixed(2)} TEAM 将自动返还到您的钱包，并且您的信用评分将提高 {selectedLoan?.creditBoost} 点。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRepaymentDialog} disabled={repaying}>
            取消
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRepay}
            disabled={repaying || !repaymentAmount || parseFloat(repaymentAmount) < (selectedLoan?.totalDue || 0)}
            startIcon={repaying ? <CircularProgress size={20} /> : null}
            sx={{
              background: 'linear-gradient(90deg, #00b09b, #96c93d)',
              '&:hover': {
                background: 'linear-gradient(90deg, #009688, #8bc34a)',
              },
              '&.Mui-disabled': {
                background: 'linear-gradient(90deg, #cccccc, #dddddd)',
              }
            }}
          >
            {repaying ? '处理中...' : '确认还款'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Repayment;
