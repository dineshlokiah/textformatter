import React from 'react';
import { Box, Typography, useTheme, alpha, Link } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CodeIcon from '@mui/icons-material/Code';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        borderTop: '1px solid',
        borderColor: isDark ? '#21262d' : '#e2e8f0',
        backgroundColor: isDark ? '#0d1117' : '#ffffff',
        px: { xs: 2, md: 4 },
        py: 3,
      }}
    >
      <Box sx={{
        maxWidth: 1440,
        mx: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        {/* Left — brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 26, height: 26, borderRadius: '7px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldIcon sx={{ fontSize: 14, color: '#fff' }} />
          </Box>
          <Typography fontSize={13} fontWeight={600} color="text.primary">
            Secure Utilities
          </Typography>
          <Typography fontSize={12} color="text.disabled" sx={{ ml: 0.5 }}>
            v3.0
          </Typography>
        </Box>

        {/* Center — developer credit */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <CodeIcon sx={{ fontSize: 14, color: alpha('#6366f1', 0.7) }} />
          <Typography fontSize={13} color="text.secondary">
            Built with
          </Typography>
          <FavoriteIcon sx={{ fontSize: 12, color: '#ec4899', mx: 0.3 }} />
          <Typography fontSize={13} color="text.secondary">
            by
          </Typography>
          <Typography
            fontSize={13}
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Dinesh Lokiah
          </Typography>
        </Box>

        {/* Right — security note */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography fontSize={11} color="text.disabled">
            🔒 100% client-side · No data leaves your browser
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
