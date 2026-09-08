'use client';

import React from 'react';
import { PdfFileCard } from './PdfFileCard';
import { Plus } from 'lucide-react';

export interface PdfFileListProps {
  files: File[];
  onRemove: (index: number) => void;
  onReorder?: (startIndex: number, endIndex: number) => void;
  onAddMore?: () => void;
  acceptsMultiple?: boolean;
}

export function PdfFileList({
  files,
  onRemove,
  onReorder,
  onAddMore,
  acceptsMultiple = true,
}: PdfFileListProps) {
  const handleMoveUp = (index: number) => {
    if (index > 0 && onReorder) {
      onReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < files.length - 1 && onReorder) {
      onReorder(index, index + 1);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {files.map((file, idx) => (
        <PdfFileCard
          key={`${file.name}-${idx}`}
          file={file}
          index={idx}
          totalFiles={files.length}
          onRemove={onRemove}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      ))}

      {acceptsMultiple && onAddMore && (
        <button
          onClick={onAddMore}
          type="button"
          className="min-h-[180px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex flex-col items-center justify-center p-4 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Add more files</span>
        </button>
      )}
    </div>
  );
}
