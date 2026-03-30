import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface TreeViewProps {
  data: any;
  defaultExpanded?: number;
  onNodeClick?: (path: string) => void;
  _path?: string;
  _depth?: number;
}

const TreeView: React.FC<TreeViewProps> = ({ data, defaultExpanded = 2, onNodeClick, _path = '.', _depth = 0 }) => {
  return <TreeNode data={data} path={_path} depth={_depth} defaultExpanded={defaultExpanded} onNodeClick={onNodeClick} />;
};

interface TreeNodeProps {
  data: any;
  keyName?: string;
  path: string;
  depth: number;
  defaultExpanded: number;
  onNodeClick?: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ data, keyName, path, depth, defaultExpanded, onNodeClick }) => {
  const [open, setOpen] = useState(depth < defaultExpanded);

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  const handleClick = () => {
    if (isObject) setOpen(o => !o);
    else if (onNodeClick) onNodeClick(path);
  };

  const keyLabel = keyName !== undefined ? (
    <Typography component="span" sx={{ color: 'primary.main', fontWeight: 500, fontFamily: 'monospace', fontSize: 13 }}>
      "{keyName}"{': '}
    </Typography>
  ) : null;

  if (!isObject) {
    const color = data === null ? 'text.disabled' : typeof data === 'string' ? 'success.main' : typeof data === 'boolean' ? 'info.main' : 'warning.main';
    const display = data === null ? 'null' : typeof data === 'string' ? `"${data}"` : String(data);
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', pl: depth * 2, py: 0.1, cursor: onNodeClick ? 'pointer' : 'default', '&:hover': onNodeClick ? { bgcolor: 'action.hover' } : {} }}
        onClick={() => onNodeClick && onNodeClick(path)}
      >
        {keyLabel}
        <Typography component="span" sx={{ color, fontFamily: 'monospace', fontSize: 13 }}>{display}</Typography>
      </Box>
    );
  }

  const entries = isArray ? data.map((v: any, i: number) => [String(i), v]) : Object.entries(data);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', pl: depth * 2, py: 0.1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, userSelect: 'none' }}
        onClick={handleClick}
      >
        {open ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> : <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
        {keyLabel}
        <Typography component="span" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: 13 }}>
          {bracket[0]} {!open && <Typography component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>{entries.length} {isArray ? 'items' : 'keys'}</Typography>} {!open && bracket[1]}
        </Typography>
      </Box>
      {open && (
        <Box>
          {entries.map((entry: any[]) => { const [k, v] = entry as [string, any]; return (
            <TreeNode
              key={k}
              data={v}
              keyName={isArray ? undefined : k}
              path={isArray ? `${path}[${k}]` : `${path}.${k}`}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
              onNodeClick={onNodeClick}
            />
          ); })}
          <Box sx={{ pl: (depth + 1) * 2 }}>
            <Typography component="span" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: 13 }}>{bracket[1]}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TreeView;
