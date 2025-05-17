import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Stack,
  Grid,
  Paper,
  Divider,
  Chip,
  Fade,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  keyframes,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useWallet } from '../hooks/useWallet';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { TeamLogo } from '../components/TeamIcons';
import TeamIconImage from '../components/TeamIconImage';
import {
  TechCard,
  DataCard,
  TechPanel,
  GlowingBorder,
  TechButtonContainer,
  DataGrid,
  TechBackground,
  PulseContainer,
  ScanEffect,
  NeonText,
  DataIndicator
} from '../components/TechStyles';

// 动画定义
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const StatsCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  height: '100%',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
  },
  '&:hover': {
    '& > *:first-of-type': {
      animation: `${pulse} 1.5s infinite`,
    }
  }
}));

const TransactionItem = styled(ListItem)<{ transactionType: string }>(({ theme, transactionType }) => {
  const getTypeColor = () => {
    switch (transactionType) {
      case '借款': return theme.palette.primary.main;
      case '还款': return theme.palette.success.main;
      case '质押': return theme.palette.secondary.main;
      default: return theme.palette.warning.main;
    }
  };
  
  const color = getTypeColor();
  
  return {
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
    position: 'relative',
    background: alpha(theme.palette.background.paper, 0.2),
    border: `1px solid ${alpha(color, 0.3)}`,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '3px',
      background: color,
      boxShadow: `0 0 8px ${color}`,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, ${alpha(color, 0.05)}, transparent)`,
      pointerEvents: 'none',
    },
    '&:hover': {
      boxShadow: `0 0 15px ${alpha(color, 0.3)}`,
      transform: 'translateX(5px)',
      '&::after': {
        background: `linear-gradient(90deg, ${alpha(color, 0.1)}, transparent)`,
      }
    },
  };
});

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalValueLocked: number;
  creditScore: number;
  availableCredit: number;
  utilizationRate: number;
  // 新增字段
  governanceTokensStaked: number;
  governanceTokensHeld: number;
  stableCoinsLimit: number;
  stakingRewards: number;
  stakingPenalties: number;
  recentTransactions: Array<{
    type: string;
    amount: number;
    timestamp: string;
    hash: string;
  }>;
}

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { address: walletAddress } = useWallet();
  const [address, setAddress] = useState(walletAddress || '');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalValueLocked: 0,
    creditScore: 0,
    availableCredit: 0,
    utilizationRate: 0,
    // 新增字段初始化
    governanceTokensStaked: 0,
    governanceTokensHeld: 0,
    stableCoinsLimit: 0,
    stakingRewards: 0,
    stakingPenalties: 0,
    recentTransactions: []
  });
  
  // 质押相关状态
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [stakingDialogOpen, setStakingDialogOpen] = useState(false);
  const [stakingAction, setStakingAction] = useState<'stake' | 'unstake' | 'claim'>('stake');
  const [stakingLoading, setStakingLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      setAddress(walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  // 处理质押操作
  const handleStakingAction = async () => {
    if (!address) return;
    
    setStakingLoading(true);
    try {
      // 导入质押服务
      const stakingService = await import('../services/stakingService').then(m => m.default);
      
      let result = false;
      
      if (stakingAction === 'stake') {
        result = await stakingService.stakeTokens(stakeAmount);
      } else if (stakingAction === 'unstake') {
        result = await stakingService.unstakeTokens(unstakeAmount);
      } else if (stakingAction === 'claim') {
        await stakingService.claimRewards();
        result = true;
      }
      
      if (result) {
        // 刷新数据
        await fetchDashboardData();
        setStakingDialogOpen(false);
      }
    } catch (error) {
      console.error('质押操作失败:', error);
    } finally {
      setStakingLoading(false);
    }
  };
  
  // 打开质押对话框
  const openStakingDialog = (action: 'stake' | 'unstake' | 'claim') => {
    setStakingAction(action);
    setStakingDialogOpen(true);
  };
  
  const fetchDashboardData = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取质押信息
      let stakingInfo = {
        stakedAmount: '0',
        rewards: '0',
        penalties: '0'
      };
      
      try {
        // 导入质押服务
        const stakingService = await import('../services/stakingService').then(m => m.default);
        stakingInfo = await stakingService.getStakingInfo(address);
      } catch (error) {
        console.error('获取质押信息失败:', error);
      }
      
      // 获取风险池信息
      let riskPoolBalance = '0';
      try {
        // 导入风险池服务
        const riskPoolService = await import('../services/riskPoolService').then(m => m.default);
        riskPoolBalance = await riskPoolService.getPoolBalance();
      } catch (error) {
        console.error('获取风险池信息失败:', error);
      }
      
      // 模拟数据
      const mockStats: DashboardStats = {
        totalLoans: Math.floor(Math.random() * 10) + 1,
        activeLoans: Math.floor(Math.random() * 5) + 1,
        totalValueLocked: Math.floor(Math.random() * 10000) + 1000,
        creditScore: Math.floor(Math.random() * 30) + 70,
        availableCredit: Math.floor(Math.random() * 5000) + 500,
        utilizationRate: Math.floor(Math.random() * 70) + 10,
        // 使用从质押服务获取的数据
        governanceTokensStaked: parseFloat(stakingInfo.stakedAmount) || 0,
        governanceTokensHeld: Math.floor(Math.random() * 1000) + 100, // 模拟持有量
        stableCoinsLimit: Math.floor(Math.random() * 10000) + 1000, // 模拟可借额度
        stakingRewards: parseFloat(stakingInfo.rewards) || 0,
        stakingPenalties: parseFloat(stakingInfo.penalties) || 0,
        recentTransactions: [
          {
            type: '借款',
            amount: 1000,
            timestamp: '2025-05-15 14:30',
            hash: '0x7f9e8d7c6b5a4c3d2e1f0a9b8c7d6e5f4a3b2c1d',
          },
          {
            type: '还款',
            amount: 500,
            timestamp: '2025-05-14 09:15',
            hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          },
          {
            type: '质押',
            amount: 2000,
            timestamp: '2025-05-13 18:45',
            hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
          },
          {
            type: '借款',
            amount: 800,
            timestamp: '2025-05-10 11:20',
            hash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
          },
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getTransactionIcon = (type: string) => {
    return <TeamIconImage size={24} color={
      type === '借款' ? 'primary' : 
      type === '还款' ? 'success' : 
      'secondary'
    } />;
  };

  const getTransactionTypeText = (type: string) => {
    return type;
  };

  const formatDate = (date: string) => {
    return date;
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 64px)',
        background: `linear-gradient(135deg, ${alpha('#041209', 0.95)} 0%, ${alpha('#072116', 0.95)} 100%)`,
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      py: 8, 
      minHeight: 'calc(100vh - 64px)', 
      position: 'relative',
      background: `linear-gradient(135deg, ${alpha('#041209', 0.95)} 0%, ${alpha('#072116', 0.95)} 100%)`,
      overflow: 'hidden',
    }}>
      {/* 科技风格背景 */}
      <TechBackground />
      
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <NeonText>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700, 
                textAlign: 'center',
                mb: 0,
                color: '#fff',
                textShadow: `0 0 10px ${theme.palette.primary.main}`,
              }}
            >
              个人中心
            </Typography>
          </NeonText>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                mr: 2
              }}
            >
              {/* <TeamLogo /> */}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600" sx={{ color: '#fff' }}>
                {formatAddress(address || '')}
              </Typography>
              <Chip 
                label={`信用评分: ${stats.creditScore}`} 
                size="small"
                sx={{ 
                  color: '#fff',
                  fontWeight: 500,
                  mt: 1,
                  background: alpha(stats.creditScore >= 90 ? theme.palette.success.main : 
                                 stats.creditScore >= 80 ? theme.palette.primary.main : 
                                 stats.creditScore >= 70 ? theme.palette.secondary.main : 
                                 theme.palette.warning.main, 0.2),
                  borderColor: stats.creditScore >= 90 ? theme.palette.success.main : 
                                 stats.creditScore >= 80 ? theme.palette.primary.main : 
                                 stats.creditScore >= 70 ? theme.palette.secondary.main : 
                                 theme.palette.warning.main
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 借贷统计 */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="600" sx={{ color: '#fff' }}>
              借贷统计
            </Typography>
            <Button variant="contained" color="primary" onClick={() => navigate('/repayment')} startIcon={<TeamIconImage size={20} color="inherit" />} sx={{ borderRadius: 2, background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, '&:hover': { background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`, boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}` } }}>
              前往还款
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    历史借款
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.totalLoans} 笔
                  </Typography>
                </StatsCard>
              </DataCard>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    活跃借款
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.activeLoans} 笔
                  </Typography>
                </StatsCard>
              </DataCard>
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="info" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    稳定币可借额度
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {formatAmount(stats.stableCoinsLimit)} RToken
                  </Typography>
                </StatsCard>
              </DataCard>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 治理代币统计 */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" fontWeight="600" sx={{ mb: 2, color: '#fff' }}>
            治理代币统计
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 250px', minWidth: { xs: '100%', sm: '45%', md: '30%', lg: '22%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="primary" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    治理代币质押数量
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.governanceTokensStaked} SToken
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => openStakingDialog('stake')} sx={{ borderRadius: 2, borderColor: alpha(theme.palette.primary.main, 0.5), color: theme.palette.primary.main, '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}>
                      质押
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => openStakingDialog('unstake')} sx={{ borderRadius: 2, borderColor: alpha(theme.palette.error.main, 0.5), color: theme.palette.error.main, '&:hover': { borderColor: theme.palette.error.main, backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
                      解除质押
                    </Button>
                  </Box>
                </StatsCard>
              </DataCard>
            </Box>

            <Box sx={{ flex: '1 1 250px', minWidth: { xs: '100%', sm: '45%', md: '30%', lg: '22%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="secondary" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    治理代币持有数量
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.governanceTokensHeld} SToken
                  </Typography>
                </StatsCard>
              </DataCard>
            </Box>

            <Box sx={{ flex: '1 1 250px', minWidth: { xs: '100%', sm: '45%', md: '30%', lg: '22%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="success" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    质押分红
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.stakingRewards} SToken
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => openStakingDialog('claim')} disabled={parseFloat(stats.stakingRewards.toString()) <= 0} sx={{ borderRadius: 2, borderColor: alpha(theme.palette.success.main, 0.5), color: theme.palette.success.main, '&:hover': { borderColor: theme.palette.success.main, backgroundColor: alpha(theme.palette.success.main, 0.1) }, '&.Mui-disabled': { borderColor: alpha(theme.palette.success.main, 0.2), color: alpha(theme.palette.success.main, 0.3) } }}>
                      领取分红
                    </Button>
                  </Box>
                </StatsCard>
              </DataCard>
            </Box>

            <Box sx={{ flex: '1 1 250px', minWidth: { xs: '100%', sm: '45%', md: '30%', lg: '22%' } }}>
              <DataCard>
                <StatsCard>
                  <TeamIconImage size={40} color="error" sx={{ mb: 1 }} />
                  <Typography variant="body2" sx={{ color: '#fff' }} gutterBottom>
                    质押惩罚
                  </Typography>
                  <Typography variant="h5" fontWeight="700" sx={{ color: '#fff' }}>
                    {stats.stakingPenalties} SToken
                  </Typography>
                </StatsCard>
              </DataCard>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 最近交易 */}
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h2" fontWeight="600" sx={{ color: '#fff' }}>
              最近交易
            </Typography>
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } 
              }}
            >
              {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Box>
          <DataCard>
            <CardContent sx={{ p: 4 }}>
              <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {stats.recentTransactions.map((transaction, index) => (
              <TransactionItem key={index} transactionType={transaction.type}>
                <ListItemIcon>
                  {getTransactionIcon(transaction.type)}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#fff' }}>
                        {getTransactionTypeText(transaction.type)}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#fff' }}>
                        {formatAmount(transaction.amount)} RToken
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                        {formatDate(transaction.timestamp)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                        {formatAddress(transaction.hash)}
                      </Typography>
                    </Box>
                  }
                />
              </TransactionItem>
            ))}
              </List>
            </CardContent>
          </DataCard>
        </Box>
      </Container>
      
      {/* 质押操作对话框 */}
      <Dialog
        open={stakingDialogOpen}
        onClose={() => setStakingDialogOpen(false)}
        maxWidth="sm" // 增大对话框宽度
        fullWidth
        PaperProps={{
          sx: {
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 0, // 改为方形（无圆角）
            boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.3)}`,
            minHeight: '300px', // 设置最小高度
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, // 添加边框增强方形效果
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {stakingAction === 'stake' ? '质押治理代币' : 
           stakingAction === 'unstake' ? '解除代币质押' : 
           '领取质押分红'}
        </DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          {stakingAction !== 'claim' && (
            <TextField
              autoFocus
              margin="dense"
              label={stakingAction === 'stake' ? '质押数量' : '解除质押数量'}
              type="number"
              fullWidth
              variant="outlined"
              value={stakingAction === 'stake' ? stakeAmount : unstakeAmount}
              onChange={(e) => stakingAction === 'stake' ? 
                setStakeAmount(e.target.value) : 
                setUnstakeAmount(e.target.value)
              }
              InputProps={{
                endAdornment: <InputAdornment position="end">TEAM</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                  '&:hover fieldset': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: alpha(theme.palette.primary.main, 0.8),
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
            />
          )}
          
          {stakingAction === 'claim' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
                {stats.stakingRewards} TEAM
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
                您当前可领取的质押分红数量
              </Typography>
            </Box>
          )}
          
          {stakingAction === 'stake' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
              <Typography variant="body1" sx={{ color: alpha('#fff', 0.9), fontWeight: 'medium', mb: 1 }}>
                质押治理代币说明
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.8) }}>
                质押治理代币可以获得分红收益，但如果您有借款违约，将会被惩罚。
              </Typography>
            </Box>
          )}
          
          {stakingAction === 'unstake' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1 }}>
              <Typography variant="body1" sx={{ color: alpha('#fff', 0.9), fontWeight: 'medium', mb: 1 }}>
                解除质押说明
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.8) }}>
                解除质押后将无法获得分红，且可能影响您的信用评分和借款额度。
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setStakingDialogOpen(false)}
            sx={{ 
              color: alpha('#fff', 0.7),
              '&:hover': {
                color: '#fff',
                backgroundColor: alpha('#fff', 0.1)
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleStakingAction}
            variant="contained"
            disabled={stakingLoading || 
              (stakingAction === 'stake' && (!stakeAmount || parseFloat(stakeAmount) <= 0)) ||
              (stakingAction === 'unstake' && (!unstakeAmount || parseFloat(unstakeAmount) <= 0)) ||
              (stakingAction === 'claim' && stats.stakingRewards <= 0)
            }
            sx={{
              borderRadius: theme.shape.borderRadius,
              background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              '&:hover': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}`
              }
            }}
          >
            {stakingLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              stakingAction === 'stake' ? '确认质押' : 
              stakingAction === 'unstake' ? '确认解除' : 
              '领取分红'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
