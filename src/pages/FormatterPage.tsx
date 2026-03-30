import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Tabs,
  Tab,
  Alert,
  Grid,
  useTheme,
  FormControlLabel,
  Checkbox,
  FormGroup,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CodeIcon from '@mui/icons-material/Code';
import FileDropZone from '../components/FileDropZone';
import { deepSortKeys } from '../utils/formatUtils';
import DownloadButton from '../components/DownloadButton';
import TreeView from '../components/TreeView';
import PageHeader from '../components/PageHeader';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import jsYaml from 'js-yaml';

// Register languages
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('yaml', yaml);

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
  language = 'json',
  readOnly = false,
  placeholder = '',
  minHeight = 360
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);
  
  if (readOnly && value) {
    const lineCount = value.split('\n').length;
    const LARGE_THRESHOLD = 5000;

    // For large outputs, skip syntax highlighting — use plain <pre> for performance
    if (lineCount > LARGE_THRESHOLD) {
      return (
        <Box sx={{
          position: 'relative',
          height: minHeight,
          overflow: 'auto',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
          borderRadius: '4px',
          backgroundColor: isDark ? '#1e1e1e' : '#f6f8fa',
          display: 'flex',
        }}>
          <Box sx={{
            color: isDark ? '#858585' : '#999',
            padding: '16px 8px 16px 16px',
            textAlign: 'right',
            userSelect: 'none',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            minWidth: '3em',
            flexShrink: 0,
          }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </Box>
          <pre style={{
            margin: 0,
            padding: '16px 16px 16px 8px',
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'monospace',
            color: isDark ? '#d4d4d4' : '#24292e',
            whiteSpace: 'pre',
            overflow: 'visible',
            flex: 1,
          }}>
            {value}
          </pre>
        </Box>
      );
    }

    // Normal-sized output with syntax highlighting
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
  
  // Editable textarea with line numbers
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
      }
    }}>
      {/* Line numbers container */}
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
            '&::-webkit-scrollbar': { 
              display: 'none' 
            },
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} style={{ height: '21px' }}>{i + 1}</div>
          ))}
        </Box>
      </Box>
      
      {/* Text area */}
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`formatter-tabpanel-${index}`}
      aria-labelledby={`formatter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const FormatterPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonOutputLanguage, setJsonOutputLanguage] = useState<'json' | 'yaml'>('json');

  // XML Formatter State
  const [xmlInput, setXmlInput] = useState('');
  const [xmlOutput, setXmlOutput] = useState('');
  const [xmlError, setXmlError] = useState('');

  // Compress Text State
  const [compressInput, setCompressInput] = useState('');
  const [compressOutput, setCompressOutput] = useState('');
  const [compressionStats, setCompressionStats] = useState('');

  // Tree View State
  const [jsonTreeView, setJsonTreeView] = useState(false);
  const [xmlTreeView, setXmlTreeView] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [compressOptions, setCompressOptions] = useState({
    removeWhitespace: false,
    removeExtraWhitespace: true,
    removeTabs: true,
    removeNewlines: true,
    removeNullValues: false,
    removeEmptyValues: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // JSON Formatter Functions
  // Wrap heavy operations: show spinner, yield to paint, then run
  const runWithLoading = useCallback((fn: () => void) => {
    setProcessing(true);
    setTimeout(() => {
      try { fn(); } finally { setProcessing(false); }
    }, 50);
  }, []);

  const smartParseJson = (input: string): any => {
    try {
      return JSON.parse(input);
    } catch {
      // Auto-unescape and retry
      const unescaped = unescapeInput(input);
      return JSON.parse(unescaped);
    }
  };

  const formatJSON = () => runWithLoading(() => {
    setJsonError('');
    try {
      const parsed = smartParseJson(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonOutput(formatted);
      setJsonOutputLanguage('json');
    } catch (error) {
      setJsonError('Invalid JSON: ' + (error as Error).message);
      setJsonOutput('');
    }
  });

  const minifyJSON = () => runWithLoading(() => {
    setJsonError('');
    try {
      const parsed = smartParseJson(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonOutput(minified);
      setJsonOutputLanguage('json');
    } catch (error) {
      setJsonError('Invalid JSON: ' + (error as Error).message);
      setJsonOutput('');
    }
  });

  const sortJSON = () => runWithLoading(() => {
    setJsonError('');
    try {
      const parsed = smartParseJson(jsonInput);
      const sorted = deepSortKeys(parsed);
      setJsonOutput(JSON.stringify(sorted, null, 2));
      setJsonOutputLanguage('json');
    } catch (error) {
      setJsonError('Invalid JSON: ' + (error as Error).message);
      setJsonOutput('');
    }
  });

  const convertJsonToYaml = () => runWithLoading(() => {
    setJsonError('');
    try {
      const parsed = smartParseJson(jsonInput);
      const yamlStr = jsYaml.dump(parsed);
      setJsonOutput(yamlStr);
      setJsonOutputLanguage('yaml');
    } catch (error) {
      setJsonError('Invalid JSON: ' + (error as Error).message);
      setJsonOutput('');
    }
  });

  const convertYamlToJson = () => runWithLoading(() => {
    setJsonError('');
    try {
      const parsed = jsYaml.load(unescapeInput(jsonInput));
      const jsonStr = JSON.stringify(parsed, null, 2);
      setJsonOutput(jsonStr);
      setJsonOutputLanguage('json');
    } catch (error) {
      setJsonError('Invalid YAML: ' + (error as Error).message);
      setJsonOutput('');
    }
  });

  const clearJSON = () => {
    setJsonInput('');
    setJsonOutput('');
    setJsonError('');
    setJsonOutputLanguage('json');
  };

  const copyJSONOutput = () => {
    navigator.clipboard.writeText(jsonOutput);
  };

  // XML Formatter Functions
  const unescapeInput = (input: string): string => {
    let result = input;
    if (result.includes('\\"') || result.includes('\\n') || result.includes('\\t')) {
      if ((result.startsWith('"') && result.endsWith('"')) ||
          (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1);
      }
      result = result
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\');
    }
    return result;
  };

  const formatXML = () => runWithLoading(() => {
    setXmlError('');
    try {
      const unescaped = unescapeInput(xmlInput);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescaped, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML structure');
      }

      const formatted = formatXMLString(unescaped);
      setXmlOutput(formatted);
    } catch (error) {
      setXmlError('Invalid XML: ' + (error as Error).message);
      setXmlOutput('');
    }
  });

  const formatXMLString = (xml: string): string => {
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;

    xml = xml.replace(reg, '$1\n$2$3');
    const lines = xml.split('\n');

    lines.forEach((line) => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      formatted += PADDING.repeat(pad) + line + '\n';
      pad += indent;
    });

    return formatted.trim();
  };

  const minifyXML = () => runWithLoading(() => {
    setXmlError('');
    try {
      const unescaped = unescapeInput(xmlInput);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescaped, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Invalid XML structure');
      }

      const minified = unescaped.replace(/>\s+</g, '><').trim();
      setXmlOutput(minified);
    } catch (error) {
      setXmlError('Invalid XML: ' + (error as Error).message);
      setXmlOutput('');
    }
  });

  const clearXML = () => {
    setXmlInput('');
    setXmlOutput('');
    setXmlError('');
  };

  const copyXMLOutput = () => {
    navigator.clipboard.writeText(xmlOutput);
  };

  // Compress Text Functions
  const compressText = () => runWithLoading(() => {
    const originalSize = new Blob([compressInput]).size;
    let compressed = compressInput;

    // Try to detect and parse JSON/XML if options are selected
    if (compressOptions.removeNullValues || compressOptions.removeEmptyValues) {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(compressed);
        compressed = JSON.stringify(removeUnwantedValues(parsed, compressOptions));
      } catch {
        // Not valid JSON, continue with text compression
      }
    }

    // Apply text compression options
    if (compressOptions.removeWhitespace) {
      // Remove ALL whitespace (most aggressive)
      compressed = compressed.replace(/\s/g, '');
    } else {
      // Apply individual options
      if (compressOptions.removeExtraWhitespace) {
        compressed = compressed.replace(/\s+/g, ' ');
      }
      
      if (compressOptions.removeTabs) {
        compressed = compressed.replace(/\t/g, '');
      }
      
      if (compressOptions.removeNewlines) {
        compressed = compressed.replace(/\n+/g, ' ');
      }
    }
    
    compressed = compressed.trim();
    
    const compressedSize = new Blob([compressed]).size;
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(2);
    
    setCompressOutput(compressed);
    setCompressionStats(
      `Original: ${originalSize} bytes | Compressed: ${compressedSize} bytes | Saved: ${savings}%`
    );
  });

  const removeUnwantedValues = (obj: any, options: typeof compressOptions): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => removeUnwantedValues(item, options));
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        const value = obj[key];
        
        // Skip null values if option is enabled
        if (options.removeNullValues && value === null) {
          continue;
        }
        
        // Skip empty values if option is enabled
        if (options.removeEmptyValues && 
            (value === '' || 
             (Array.isArray(value) && value.length === 0) ||
             (typeof value === 'object' && value !== null && Object.keys(value).length === 0))) {
          continue;
        }
        
        result[key] = removeUnwantedValues(value, options);
      }
      return result;
    }
    return obj;
  };

  const handleCompressOptionChange = (option: keyof typeof compressOptions) => {
    setCompressOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const clearCompress = () => {
    setCompressInput('');
    setCompressOutput('');
    setCompressionStats('');
  };

  const copyCompressOutput = () => {
    navigator.clipboard.writeText(compressOutput);
  };

  // Extract and Format Functions
  const extractAndFormat = () => runWithLoading(() => {
    let extracted = compressInput;
    
    // Try to unescape JSON string (handles \" and other escape sequences)
    try {
      // Check if it's a quoted string that needs unescaping
      if (extracted.includes('\\"') || extracted.includes('\\n') || extracted.includes('\\t')) {
        // Remove outer quotes if present
        if ((extracted.startsWith('"') && extracted.endsWith('"')) || 
            (extracted.startsWith("'") && extracted.endsWith("'"))) {
          extracted = extracted.slice(1, -1);
        }
        
        // Unescape the string
        extracted = extracted
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\\\/g, '\\');
      }
      
      // Try to parse and format as JSON
      const parsed = JSON.parse(extracted);
      const formatted = JSON.stringify(parsed, null, 2);
      setCompressOutput(formatted);
      setCompressionStats('Successfully extracted and formatted JSON');
    } catch {
      // If JSON parsing fails, try XML
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(extracted, 'text/xml');
        
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length === 0) {
          const formatted = formatXMLString(extracted);
          setCompressOutput(formatted);
          setCompressionStats('Successfully extracted and formatted XML');
        } else {
          setCompressionStats('Could not detect valid JSON or XML format');
          setCompressOutput(extracted);
        }
      } catch {
        setCompressionStats('Could not detect valid JSON or XML format');
        setCompressOutput(extracted);
      }
    }
  });

  // Parse output for tree view
  const getJsonTreeData = (): any => {
    if (!jsonOutput) return null;
    try {
      if (jsonOutputLanguage === 'yaml') {
        return jsYaml.load(jsonOutput);
      }
      return JSON.parse(jsonOutput);
    } catch {
      return null;
    }
  };

  const xmlToObject = (node: Element): any => {
    const obj: any = {};
    // Add attributes
    if (node.attributes && node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj['@attributes'][attr.nodeName] = attr.nodeValue;
      }
    }
    // Add child nodes
    if (node.childNodes && node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          const childObj = xmlToObject(child as Element);
          const childName = child.nodeName;
          if (obj[childName] !== undefined) {
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]];
            }
            obj[childName].push(childObj);
          } else {
            obj[childName] = childObj;
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = (child.textContent || '').trim();
          if (text) {
            const hasElementChildren = Array.from(node.childNodes).some(
              (c) => c.nodeType === Node.ELEMENT_NODE
            );
            if (!hasElementChildren && !node.attributes?.length) {
              return text;
            }
            obj['#text'] = text;
          }
        }
      }
    }
    return obj;
  };

  const getXmlTreeData = (): any => {
    if (!xmlOutput) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlOutput, 'text/xml');
      const parserError = doc.getElementsByTagName('parsererror');
      if (parserError.length > 0) return null;
      return { [doc.documentElement.nodeName]: xmlToObject(doc.documentElement) };
    } catch {
      return null;
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<CodeOutlinedIcon />}
        title="Formatter"
        description="Format, minify, and compress text directly in your browser. Your data never leaves your machine — no server calls, no storage, no risk of leaking sensitive information. Safe for PII, PNRs, and all customer data."
        accentColor="#6366f1"
      />

      <Card variant="outlined">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="formatter tabs">
            <Tab label="JSON Formatter" />
            <Tab label="XML Formatter" />
            <Tab label="Compress Text" />
          </Tabs>
        </Box>

        {/* JSON Formatter Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Input JSON
              </Typography>
              <FileDropZone onFileContent={setJsonInput} accept=".json,.txt">
              <CodeEditor
                value={jsonInput}
                onChange={setJsonInput}
                language="json"
                placeholder='Paste your JSON here or drag & drop a file...'
                minHeight={400}
              />
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={formatJSON} disabled={processing}>
                  Format
                </Button>
                <Button variant="outlined" onClick={minifyJSON} disabled={processing}>
                  Minify
                </Button>
                <Button variant="outlined" onClick={sortJSON} disabled={processing}>
                  Sort
                </Button>
                <Button variant="outlined" onClick={convertJsonToYaml} disabled={processing}>
                  JSON→YAML
                </Button>
                <Button variant="outlined" onClick={convertYamlToJson} disabled={processing}>
                  YAML→JSON
                </Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearJSON}>
                  Clear
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">
                  Output
                </Typography>
                <ToggleButtonGroup
                  value={jsonTreeView ? 'tree' : 'code'}
                  exclusive
                  onChange={(_e, val) => { if (val) setJsonTreeView(val === 'tree'); }}
                  size="small"
                >
                  <ToggleButton value="code" aria-label="code view">
                    <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Code
                  </ToggleButton>
                  <ToggleButton value="tree" aria-label="tree view">
                    <AccountTreeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Tree
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {jsonError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {jsonError}
                </Alert>
              )}
              <Box sx={{ position: 'relative' }}>
                {processing && (
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', backdropFilter: 'blur(1px)',
                  }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'white', fontWeight: 500 }}>Processing...</Typography>
                  </Box>
                )}
              {jsonTreeView && jsonOutput ? (
                (() => {
                  const treeData = getJsonTreeData();
                  return treeData !== null ? (
                    <Box sx={{
                      height: 400,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '4px',
                    }}>
                      <TreeView data={treeData} defaultExpanded={2} />
                    </Box>
                  ) : (
                    <CodeEditor
                      value={jsonOutput}
                      language={jsonOutputLanguage}
                      readOnly={true}
                      minHeight={400}
                    />
                  );
                })()
              ) : (
                <CodeEditor
                  value={jsonOutput}
                  language={jsonOutputLanguage}
                  readOnly={true}
                  minHeight={400}
                />
              )}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyJSONOutput}
                  disabled={!jsonOutput}
                >
                  Copy Output
                </Button>
                <DownloadButton content={jsonOutput} filename="formatted.json" mimeType="application/json" />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* XML Formatter Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Input XML
              </Typography>
              <FileDropZone onFileContent={setXmlInput} accept=".xml,.txt">
              <CodeEditor
                value={xmlInput}
                onChange={setXmlInput}
                language="xml"
                placeholder='Paste your XML here or drag & drop a file...'
                minHeight={400}
              />
              </FileDropZone>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={formatXML} disabled={processing}>
                  Format
                </Button>
                <Button variant="outlined" onClick={minifyXML} disabled={processing}>
                  Minify
                </Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearXML}>
                  Clear
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">
                  Output
                </Typography>
                <ToggleButtonGroup
                  value={xmlTreeView ? 'tree' : 'code'}
                  exclusive
                  onChange={(_e, val) => { if (val) setXmlTreeView(val === 'tree'); }}
                  size="small"
                >
                  <ToggleButton value="code" aria-label="code view">
                    <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Code
                  </ToggleButton>
                  <ToggleButton value="tree" aria-label="tree view">
                    <AccountTreeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Tree
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {xmlError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {xmlError}
                </Alert>
              )}
              <Box sx={{ position: 'relative' }}>
                {processing && (
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', backdropFilter: 'blur(1px)',
                  }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1, color: 'white', fontWeight: 500 }}>Processing...</Typography>
                  </Box>
                )}
              {xmlTreeView && xmlOutput ? (
                (() => {
                  const treeData = getXmlTreeData();
                  return treeData !== null ? (
                    <Box sx={{
                      height: 400,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '4px',
                    }}>
                      <TreeView data={treeData} defaultExpanded={2} />
                    </Box>
                  ) : (
                    <CodeEditor
                      value={xmlOutput}
                      language="xml"
                      readOnly={true}
                      minHeight={400}
                    />
                  );
                })()
              ) : (
                <CodeEditor
                  value={xmlOutput}
                  language="xml"
                  readOnly={true}
                  minHeight={400}
                />
              )}
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyXMLOutput}
                  disabled={!xmlOutput}
                >
                  Copy Output
                </Button>
                <DownloadButton content={xmlOutput} filename="formatted.xml" mimeType="application/xml" />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Compress Text Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Input Text
              </Typography>
              <FileDropZone onFileContent={setCompressInput} accept=".json,.xml,.txt,.log">
              <CodeEditor
                value={compressInput}
                onChange={setCompressInput}
                language="json"
                placeholder='Paste your text here or drag & drop a file...'
                minHeight={320}
              />
              </FileDropZone>
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Compression Options:
                </Typography>
                <FormGroup>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeWhitespace}
                            onChange={() => handleCompressOptionChange('removeWhitespace')}
                            size="small"
                          />
                        }
                        label="Remove ALL whitespace"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeExtraWhitespace}
                            onChange={() => handleCompressOptionChange('removeExtraWhitespace')}
                            size="small"
                            disabled={compressOptions.removeWhitespace}
                          />
                        }
                        label="Remove extra whitespace"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeTabs}
                            onChange={() => handleCompressOptionChange('removeTabs')}
                            size="small"
                            disabled={compressOptions.removeWhitespace}
                          />
                        }
                        label="Remove tabs"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeNewlines}
                            onChange={() => handleCompressOptionChange('removeNewlines')}
                            size="small"
                            disabled={compressOptions.removeWhitespace}
                          />
                        }
                        label="Remove newlines"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeNullValues}
                            onChange={() => handleCompressOptionChange('removeNullValues')}
                            size="small"
                          />
                        }
                        label="Remove null values (JSON)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={compressOptions.removeEmptyValues}
                            onChange={() => handleCompressOptionChange('removeEmptyValues')}
                            size="small"
                          />
                        }
                        label="Remove empty values (JSON)"
                      />
                    </Grid>
                  </Grid>
                </FormGroup>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={compressText}>
                  Compress
                </Button>
                <Button variant="contained" color="secondary" onClick={extractAndFormat}>
                  Extract & Format JSON/XML
                </Button>
                <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearCompress}>
                  Clear
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Output
              </Typography>
              {compressionStats && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {compressionStats}
                </Alert>
              )}
              <CodeEditor
                value={compressOutput}
                language="json"
                readOnly={true}
                minHeight={320}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyCompressOutput}
                  disabled={!compressOutput}
                >
                  Copy Output
                </Button>
                <DownloadButton content={compressOutput} filename="compressed.txt" />
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default FormatterPage;
