'use client';

import React, { useEffect, useState, useRef } from 'react';
import { renderPdfPageToDataUrl } from '@/lib/pdf/pdf-renderer';
import { Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PdfThumbnailProps {
  file: File;
  pageNumber?: number;
  className?: string;
}

export function PdfThumbnail({ file, pageNumber = 1, className }: PdfThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let isCancelled = false;

    async function loadThumbnail() {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        // If it's an image file
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          if (!isCancelled) {
            setDataUrl(url);
            setLoading(false);
          }
        }
        return;
      }

      try {
        setLoading(true);
        setError(false);
        const url = await renderPdfPageToDataUrl(file, pageNumber, 0.4);
        if (!isCancelled) {
          setDataUrl(url);
          setLoading(false);
        }
      } catch {
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [file, pageNumber]);

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm',
        className
      )}
    >
      {loading && (
        <div className="flex flex-col items-center justify-center p-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mb-1 text-indigo-500" />
          <span className="text-[10px] font-mono">Rendering</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center p-2 text-slate-400 text-center">
          <FileText className="w-6 h-6 text-slate-400 mb-1" />
          <span className="text-[10px] text-slate-500">Page {pageNumber}</span>
        </div>
      )}

      {!loading && !error && dataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`Preview of page ${pageNumber}`}
          className="w-full h-full object-contain pointer-events-none"
        />
      )}
    </div>
  );
}
