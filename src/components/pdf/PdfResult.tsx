'use client';

import React from 'react';
import Link from 'next/link';
import { DownloadButton } from './DownloadButton';
import { ResetButton } from './ResetButton';
import { CheckCircle2, FileCheck, ShieldCheck, ArrowRight, HardDrive, Cpu } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { ProcessResult } from '@/types/pdf';
import { BuyMeACoffee } from '@/components/support/BuyMeACoffee';

export interface NextStepTool {
  slug: string;
  name: string;
}

export interface PdfResultProps {
  result: ProcessResult;
  onReset: () => void;
  title?: string;
  description?: string;
  nextSteps?: NextStepTool[];
}

const DEFAULT_NEXT_STEPS: NextStepTool[] = [
  { slug: 'compress-pdf', name: 'Compress PDF' },
  { slug: 'merge-pdf', name: 'Merge PDF' },
  { slug: 'split-pdf', name: 'Split PDF' },
  { slug: 'protect-pdf', name: 'Protect PDF' },
  { slug: 'pdf-to-jpg', name: 'PDF to JPG' },
];

export function PdfResult({
  result,
  onReset,
  title = 'DONE. YOUR PDF IS READY.',
  description = 'Document manipulation finalized in local memory. Zero server custody.',
  nextSteps = DEFAULT_NEXT_STEPS,
}: PdfResultProps) {
  return (
    <div className="w-full max-w-2xl mx-auto paper-sheet rounded-3xl p-6 sm:p-10 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-2xl text-center space-y-7 animate-in fade-in-50 zoom-in-95 duration-200">
      {/* Outro Header & Status */}
      <div className="space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Settlement Finalized
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Forensic Document Settlement Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 text-left space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
              {result.fileName}
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-mono">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {formatBytes(result.fileSize)}
              </span>
              {result.summary && (
                <>
                  <span>•</span>
                  <span className="font-sans text-stone-600 dark:text-stone-300 truncate">
                    {result.summary}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Micro-Audit Chips */}
        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/80 text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 shrink-0" />
            <span className="truncate">Local WASM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">0B Server Transit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300 shrink-0" />
            <span className="truncate">RAM Purgeable</span>
          </div>
        </div>
      </div>

      {/* Primary Actions: Download & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
        <DownloadButton
          downloadUrl={result.downloadUrl}
          fileName={result.fileName}
          className="w-full sm:w-auto px-7 py-3 rounded-xl shadow-md font-semibold text-sm"
        />
        <ResetButton onReset={onReset} className="w-full sm:w-auto" />
      </div>

      {/* Creator Appreciation (Buy Me a Coffee) */}
      <BuyMeACoffee variant="card" />

      {/* Outro / Cross-Navigation: Intelligent Next Actions */}
      <div className="pt-5 border-t border-stone-200/80 dark:border-stone-800 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            What would you like to do next?
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            Internal Cross-Flow
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {nextSteps.map((step) => (
            <Link
              key={step.slug}
              href={`/pdf-tools/${step.slug}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all font-medium border border-stone-200/80 dark:border-stone-700"
            >
              <span>{step.name}</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </Link>
          ))}
        </div>
      </div>

      {/* Local Privacy Seal */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Memory Sandbox flushes automatically upon tab refresh or navigation</span>
      </div>
    </div>
  );
}
