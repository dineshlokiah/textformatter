import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Grid, useTheme, TextField, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  FormControlLabel, Checkbox, FormGroup, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import SearchIcon from '@mui/icons-material/Search';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { explainRegex } from '../utils/regexUtils';

const CAPTURE_GROUP_COLORS = [
  '#90caf9', '#a5d6a7', '#ffcc80', '#ce93d8', '#ef9a9a', '#80cbc4',
  '#fff59d', '#f48fb1', '#b0bec5', '#bcaaa4',
];

const CHEAT_SHEET_DATA = [
  {
    category: 'Character Classes',
    items: [
      { syntax: '.', description: 'Any character except newline' },
      { syntax: '\\d', description: 'Any digit (0-9)' },
      { syntax: '\\D', description: 'Any non-digit' },
      { syntax: '\\w', description: 'Any word character (a-z, A-Z, 0-9, _)' },
      { syntax: '\\W', description: 'Any non-word character' },
      { syntax: '\\s', description: 'Any whitespace character' },
      { syntax: '\\S', description: 'Any non-whitespace character' },
      { syntax: '[abc]', description: 'Any of a, b, or c' },
      { syntax: '[^abc]', description: 'Any character except a, b, or c' },
      { syntax: '[a-z]', description: 'Any character in range a-z' },
    ],
  },
  {
    category: 'Quantifiers',
    items: [
      { syntax: '*', description: 'Zero or more' },
      { syntax: '+', description: 'One or more' },
      { syntax: '?', description: 'Zero or one (optional)' },
      { syntax: '{n}', description: 'Exactly n times' },
      { syntax: '{n,}', description: 'n or more times' },
      { syntax: '{n,m}', description: 'Between n and m times' },
      { syntax: '*?', description: 'Zero or more (lazy)' },
      { syntax: '+?', description: 'One or more (lazy)' },
    ],
  },
  {
    category: 'Anchors',
    items: [
      { syntax: '^', description: 'Start of string/line' },
      { syntax: '$', description: 'End of string/line' },
      { syntax: '\\b', description: 'Word boundary' },
      { syntax: '\\B', description: 'Non-word boundary' },
    ],
  },
  {
    category: 'Groups',
    items: [
      { syntax: '(...)', description: 'Capturing group' },
      { syntax: '(?:...)', description: 'Non-capturing group' },
      { syntax: '(?=...)', description: 'Positive lookahead' },
      { syntax: '(?!...)', description: 'Negative lookahead' },
      { syntax: '(?<=...)', description: 'Positive lookbehind' },
      { syntax: '(?<!...)', description: 'Negative lookbehind' },
      { syntax: '(?<name>...)', description: 'Named capturing group' },
    ],
  },
  {
    category: 'Flags',
    items: [
      { syntax: 'g', description: 'Global — find all matches' },
      { syntax: 'i', description: 'Case insensitive' },
      { syntax: 'm', description: 'Multiline — ^ and $ match line boundaries' },
      { syntax: 's', description: 'Dotall — . matches newline characters' },
    ],
  },
];

const RegexTesterPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false });
  const [testString, setTestString] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [mode, setMode] = useState<'match' | 'replace'>('match');

  // Decode URL hash on page load
  useEffect(() => {
    if (window.location.hash) {
      try {
        const state = JSON.parse(atob(window.location.hash.slice(1)));
        if (state.pattern !== undefined) setPattern(state.pattern);
        if (state.testString !== undefined) setTestString(state.testString);
        if (state.flags) {
          const flagObj = { g: false, i: false, m: false, s: false };
          for (const ch of state.flags) {
            if (ch in flagObj) flagObj[ch as keyof typeof flagObj] = true;
          }
          setFlags(flagObj);
        }
      } catch {
        // Invalid hash — silently ignore
      }
    }
  }, []);

  const textareaStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', padding: '12px',
    backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
  };
  const boxStyle = {
    height: 200, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
    borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
  };

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');

  // Encode state to URL hash whenever pattern, flags, or testString change
  useEffect(() => {
    if (pattern || testString) {
      const hash = btoa(JSON.stringify({ pattern, flags: flagStr, testString }));
      window.location.hash = hash;
    }
  }, [pattern, flagStr, testString]);

  const explanationTokens = useMemo(() => explainRegex(pattern), [pattern]);

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const { matches, matchesWithCaptures, highlightedHtml, replaceResult, regexError } = useMemo(() => {
    if (!pattern || !testString) return { matches: [], matchesWithCaptures: [], highlightedHtml: '', replaceResult: '', regexError: '' };
    try {
      const regex = new RegExp(pattern, flagStr);
      const allMatches: { match: string; index: number; groups: Record<string, string> | undefined }[] = [];
      const allCaptures: { match: string; index: number; captures: string[] }[] = [];

      if (flagStr.includes('g')) {
        let m: RegExpExecArray | null;
        while ((m = regex.exec(testString)) !== null) {
          allMatches.push({ match: m[0], index: m.index, groups: m.groups });
          allCaptures.push({ match: m[0], index: m.index, captures: Array.from(m).slice(1) });
          if (!m[0]) break;
        }
      } else {
        const m = regex.exec(testString);
        if (m) {
          allMatches.push({ match: m[0], index: m.index, groups: m.groups });
          allCaptures.push({ match: m[0], index: m.index, captures: Array.from(m).slice(1) });
        }
      }

      // Build highlighted HTML with capture group colors
      let html = '';
      let lastIndex = 0;
      const matchColors = ['#ffeb3b', '#4fc3f7', '#81c784', '#ff8a65', '#ce93d8', '#a1887f'];

      allCaptures.forEach((mc, i) => {
        const before = testString.slice(lastIndex, mc.index);
        html += escapeHtml(before);

        const hasCaptures = mc.captures.some(c => c !== undefined);
        if (hasCaptures) {
          // Highlight individual capture groups within the match
          const matchText = mc.match;
          const matchStart = mc.index;
          // Re-exec to get capture group positions
          const posRegex = new RegExp(pattern, flagStr.replace('g', ''));
          const posMatch = posRegex.exec(testString.slice(matchStart));
          if (posMatch && posMatch.length > 1) {
            // Build sub-highlights for capture groups
            let innerHtml = '';
            let innerIdx = 0;
            const groupPositions: { start: number; end: number; groupIdx: number }[] = [];

            // Find positions of each capture group within the match
            for (let g = 1; g < posMatch.length; g++) {
              if (posMatch[g] === undefined) continue;
              const groupText = posMatch[g];
              const groupStart = matchText.indexOf(groupText, innerIdx);
              if (groupStart !== -1) {
                groupPositions.push({ start: groupStart, end: groupStart + groupText.length, groupIdx: g - 1 });
                innerIdx = groupStart + groupText.length;
              }
            }

            // Sort by start position
            groupPositions.sort((a, b) => a.start - b.start);

            let pos = 0;
            const bgColor = matchColors[i % matchColors.length];
            for (const gp of groupPositions) {
              if (gp.start > pos) {
                innerHtml += `<mark style="background-color:${bgColor};color:#000;padding:1px 2px;border-radius:2px">${escapeHtml(matchText.slice(pos, gp.start))}</mark>`;
              }
              const cgColor = CAPTURE_GROUP_COLORS[gp.groupIdx % CAPTURE_GROUP_COLORS.length];
              innerHtml += `<mark style="background-color:${cgColor};color:#000;padding:1px 2px;border-radius:2px;border-bottom:2px solid ${cgColor}" title="Group ${gp.groupIdx + 1}">${escapeHtml(matchText.slice(gp.start, gp.end))}</mark>`;
              pos = gp.end;
            }
            if (pos < matchText.length) {
              innerHtml += `<mark style="background-color:${bgColor};color:#000;padding:1px 2px;border-radius:2px">${escapeHtml(matchText.slice(pos))}</mark>`;
            }
            html += innerHtml;
          } else {
            const color = matchColors[i % matchColors.length];
            html += `<mark style="background-color:${color};color:#000;padding:1px 2px;border-radius:2px">${escapeHtml(matchText)}</mark>`;
          }
        } else {
          const color = matchColors[i % matchColors.length];
          html += `<mark style="background-color:${color};color:#000;padding:1px 2px;border-radius:2px">${escapeHtml(mc.match)}</mark>`;
        }
        lastIndex = mc.index + mc.match.length;
      });
      html += escapeHtml(testString.slice(lastIndex));

      const replaced = replaceWith ? testString.replace(new RegExp(pattern, flagStr), replaceWith) : '';

      return { matches: allMatches, matchesWithCaptures: allCaptures, highlightedHtml: html, replaceResult: replaced, regexError: '' };
    } catch (e) {
      return { matches: [], matchesWithCaptures: [], highlightedHtml: '', replaceResult: '', regexError: (e as Error).message };
    }
  }, [pattern, testString, flagStr, replaceWith]);

  const clear = () => { setPattern(''); setTestString(''); setReplaceWith(''); window.location.hash = ''; };

  const commonPatterns = [
    { label: 'Email', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
    { label: 'URL', pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?' },
    { label: 'IP Address', pattern: '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}' },
    { label: 'Phone', pattern: '\\+?\\d[\\d\\s()-]{7,}\\d' },
    { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
    { label: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' },
    { label: 'JSON Key', pattern: '"(\\w+)"\\s*:' },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>Regex Tester</Typography>
        <Typography variant="body1" color="text.secondary">
          Test and debug regular expressions with real-time matching, highlighting, and replacement. Inspired by regex101.com — runs 100% in your browser.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField fullWidth label="Regular Expression" value={pattern} onChange={e => setPattern(e.target.value)}
              placeholder="Enter regex pattern..." variant="outlined" size="small" error={!!regexError}
              helperText={regexError || undefined} InputProps={{ sx: { fontFamily: 'monospace' } }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormGroup row>
              {Object.entries({ g: 'Global', i: 'Case Insensitive', m: 'Multiline', s: 'Dotall' }).map(([key, label]) => (
                <FormControlLabel key={key} control={<Checkbox checked={flags[key as keyof typeof flags]} onChange={() => setFlags(prev => ({ ...prev, [key]: !prev[key as keyof typeof flags] }))} size="small" />} label={label} />
              ))}
            </FormGroup>
          </Grid>
        </Grid>

        {/* Mode Toggle */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => { if (newMode) setMode(newMode); }}
            size="small"
          >
            <ToggleButton value="match" aria-label="match mode">
              <SearchIcon sx={{ mr: 0.5 }} fontSize="small" /> Match
            </ToggleButton>
            <ToggleButton value="replace" aria-label="replace mode">
              <FindReplaceIcon sx={{ mr: 0.5 }} fontSize="small" /> Replace
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {pattern && explanationTokens.length > 0 && (
          <Accordion variant="outlined" sx={{ mb: 2 }} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Pattern Explanation</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>Token</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {explanationTokens.map((t, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', whiteSpace: 'nowrap' }}>{t.token}</TableCell>
                        <TableCell>{t.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Test String</Typography>
            <Box sx={boxStyle}><textarea value={testString} onChange={e => setTestString(e.target.value)} placeholder="Enter test string..." style={textareaStyle} /></Box>
            {mode === 'replace' && (
              <Box sx={{ mt: 1 }}>
                <TextField fullWidth label="Replace With" value={replaceWith} onChange={e => setReplaceWith(e.target.value)}
                  placeholder="Replacement string ($1, $2 for groups)" variant="outlined" size="small" InputProps={{ sx: { fontFamily: 'monospace' } }} />
              </Box>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clear}>Clear</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Matches {matches.length > 0 && <Chip label={`${matches.length} match${matches.length > 1 ? 'es' : ''}`} size="small" color="primary" sx={{ ml: 1 }} />}
            </Typography>
            {highlightedHtml ? (
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            ) : (
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.disabled" sx={{ fontFamily: 'monospace' }}>Matches will be highlighted here...</Typography>
              </Box>
            )}

            {mode === 'replace' && replaceResult && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2">Replace Result</Typography>
                  <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(replaceResult)}>Copy</Button>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '4px', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)', backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto' }}>
                  {replaceResult}
                </Box>
              </Box>
            )}

            {/* Capture group color legend */}
            {matchesWithCaptures.some(mc => mc.captures.some(c => c !== undefined)) && (
              <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Groups:</Typography>
                {matchesWithCaptures[0]?.captures.map((c, idx) =>
                  c !== undefined ? (
                    <Chip
                      key={idx}
                      label={`Group ${idx + 1}`}
                      size="small"
                      sx={{ backgroundColor: CAPTURE_GROUP_COLORS[idx % CAPTURE_GROUP_COLORS.length], color: '#000', fontSize: '11px', height: 20 }}
                    />
                  ) : null
                )}
              </Box>
            )}
          </Grid>
        </Grid>

        {matches.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Match Details</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
              <Table size="small" stickyHeader>
                <TableHead><TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Match</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Index</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Length</TableCell>
                  {matches.some(m => m.groups) && <TableCell sx={{ fontWeight: 600 }}>Groups</TableCell>}
                </TableRow></TableHead>
                <TableBody>
                  {matches.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', maxWidth: 200, wordBreak: 'break-all' }}>{m.match}</TableCell>
                      <TableCell>{m.index}</TableCell>
                      <TableCell>{m.match.length}</TableCell>
                      {matches.some(m => m.groups) && <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.groups ? JSON.stringify(m.groups) : '—'}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Common Patterns:</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {commonPatterns.map(p => (
              <Chip key={p.label} label={p.label} size="small" variant="outlined"
                onClick={() => setPattern(p.pattern)} sx={{ cursor: 'pointer' }} />
            ))}
          </Box>
        </Box>

        {/* Cheat Sheet Accordion */}
        <Accordion variant="outlined" sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Regex Cheat Sheet</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {CHEAT_SHEET_DATA.map(section => (
                <Grid item xs={12} sm={6} md={4} key={section.category}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>{section.category}</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {section.items.map(item => (
                          <TableRow key={item.syntax}>
                            <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', whiteSpace: 'nowrap', py: 0.5, px: 1 }}>{item.syntax}</TableCell>
                            <TableCell sx={{ py: 0.5, px: 1, fontSize: '13px' }}>{item.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default RegexTesterPage;
