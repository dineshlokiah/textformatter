import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, useTheme, Chip, Tooltip, IconButton, Divider,
  ToggleButton, ToggleButtonGroup, Paper, Select, MenuItem as MuiMenuItem,
  FormControl, InputLabel, Checkbox, FormControlLabel, Alert, CircularProgress,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearIcon from '@mui/icons-material/Clear';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import DifferenceIcon from '@mui/icons-material/Difference';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { diffLines as computeDiffLines, Change } from 'diff';
import { deepSortKeys } from '../utils/formatUtils';

// ── Types ──
interface DiffLine {
  lineNumLeft: number | null;
  lineNumRight: number | null;
  contentLeft: string;
  contentRight: string;
  type: 'unchanged' | 'added' | 'removed' | 'modified';
}

interface DiffSection {
  startIndex: number;
  endIndex: number;
}

// ── Helpers ──
function buildSideBySideLines(changes: Change[]): DiffLine[] {
  const lines: DiffLine[] = [];
  let leftNum = 1;
  let rightNum = 1;

  let i = 0;
  while (i < changes.length) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      // Unchanged
      const cLines = (change.value.endsWith('\n') ? change.value.slice(0, -1) : change.value).split('\n');
      for (const l of cLines) {
        lines.push({ lineNumLeft: leftNum++, lineNumRight: rightNum++, contentLeft: l, contentRight: l, type: 'unchanged' });
      }
      i++;
    } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      // Modified (removed followed by added)
      const removedLines = (change.value.endsWith('\n') ? change.value.slice(0, -1) : change.value).split('\n');
      const addedLines = (changes[i + 1].value.endsWith('\n') ? changes[i + 1].value.slice(0, -1) : changes[i + 1].value).split('\n');
      const maxLen = Math.max(removedLines.length, addedLines.length);
      for (let j = 0; j < maxLen; j++) {
        lines.push({
          lineNumLeft: j < removedLines.length ? leftNum++ : null,
          lineNumRight: j < addedLines.length ? rightNum++ : null,
          contentLeft: j < removedLines.length ? removedLines[j] : '',
          contentRight: j < addedLines.length ? addedLines[j] : '',
          type: 'modified',
        });
      }
      i += 2;
    } else if (change.removed) {
      const cLines = (change.value.endsWith('\n') ? change.value.slice(0, -1) : change.value).split('\n');
      for (const l of cLines) {
        lines.push({ lineNumLeft: leftNum++, lineNumRight: null, contentLeft: l, contentRight: '', type: 'removed' });
      }
      i++;
    } else if (change.added) {
      const cLines = (change.value.endsWith('\n') ? change.value.slice(0, -1) : change.value).split('\n');
      for (const l of cLines) {
        lines.push({ lineNumLeft: null, lineNumRight: rightNum++, contentLeft: '', contentRight: l, type: 'added' });
      }
      i++;
    } else {
      i++;
    }
  }
  return lines;
}

function getDiffSections(lines: DiffLine[]): DiffSection[] {
  const sections: DiffSection[] = [];
  let inSection = false;
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== 'unchanged') {
      if (!inSection) { start = i; inSection = true; }
    } else {
      if (inSection) { sections.push({ startIndex: start, endIndex: i - 1 }); inSection = false; }
    }
  }
  if (inSection) sections.push({ startIndex: start, endIndex: lines.length - 1 });
  return sections;
}

