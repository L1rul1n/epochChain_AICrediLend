import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import TeamIconImage from './TeamIconImage';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setWallet, disconnectWallet } from '../store/walletSlice';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isConnected, address } = useSelector((state: RootState) => state.wallet);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { text: '信用评分', icon: null, path: '/credit-score' },
    { text: '借贷', icon: null, path: '/lending' },
    { text: '个人中心', icon: null, path: '/dashboard' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItem
          component="div"
          key={item.text}
          onClick={() => {
            navigate(item.path);
            handleDrawerToggle();
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <TeamIconImage size={28} color="primary" sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={() => navigate('/')}
            >
              <Box component="img" src="/icon.jpg" alt="logo" sx={{ width: 24, height: 24, mr: 1, display: 'inline-block', verticalAlign: 'middle', borderRadius: '50%' }} />
              AICrediLend
            </Typography>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
  {isConnected ? (
    <Button 
      variant="contained" 
      color="success"
      onClick={() => {
        dispatch(disconnectWallet());
      }}
      sx={{
        borderRadius: '20px',
        textTransform: 'none',
        fontWeight: 'bold',
      }}
    >
      {address ? address.substring(0, 6) + '...' + address.substring(address.length - 4) : '断开连接'}
    </Button>
  ) : (
    <Button 
      variant="contained" 
      color="primary"
      onClick={() => {
      // 钱包连接逻辑，并更新Redux状态
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' })
          .then((accounts: string[]) => {
            console.log('Connected accounts:', accounts);
            // 获取网络 ID
            window.ethereum.request({ method: 'eth_chainId' })
              .then((chainId: string) => {
                // 获取余额
                window.ethereum.request({
                  method: 'eth_getBalance',
                  params: [accounts[0], 'latest']
                }).then((balance: string) => {
                  // 更新 Redux 状态
                  dispatch(setWallet({
                    address: accounts[0],
                    balance: balance,
                    chainId: chainId
                  }));
                  console.log('Wallet connected and state updated');
                });
              });
          })
          .catch((error: any) => {
            console.error('Connection error:', error);
            alert('连接失败: ' + error.message);
          });
      } else {
        alert('请安装MetaMask或其他以太坊钱包!');
      }
    }}
    sx={{
      borderRadius: '20px',
      textTransform: 'none',
      fontWeight: 'bold',
      background: 'linear-gradient(90deg, #00b09b, #96c93d)',
      '&:hover': {
        background: 'linear-gradient(90deg, #009688, #8bc34a)',
      }
    }}
  >
    连接钱包
  </Button>
  )}
</Box>

          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
          },
        }}
      >
        {drawer}
        <Divider />
        <Box sx={{ p: 2 }}>
          {isConnected ? (
            <Button 
              variant="contained" 
              color="success"
              fullWidth
              onClick={() => {
                dispatch(disconnectWallet());
              }}
            >
              {address ? address.substring(0, 6) + '...' + address.substring(address.length - 4) : '断开连接'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              fullWidth
              onClick={() => {
              // 钱包连接逻辑，并更新Redux状态
              if (window.ethereum) {
                window.ethereum.request({ method: 'eth_requestAccounts' })
                  .then((accounts: string[]) => {
                    console.log('Connected accounts:', accounts);
                    // 获取网络 ID
                    window.ethereum.request({ method: 'eth_chainId' })
                      .then((chainId: string) => {
                        // 获取余额
                        window.ethereum.request({
                          method: 'eth_getBalance',
                          params: [accounts[0], 'latest']
                        }).then((balance: string) => {
                          // 更新 Redux 状态
                          dispatch(setWallet({
                            address: accounts[0],
                            balance: balance,
                            chainId: chainId
                          }));
                          setMobileOpen(false); // 关闭移动菜单
                          console.log('Wallet connected and state updated');
                        });
                      });
                  })
                  .catch((error: any) => {
                    console.error('Connection error:', error);
                    alert('连接失败: ' + error.message);
                  });
              } else {
                alert('请安装MetaMask或其他以太坊钱包!');
              }
            }}
          >
            连接钱包
          </Button>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Navbar;
