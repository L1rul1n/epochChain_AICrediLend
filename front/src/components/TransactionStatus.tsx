import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Link, 
  Paper,
  Collapse
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { getEtherscanLink } from '../contracts/contractConfig';

interface TransactionStatusProps {
  txHash: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  chainId?: number;
  onClose?: () => void;
}

/**
 * 交易状态显示组件
 * 显示交易的状态、哈希和Etherscan链接
 */
export const TransactionStatus: React.FC<TransactionStatusProps> = ({ 
  txHash, 
  status, 
  chainId = 11155111,
  onClose 
}) => {
  if (!txHash || status === 'idle') return null;

  // 现在 getEtherscanLink 只接受一个参数（交易哈希）
  const etherscanLink = getEtherscanLink(txHash);

  return (
    <Collapse in={true}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          mt: 2, 
          mb: 2,
          borderLeft: status === 'success' 
            ? '4px solid #4caf50' 
            : status === 'error' 
              ? '4px solid #f44336' 
              : '4px solid #2196f3'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {status === 'pending' && (
              <CircularProgress size={24} sx={{ mr: 2 }} />
            )}
            {status === 'success' && (
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
            )}
            {status === 'error' && (
              <ErrorIcon color="error" sx={{ mr: 2 }} />
            )}
            
            <Typography variant="body1">
              {status === 'pending' && '交易处理中...'}
              {status === 'success' && '交易成功'}
              {status === 'error' && '交易失败'}
            </Typography>
          </Box>
        </Box>
        
        <Box mt={1}>
          <Typography variant="body2" color="textSecondary">
            交易哈希: <Link href={etherscanLink} target="_blank" rel="noopener noreferrer">
              {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
            </Link>
          </Typography>
        </Box>
        
        {status === 'pending' && (
          <Alert severity="info" sx={{ mt: 1 }}>
            请等待交易确认。您可以在Etherscan上查看交易详情。
          </Alert>
        )}
        
        {status === 'success' && (
          <Alert severity="success" sx={{ mt: 1 }}>
            交易已成功确认。您可以在Etherscan上查看交易详情。
          </Alert>
        )}
        
        {status === 'error' && (
          <Alert severity="error" sx={{ mt: 1 }}>
            交易处理过程中出现错误。请检查您的钱包或尝试重新提交交易。
          </Alert>
        )}
      </Paper>
    </Collapse>
  );
};

export default TransactionStatus;
