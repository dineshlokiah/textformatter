import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Alert,
  Grid,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import { format as sqlFormat } from 'sql-formatter';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'tsql' | 'plsql';
type KeywordCase = 'upper' | 'lower';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'sql',
  readOnly = false,
  placeholder = '',
  minHeight = 360,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);

  if (readOnly && value) {
    return (
      <Box sx={{
        position: 'relative',
        height: minHeight,
        overflow: 'auto',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
        borderRadius: '4px',
      }}>
        <SyntaxHighlighter
          language={language}
          style={isDark ? vs2015 : github}
          showLineNumbers={true}
          wrapLines={true}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            color: isDark ? '#858585' : '#999',
          }}
          customStyle={{
            margin: 0,
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa',
            borderRadius: '4px',
            height: '100%',
          }}
        >
          {value}
        </SyntaxHighlighter>
      </Box>
    );
  }

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 15);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
  };

  return (
    <Box sx={{
      position: 'relative',
      display: 'flex',
      height: minHeight,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
      borderRadius: '4px',
      overflow: 'hidden',
      '&:hover': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
      },
      '&:focus-within': {
        borderColor: 'primary.main',
        borderWidth: '2px',
      },
    }}>
      <Box sx={{
        backgroundColor: isDark ? '#252526' : '#f0f0f0',
        borderRight: '1px solid',
        borderColor: isDark ? '#3e3e42' : '#ddd',
        overflow: 'hidden',
        height: '100%',
        flexShrink: 0,
      }}>
        <Box
          ref={lineNumbersRef}
          sx={{
            color: isDark ? '#858585' : '#999',
            padding: '8px 8px 8px 16px',
            textAlign: 'right',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            minWidth: '3em',
            height: '100%',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} style={{ height: '21px' }}>{i + 1}</div>
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: 'inherit',
            overflow: 'auto',
          }}
        />
      </Box>
    </Box>
  );
};

const DIALECT_OPTIONS: { value: SqlDialect; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'tsql', label: 'T-SQL' },
  { value: 'plsql', label: 'PL/SQL' },
];

const SqlFormatterPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');

  const handleFormat = () => {
    setError('');
    if (!input.trim()) return;
    try {
      const formatted = sqlFormat(input, {
        language: dialect,
        keywordCase: keywordCase,
        tabWidth: 2,
      });
      setOutput(formatted);
    } catch (err) {
      setError('Error formatting SQL: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleMinify = () => {
    setError('');
    if (!input.trim()) return;
    try {
      // Just collapse all whitespace to single spaces for minification
      const minified = input.replace(/\s+/g, ' ').trim();
      setOutput(minified);
    } catch (err) {
      setError('Error minifying SQL: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>
          SQL Formatter
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Format and minify SQL queries directly in your browser.
          Your data never leaves your machine — no server calls, no storage, no risk of leaking sensitive information.
          Everything runs 100% in your browser.
        </Typography>
      </Box>

      <Card variant="outlined" sx={{ p: 3 }}>
        {/* Options row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="dialect-label">SQL Dialect</InputLabel>
            <Select
              labelId="dialect-label"
              value={dialect}
              label="SQL Dialect"
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
            >
              {DIALECT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Keywords:
            </Typography>
            <ToggleButtonGroup
              value={keywordCase}
              exclusive
              onChange={(_e, val) => { if (val) setKeywordCase(val as KeywordCase); }}
              size="small"
            >
              <ToggleButton value="upper">UPPER</ToggleButton>
              <ToggleButton value="lower">lower</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Input Panel */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Input SQL
            </Typography>
            <CodeEditor
              value={input}
              onChange={setInput}
              language="sql"
              placeholder="Paste your SQL query here..."
              minHeight={400}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleFormat} disabled={!input.trim()}>
                Format
              </Button>
              <Button variant="outlined" onClick={handleMinify} disabled={!input.trim()}>
                Minify
              </Button>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={handleClear}>
                Clear
              </Button>
            </Box>
          </Grid>

          {/* Output Panel */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Output
            </Typography>
            <CodeEditor
              value={output}
              language="sql"
              readOnly={true}
              minHeight={400}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
                disabled={!output}
              >
                Copy Output
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default SqlFormatterPage;
