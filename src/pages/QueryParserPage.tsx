import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, TextField, Chip, Collapse,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import TreeView from '../components/TreeView';

SyntaxHighlighter.registerLanguage('json', json);

const QueryParserPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [dataInput, setDataInput] = useState('');
  const [query, setQuery] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [treeOpen, setTreeOpen] = useState(true);

  const parsedData = useMemo(() => {
    if (!dataInput.trim()) return null;
    try {
      return JSON.parse(dataInput);
    } catch {
      return null;
    }
  }, [dataInput]);

  const handleNodeClick = (path: string) => {
    setQuery(path);
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', padding: '12px',
    backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
  };
  const boxStyle = {
    height: 300, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
    borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
  };
  const syntaxStyle = isDark ? vs2015 : github;

  // Simple JSONPath-like query engine (client-side jq alternative)
  const evaluateQuery = (data: any, q: string): any => {
    q = q.trim();
    if (q === '.' || q === '') return data;

    // Handle pipe operator
    if (q.includes(' | ')) {
      const parts = q.split(' | ');
      let result = data;
      for (const part of parts) {
        result = evaluateQuery(result, part.trim());
      }
      return result;
    }

    // .key or .key.subkey
    if (q.startsWith('.') && !q.startsWith('.[') && !q.startsWith('..')) {
      const keys = q.slice(1).split('.').filter(Boolean);
      let result = data;
      for (const key of keys) {
        // Handle array index in key like "items[0]"
        const arrMatch = key.match(/^(\w+)\[(\d+)\]$/);
        if (arrMatch) {
          result = result?.[arrMatch[1]]?.[parseInt(arrMatch[2])];
        } else {
          result = result?.[key];
        }
        if (result === undefined) return null;
      }
      return result;
    }

    // .[n] array index
    if (q.startsWith('.[')) {
      const match = q.match(/^\.\[(\d+)\](.*)/);
      if (match) {
        const result = Array.isArray(data) ? data[parseInt(match[1])] : null;
        return match[2] ? evaluateQuery(result, '.' + match[2]) : result;
      }
    }

    // .[] iterate array
    if (q === '.[]') {
      return Array.isArray(data) ? data : Object.values(data);
    }

    // .[] | .key — map over array
    if (q.startsWith('.[] | ')) {
      const subQuery = q.slice(6);
      const arr = Array.isArray(data) ? data : Object.values(data);
      return arr.map(item => evaluateQuery(item, subQuery));
    }

    // keys
    if (q === 'keys') return Object.keys(data);
    // values
    if (q === 'values') return Object.values(data);
    // length
    if (q === 'length') return Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : String(data).length;
    // type
    if (q === 'type') return Array.isArray(data) ? 'array' : typeof data;
    // flatten
    if (q === 'flatten') return Array.isArray(data) ? data.flat(Infinity) : data;
    // unique
    if (q === 'unique') return Array.isArray(data) ? [...new Set(data.map(i => JSON.stringify(i)))].map(i => JSON.parse(i)) : data;
    // sort
    if (q === 'sort') return Array.isArray(data) ? [...data].sort() : data;
    // reverse
    if (q === 'reverse') return Array.isArray(data) ? [...data].reverse() : data;
    // first / last
    if (q === 'first') return Array.isArray(data) ? data[0] : data;
    if (q === 'last') return Array.isArray(data) ? data[data.length - 1] : data;

    // select(condition) — basic support
    const selectMatch = q.match(/^select\(\.(\w+)\s*(==|!=|>|<|>=|<=)\s*(.+)\)$/);
    if (selectMatch) {
      const [, key, op, rawVal] = selectMatch;
      const val = rawVal.startsWith('"') ? rawVal.slice(1, -1) : isNaN(Number(rawVal)) ? rawVal : Number(rawVal);
      const arr = Array.isArray(data) ? data : [data];
      return arr.filter(item => {
        const v = item?.[key];
        switch (op) {
          case '==': return v == val;
          case '!=': return v != val;
          case '>': return v > val;
          case '<': return v < val;
          case '>=': return v >= val;
          case '<=': return v <= val;
          default: return false;
        }
      });
    }

    // map(.key)
    const mapMatch = q.match(/^map\((.+)\)$/);
    if (mapMatch) {
      const arr = Array.isArray(data) ? data : [data];
      return arr.map(item => evaluateQuery(item, mapMatch[1]));
    }

    throw new Error(`Unsupported query: "${q}". See examples below.`);
  };

  // Built-in function names that don't need a dot prefix
  const builtinFunctions = new Set([
    'keys', 'values', 'length', 'type', 'flatten', 'unique', 'sort', 'reverse', 'first', 'last',
  ]);

  // Error suggestion map for common mistakes
  const getErrorSuggestion = (q: string, errMsg: string): string | null => {
    const trimmed = q.trim();
    // Missing dot prefix — user typed a field name without leading dot
    if (trimmed && !trimmed.startsWith('.') && !builtinFunctions.has(trimmed) && !trimmed.startsWith('select(') && !trimmed.startsWith('map(')) {
      return `Did you mean ".${trimmed}"?`;
    }
    // Unexpected token hints
    if (errMsg.includes('Unexpected token') || errMsg.includes('JSON.parse')) {
      return 'Check that your JSON input is valid. Ensure strings are double-quoted and there are no trailing commas.';
    }
    // Unsupported query
    if (errMsg.includes('Unsupported query')) {
      return 'Check the query syntax. Use the Quick Reference below for supported patterns.';
    }
    return null;
  };

  // Determine result type for the metadata chip
  const getResultType = (val: any): string => {
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val; // 'object' | 'string' | 'number' | 'boolean'
  };

  // Color mapping for type chips
  const typeChipColor: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    object: 'primary',
    array: 'secondary',
    string: 'success',
    number: 'info',
    boolean: 'warning',
    null: 'default',
  };

  // Parse the result for metadata display
  const resultMeta = useMemo(() => {
    if (!output) return null;
    try {
      const parsed = JSON.parse(output);
      const type = getResultType(parsed);
      const count = Array.isArray(parsed) ? parsed.length : 1;
      return { type, count };
    } catch {
      // output is a raw string or unparseable — treat as string
      return { type: 'string', count: 1 };
    }
  }, [output]);

  const runQuery = useCallback(() => {
    setError(''); setOutput('');
    if (!dataInput.trim() || !query.trim()) return;
    try {
      const parsed = JSON.parse(dataInput);
      const result = evaluateQuery(parsed, query);
      setOutput(JSON.stringify(result, null, 2));
    } catch (e) {
      const msg = (e as Error).message;
      const suggestion = getErrorSuggestion(query, msg);
      setError(suggestion ? `${msg}\n💡 ${suggestion}` : msg);
    }
  }, [dataInput, query]);

  // Debounced auto-execution on query or dataInput changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runQuery();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, dataInput, runQuery]);

  const clear = () => { setDataInput(''); setQuery(''); setOutput(''); setError(''); };

  const examples = [
    { label: '.', desc: 'Identity (whole document)' },
    { label: '.name', desc: 'Access field' },
    { label: '.users[0]', desc: 'Array index' },
    { label: '.users[0].name', desc: 'Nested access' },
    { label: '.[] | .name', desc: 'Map over array' },
    { label: 'keys', desc: 'Get keys' },
    { label: 'length', desc: 'Get length' },
    { label: 'select(.age > 25)', desc: 'Filter' },
    { label: 'map(.name)', desc: 'Map field' },
    { label: 'sort', desc: 'Sort array' },
    { label: 'unique', desc: 'Unique values' },
    { label: 'flatten', desc: 'Flatten nested arrays' },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>Query Parser (JQ)</Typography>
        <Typography variant="body1" color="text.secondary">
          Query and transform JSON data using jq-like syntax — directly in your browser. Inspired by jqplay.org. No data leaves your machine.
        </Typography>
      </Box>
      <Card variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth label="Query" value={query} onChange={e => setQuery(e.target.value)}
            placeholder=".users[0].name" variant="outlined" size="small"
            onKeyDown={e => { if (e.key === 'Enter') runQuery(); }}
            InputProps={{ sx: { fontFamily: 'monospace' } }} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>JSON Input</Typography>
            <Box sx={boxStyle}><textarea value={dataInput} onChange={e => setDataInput(e.target.value)} placeholder='Paste your JSON data here...' style={textareaStyle} /></Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={runQuery} startIcon={<PlayArrowIcon />}>Run Query</Button>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clear}>Clear</Button>
            </Box>
            {parsedData !== null && (
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AccountTreeIcon />}
                  endIcon={treeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setTreeOpen(prev => !prev)}
                >
                  Path Builder
                </Button>
                <Collapse in={treeOpen}>
                  <Box sx={{
                    mt: 1,
                    maxHeight: 250,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
                    borderRadius: '4px',
                    backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa',
                  }}>
                    <TreeView data={parsedData} defaultExpanded={1} onNodeClick={handleNodeClick} />
                  </Box>
                </Collapse>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">Result</Typography>
              {resultMeta && (
                <>
                  <Chip label={resultMeta.type} size="small" color={typeChipColor[resultMeta.type] || 'default'} />
                  <Chip label={resultMeta.count === 1 ? '1 result' : `${resultMeta.count} results`} size="small" variant="outlined" />
                </>
              )}
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{error}</Alert>}
            {output ? (
              <Box sx={{ height: 300, overflow: 'auto', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)', borderRadius: '4px' }}>
                <SyntaxHighlighter language="json" style={syntaxStyle} showLineNumbers
                  customStyle={{ margin: 0, padding: '12px', fontSize: '13px', lineHeight: '1.5', backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', borderRadius: '4px', height: '100%' }}>
                  {output}
                </SyntaxHighlighter>
              </Box>
            ) : (
              <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.disabled" sx={{ fontFamily: 'monospace' }}>Result will appear here...</Typography>
              </Box>
            )}
            <Box sx={{ mt: 2 }}><Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>Copy Result</Button></Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Quick Reference:</Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {examples.map(ex => (
              <Chip key={ex.label} label={`${ex.label} — ${ex.desc}`} size="small" variant="outlined"
                onClick={() => setQuery(ex.label)} sx={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px' }} />
            ))}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default QueryParserPage;
