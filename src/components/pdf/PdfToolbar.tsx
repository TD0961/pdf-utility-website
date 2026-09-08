'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ResetButton } from './ResetButton';
import { ArrowRight } from 'lucide-react';

export interface PdfToolbarProps {
  actionLabel: string;
  onExecute: () => void;
  onReset: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
  fileCount: number;
  children?: React.ReactNode;
}

export function PdfToolbar({
  actionLabel,
  onExecute,
  onReset,
  isProcessing = false,
  disabled = false,
  fileCount,
  children,
}: PdfToolbarProps) {
  return (
    <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto mt-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          {fileCount} {fileCount === 1 ? 'file' : 'files'} selected
        </span>
        {children}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <ResetButton onReset={onReset} label="Clear" size="sm" />
        <Button
          variant="primary"
          size="md"
          isLoading={isProcessing}
          disabled={disabled || isProcessing}
          onClick={onExecute}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full sm:w-auto font-semibold"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
