'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { addHeaderFooterToPdf, HeaderFooterAlignment, HeaderFooterResult } from '@/lib/pdf/header-footer';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileText,
  Download,
  RotateCcw,
  AlertCircle,
  FileCheck,
  XCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

export function HeaderFooterWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [headerText, setHeaderText] = useState('');
  const [headerAlignment, setHeaderAlignment] = useState<HeaderFooterAlignment>('center');
  const [footerText, setFooterText] = useState('Page {page} of {total}');
  const [footerAlignment, setFooterAlignment] = useState<HeaderFooterAlignment>('center');
  const [fontSize, setFontSize] = useState(10);
  const [margin, setMargin] = useState(36);
  const [skipFirstPage, setSkipFirstPage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<HeaderFooterResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileSelected = (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setSourceFile(selectedFiles[0]);
    setErrorMessage(null);
  };

  const handleApply = async () => {
    if (!sourceFile) return;
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const buffer = await sourceFile.arrayBuffer();

      const res = await addHeaderFooterToPdf(buffer, {
        headerText,
        headerAlignment,
        footerText,
        footerAlignment,
        fontSize,
        margin,
        skipFirstPage,
        cancellationToken: cancelToken,
      });

      const blob = new Blob([res.stampedBytes as BlobPart], { type: 'application/pdf' });
      const url = memoryManager.createTrackedUrl(blob);
      setDownloadUrl(url);
      setResult(res);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Header/footer stamping was cancelled.');
      } else {
        console.error('Header/footer stamping error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'adding headers and footers'));
      }
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setResult(null);
    setIsProcessing(false);
    setErrorMessage(null);
    cancelTokenRef.current = null;
  };

  return (
    <div className="space-y-8">
      {/* 1. File Selection / Dropzone */}
      {!sourceFile && (
        <div className="space-y-6">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to add headers & footers"
            subtitle="Add titles, dates, confidentiality notices, and dynamic page numbering."
          />
        </div>
      )}

      {/* 2. Configuration Card */}
      {sourceFile && !result && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {(sourceFile.size / 1024).toFixed(1)} KB · Configure text & placement
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change File
            </Button>
          </div>

          <div className="space-y-4">
            {/* Header Configuration */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Header Text (Top of page)
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setHeaderAlignment('left')}
                    className={`p-1 rounded ${headerAlignment === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderAlignment('center')}
                    className={`p-1 rounded ${headerAlignment === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeaderAlignment('right')}
                    className={`p-1 rounded ${headerAlignment === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="e.g. Confidential Report · {date}"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Footer Configuration */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Footer Text (Bottom of page)
                </label>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setFooterAlignment('left')}
                    className={`p-1 rounded ${footerAlignment === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFooterAlignment('center')}
                    className={`p-1 rounded ${footerAlignment === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFooterAlignment('right')}
                    className={`p-1 rounded ${footerAlignment === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="e.g. Page {page} of {total}"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
              />

              {/* Dynamic Tokens quick helper chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Insert tag:</span>
                <button
                  type="button"
                  onClick={() => setFooterText((t) => t + ' {page}')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-indigo-600 dark:text-indigo-400"
                >
                  {'{page}'}
                </button>
                <button
                  type="button"
                  onClick={() => setFooterText((t) => t + ' {total}')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-indigo-600 dark:text-indigo-400"
                >
                  {'{total}'}
                </button>
                <button
                  type="button"
                  onClick={() => setFooterText((t) => t + ' {date}')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-indigo-600 dark:text-indigo-400"
                >
                  {'{date}'}
                </button>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium">Font Size:</label>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value={8}>8 pt (Small)</option>
                  <option value={10}>10 pt (Standard)</option>
                  <option value={12}>12 pt (Medium)</option>
                  <option value={14}>14 pt (Large)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium">Margin (pt):</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value, 10) || 36)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="skipFirstPage"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="skipFirstPage" className="text-slate-700 dark:text-slate-300 font-medium">
                  Skip first page (Cover)
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleApply}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isProcessing ? 'Applying Headers & Footers...' : 'Apply Headers & Footers'}
            </Button>
            {isProcessing && (
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-1.5 text-rose-500" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* 4. Result & Download */}
      {result && downloadUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Headers & Footers Applied!
              </h3>
              <p className="text-xs text-slate-500">
                Updated {result.pagesModifiedCount} of {result.totalPages} page(s) in{' '}
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={sourceFile ? `header_footer_${sourceFile.name}` : 'stamped.pdf'}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Stamped PDF
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Stamp Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Vector Stamping Information:
        </p>
        <p>
          Headers and footers are stamped as crisp vector text objects directly into the PDF content stream
          using standard Helvetica. Document rotation and page dimensions are handled automatically.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
