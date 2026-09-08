import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocalProcessingNoticeProps {
  className?: string;
  compact?: boolean;
}

export function LocalProcessingNotice({ className, compact = false }: LocalProcessingNoticeProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl',
          className
        )}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          <strong>Your PDF is processed locally in your browser.</strong> Files are never uploaded to a remote server.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-4 text-emerald-900 dark:text-emerald-200 flex items-start sm:items-center gap-3.5',
        className
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5 sm:mt-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="text-xs sm:text-sm">
        <p className="font-semibold text-emerald-950 dark:text-emerald-100">
          Your PDF is processed locally in your browser.
        </p>
        <p className="text-emerald-800/90 dark:text-emerald-300/80 text-xs mt-0.5">
          iLikePDF uses client-side WebAssembly to process documents entirely on your device. Your file contents, text, and pages are never uploaded to our servers or any cloud service.
        </p>
      </div>
    </div>
  );
}
