'use client';

import React from 'react';
import { DownloadButton } from './DownloadButton';
import { ResetButton } from './ResetButton';
import { CheckCircle2, FileCheck, ShieldCheck } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { ProcessResult } from '@/types/pdf';

export interface PdfResultProps {
  result: ProcessResult;
  onReset: () => void;
  title?: string;
  description?: string;
}

export function PdfResult({
  result,
  onReset,
  title = 'Your document is ready!',
  description = 'Processed 100% locally in your browser. No files were sent over the internet.',
}: PdfResultProps) {
  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>

      {/* File summary card */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <FileCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {result.fileName}
          </p>
          <p className="text-xs text-slate-500">
            {formatBytes(result.fileSize)}
            {result.summary && ` • ${result.summary}`}
          </p>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName={result.fileName}
          className="w-full sm:w-auto"
        />
        <ResetButton onReset={onReset} className="w-full sm:w-auto" />
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="w-4 h-4" />
        <span>Zero server storage: file data exists only in this browser tab.</span>
      </div>
    </div>
  );
}
