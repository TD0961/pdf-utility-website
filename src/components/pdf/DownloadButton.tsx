'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { Download, Share2 } from 'lucide-react';
import { toast } from '@/lib/notifications/toast';

export interface DownloadButtonProps extends Omit<ButtonProps, 'onClick'> {
  downloadUrl: string;
  fileName: string;
  label?: string;
  showShare?: boolean;
  onDownloaded?: () => void;
}

export function DownloadButton({
  downloadUrl,
  fileName,
  label = 'Download PDF',
  showShare = true,
  onDownloaded,
  className,
  ...props
}: DownloadButtonProps) {
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    () => false
  );
  const [isSharing, setIsSharing] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${fileName}`);
    onDownloaded?.();
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      setIsSharing(true);
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
      } else {
        await navigator.share({
          title: fileName,
          url: downloadUrl,
        });
      }
      toast.success('Shared successfully');
      onDownloaded?.();
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('Share error, downloading instead:', err);
        handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <Button
        variant="success"
        size="lg"
        leftIcon={<Download className="w-5 h-5" />}
        onClick={handleDownload}
        className={className}
        {...props}
      >
        {label}
      </Button>

      {showShare && canShare && (
        <Button
          variant="outline"
          size="lg"
          leftIcon={<Share2 className="w-4 h-4" />}
          onClick={handleShare}
          isLoading={isSharing}
          title="Share / Save to Files"
          className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
        >
          Share
        </Button>
      )}
    </div>
  );
}
