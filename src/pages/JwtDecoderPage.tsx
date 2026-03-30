import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import LockIcon from '@mui/icons-material/Lock';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDropZone from '../components/FileDropZone';
import DownloadButton from '../components/DownloadButton';
import PageHeader from '../components/PageHeader';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('json', json);

const JwtDecoderPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [input, setInput] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState('');
  const [expInfo, setExpInfo] = useState<{ expired: boolean; expDate: string } | null>(null);

  const decodeBase64Url = (str: string): string => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  };

  const decode = () => {
    setError('');
    setHeader('');
    setPayload('');
    setSignature('');
    setExpInfo(null);
    try {
      const trimmed = input.trim();
      const parts = trimmed.split('.');
      if (parts.length < 2 || parts.length > 3) {
        throw new Error('Invalid JWT format. Expected 2 or 3 parts separated by dots.');
      }
      const decodedHeader = JSON.parse(decodeBase64Url(parts[0]));
      setHeader(JSON.stringify(decodedHeader, null, 2));

      const decodedPayload = JSON.parse(decodeBase64Url(parts[1]));
      setPayload(JSON.stringify(decodedPayload, null, 2));

      if (parts[2]) setSignature(parts[2]);

      if (decodedPayload.exp) {
        const expDate = new Date(decodedPayload.exp * 1000);
        setExpInfo({ expired: expDate < new Date(), expDate: expDate.toLocaleString() });
      }
    } catch (e) {
      setError('Failed to decode JWT: ' + (e as Error).message);
    }
  };

  const clear = () => { setInput(''); setHeader(''); setPayload(''); setSignature(''); setError(''); setExpInfo(null); };
  const copySection = (text: string) => navigator.clipboard.writeText(text);

  const knownClaims: Record<string, string> = {
    iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expiration Time',
    nbf: 'Not Before', iat: 'Issued At', jti: 'JWT ID', name: 'Full Name',
    email: 'Email', scope: 'Scope', roles: 'Roles', azp: 'Authorized Party',
  };

  const renderClaimsTable = () => {
    if (!payload) return null;
    try {
      const claims = JSON.parse(payload);
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Claim</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(claims).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell><code>{key}</code></TableCell>
                  <TableCell>{knownClaims[key] || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 300, wordBreak: 'break-all' }}>
                    {key === 'exp' || key === 'iat' || key === 'nbf'
                      ? new Date((value as number) * 1000).toLocaleString()
                      : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } catch { return null; }
  };

  const syntaxStyle = isDark ? vs2015 : github;
  const renderJson = (text: string, label: string, color: string) => (
    text ? (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Chip label={label} size="small" sx={{ backgroundColor: color, color: '#fff', fontWeight: 600 }} />
          <Tooltip title="Copy"><Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copySection(text)}>Copy</Button></Tooltip>
        </Box>
        <SyntaxHighlighter language="json" style={syntaxStyle} showLineNumbers
          customStyle={{ margin: 0, padding: '12px', fontSize: '13px', lineHeight: '1.5', backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', borderRadius: '4px', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' }}>
          {text}
        </SyntaxHighlighter>
      </Box>
    ) : null
  );

  return (
    <Box>
      <PageHeader
        icon={<LockOutlinedIcon />}
        title="JWT Decoder"
        description="Decode JSON Web Tokens securely in your browser. No data leaves your machine — inspired by jwt.io but 100% offline and safe for production tokens."
        accentColor="#ec4899"
      />
      <Card variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>Encoded JWT</Typography>
            <FileDropZone onFileContent={setInput} accept=".txt,.jwt,.token">
            <Box sx={{ position: 'relative', display: 'flex', height: 300, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)', borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' } }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste your JWT token here or drag & drop a file (eyJhbGciOiJIUzI1NiIs...)" style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', padding: '12px', backgroundColor: 'transparent', color: 'inherit', overflow: 'auto', wordBreak: 'break-all' }} />
            </Box>
            </FileDropZone>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={decode} startIcon={<LockIcon />}>Decode</Button>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clear}>Clear</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>Decoded</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {expInfo && (
              <Alert severity={expInfo.expired ? 'warning' : 'success'} icon={expInfo.expired ? <WarningAmberIcon /> : <CheckCircleIcon />} sx={{ mb: 2 }}>
                Token {expInfo.expired ? 'expired' : 'valid until'}: {expInfo.expDate}
              </Alert>
            )}
            {renderJson(header, 'HEADER', '#fb015b')}
            {renderJson(payload, 'PAYLOAD', '#d63aff')}
            {signature && (
              <Box sx={{ mb: 2 }}>
                <Chip label="SIGNATURE" size="small" sx={{ backgroundColor: '#00b9f1', color: '#fff', fontWeight: 600, mb: 1 }} />
                <Box sx={{ p: 1.5, borderRadius: '4px', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)', backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
                  {signature}
                </Box>
              </Box>
            )}
            {renderClaimsTable()}
            {payload && (
              <Box sx={{ mt: 2 }}>
                <DownloadButton content={payload} filename="jwt-payload.json" mimeType="application/json" />
              </Box>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default JwtDecoderPage;
