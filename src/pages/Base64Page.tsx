import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, Tabs, Tab,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import FileDropZone from '../components/FileDropZone';
import DownloadButton from '../components/DownloadButton';
import PageHeader from '../components/PageHeader';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (<div role="tabpanel" hidden={value !== index} {...other}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>);
}

const Base64Page: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabValue, setTabValue] = useState(0);

  // Encode state
  const [encodeInput, setEncodeInput] = useState('');
  const [encodeOutput, setEncodeOutput] = useState('');
  const [encodeError, setEncodeError] = useState('');
  const [encodeUrlSafe, setEncodeUrlSafe] = useState(false);

  // Decode state
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeOutput, setDecodeOutput] = useState('');
  const [decodeError, setDecodeError] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [imageSrc, setImageSrc] = useState('');

  const textareaStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', padding: '12px',
    backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
  };

  const boxStyle = {
    height: 300, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
    borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
  };

  const encode = () => {
    setEncodeError('');
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(encodeInput);
      let base64 = btoa(String.fromCharCode(...data));
      if (encodeUrlSafe) base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      setEncodeOutput(base64);
    } catch (e) { setEncodeError('Encoding failed: ' + (e as Error).message); }
  };

  const decode = () => {
    setDecodeError(''); setIsImage(false); setImageSrc('');
    try {
      let b64 = decodeInput.trim();
      // Handle URL-safe base64
      b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      // Handle data URI
      const dataUriMatch = b64.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUriMatch) {
        setIsImage(dataUriMatch[1].startsWith('image/'));
        if (dataUriMatch[1].startsWith('image/')) { setImageSrc(decodeInput.trim()); setDecodeOutput('[Image data]'); return; }
        b64 = dataUriMatch[2];
      }
      const decoded = atob(b64);
      // Check if it looks like binary
      const nonPrintable = decoded.split('').filter(c => { const code = c.charCodeAt(0); return code < 32 && code !== 9 && code !== 10 && code !== 13; }).length;
      if (nonPrintable / decoded.length > 0.1) {
        setDecodeOutput(`[Binary data detected - ${decoded.length} bytes]`);
        // Try as image
        setIsImage(true); setImageSrc(`data:image/png;base64,${decodeInput.trim()}`);
      } else {
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        setDecodeOutput(new TextDecoder().decode(bytes));
      }
    } catch (e) { setDecodeError('Decoding failed: ' + (e as Error).message); }
  };

  const clearEncode = () => { setEncodeInput(''); setEncodeOutput(''); setEncodeError(''); };
  const clearDecode = () => { setDecodeInput(''); setDecodeOutput(''); setDecodeError(''); setIsImage(false); setImageSrc(''); };

  return (
    <Box>
      <PageHeader
        icon={<SwapHorizOutlinedIcon />}
        title="Base64 Encoder / Decoder"
        description="Encode and decode Base64 strings securely in your browser. Supports standard and URL-safe Base64, data URIs, and image preview. No data leaves your machine."
        accentColor="#f59e0b"
      />
      <Card variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Encode" />
            <Tab label="Decode" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Plain Text</Typography>
              <FileDropZone onFileContent={setEncodeInput} accept=".txt,.json,.xml,.csv,.log">
              <Box sx={boxStyle}><textarea value={encodeInput} onChange={e => setEncodeInput(e.target.value)} placeholder="Enter text to encode or drag & drop a file..." style={textareaStyle} /></Box>
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant="contained" onClick={encode}>Encode</Button>
                <Button variant="outlined" size="small" onClick={() => setEncodeUrlSafe(!encodeUrlSafe)} color={encodeUrlSafe ? 'secondary' : 'primary'}>
                  {encodeUrlSafe ? 'URL-Safe ✓' : 'Standard'}
                </Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearEncode}>Clear</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Base64 Output</Typography>
              {encodeError && <Alert severity="error" sx={{ mb: 2 }}>{encodeError}</Alert>}
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', overflow: 'auto', wordBreak: 'break-all' }}>
                {encodeOutput || <Typography color="text.disabled" sx={{ fontFamily: 'monospace' }}>Output will appear here...</Typography>}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(encodeOutput)} disabled={!encodeOutput}>Copy Output</Button>
                <DownloadButton content={encodeOutput} filename="encoded.b64" />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Base64 Input</Typography>
              <FileDropZone onFileContent={setDecodeInput} accept=".txt,.b64">
              <Box sx={boxStyle}><textarea value={decodeInput} onChange={e => setDecodeInput(e.target.value)} placeholder="Paste Base64 string here or drag & drop a file..." style={textareaStyle} /></Box>
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={decode} startIcon={<SwapVertIcon />}>Decode</Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearDecode}>Clear</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Decoded Output</Typography>
              {decodeError && <Alert severity="error" sx={{ mb: 2 }}>{decodeError}</Alert>}
              {isImage && imageSrc && (
                <Box sx={{ mb: 2, textAlign: 'center', p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                  <img src={imageSrc} alt="Decoded" style={{ maxWidth: '100%', maxHeight: 200 }} onError={() => { setIsImage(false); setImageSrc(''); }} />
                </Box>
              )}
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {decodeOutput || <Typography color="text.disabled" sx={{ fontFamily: 'monospace' }}>Output will appear here...</Typography>}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(decodeOutput)} disabled={!decodeOutput}>Copy Output</Button>
                <DownloadButton content={decodeOutput} filename="decoded.txt" />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Base64Page;
