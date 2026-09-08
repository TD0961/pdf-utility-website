'use client';

import React from 'react';
import { PdfThumbnail } from './PdfThumbnail';
import { formatBytes } from '@/lib/utils';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PdfFileCardProps {
  file: File;
  index: number;
  totalFiles: number;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export function PdfFileCard({
  file,
  index,
  totalFiles,
  onRemove,
  onMoveUp,
  onMoveDown,
}: PdfFileCardProps) {
  return (
    <div className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Sequence Badge */}
      <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm shadow">
        {index + 1}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onRemove(index)}
        aria-label={`Remove file ${file.name}`}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 shadow transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Thumbnail */}
      <div className="mb-2">
        <PdfThumbnail file={file} pageNumber={1} />
      </div>

      {/* File Info */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatBytes(file.size)}</span>
        </div>
      </div>

      {/* Reorder Controls */}
      {totalFiles > 1 && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMoveUp?.(index)}
            aria-label="Move file up in order"
            className="p-1 h-7 text-xs"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </Button>

          <span className="text-[10px] text-slate-400 font-mono">Order {index + 1}/{totalFiles}</span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={index === totalFiles - 1}
            onClick={() => onMoveDown?.(index)}
            aria-label="Move file down in order"
            className="p-1 h-7 text-xs"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
