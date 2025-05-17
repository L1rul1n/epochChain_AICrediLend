import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Stack,
  Grid,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { TechBackground, NeonText, PulseContainer } from '../components/TechStyles';
import TeamIconImage from '../components/TeamIconImage';

// 定义动画效果
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Home: React.FC = () => {
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
        <Fade in={true} timeout={800}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 8, mt: 10 }}>
              {/* 图标已移除 */}
              
              <NeonText>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    textAlign: 'center',
                    mb: 3,
                    color: '#fff',
                    textShadow: `0 0 10px ${theme.palette.primary.main}`,
                    animation: `${fadeIn} 1s ease-out`,
                  }}
                >
                  AI 赋能的链上无抵押信用借贷协议
                </Typography>
              </NeonText>
              
              <Typography 
                variant="h6" 
                paragraph
                sx={{
                  textAlign: 'center',
                  maxWidth: '800px',
                  mx: 'auto',
                  mb: 5,
                  animation: `${fadeIn} 1s ease-out 0.3s both`,
                  opacity: 0,
                  color: '#fff',
                }}
              >
                创新的去中心化金融协议，通过AI算法分析链上行为，实现无抵押借贷，重新定义DeFi信用体系
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  '&:hover': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}`
                  }
                }}
                onClick={() => navigate('/lending')}
              >
                开始借贷
              </Button>
            </Box>

            <Stack 
              direction="row" 
              spacing={4} 
              sx={{ 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                '& > *': {
                  animation: `${fadeIn} 0.8s ease-out 0.7s both`,
                  opacity: 0,
                },
                '& > *:nth-of-type(2)': {
                  animation: `${fadeIn} 0.8s ease-out 0.9s both`,
                },
                '& > *:nth-of-type(3)': {
                  animation: `${fadeIn} 0.8s ease-out 1.1s both`,
                },
              }}
            >
              {/* 信用评分卡片 */}
              <Box sx={{ width: { xs: '100%', md: '30%' }, mb: 4 }}>
                <Card sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: `0 20px 30px rgba(0, 0, 0, 0.3), 
                           0 0 30px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                }}>
                  <Box sx={{ 
                    height: '160px', 
                    background: 'linear-gradient(135deg, #3a7bd5 0%, #00d4ff 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("/img_v3_02md_c3938e0a-d1a8-4fd5-a751-a6b401fbae4g.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.6,
                      mixBlendMode: 'overlay',
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      zIndex: 1,
                    }} />
                  </Box>
                  <CardContent sx={{ position: 'relative', pt: 3 }}>
                    <Typography 
                      variant="h5" 
                      component="div" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: '#fff',
                        textShadow: `0 0 5px ${theme.palette.primary.main}`,
                      }}
                    >
                      AI信用评分
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#fff', opacity: 0.8 }}>
                      采用多维度链上数据分析，精准评估用户信用状况，提供个性化借贷方案。
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button 
                      size="medium" 
                      color="primary"
                      onClick={() => navigate('/credit-score-intro')}
                      sx={{ 
                        borderRadius: '20px',
                        px: 2,
                        '&:hover': {
                          background: alpha(theme.palette.primary.main, 0.1),
                        }
                      }}
                    >
                      了解更多
                    </Button>
                  </CardActions>
                </Card>
              </Box>

              {/* 风控检测卡片 */}
              <Box sx={{ width: { xs: '100%', md: '30%' }, mb: 4 }}>
                <Card sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: `0 20px 30px rgba(0, 0, 0, 0.3), 
                           0 0 30px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  },
                }}>
                  <Box sx={{ 
                    height: '160px', 
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00e676 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("/img_v3_02md_b70e156a-30e1-4158-ba20-3cdd4ea3f68g.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.6,
                      mixBlendMode: 'overlay',
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      zIndex: 1,
                    }} />
                  </Box>
                  <CardContent sx={{ position: 'relative', pt: 3 }}>
                    <Typography 
                      variant="h5" 
                      component="div" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: '#fff',
                        textShadow: `0 0 5px ${theme.palette.secondary.main}`,
                      }}
                    >
                      风控检测
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#fff', opacity: 0.8 }}>
                      基于机器学习的风险识别系统，实时预警异常交易，保障协议安全运行。
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button 
                      size="medium" 
                      color="secondary"
                      onClick={() => navigate('/risk-control-intro')}
                      sx={{ 
                        borderRadius: '20px',
                        px: 2,
                        '&:hover': {
                          background: alpha(theme.palette.secondary.main, 0.1),
                        }
                      }}
                    >
                      了解更多
                    </Button>
                  </CardActions>
                </Card>
              </Box>

              {/* 双代币模型卡片 */}
              <Box sx={{ width: { xs: '100%', md: '30%' }, mb: 4 }}>
                <Card sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: `0 20px 30px rgba(0, 0, 0, 0.3), 
                           0 0 30px ${alpha(theme.palette.warning.main, 0.3)}`,
                  },
                }}>
                  <Box sx={{ 
                    height: '160px', 
                    background: 'linear-gradient(135deg, #ffab00 0%, #ff5252 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("/img_v3_02md_6e6b4f3c-d898-4d34-be12-074c4b890dfg.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.6,
                      mixBlendMode: 'overlay',
                    }
                  }}>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      left: 0, 
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                      zIndex: 1,
                    }} />
                  </Box>
                  <CardContent sx={{ position: 'relative', pt: 3 }}>
                    <Typography 
                      variant="h5" 
                      component="div" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: '#fff',
                        textShadow: `0 0 5px ${theme.palette.warning.main}`,
                      }}
                    >
                      双代币模型
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: '#fff', opacity: 0.8 }}>
                      独特的双代币激励机制，优化资本效率，实现可持续发展与价值捕获。
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button 
                      size="medium" 
                      color="warning"
                      onClick={() => navigate('/token-model-intro')}
                      sx={{ 
                        borderRadius: '20px',
                        px: 2,
                        '&:hover': {
                          background: alpha(theme.palette.warning.main, 0.1),
                        }
                      }}
                    >
                      了解更多
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            </Stack>
            
            {/* 平台特点部分已移除 */}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Home;
