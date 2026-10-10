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
          'inline-flex items-center gap-2 text-xs font-mono text-stone-700 dark:text-stone-300 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 px-3.5 py-1.5 rounded-xl shadow-2xs',
          className
        )}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          <strong className="font-semibold text-stone-900 dark:text-stone-100">Local In-Browser RAM:</strong> Zero server uploads.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl paper-sheet bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 p-4 text-stone-700 dark:text-stone-300 flex items-start sm:items-center gap-3.5 shadow-2xs',
        className
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
        <ShieldCheck className="w-5 h-5" />
      </div>
      <div className="text-xs sm:text-sm">
        <p className="font-bold text-stone-900 dark:text-stone-100">
          Your document is processed locally in browser memory.
        </p>
        <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5 leading-relaxed font-sans">
          PDFSimplify processes documents on your device using client-side WebAssembly. No document bytes are transmitted to our servers or external cloud endpoints.
        </p>
      </div>
    </div>
  );
}