// ── Inline word-level highlighting ──
function highlightInlineChanges(left: string, right: string, isDark: boolean): { leftHtml: string; rightHtml: string } {
  if (left === right) return { leftHtml: escapeHtml(left), rightHtml: escapeHtml(right) };

  // Simple word-level diff
  const leftWords = left.split(/(\s+)/);
  const rightWords = right.split(/(\s+)/);
  const maxLen = Math.max(leftWords.length, rightWords.length);

  let leftHtml = '';
  let rightHtml = '';
  const hlLeft = isDark ? 'rgba(255,100,100,0.35)' : 'rgba(255,0,0,0.2)';
  const hlRight = isDark ? 'rgba(100,255,100,0.35)' : 'rgba(0,180,0,0.2)';

  for (let i = 0; i < maxLen; i++) {
    const lw = i < leftWords.length ? leftWords[i] : '';
    const rw = i < rightWords.length ? rightWords[i] : '';
    if (lw === rw) {
      leftHtml += escapeHtml(lw);
      rightHtml += escapeHtml(rw);
    } else {
      if (lw) leftHtml += `<span style="background:${hlLeft};border-radius:2px">${escapeHtml(lw)}</span>`;
      if (rw) rightHtml += `<span style="background:${hlRight};border-radius:2px">${escapeHtml(rw)}</span>`;
    }
  }
  return { leftHtml, rightHtml };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Context line collapsing ──
function getVisibleRanges(lines: DiffLine[], contextLines: number): boolean[] {
  const visible = new Array(lines.length).fill(false);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].type !== 'unchanged') {
      for (let j = Math.max(0, i - contextLines); j <= Math.min(lines.length - 1, i + contextLines); j++) {
        visible[j] = true;
      }
    }
  }
  return visible;
}

// ── Diff mode types ──
type DiffMode = 'text' | 'json' | 'xml' | 'yaml' | 'properties';

const DIFF_MODE_LABELS: Record<DiffMode, string> = {
  text: 'Text',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  properties: 'App Properties',
};

// ── Auto-detect diff mode from file extension ──
function detectModeFromFilename(filename: string): DiffMode | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json': return 'json';
    case 'xml': case 'xsd': case 'xsl': case 'xslt': case 'wsdl': case 'svg': case 'pom': return 'xml';
    case 'yaml': case 'yml': return 'yaml';
    case 'properties': case 'cfg': case 'ini': case 'conf': case 'env': return 'properties';
    default: return null;
  }
}

// ── Parse properties into key→line map ──
function parsePropertiesMap(lines: string[]): { key: string; line: string }[] {
  return lines
    .filter(l => l.trim().length > 0)
    .map(line => {
      const eqIdx = line.indexOf('=');
      const key = eqIdx >= 0 ? line.substring(0, eqIdx).trim() : line.trim();
      return { key, line };
    });
}

// ── Property-aware alignment: match by key, then output aligned text ──
export function alignPropertiesByKey(leftText: string, rightText: string, options: { sortProperties: boolean; stripComments: boolean }): { left: string; right: string } {
  let leftLines = leftText.split('\n');
  let rightLines = rightText.split('\n');

  if (options.stripComments) {
    leftLines = leftLines.filter(l => !l.trimStart().startsWith('#'));
    rightLines = rightLines.filter(l => !l.trimStart().startsWith('#'));
  }

  const leftProps = parsePropertiesMap(leftLines);
  const rightProps = parsePropertiesMap(rightLines);

  // Build maps: key → line (last occurrence wins for duplicates)
  const leftMap = new Map<string, string>();
  leftProps.forEach(p => leftMap.set(p.key, p.line));
  const rightMap = new Map<string, string>();
  rightProps.forEach(p => rightMap.set(p.key, p.line));

  // Collect all unique keys
  const allKeys = new Set<string>();
  leftProps.forEach(p => allKeys.add(p.key));
  rightProps.forEach(p => allKeys.add(p.key));

  // Sort keys if requested
  let sortedKeys = Array.from(allKeys);
  if (options.sortProperties) {
    sortedKeys.sort();
  }

  // Group: matched (both sides), left-only, right-only
  const matchedLines: { left: string; right: string }[] = [];
  const leftOnlyLines: string[] = [];
  const rightOnlyLines: string[] = [];

  for (const key of sortedKeys) {
    const hasLeft = leftMap.has(key);
    const hasRight = rightMap.has(key);
    if (hasLeft && hasRight) {
      matchedLines.push({ left: leftMap.get(key)!, right: rightMap.get(key)! });
    } else if (hasLeft) {
      leftOnlyLines.push(leftMap.get(key)!);
    } else {
      rightOnlyLines.push(rightMap.get(key)!);
    }
  }

  // Build aligned output:
  // 1. Matched properties (same key on both sides, aligned line-by-line)
  // 2. Left-only properties (appear as removed)
  // 3. Right-only properties (appear as added)
  const resultLeft: string[] = [];
  const resultRight: string[] = [];

  for (const m of matchedLines) {
    resultLeft.push(m.left);
    resultRight.push(m.right);
  }

  // Left-only: add to left, blank placeholder on right
  for (const l of leftOnlyLines) {
    resultLeft.push(l);
    resultRight.push('');
  }

  // Right-only: blank placeholder on left, add to right
  for (const r of rightOnlyLines) {
    resultLeft.push('');
    resultRight.push(r);
  }

  return { left: resultLeft.join('\n'), right: resultRight.join('\n') };
}

