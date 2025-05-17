import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  GridLegacy as Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import { TechBackground } from '../components/TechStyles';

const TokenModelIntro: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

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
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                color: '#fff',
                textShadow: `0 0 10px ${theme.palette.warning.main}`,
                mb: 3,
              }}
            >
              双代币经济模型
            </Typography>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#fff', 
                opacity: 0.9, 
                mb: 5,
                maxWidth: '800px'
              }}
            >
              我们的双代币经济模型由治理代币和稳定币组成，通过精心设计的通证经济学，
              实现了系统的可持续发展和用户价值的最大化。
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                height: '100%',
                background: alpha(theme.palette.background.paper, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{ 
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                治理代币 (SToken)
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <HowToVoteIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="治理权" 
                    secondary="持有者可参与协议治理，对重要提案进行投票" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
                <Divider sx={{ my: 1, backgroundColor: alpha('#fff', 0.1) }} />
                
                <ListItem>
                  <ListItemIcon>
                    <AccountBalanceIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="质押收益" 
                    secondary="质押治理代币可获得协议收益分红" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
                <Divider sx={{ my: 1, backgroundColor: alpha('#fff', 0.1) }} />
                
                <ListItem>
                  <ListItemIcon>
                    <TokenIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="信用额度提升" 
                    secondary="持有治理代币可提高用户的借贷额度" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
                <Divider sx={{ my: 1, backgroundColor: alpha('#fff', 0.1) }} />
                
                <ListItem>
                  <ListItemIcon>
                    <LocalAtmIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="费用折扣" 
                    secondary="持有者享受交易费用折扣" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                height: '100%',
                background: alpha(theme.palette.background.paper, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{ 
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                稳定币 (RToken)
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <TokenIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="借贷媒介" 
                    secondary="作为系统内借贷的主要媒介，价值稳定" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
                <Divider sx={{ my: 1, backgroundColor: alpha('#fff', 0.1) }} />
                
                <ListItem>
                  <ListItemIcon>
                    <AccountBalanceIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="风险池" 
                    secondary="部分稳定币用于建立风险池，保障系统安全" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
                <Divider sx={{ my: 1, backgroundColor: alpha('#fff', 0.1) }} />
                
                <ListItem>
                  <ListItemIcon>
                    <LocalAtmIcon sx={{ color: theme.palette.warning.main }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="利息支付" 
                    secondary="借款利息以稳定币支付，确保价值稳定" 
                    primaryTypographyProps={{ color: '#fff' }}
                    secondaryTypographyProps={{ color: alpha('#fff', 0.7) }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4,
                background: alpha(theme.palette.background.paper, 0.1),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{ 
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                双代币协同机制
              </Typography>
              
              <Typography 
                variant="body1" 
                paragraph
                sx={{ color: '#fff', opacity: 0.9 }}
              >
                我们的双代币模型通过精心设计的协同机制，实现了系统的可持续发展：
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    borderRadius: 1,
                    height: '100%',
                  }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ color: theme.palette.warning.main }}
                    >
                      质押激励
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      用户质押治理代币可获得协议收益分红，同时提高自己的信用额度，
                      激励长期持有和参与治理。
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    borderRadius: 1,
                    height: '100%',
                  }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ color: theme.palette.warning.main }}
                    >
                      风险管理
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      部分借贷利息用于建立风险池，保障系统安全；同时治理代币持有者
                      可通过投票决定风险参数，实现风险的去中心化管理。
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    borderRadius: 1,
                    height: '100%',
                  }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{ color: theme.palette.warning.main }}
                    >
                      价值捕获
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', opacity: 0.8 }}>
                      协议收益通过回购治理代币或分红给质押者，确保治理代币价值与
                      协议发展紧密相连，实现长期可持续发展。
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              color="warning"
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                px: 4,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                  boxShadow: `0 0 15px ${alpha(theme.palette.warning.main, 0.5)}`
                }
              }}
              onClick={() => navigate('/dashboard')}
            >
              查看我的代币
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              color="warning"
              sx={{ 
                mt: 3, 
                mb: 2,
                ml: 2,
                py: 1.5,
                px: 4,
                borderRadius: 2,
                borderColor: theme.palette.warning.main,
                color: '#fff',
                '&:hover': {
                  borderColor: theme.palette.warning.light,
                  background: alpha(theme.palette.warning.main, 0.1),
                }
              }}
              onClick={() => navigate('/')}
            >
              返回首页
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TokenModelIntro;
