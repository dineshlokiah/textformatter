import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, Chip,
  Table, TableBody, TableCell, TableContainer, TableRow, Paper,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import FileDropZone from '../components/FileDropZone';

interface CertInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  version: number;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: string;
  fingerprint: string;
  san: string[];
  isCA: boolean;
  isSelfSigned: boolean;
  pemSize: number;
}

const CertInspectorPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [input, setInput] = useState('');
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [error, setError] = useState('');
  const [chainInfo, setChainInfo] = useState<CertInfo[]>([]);

  const textareaStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5', padding: '12px',
    backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
  };
  const boxStyle = {
    height: 300, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
    borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
  };

  const bytesToHex = (bytes: number[]): string => bytes.map(b => b.toString(16).padStart(2, '0')).join(':');

  const parseASN1String = (bytes: number[], offset: number, length: number): string => {
    return bytes.slice(offset, offset + length).map(b => String.fromCharCode(b)).join('');
  };

  const parsePEM = (pem: string): CertInfo => {
    // Extract all certs from PEM
    const certRegex = /-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/g;
    const matches = [...pem.matchAll(certRegex)];
    if (matches.length === 0) throw new Error('No valid PEM certificate found. Paste a certificate starting with -----BEGIN CERTIFICATE-----');

    const b64 = matches[0][1].replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = Array.from(binary, c => c.charCodeAt(0));

    // Parse basic ASN.1 DER structure
    const info = parseDERCert(bytes, b64);
    return info;
  };

  const parseDERCert = (bytes: number[], b64: string): CertInfo => {
    // This is a simplified parser that extracts key fields from X.509 DER
    const pemSize = b64.length;

    // Find version (usually at offset ~7)
    let version = 3;
    if (bytes[4] === 0xA0) version = bytes[7] + 1;

    // Extract serial number
    // Find the serial number (INTEGER tag = 0x02)
    let serialHex = '';
    for (let i = 4; i < Math.min(50, bytes.length); i++) {
      if (bytes[i] === 0x02 && bytes[i + 1] > 0 && bytes[i + 1] < 30) {
        const len = bytes[i + 1];
        serialHex = bytes.slice(i + 2, i + 2 + len).map(b => b.toString(16).padStart(2, '0')).join(':');
        break;
      }
    }

    // Extract all readable strings from cert
    // Try to identify subject and issuer from string patterns
    const subject: Record<string, string> = {};
    const issuer: Record<string, string> = {};

    // Simple extraction: find CN, O, etc. by looking for OID sequences
    for (let i = 0; i < Math.min(bytes.length - 10, 400); i++) {
      if (bytes[i] === 0x06 && bytes[i + 1] === 0x03 && bytes[i + 2] === 0x55 && bytes[i + 3] === 0x04) {
        const attrType = bytes[i + 4];
        const attrNames: Record<number, string> = { 3: 'CN', 6: 'C', 7: 'L', 8: 'ST', 10: 'O', 11: 'OU' };
        const name = attrNames[attrType];
        if (name && i + 7 < bytes.length) {
          const strTag = bytes[i + 5];
          if (strTag === 0x13 || strTag === 0x0C || strTag === 0x16) {
            const len = bytes[i + 6];
            if (len > 0 && len < 128) {
              const val = parseASN1String(bytes, i + 7, len);
              // First occurrence goes to issuer, second to subject (in DER order)
              if (!issuer[name]) issuer[name] = val;
              else if (!subject[name]) subject[name] = val;
            }
          }
        }
      }
    }

    // If subject is empty, swap (self-signed cert)
    const isSelfSigned = Object.keys(subject).length === 0 ||
      (subject['CN'] === issuer['CN'] && subject['O'] === issuer['O']);
    if (Object.keys(subject).length === 0) {
      Object.assign(subject, issuer);
    }

    // Find validity dates (UTCTime tag = 0x17 or GeneralizedTime = 0x18)
    let validFrom = '';
    let validTo = '';
    const dateTags: number[] = [];
    for (let i = 0; i < bytes.length - 2; i++) {
      if ((bytes[i] === 0x17 || bytes[i] === 0x18) && bytes[i + 1] >= 12 && bytes[i + 1] <= 16) {
        const len = bytes[i + 1];
        const dateStr = parseASN1String(bytes, i + 2, len);
        if (/^\d{12,14}Z?$/.test(dateStr)) dateTags.push(i);
      }
    }

    const parseDate = (offset: number): Date => {
      const tag = bytes[offset];
      const len = bytes[offset + 1];
      const str = parseASN1String(bytes, offset + 2, len);
      if (tag === 0x17) { // UTCTime
        const year = parseInt(str.substr(0, 2));
        const fullYear = year >= 50 ? 1900 + year : 2000 + year;
        return new Date(`${fullYear}-${str.substr(2, 2)}-${str.substr(4, 2)}T${str.substr(6, 2)}:${str.substr(8, 2)}:${str.substr(10, 2)}Z`);
      }
      // GeneralizedTime
      return new Date(`${str.substr(0, 4)}-${str.substr(4, 2)}-${str.substr(6, 2)}T${str.substr(8, 2)}:${str.substr(10, 2)}:${str.substr(12, 2)}Z`);
    };

    let fromDate = new Date();
    let toDate = new Date();
    if (dateTags.length >= 2) {
      fromDate = parseDate(dateTags[0]);
      toDate = parseDate(dateTags[1]);
      validFrom = fromDate.toLocaleString();
      validTo = toDate.toLocaleString();
    }

    const now = new Date();
    const isExpired = toDate < now;
    const daysUntilExpiry = Math.ceil((toDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Compute SHA-256 fingerprint (simplified - just use first 20 bytes hash representation)
    const fingerprint = bytesToHex(bytes.slice(0, 20)).toUpperCase();

    // Detect signature algorithm
    let signatureAlgorithm = 'Unknown';
    // Look for common OIDs
    const certHex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    if (certHex.includes('2a864886f70d01010b')) signatureAlgorithm = 'SHA256withRSA';
    else if (certHex.includes('2a864886f70d010105')) signatureAlgorithm = 'SHA1withRSA';
    else if (certHex.includes('2a864886f70d01010c')) signatureAlgorithm = 'SHA384withRSA';
    else if (certHex.includes('2a864886f70d01010d')) signatureAlgorithm = 'SHA512withRSA';
    else if (certHex.includes('2a8648ce3d040302')) signatureAlgorithm = 'ECDSA with SHA256';

    // Detect key type
    let publicKeyAlgorithm = 'RSA';
    let keySize = 'Unknown';
    if (certHex.includes('2a8648ce3d0201')) { publicKeyAlgorithm = 'ECDSA'; keySize = '256-bit'; }
    else {
      // Try to find RSA key size from modulus length
      for (let i = 0; i < bytes.length - 4; i++) {
        if (bytes[i] === 0x02 && bytes[i + 1] === 0x82) {
          const modLen = (bytes[i + 2] << 8) | bytes[i + 3];
          if (modLen >= 128 && modLen <= 1024) { keySize = `${modLen * 8}-bit`; break; }
        }
      }
    }

    // Check for SAN extension
    const san: string[] = [];
    // Look for SAN OID (2.5.29.17 = 55 1d 11)
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === 0x55 && bytes[i + 1] === 0x1d && bytes[i + 2] === 0x11) {
        // Found SAN extension, extract DNS names (tag 0x82)
        for (let j = i + 3; j < Math.min(i + 500, bytes.length - 2); j++) {
          if (bytes[j] === 0x82) {
            const len = bytes[j + 1];
            if (len > 0 && len < 128) {
              const name = parseASN1String(bytes, j + 2, len);
              if (/^[\w.*-]+$/.test(name)) san.push(name);
            }
          }
        }
        break;
      }
    }

    // Check for CA basic constraint
    let isCA = false;
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === 0x55 && bytes[i + 1] === 0x1d && bytes[i + 2] === 0x13) {
        // Basic Constraints found, check if CA=TRUE
        for (let j = i + 3; j < Math.min(i + 20, bytes.length); j++) {
          if (bytes[j] === 0x01 && bytes[j + 1] === 0x01 && bytes[j + 2] === 0xFF) { isCA = true; break; }
        }
        break;
      }
    }

    return {
      subject, issuer, serialNumber: serialHex, validFrom, validTo,
      isExpired, daysUntilExpiry, version, signatureAlgorithm,
      publicKeyAlgorithm, keySize, fingerprint, san, isCA, isSelfSigned, pemSize,
    };
  };

  const inspect = () => {
    setError(''); setCertInfo(null); setChainInfo([]);
    try {
      const info = parsePEM(input);
      setCertInfo(info);

      // Parse chain if multiple certs
      const certRegex = /-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/g;
      const matches = [...input.matchAll(certRegex)];
      if (matches.length > 1) {
        const chain = matches.map(m => {
          const b64 = m[1].replace(/\s/g, '');
          const binary = atob(b64);
          const bytes = Array.from(binary, c => c.charCodeAt(0));
          return parseDERCert(bytes, b64);
        });
        setChainInfo(chain);
      }
    } catch (e) { setError((e as Error).message); }
  };

  const clear = () => { setInput(''); setCertInfo(null); setError(''); setChainInfo([]); };

  const renderField = (label: string, value: string | number | boolean | undefined) => (
    value !== undefined ? (
      <TableRow>
        <TableCell sx={{ fontWeight: 600, width: 200 }}>{label}</TableCell>
        <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{String(value)}</TableCell>
      </TableRow>
    ) : null
  );

  const renderDN = (dn: Record<string, string>) =>
    Object.entries(dn).map(([k, v]) => `${k}=${v}`).join(', ') || 'N/A';

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>Certificate Inspector</Typography>
        <Typography variant="body1" color="text.secondary">
          Inspect X.509 PEM certificates — view subject, issuer, validity, SANs, key info, and chain details. Inspired by sslshopper.com/certificate-decoder — runs 100% in your browser.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>PEM Certificate</Typography>
            <FileDropZone onFileContent={setInput} accept=".pem,.crt,.cer,.cert,.txt">
            <Box sx={boxStyle}><textarea value={input} onChange={e => setInput(e.target.value)} placeholder={'Paste your PEM certificate here or drag & drop a file...\n\n-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----'} style={textareaStyle} /></Box>
            </FileDropZone>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={inspect} startIcon={<SearchIcon />}>Inspect</Button>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clear}>Clear</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>Certificate Details</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {certInfo && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {certInfo.isExpired ? (
                    <Chip icon={<ErrorIcon />} label="Expired" color="error" size="small" />
                  ) : certInfo.daysUntilExpiry <= 30 ? (
                    <Chip icon={<WarningAmberIcon />} label={`Expires in ${certInfo.daysUntilExpiry} days`} color="warning" size="small" />
                  ) : (
                    <Chip icon={<CheckCircleIcon />} label={`Valid (${certInfo.daysUntilExpiry} days remaining)`} color="success" size="small" />
                  )}
                  {certInfo.isCA && <Chip label="CA Certificate" color="info" size="small" />}
                  {certInfo.isSelfSigned && <Chip label="Self-Signed" color="warning" size="small" variant="outlined" />}
                  <Chip label={`v${certInfo.version}`} size="small" variant="outlined" />
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                  <Table size="small">
                    <TableBody>
                      {renderField('Subject', renderDN(certInfo.subject))}
                      {renderField('Issuer', renderDN(certInfo.issuer))}
                      {renderField('Serial Number', certInfo.serialNumber)}
                      {renderField('Valid From', certInfo.validFrom)}
                      {renderField('Valid To', certInfo.validTo)}
                      {renderField('Signature Algorithm', certInfo.signatureAlgorithm)}
                      {renderField('Public Key', `${certInfo.publicKeyAlgorithm} ${certInfo.keySize}`)}
                      {renderField('Fingerprint (first 20 bytes)', certInfo.fingerprint)}
                      {certInfo.san.length > 0 && renderField('Subject Alt Names', certInfo.san.join(', '))}
                      {renderField('PEM Size', `${certInfo.pemSize} characters`)}
                    </TableBody>
                  </Table>
                </TableContainer>

                {chainInfo.length > 1 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Certificate Chain ({chainInfo.length} certificates)</Typography>
                    {chainInfo.map((cert, i) => (
                      <Alert key={i} severity={cert.isExpired ? 'error' : 'success'} sx={{ mb: 1 }} icon={cert.isExpired ? <ErrorIcon /> : <CheckCircleIcon />}>
                        <Typography variant="body2">
                          [{i + 1}] {renderDN(cert.subject)} — {cert.isExpired ? 'EXPIRED' : `Valid until ${cert.validTo}`}
                          {cert.isCA && ' (CA)'}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}
              </Box>
            )}
            {!certInfo && !error && (
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.disabled">Certificate details will appear here...</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default CertInspectorPage;
