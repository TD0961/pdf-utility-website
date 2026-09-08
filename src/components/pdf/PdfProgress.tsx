import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export interface PdfProgressProps {
  progress?: number;
  stage?: string;
  detail?: string;
}

export function PdfProgress({
  progress = 0,
  stage = 'Processing document locally...',
  detail,
}: PdfProgressProps) {
  const percentage = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md text-center space-y-4"
    >
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          {stage}
        </h4>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>Processing in browser</span>
        <span>{percentage}%</span>
      </div>

      {detail && <p className="text-xs text-slate-500">{detail}</p>}

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Client-Side • No data sent to any server</span>
      </div>
    </div>
  );
}
