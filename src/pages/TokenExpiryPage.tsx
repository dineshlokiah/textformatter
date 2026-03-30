import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, Chip, TextField,
  LinearProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import TimerIcon from '@mui/icons-material/Timer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

type TokenStatus = 'valid' | 'expiring' | 'expired' | 'unknown';

interface TokenClaims {
  iat: number | null;
  exp: number | null;
  nbf: number | null;
}

const decodeBase64Url = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
};

export function extractClaims(payloadStr: string): TokenClaims {
  const payload = JSON.parse(payloadStr);
  return {
    iat: typeof payload.iat === 'number' ? payload.iat : null,
    exp: typeof payload.exp === 'number' ? payload.exp : null,
    nbf: typeof payload.nbf === 'number' ? payload.nbf : null,
  };
}

export function decodeJwtPayload(token: string): string {
  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error('Invalid JWT format. Expected 2 or 3 dot-separated Base64URL segments.');
  }
  return decodeBase64Url(parts[1]);
}

export function getTokenStatus(remaining: number): TokenStatus {
  if (remaining <= 0) return 'expired';
  if (remaining <= 300) return 'expiring';
  return 'valid';
}

export function computeTimingValues(
  claims: TokenClaims,
  nowSeconds: number
): { countdown: number | null; elapsed: number | null; totalLifetime: number | null } {
  const countdown = claims.exp !== null ? claims.exp - nowSeconds : null;
  const elapsed = claims.iat !== null ? nowSeconds - claims.iat : null;
  const totalLifetime =
    claims.iat !== null && claims.exp !== null ? claims.exp - claims.iat : null;
  return { countdown, elapsed, totalLifetime };
}

function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

const statusConfig: Record<TokenStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  valid: { label: 'Valid', color: 'success' },
  expiring: { label: 'Expiring Soon', color: 'warning' },
  expired: { label: 'Expired', color: 'error' },
  unknown: { label: 'Unknown', color: 'default' },
};

const TokenExpiryPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [jwtInput, setJwtInput] = useState('');
  const [manualTimestamp, setManualTimestamp] = useState('');
  const [claims, setClaims] = useState<TokenClaims>({ iat: null, exp: null, nbf: null });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [totalLifetime, setTotalLifetime] = useState<number | null>(null);
  const [status, setStatus] = useState<TokenStatus>('unknown');
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);

  const processToken = useCallback(() => {
    setError('');
    setClaims({ iat: null, exp: null, nbf: null });
    setCountdown(null);
    setElapsed(null);
    setTotalLifetime(null);
    setStatus('unknown');
    setHasToken(false);

    const trimmedJwt = jwtInput.trim();
    const trimmedTs = manualTimestamp.trim();

    if (!trimmedJwt && !trimmedTs) return;

    try {
      let tokenClaims: TokenClaims;

      if (trimmedJwt) {
        const payloadStr = decodeJwtPayload(trimmedJwt);
        tokenClaims = extractClaims(payloadStr);
      } else {
        const ts = Number(trimmedTs);
        if (isNaN(ts) || !Number.isFinite(ts)) {
          throw new Error('Invalid timestamp. Enter a Unix timestamp in seconds.');
        }
        tokenClaims = { iat: null, exp: Math.floor(ts), nbf: null };
      }

      setClaims(tokenClaims);
      setHasToken(true);

      const now = Math.floor(Date.now() / 1000);
      const timing = computeTimingValues(tokenClaims, now);
      setCountdown(timing.countdown);
      setElapsed(timing.elapsed);
      setTotalLifetime(timing.totalLifetime);

      if (timing.countdown !== null) {
        setStatus(getTokenStatus(timing.countdown));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [jwtInput, manualTimestamp]);

  // Auto-decode when input changes
  useEffect(() => {
    processToken();
  }, [processToken]);

  // Live countdown timer
  useEffect(() => {
    if (claims.exp === null) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = claims.exp! - now;
      setCountdown(remaining);
      setStatus(getTokenStatus(remaining));

      if (claims.iat !== null) {
        setElapsed(now - claims.iat);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [claims.exp, claims.iat]);

  const handleClear = () => {
    setJwtInput('');
    setManualTimestamp('');
    setClaims({ iat: null, exp: null, nbf: null });
    setCountdown(null);
    setElapsed(null);
    setTotalLifetime(null);
    setStatus('unknown');
    setError('');
    setHasToken(false);
  };

  const handleCopy = () => {
    const lines: string[] = [];
    if (claims.exp !== null) {
      lines.push(`Expiry: ${formatTimestamp(claims.exp)}`);
      if (countdown !== null) lines.push(`Countdown: ${formatDuration(countdown)}`);
      lines.push(`Status: ${statusConfig[status].label}`);
    }
    if (claims.iat !== null) {
      lines.push(`Issued At: ${formatTimestamp(claims.iat)}`);
      if (elapsed !== null) lines.push(`Elapsed: ${formatDuration(elapsed)}`);
    }
    if (claims.nbf !== null) {
      lines.push(`Not Before: ${formatTimestamp(claims.nbf)}`);
    }
    if (totalLifetime !== null) {
      lines.push(`Total Lifetime: ${formatDuration(totalLifetime)}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
  };

  const lifetimeProgress = (() => {
    if (totalLifetime === null || totalLifetime <= 0 || elapsed === null) return null;
    const pct = Math.min(100, Math.max(0, (elapsed / totalLifetime) * 100));
    return pct;
  })();

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>
          Token Expiry Calculator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Paste a JWT token or enter a Unix timestamp to see live expiry details. 100% client-side — no data leaves your browser.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Input Section */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>Input</Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>JWT Token</Typography>
            <Box
              sx={{
                position: 'relative', display: 'flex', height: 200,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                borderRadius: '4px', overflow: 'hidden',
                '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
              }}
            >
              <textarea
                value={jwtInput}
                onChange={e => setJwtInput(e.target.value)}
                placeholder="Paste your JWT token here (eyJhbGciOiJIUzI1NiIs...)"
                style={{
                  width: '100%', height: '100%', border: 'none', outline: 'none',
                  resize: 'none', fontFamily: 'monospace', fontSize: '14px',
                  lineHeight: '1.5', padding: '12px', backgroundColor: 'transparent',
                  color: 'inherit', overflow: 'auto', wordBreak: 'break-all',
                }}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Or enter a Unix timestamp
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={manualTimestamp}
              onChange={e => setManualTimestamp(e.target.value)}
              placeholder="e.g. 1700000000"
              disabled={jwtInput.trim().length > 0}
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={!hasToken}
              >
                Copy
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearIcon />}
                onClick={handleClear}
              >
                Clear
              </Button>
            </Box>
          </Grid>

          {/* Output Section */}
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom>Expiry Details</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {hasToken && !error && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Status & Countdown */}
                {claims.exp !== null && (
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <TimerIcon color={status === 'valid' ? 'success' : status === 'expiring' ? 'warning' : 'error'} />
                      <Chip
                        label={statusConfig[status].label}
                        color={statusConfig[status].color}
                        size="small"
                      />
                    </Box>
                    {countdown !== null && (
                      <Typography variant="h4" fontFamily="monospace" sx={{ my: 1 }}>
                        {formatDuration(countdown)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {countdown !== null && countdown > 0
                        ? 'Time remaining until expiry'
                        : 'Token has expired'}
                    </Typography>
                  </Card>
                )}

                {claims.exp === null && (
                  <Alert severity="info">No expiration claim found in this token.</Alert>
                )}

                {/* Time Details */}
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    Time Details
                  </Typography>
                  <Grid container spacing={1}>
                    {claims.iat !== null && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Issued At</Typography>
                        <Typography variant="body1">{formatTimestamp(claims.iat)}</Typography>
                      </Grid>
                    )}
                    {claims.exp !== null && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Expires At</Typography>
                        <Typography variant="body1">{formatTimestamp(claims.exp)}</Typography>
                      </Grid>
                    )}
                    {claims.nbf !== null && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Not Before</Typography>
                        <Typography variant="body1">{formatTimestamp(claims.nbf)}</Typography>
                      </Grid>
                    )}
                    {claims.iat === null && claims.nbf === null && claims.exp === null && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          No timing claims found.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Card>

                {/* Elapsed & Lifetime */}
                {(elapsed !== null || totalLifetime !== null) && (
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Lifetime</Typography>
                    {elapsed !== null && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Time elapsed since issuance
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace">
                          {formatDuration(elapsed)}
                        </Typography>
                      </Box>
                    )}
                    {totalLifetime !== null && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total token lifetime
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace">
                          {formatDuration(totalLifetime)}
                        </Typography>
                      </Box>
                    )}
                    {lifetimeProgress !== null && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Lifetime progress
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={lifetimeProgress}
                          color={status === 'expired' ? 'error' : status === 'expiring' ? 'warning' : 'primary'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {lifetimeProgress.toFixed(1)}% elapsed
                        </Typography>
                      </Box>
                    )}
                  </Card>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default TokenExpiryPage;
