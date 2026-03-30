import React, { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileDropZoneProps {
  children: React.ReactNode;
  onFileContent: (content: string) => void;
  accept?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ children, onFileContent, accept }) => {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onFileContent(e.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <Box
      sx={{ position: 'relative' }}
      onDragEnter={e => { e.preventDefault(); counter.current++; setDragging(true); }}
      onDragLeave={e => { e.preventDefault(); counter.current--; if (counter.current === 0) setDragging(false); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        counter.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      {children}
      {dragging && (
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(25,118,210,0.1)', border: '2px dashed', borderColor: 'primary.main',
          borderRadius: '4px', backdropFilter: 'blur(2px)',
        }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography color="primary.main" fontWeight={500}>Drop file here</Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileDropZone;
