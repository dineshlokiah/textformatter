import React, { useState } from 'react';
import {
  Box, Card, Typography, Button, Alert, Grid, useTheme, Tabs, Tab,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FileDropZone from '../components/FileDropZone';
import DownloadButton from '../components/DownloadButton';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import jsYaml from 'js-yaml';

SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (<div role="tabpanel" hidden={value !== index} {...other}>{value === index && <Box sx={{ p: 3 }}>{children}</Box>}</div>);
}

const YamlLinterPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabValue, setTabValue] = useState(0);

  const [yamlInput, setYamlInput] = useState('');
  const [yamlOutput, setYamlOutput] = useState('');
  const [yamlError, setYamlError] = useState('');
  const [yamlValid, setYamlValid] = useState(false);

  const [jsonToYamlInput, setJsonToYamlInput] = useState('');
  const [jsonToYamlOutput, setJsonToYamlOutput] = useState('');
  const [jsonToYamlError, setJsonToYamlError] = useState('');

  const [yamlToJsonInput, setYamlToJsonInput] = useState('');
  const [yamlToJsonOutput, setYamlToJsonOutput] = useState('');
  const [yamlToJsonError, setYamlToJsonError] = useState('');

  const textareaStyle: React.CSSProperties = {
    width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none',
    fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5', padding: '12px',
    backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
  };
  const boxStyle = {
    height: 350, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)',
    borderRadius: '4px', overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', borderWidth: '2px' },
  };
  const syntaxStyle = isDark ? vs2015 : github;

  const validateYaml = () => {
    setYamlError(''); setYamlValid(false); setYamlOutput('');
    try {
      const parsed = jsYaml.load(yamlInput);
      setYamlOutput(jsYaml.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true }));
      setYamlValid(true);
    } catch (e: any) {
      const msg = e.mark ? `Line ${e.mark.line + 1}, Column ${e.mark.column + 1}: ${e.reason}` : e.message;
      setYamlError(msg);
    }
  };

  const convertJsonToYaml = () => {
    setJsonToYamlError(''); setJsonToYamlOutput('');
    try {
      const parsed = JSON.parse(jsonToYamlInput);
      setJsonToYamlOutput(jsYaml.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true }));
    } catch (e) { setJsonToYamlError('Invalid JSON: ' + (e as Error).message); }
  };

  const convertYamlToJson = () => {
    setYamlToJsonError(''); setYamlToJsonOutput('');
    try {
      const parsed = jsYaml.load(yamlToJsonInput);
      setYamlToJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      const msg = e.mark ? `Line ${e.mark.line + 1}, Column ${e.mark.column + 1}: ${e.reason}` : e.message;
      setYamlToJsonError('Invalid YAML: ' + msg);
    }
  };

  const renderOutput = (output: string, language: string) => (
    output ? (
      <Box sx={{ height: 350, overflow: 'auto', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)', borderRadius: '4px' }}>
        <SyntaxHighlighter language={language} style={syntaxStyle} showLineNumbers
          customStyle={{ margin: 0, padding: '12px', fontSize: '13px', lineHeight: '1.5', backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', borderRadius: '4px', height: '100%' }}>
          {output}
        </SyntaxHighlighter>
      </Box>
    ) : (
      <Box sx={{ ...boxStyle, backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.disabled" sx={{ fontFamily: 'monospace' }}>Output will appear here...</Typography>
      </Box>
    )
  );

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>YAML Linter & Converter</Typography>
        <Typography variant="body1" color="text.secondary">
          Validate YAML syntax, format YAML, and convert between YAML and JSON — all in your browser. No data leaves your machine.
        </Typography>
      </Box>
      <Card variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Validate & Format" />
            <Tab label="JSON → YAML" />
            <Tab label="YAML → JSON" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Input YAML</Typography>
              <FileDropZone onFileContent={setYamlInput} accept=".yaml,.yml,.txt">
              <Box sx={boxStyle}><textarea value={yamlInput} onChange={e => setYamlInput(e.target.value)} placeholder="Paste your YAML here or drag & drop a file..." style={textareaStyle} /></Box>
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={validateYaml} startIcon={<CheckCircleIcon />}>Validate & Format</Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={() => { setYamlInput(''); setYamlOutput(''); setYamlError(''); setYamlValid(false); }}>Clear</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Output</Typography>
              {yamlError && <Alert severity="error" sx={{ mb: 2 }}>{yamlError}</Alert>}
              {yamlValid && <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>YAML is valid</Alert>}
              {renderOutput(yamlOutput, 'yaml')}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}><Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(yamlOutput)} disabled={!yamlOutput}>Copy Output</Button><DownloadButton content={yamlOutput} filename="formatted.yaml" /></Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Input JSON</Typography>
              <FileDropZone onFileContent={setJsonToYamlInput} accept=".json,.txt">
              <Box sx={boxStyle}><textarea value={jsonToYamlInput} onChange={e => setJsonToYamlInput(e.target.value)} placeholder="Paste JSON to convert to YAML or drag & drop a file..." style={textareaStyle} /></Box>
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={convertJsonToYaml} startIcon={<SwapHorizIcon />}>Convert to YAML</Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={() => { setJsonToYamlInput(''); setJsonToYamlOutput(''); setJsonToYamlError(''); }}>Clear</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>YAML Output</Typography>
              {jsonToYamlError && <Alert severity="error" sx={{ mb: 2 }}>{jsonToYamlError}</Alert>}
              {renderOutput(jsonToYamlOutput, 'yaml')}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}><Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(jsonToYamlOutput)} disabled={!jsonToYamlOutput}>Copy Output</Button><DownloadButton content={jsonToYamlOutput} filename="converted.yaml" /></Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Input YAML</Typography>
              <FileDropZone onFileContent={setYamlToJsonInput} accept=".yaml,.yml,.txt">
              <Box sx={boxStyle}><textarea value={yamlToJsonInput} onChange={e => setYamlToJsonInput(e.target.value)} placeholder="Paste YAML to convert to JSON or drag & drop a file..." style={textareaStyle} /></Box>
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={convertYamlToJson} startIcon={<SwapHorizIcon />}>Convert to JSON</Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={() => { setYamlToJsonInput(''); setYamlToJsonOutput(''); setYamlToJsonError(''); }}>Clear</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>JSON Output</Typography>
              {yamlToJsonError && <Alert severity="error" sx={{ mb: 2 }}>{yamlToJsonError}</Alert>}
              {renderOutput(yamlToJsonOutput, 'json')}
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}><Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={() => navigator.clipboard.writeText(yamlToJsonOutput)} disabled={!yamlToJsonOutput}>Copy Output</Button><DownloadButton content={yamlToJsonOutput} filename="converted.json" mimeType="application/json" /></Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default YamlLinterPage;
