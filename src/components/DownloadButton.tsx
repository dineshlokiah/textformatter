import React from 'react';
import { Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface DownloadButtonProps {
  content: string;
  filename: string;
  mimeType?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ content, filename, mimeType = 'text/plain' }) => {
  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleDownload} disabled={!content}>
      Download
    </Button>
  );
};

export default DownloadButton;
