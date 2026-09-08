'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { Download } from 'lucide-react';

export interface DownloadButtonProps extends Omit<ButtonProps, 'onClick'> {
  downloadUrl: string;
  fileName: string;
  label?: string;
  onDownloaded?: () => void;
}

export function DownloadButton({
  downloadUrl,
  fileName,
  label = 'Download PDF',
  onDownloaded,
  ...props
}: DownloadButtonProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownloaded?.();
  };

  return (
    <Button
      variant="success"
      size="lg"
      leftIcon={<Download className="w-5 h-5" />}
      onClick={handleDownload}
      {...props}
    >
      {label}
    </Button>
  );
}
