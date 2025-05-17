import React from 'react';
import { Box, BoxProps, useTheme } from '@mui/material';

interface TeamIconImageProps extends BoxProps {
  size?: number | string;
  color?: string;
  fontSize?: string;
}

// 使用实际队徽图片的图标组件
export const TeamIconImage: React.FC<TeamIconImageProps> = ({ 
  size = 24, 
  color, 
  fontSize, 
  sx, 
  ...props 
}) => {
  const theme = useTheme();
  // 根据fontSize属性调整大小
  let finalSize = size;
  if (fontSize === 'small') finalSize = 20;
  if (fontSize === 'medium') finalSize = 24;
  if (fontSize === 'large') finalSize = 35;
  if (fontSize === 'inherit') finalSize = 'inherit';
  
  return (
    <Box
      sx={{
        width: finalSize,
        height: finalSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        borderRadius: '50%',
        backgroundColor: typeof color === 'string' ? color : 
                        color === 'primary' ? theme.palette.primary.main :
                        color === 'secondary' ? theme.palette.secondary.main :
                        color === 'success' ? theme.palette.success.main :
                        color === 'error' ? theme.palette.error.main :
                        color === 'info' ? theme.palette.info.main :
                        color === 'inherit' ? 'currentColor' : theme.palette.primary.main,
        boxShadow: `0 0 5px ${typeof color === 'string' ? color : 
                  color === 'primary' ? theme.palette.primary.main :
                  color === 'secondary' ? theme.palette.secondary.main :
                  color === 'success' ? theme.palette.success.main :
                  color === 'error' ? theme.palette.error.main :
                  color === 'info' ? theme.palette.info.main :
                  color === 'inherit' ? 'currentColor' : theme.palette.primary.main}`,
        opacity: 0.8,
        ...sx
      }}
      {...props}
    />
  );
};

export default TeamIconImage;