// ── Preprocessing pipeline per diff mode ──
export function preprocessInput(
  text: string,
  mode: DiffMode,
  options: { sortProperties: boolean; stripComments: boolean }
): string {
  switch (mode) {
    case 'json': {
      const parsed = JSON.parse(text);
      const sorted = deepSortKeys(parsed);
      return JSON.stringify(sorted, null, 2);
    }
    case 'properties': {
      let lines = text.split('\n');
      // Always strip blank/empty lines for properties comparison
      lines = lines.filter((line) => line.trim().length > 0);
      if (options.stripComments) {
        lines = lines.filter((line) => !line.trimStart().startsWith('#'));
      }
      if (options.sortProperties) {
        lines.sort();
      }
      return lines.join('\n');
    }
    // text, xml, yaml — pass through as-is
    default:
      return text;
  }
}

// ── Main Component ──
const DiffCheckerPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Input state
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');

  // Comparison mode state
  const [diffMode, setDiffMode] = useState<DiffMode>('text');
  const [sortProperties, setSortProperties] = useState(false);
  const [stripComments, setStripComments] = useState(false);
  const [matchByKey, setMatchByKey] = useState(true);

  // Diff state
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [sections, setSections] = useState<DiffSection[]>([]);
  const [currentSection, setCurrentSection] = useState(-1);
  const [hasCompared, setHasCompared] = useState(false);

  // View options
  const [viewMode, setViewMode] = useState<'side' | 'inline'>('side');
  const [showUnchanged, setShowUnchanged] = useState(true);
  const [contextLineCount, setContextLineCount] = useState(3);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [preprocessError, setPreprocessError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  // Refs for synchronized scrolling
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // File input refs
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  // Stats
  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    const modified = diffLines.filter(l => l.type === 'modified').length;
    const unchanged = diffLines.filter(l => l.type === 'unchanged').length;
    return { added, removed, modified, unchanged, total: sections.length };
  }, [diffLines, sections]);

  // ── Compare ──
  const doCompare = useCallback(() => {
    setPreprocessError(null);

    let l = leftText;
    let r = rightText;

    // For properties mode with key matching, use key-aware alignment
    if (diffMode === 'properties' && matchByKey) {
      try {
        const aligned = alignPropertiesByKey(l, r, { sortProperties, stripComments });
        l = aligned.left;
        r = aligned.right;
      } catch (e: any) {
        setPreprocessError(`Properties alignment error: ${e.message}`);
        return;
      }
    } else {
      // Apply mode-specific preprocessing for other modes
      try {
        l = preprocessInput(l, diffMode, { sortProperties, stripComments });
      } catch (e: any) {
        setPreprocessError(`Left side: ${e.message}`);
        return;
      }
      try {
        r = preprocessInput(r, diffMode, { sortProperties, stripComments });
      } catch (e: any) {
        setPreprocessError(`Right side: ${e.message}`);
        return;
      }
    }

    if (ignoreCase) { l = l.toLowerCase(); r = r.toLowerCase(); }
    if (ignoreWhitespace) {
      l = l.split('\n').map(s => s.trimEnd()).join('\n');
      r = r.split('\n').map(s => s.trimEnd()).join('\n');
    }
    const changes = computeDiffLines(l, r);
    const built = buildSideBySideLines(changes);
    setDiffLines(built);
    const secs = getDiffSections(built);
    setSections(secs);
    setCurrentSection(secs.length > 0 ? 0 : -1);
    setHasCompared(true);
    setComparing(false);
  }, [leftText, rightText, ignoreCase, ignoreWhitespace, diffMode, sortProperties, stripComments, matchByKey]);

  const compare = useCallback(() => {
    setComparing(true);
    setTimeout(() => doCompare(), 50);
  }, [doCompare]);

  // ── Navigation ──
  const goToSection = useCallback((idx: number) => {
    if (idx < 0 || idx >= sections.length) return;
    setCurrentSection(idx);
    const lineIdx = sections[idx].startIndex;
    lineRefs.current[lineIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [sections]);

  const nextSection = () => goToSection(currentSection + 1);
  const prevSection = () => goToSection(currentSection - 1);

  // ── Swap ──
  const swap = () => { const tmp = leftText; setLeftText(rightText); setRightText(tmp); };

  // ── Clear ──
  const clear = () => { setLeftText(''); setRightText(''); setDiffLines([]); setSections([]); setCurrentSection(-1); setHasCompared(false); setPreprocessError(null); };

  // ── Sync scroll ──
  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    const src = source === 'left' ? leftPanelRef.current : rightPanelRef.current;
    const tgt = source === 'left' ? rightPanelRef.current : leftPanelRef.current;
    if (src && tgt) { tgt.scrollTop = src.scrollTop; tgt.scrollLeft = src.scrollLeft; }
    requestAnimationFrame(() => { isScrolling.current = false; });
  }, []);

  // ── File upload ──
  const handleFileLoad = (file: File, side: 'left' | 'right') => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (side === 'left') setLeftText(text); else setRightText(text);
      // Auto-detect mode from file extension
      const detected = detectModeFromFilename(file.name);
      if (detected) setDiffMode(detected);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (side: 'left' | 'right') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileLoad(file, side);
    e.target.value = '';
  };

  // ── Drag and drop state ──
  const [draggingSide, setDraggingSide] = useState<'left' | 'right' | null>(null);
  const dragCounterLeft = useRef(0);
  const dragCounterRight = useRef(0);

  const handleDragEnter = (side: 'left' | 'right') => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const counter = side === 'left' ? dragCounterLeft : dragCounterRight;
    counter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDraggingSide(side);
    }
  };

  const handleDragLeave = (side: 'left' | 'right') => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const counter = side === 'left' ? dragCounterLeft : dragCounterRight;
    counter.current--;
    if (counter.current === 0) setDraggingSide(prev => prev === side ? null : prev);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (side: 'left' | 'right') => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingSide(null);
    const counter = side === 'left' ? dragCounterLeft : dragCounterRight;
    counter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileLoad(e.dataTransfer.files[0], side);
    }
  };

  // ── Copy diff ──
  const copyDiff = () => {
    const text = diffLines.map(l => {
      const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : l.type === 'modified' ? '~ ' : '  ';
      if (l.type === 'modified') return `${prefix}${l.contentLeft} → ${l.contentRight}`;
      return `${prefix}${l.type === 'added' ? l.contentRight : l.contentLeft}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
  };

  // ── Download diff ──
  const downloadDiff = () => {
    const text = diffLines.map(l => {
      const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : l.type === 'modified' ? '~ ' : '  ';
      if (l.type === 'modified') return `${prefix}${l.contentLeft} → ${l.contentRight}`;
      return `${prefix}${l.type === 'added' ? l.contentRight : l.contentLeft}`;
    }).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'diff-result.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Visible lines (context filtering) ──
  const visibleMask = useMemo(() => {
    if (showUnchanged) return new Array(diffLines.length).fill(true);
    return getVisibleRanges(diffLines, contextLineCount);
  }, [diffLines, showUnchanged, contextLineCount]);

  // ── Colors ──
  const colors = {
    added:    { bg: isDark ? '#0d2818' : '#e6ffec', gutter: isDark ? '#196c2e' : '#aceebb', text: isDark ? '#7ee787' : '#1a7f37' },
    removed:  { bg: isDark ? '#2d1215' : '#ffebe9', gutter: isDark ? '#8e1519' : '#ffcecb', text: isDark ? '#f47067' : '#cf222e' },
    modified: { bg: isDark ? '#2d2000' : '#fff8c5', gutter: isDark ? '#845d02' : '#ffe17e', text: isDark ? '#e3b341' : '#9a6700' },
    unchanged:{ bg: 'transparent', gutter: 'transparent', text: 'inherit' },
    lineNum:  isDark ? '#484f58' : '#8b949e',
    border:   isDark ? '#30363d' : '#d0d7de',
    headerBg: isDark ? '#161b22' : '#f6f8fa',
    gutterBg: isDark ? '#0d1117' : '#ffffff',
  };

  // ── Render a single diff line ──
  const renderDiffLine = (line: DiffLine, index: number, side: 'left' | 'right' | 'both') => {
    const c = colors[line.type];
    const isCurrentSection = sections[currentSection] &&
      index >= sections[currentSection].startIndex && index <= sections[currentSection].endIndex;

    const content = side === 'right' ? line.contentRight : line.contentLeft;
    const lineNum = side === 'right' ? line.lineNumRight : line.lineNumLeft;

    let contentHtml = escapeHtml(content);
    if (line.type === 'modified' && side !== 'both') {
      const { leftHtml, rightHtml } = highlightInlineChanges(line.contentLeft, line.contentRight, isDark);
      contentHtml = side === 'right' ? rightHtml : leftHtml;
    }

    const isEmpty = (side === 'left' && line.type === 'added') || (side === 'right' && line.type === 'removed');

    return (
      <Box
        key={`${side}-${index}`}
        ref={(el: HTMLDivElement | null) => { if (side === 'left' || side === 'both') lineRefs.current[index] = el; }}
        sx={{
          display: 'flex',
          minHeight: '22px',
          lineHeight: '22px',
          backgroundColor: isEmpty ? (isDark ? '#1c1c1c' : '#f0f0f0') : c.bg,
          borderLeft: isCurrentSection ? `3px solid ${isDark ? '#58a6ff' : '#0969da'}` : '3px solid transparent',
          '&:hover': { filter: 'brightness(1.05)' },
        }}
      >
        {/* Gutter indicator */}
        <Box sx={{
          width: 20, minWidth: 20, textAlign: 'center', fontSize: '12px', fontWeight: 700,
          backgroundColor: isEmpty ? 'transparent' : c.gutter, color: c.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none',
        }}>
          {line.type === 'added' && side !== 'left' ? '+' : line.type === 'removed' && side !== 'right' ? '−' : line.type === 'modified' && !isEmpty ? '≠' : ''}
        </Box>
        {/* Line number */}
        <Box sx={{
          width: 50, minWidth: 50, textAlign: 'right', pr: 1, fontSize: '12px',
          color: colors.lineNum, userSelect: 'none', fontFamily: 'monospace',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        }}>
          {isEmpty ? '' : lineNum ?? ''}
        </Box>
        {/* Content */}
        <Box sx={{
          flex: 1, px: 1, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre',
          overflow: 'hidden', textOverflow: 'ellipsis',
          color: isEmpty ? 'transparent' : (line.type === 'unchanged' ? 'inherit' : c.text),
          textDecoration: (line.type === 'removed' && side === 'left') ? 'none' : 'none',
        }}
          dangerouslySetInnerHTML={{ __html: isEmpty ? '&nbsp;' : contentHtml }}
        />
      </Box>
    );
  };

  // ── Collapsed section indicator ──
  const renderCollapsedIndicator = (count: number) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', py: 0.3,
      backgroundColor: isDark ? '#1c2128' : '#edf2f7', borderTop: `1px solid ${colors.border}`,
      borderBottom: `1px solid ${colors.border}`, cursor: 'pointer',
      '&:hover': { backgroundColor: isDark ? '#262c36' : '#dde4ed' },
    }}
      onClick={() => setShowUnchanged(true)}
    >
      <DragHandleIcon sx={{ fontSize: 14, color: colors.lineNum, mr: 0.5 }} />
      <Typography variant="caption" sx={{ color: colors.lineNum, fontFamily: 'monospace', fontSize: '11px' }}>
        ⋯ {count} unchanged line{count > 1 ? 's' : ''} hidden ⋯
      </Typography>
    </Box>
  );

  // ── Build visible lines with collapse indicators ──
  const renderDiffPanel = (side: 'left' | 'right' | 'both') => {
    const elements: React.ReactNode[] = [];
    let hiddenCount = 0;

    for (let i = 0; i < diffLines.length; i++) {
      if (!visibleMask[i]) {
        hiddenCount++;
        if (i === diffLines.length - 1 || visibleMask[i + 1]) {
          elements.push(<React.Fragment key={`collapsed-${i}`}>{renderCollapsedIndicator(hiddenCount)}</React.Fragment>);
          hiddenCount = 0;
        }
        continue;
      }
      elements.push(renderDiffLine(diffLines[i], i, side));
    }
    return elements;
  };

  // ── Input panel ──
  const renderInputPanel = (side: 'left' | 'right') => {
    const value = side === 'left' ? leftText : rightText;
    const setValue = side === 'left' ? setLeftText : setRightText;
    const fileRef = side === 'left' ? leftFileRef : rightFileRef;
    const lineCount = value.split('\n').length;
    const byteSize = new Blob([value]).size;

    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Panel header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 1.5, py: 0.8, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}`,
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {side === 'left' ? '◀ Original' : 'Modified ▶'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: colors.lineNum, mr: 1 }}>
              {lineCount} lines · {byteSize.toLocaleString()} bytes
            </Typography>
            <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileUpload(side)} accept=".txt,.json,.xml,.yaml,.yml,.csv,.log,.js,.ts,.py,.java,.html,.css,.md,.cfg,.ini,.conf,.sh,.bat,.sql" />
            <Tooltip title="Upload file">
              <IconButton size="small" onClick={() => fileRef.current?.click()}>
                <UploadFileIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => navigator.clipboard.writeText(value)}>
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear">
              <IconButton size="small" onClick={() => setValue('')}>
                <ClearIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Textarea with drag-and-drop */}
        <Box
          sx={{ flex: 1, position: 'relative' }}
          onDragEnter={handleDragEnter(side)}
          onDragLeave={handleDragLeave(side)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(side)}
        >
          {draggingSide === side && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)',
              border: '2px dashed', borderColor: 'primary.main', borderRadius: '4px',
              backdropFilter: 'blur(2px)',
            }}>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" color="primary.main" fontWeight={500}>
                Drop file here
              </Typography>
            </Box>
          )}
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={side === 'left' ? 'Paste original text or drag & drop a file...' : 'Paste modified text or drag & drop a file...'}
            style={{
              width: '100%', height: '100%', minHeight: 300, border: 'none', outline: 'none', resize: 'none',
              fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace', fontSize: '13px', lineHeight: '22px',
              padding: '8px 12px', backgroundColor: 'transparent', color: 'inherit', overflow: 'auto',
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="500" gutterBottom>Diff Checker</Typography>
        <Typography variant="body1" color="text.secondary">
          Compare two texts side by side with synchronized scrolling, inline change highlighting, and section navigation — like Beyond Compare, right in your browser. No data leaves your machine.
        </Typography>
      </Box>

      {/* ── Toolbar ── */}
      <Paper variant="outlined" sx={{
        display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, mb: 2,
        flexWrap: 'wrap', backgroundColor: colors.headerBg,
      }}>
        <Button variant="contained" size="small" onClick={compare} startIcon={comparing ? <CircularProgress size={16} color="inherit" /> : <CompareArrowsIcon />} disabled={comparing}
          sx={{ textTransform: 'none', fontWeight: 600 }}>
          {comparing ? 'Comparing...' : 'Compare'}
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="side" sx={{ textTransform: 'none', px: 1.5 }}>Side by Side</ToggleButton>
          <ToggleButton value="inline" sx={{ textTransform: 'none', px: 1.5 }}>Inline</ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Previous difference">
          <span><IconButton size="small" onClick={prevSection} disabled={currentSection <= 0}><NavigateBeforeIcon /></IconButton></span>
        </Tooltip>
        {hasCompared && (
          <Chip size="small" label={`${currentSection + 1} / ${sections.length} sections`}
            icon={<DifferenceIcon sx={{ fontSize: '16px !important' }} />}
            sx={{ fontFamily: 'monospace', fontSize: '12px' }} />
        )}
        <Tooltip title="Next difference">
          <span><IconButton size="small" onClick={nextSection} disabled={currentSection >= sections.length - 1}><NavigateNextIcon /></IconButton></span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title={showUnchanged ? 'Hide unchanged (show context only)' : 'Show all lines'}>
          <IconButton size="small" onClick={() => setShowUnchanged(!showUnchanged)}>
            {showUnchanged ? <VisibilityIcon sx={{ fontSize: 20 }} /> : <VisibilityOffIcon sx={{ fontSize: 20 }} />}
          </IconButton>
        </Tooltip>

        {!showUnchanged && (
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <InputLabel sx={{ fontSize: 12 }}>Context</InputLabel>
            <Select value={contextLineCount} label="Context" onChange={e => setContextLineCount(e.target.value as number)}
              sx={{ fontSize: 12, height: 32 }}>
              {[1, 2, 3, 5, 10, 20].map(n => <MuiMenuItem key={n} value={n}>{n} lines</MuiMenuItem>)}
            </Select>
          </FormControl>
        )}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Ignore trailing whitespace">
          <Button size="small" variant={ignoreWhitespace ? 'contained' : 'outlined'}
            onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            sx={{ textTransform: 'none', fontSize: '12px', minWidth: 'auto', px: 1 }}>
            Whitespace
          </Button>
        </Tooltip>
        <Tooltip title="Ignore case differences">
          <Button size="small" variant={ignoreCase ? 'contained' : 'outlined'}
            onClick={() => setIgnoreCase(!ignoreCase)}
            sx={{ textTransform: 'none', fontSize: '12px', minWidth: 'auto', px: 1 }}>
            Case
          </Button>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Swap left and right"><IconButton size="small" onClick={swap}><SwapHorizIcon /></IconButton></Tooltip>
        <Tooltip title="Copy diff"><IconButton size="small" onClick={copyDiff} disabled={diffLines.length === 0}><ContentCopyIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        <Tooltip title="Download diff"><IconButton size="small" onClick={downloadDiff} disabled={diffLines.length === 0}><FileDownloadIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        <Tooltip title="Clear all"><IconButton size="small" onClick={clear}><ClearIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
      </Paper>

      {/* ── Comparison Mode Selector ── */}
      <Paper variant="outlined" sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, mb: 2,
        flexWrap: 'wrap', backgroundColor: colors.headerBg,
      }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
          Mode:
        </Typography>
        <ToggleButtonGroup
          size="small"
          value={diffMode}
          exclusive
          onChange={(_, v) => { if (v) setDiffMode(v as DiffMode); }}
        >
          {(Object.keys(DIFF_MODE_LABELS) as DiffMode[]).map((mode) => (
            <ToggleButton key={mode} value={mode} sx={{ textTransform: 'none', px: 1.5, fontSize: '13px' }}>
              {DIFF_MODE_LABELS[mode]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Application Properties options */}
        {diffMode === 'properties' && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={sortProperties}
                  onChange={(e) => setSortProperties(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Sort lines</Typography>}
              sx={{ mr: 0 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={stripComments}
                  onChange={(e) => setStripComments(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Strip comments (#)</Typography>}
              sx={{ mr: 0 }}
            />
            <Tooltip title="Match properties by key name (before =) so same keys are compared side-by-side regardless of line order">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={matchByKey}
                    onChange={(e) => setMatchByKey(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">Match by key</Typography>}
                sx={{ mr: 0 }}
              />
            </Tooltip>
          </>
        )}

        {/* JSON mode info chip */}
        {diffMode === 'json' && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Chip
              size="small"
              icon={<InfoOutlinedIcon sx={{ fontSize: '16px !important' }} />}
              label="Keys are deep-sorted before comparison"
              variant="outlined"
              color="info"
              sx={{ fontSize: '12px' }}
            />
          </>
        )}
      </Paper>

      {/* ── Preprocessing error ── */}
      {preprocessError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPreprocessError(null)}>
          {preprocessError}
        </Alert>
      )}

      {/* ── Stats bar ── */}
      {hasCompared && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip size="small" label={`${stats.total} difference section${stats.total !== 1 ? 's' : ''}`}
            sx={{ fontWeight: 600 }} />
          <Chip size="small" label={`+${stats.added} added`}
            sx={{ backgroundColor: colors.added.bg, color: colors.added.text, border: `1px solid ${colors.added.gutter}` }} />
          <Chip size="small" label={`−${stats.removed} removed`}
            sx={{ backgroundColor: colors.removed.bg, color: colors.removed.text, border: `1px solid ${colors.removed.gutter}` }} />
          <Chip size="small" label={`≠${stats.modified} modified`}
            sx={{ backgroundColor: colors.modified.bg, color: colors.modified.text, border: `1px solid ${colors.modified.gutter}` }} />
          <Chip size="small" label={`${stats.unchanged} unchanged`} variant="outlined" />
          {leftText === rightText && leftText.length > 0 && (
            <Chip size="small" label="Files are identical" color="success" />
          )}
        </Box>
      )}

      {/* ── Main content ── */}
      <Paper variant="outlined" sx={{ overflow: 'hidden', border: `1px solid ${colors.border}` }}>
        {!hasCompared ? (
          /* ── Input mode ── */
          <Box sx={{ display: 'flex', minHeight: 400 }}>
            {renderInputPanel('left')}
            <Divider orientation="vertical" flexItem />
            {renderInputPanel('right')}
          </Box>
        ) : viewMode === 'side' ? (
          /* ── Side-by-side diff view ── */
          <Box sx={{ display: 'flex', minHeight: 400 }}>
            {/* Left panel */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: `1px solid ${colors.border}` }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 1.5, py: 0.6, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}`,
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.removed.text }}>◀ Original</Typography>
                <Typography variant="caption" sx={{ color: colors.lineNum }}>
                  {leftText.split('\n').length} lines
                </Typography>
              </Box>
              <Box ref={leftPanelRef} onScroll={() => handleScroll('left')}
                sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 340px)', minHeight: 350 }}>
                {renderDiffPanel('left')}
              </Box>
            </Box>
            {/* Right panel */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 1.5, py: 0.6, backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}`,
              }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: colors.added.text }}>Modified ▶</Typography>
                <Typography variant="caption" sx={{ color: colors.lineNum }}>
                  {rightText.split('\n').length} lines
                </Typography>
              </Box>
              <Box ref={rightPanelRef} onScroll={() => handleScroll('right')}
                sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 340px)', minHeight: 350 }}>
                {renderDiffPanel('right')}
              </Box>
            </Box>
          </Box>
        ) : (
          /* ── Inline diff view ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', px: 1.5, py: 0.6,
              backgroundColor: colors.headerBg, borderBottom: `1px solid ${colors.border}`,
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Unified Diff View</Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 340px)', minHeight: 350 }}>
              {renderDiffPanel('both')}
            </Box>
          </Box>
        )}
      </Paper>

      {/* ── Edit button to go back to input ── */}
      {hasCompared && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setHasCompared(false)}
            sx={{ textTransform: 'none' }}>
            ← Edit Inputs
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DiffCheckerPage;
