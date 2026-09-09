'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';
import { EditorExportProgress } from '@/lib/pdf/editor/types';

interface EditorExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFileName: string;
  isExporting: boolean;
  exportProgress?: EditorExportProgress | null;
  errorMessage?: string | null;
  exportResult: {
    url: string;
    fileName: string;
    fileSize: number;
    totalPages: number;
  } | null;
  onConfirmExport: (customFileName: string) => Promise<void>;
  onPrint?: () => void;
}

export function EditorExportModal({
  isOpen,
  onClose,
  defaultFileName,
  isExporting,
  exportProgress,
  errorMessage,
  exportResult,
  onConfirmExport,
  onPrint,
}: EditorExportModalProps) {
  const [customFileName, setCustomFileName] = useState(defaultFileName);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExporting) return;
    await onConfirmExport(customFileName);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        if (!isExporting) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {exportResult ? 'PDF Ready for Download' : 'Export Document'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {exportResult
                  ? 'Your PDF has been processed and verified locally'
                  : 'High-fidelity client-side PDF compilation'}
              </p>
            </div>
          </div>
          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-300">
                <span className="font-semibold">Export Failed:</span> {errorMessage}
              </div>
            </div>
          )}

          {isExporting ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {exportProgress?.stage || 'Preparing document...'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Processing pages, vectors, and annotations entirely in your browser...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${exportProgress?.percent || 20}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {exportProgress?.percent || 20}%
              </span>
            </div>
          ) : exportResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Export Successful
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Structure and page integrity verified with zero data leakage.
                  </p>
                </div>
              </div>

              {/* Document Stats Box */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">File Name</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={exportResult.fileName}>
                    {exportResult.fileName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pages</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {exportResult.totalPages}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Size</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {formatBytes(exportResult.fileSize)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <a
                  href={exportResult.url}
                  download={exportResult.fileName}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Again</span>
                </a>

                {onPrint && (
                  <button
                    type="button"
                    onClick={onPrint}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print PDF</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="export-filename-input"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Output File Name
                </label>
                <div className="relative">
                  <input
                    id="export-filename-input"
                    type="text"
                    value={customFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    placeholder="document-edited.pdf"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Automatic protection against overwrite loops and unsafe path characters.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Export validates output page counts and font encodings automatically before triggering download.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Export &amp; Download
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
