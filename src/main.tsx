import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography,
  Box, IconButton, Tooltip, alpha,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ShieldIcon from '@mui/icons-material/Shield';
import CodeIcon from '@mui/icons-material/Code';
import LockIcon from '@mui/icons-material/Lock';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TuneIcon from '@mui/icons-material/Tune';
import DifferenceIcon from '@mui/icons-material/Difference';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StorageIcon from '@mui/icons-material/Storage';
import TimerIcon from '@mui/icons-material/Timer';

import FormatterPage from './pages/FormatterPage';
import JwtDecoderPage from './pages/JwtDecoderPage';
import Base64Page from './pages/Base64Page';
import YamlLinterPage from './pages/YamlLinterPage';
import DiffCheckerPage from './pages/DiffCheckerPage';
import QueryParserPage from './pages/QueryParserPage';
import RegexTesterPage from './pages/RegexTesterPage';
import CertInspectorPage from './pages/CertInspectorPage';
import SqlFormatterPage from './pages/SqlFormatterPage';
import TokenExpiryPage from './pages/TokenExpiryPage';
import Footer from './components/Footer';

const UTILITIES = [
  { label: 'Formatter',            path: '/formatter',    icon: <CodeIcon sx={{ fontSize: 15 }} /> },
  { label: 'JWT Decoder',          path: '/jwt-decoder',  icon: <LockIcon sx={{ fontSize: 15 }} /> },
  { label: 'Base64',               path: '/base64',       icon: <SwapHorizIcon sx={{ fontSize: 15 }} /> },
  { label: 'YAML Linter',          path: '/yaml-linter',  icon: <TuneIcon sx={{ fontSize: 15 }} /> },
  { label: 'Diff Checker',         path: '/diff-checker', icon: <DifferenceIcon sx={{ fontSize: 15 }} /> },
  { label: 'Query Parser',         path: '/query-parser', icon: <SearchIcon sx={{ fontSize: 15 }} /> },
  { label: 'Regex Tester',         path: '/regex-tester', icon: <SearchIcon sx={{ fontSize: 15 }} /> },
  { label: 'Cert Inspector',       path: '/cert-inspector', icon: <VerifiedUserIcon sx={{ fontSize: 15 }} /> },
  { label: 'SQL Formatter',        path: '/sql-formatter', icon: <StorageIcon sx={{ fontSize: 15 }} /> },
  { label: 'Token Expiry',         path: '/token-expiry', icon: <TimerIcon sx={{ fontSize: 15 }} /> },
];

function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#6366f1' },
      secondary: { main: '#ec4899' },
      ...(mode === 'light'
        ? {
            background: { default: '#f1f5f9', paper: '#ffffff' },
            text: { primary: '#0f172a', secondary: '#475569' },
          }
        : {
            background: { default: '#0d1117', paper: '#161b22' },
            text: { primary: '#e2e8f0', secondary: '#94a3b8' },
          }),
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.5px' },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: mode === 'dark' ? '#0d1117' : '#ffffff',
            borderBottom: `1px solid ${mode === 'dark' ? '#21262d' : '#e2e8f0'}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${mode === 'dark' ? '#21262d' : '#e2e8f0'}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500 },
          containedPrimary: {
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.45)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 500, minHeight: 44 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
    },
  });
}

function NavBar({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  const location = useLocation();
  const isDark = mode === 'dark';

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 0, px: { xs: 1.5, md: 2.5 }, minHeight: '52px !important' }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 3, flexShrink: 0 }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
          }}>
            <ShieldIcon sx={{ fontSize: 17, color: '#fff' }} />
          </Box>
          <Typography fontWeight={700} fontSize={15} letterSpacing="-0.3px" noWrap>
            Secure Utilities
          </Typography>
        </Box>

        {/* Nav items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexWrap: 'wrap', flex: 1 }}>
          {UTILITIES.map(u => {
            const active = location.pathname === u.path || (location.pathname === '/' && u.path === '/diff-checker') || (location.pathname === '/textformatter' && u.path === '/diff-checker');
            return (
              <Box
                key={u.path}
                component={Link}
                to={u.path}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6,
                  px: 1.2, py: 0.6,
                  borderRadius: '7px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  color: active
                    ? '#6366f1'
                    : isDark ? '#94a3b8' : '#475569',
                  backgroundColor: active
                    ? alpha('#6366f1', isDark ? 0.15 : 0.08)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: active
                      ? alpha('#6366f1', isDark ? 0.2 : 0.12)
                      : isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
                    color: active ? '#6366f1' : isDark ? '#e2e8f0' : '#0f172a',
                  },
                }}
              >
                {u.icon}
                {u.label}
              </Box>
            );
          })}
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, flexShrink: 0 }}>
          <Box sx={{
            display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5,
            px: 1.2, py: 0.4, borderRadius: '20px', fontSize: 11, fontWeight: 600,
            color: '#22c55e',
            border: '1px solid',
            borderColor: alpha('#22c55e', 0.4),
            backgroundColor: alpha('#22c55e', isDark ? 0.1 : 0.06),
          }}>
            🔒 Client-Side Only
          </Box>
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton
              size="small"
              onClick={toggleMode}
              sx={{
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isDark ? '#21262d' : '#e2e8f0',
                width: 32, height: 32,
                color: isDark ? '#94a3b8' : '#475569',
                '&:hover': { backgroundColor: isDark ? alpha('#ffffff', 0.06) : alpha('#000', 0.04) },
              }}
            >
              {mode === 'dark' ? <Brightness7Icon sx={{ fontSize: 17 }} /> : <Brightness4Icon sx={{ fontSize: 17 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/textformatter">
        <NavBar mode={mode} toggleMode={() => setMode(m => m === 'light' ? 'dark' : 'light')} />
        <Box sx={{ maxWidth: 1440, mx: 'auto', px: { xs: 1, md: 2 }, py: 2 }}>
          <Routes>
            <Route path="/" element={<DiffCheckerPage />} />
            <Route path="/formatter" element={<FormatterPage />} />
            <Route path="/jwt-decoder" element={<JwtDecoderPage />} />
            <Route path="/base64" element={<Base64Page />} />
            <Route path="/yaml-linter" element={<YamlLinterPage />} />
            <Route path="/diff-checker" element={<DiffCheckerPage />} />
            <Route path="/query-parser" element={<QueryParserPage />} />
            <Route path="/regex-tester" element={<RegexTesterPage />} />
            <Route path="/cert-inspector" element={<CertInspectorPage />} />
            <Route path="/sql-formatter" element={<SqlFormatterPage />} />
            <Route path="/token-expiry" element={<TokenExpiryPage />} />
          </Routes>
        </Box>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
