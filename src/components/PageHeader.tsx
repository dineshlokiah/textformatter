import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, accentColor = '#6366f1' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{
      mb: 3,
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: isDark ? alpha(accentColor, 0.25) : alpha(accentColor, 0.15),
      background: isDark
        ? `linear-gradient(135deg, ${alpha(accentColor, 0.12)} 0%, ${alpha(accentColor, 0.04)} 100%)`
        : `linear-gradient(135deg, ${alpha(accentColor, 0.07)} 0%, ${alpha(accentColor, 0.02)} 100%)`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
    }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
        background: `linear-gradient(135deg, ${accentColor} 0%, ${alpha(accentColor, 0.7)} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${alpha(accentColor, 0.35)}`,
        color: '#fff',
        '& svg': { fontSize: 22 },
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700} letterSpacing="-0.3px" gutterBottom sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, maxWidth: 720 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
};

export default PageHeader;
