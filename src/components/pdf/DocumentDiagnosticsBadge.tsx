'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { DocumentDiagnostics } from '@/lib/pdf/inspector';
import { formatBytes } from '@/lib/utils';

export interface DocumentDiagnosticsBadgeProps {
  diagnostics: DocumentDiagnostics | null;
  className?: string;
}

export function DocumentDiagnosticsBadge({
  diagnostics,
  className = '',
}: DocumentDiagnosticsBadgeProps) {
  if (!diagnostics) return null;

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 space-y-3 ${className}`}
    >
      {/* Metric Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          {diagnostics.pageCount} {diagnostics.pageCount === 1 ? 'Page' : 'Pages'}
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
          {formatBytes(diagnostics.fileSizeBytes)}
        </span>

        {diagnostics.hasSelectableText && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Digital Text
          </span>
        )}

        {diagnostics.hasAcroForm && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            {diagnostics.acroFormFieldCount} Form Fields
          </span>
        )}

        {diagnostics.hasMixedPageSizes && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Mixed Sizes
          </span>
        )}
      </div>

      {/* Warnings & Recommendations */}
      {diagnostics.warnings.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {diagnostics.warnings.map((warn) => (
            <div
              key={warn.id}
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                warn.level === 'warning'
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/40'
                  : 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 border border-blue-200/80 dark:border-blue-900/40'
              }`}
            >
              {warn.level === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-semibold block">{warn.title}</span>
                <p className="opacity-90 mt-0.5">{warn.message}</p>
                {warn.recommendedTool && (
                  <Link
                    href={`/pdf-tools/${warn.recommendedTool.slug}`}
                    prefetch={false}
                    className="inline-flex items-center gap-1 mt-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Use {warn.recommendedTool.name}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
