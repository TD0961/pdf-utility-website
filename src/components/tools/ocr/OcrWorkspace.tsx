'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { performClientOcr, OcrResult, OcrProgress } from '@/lib/pdf/ocr';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  ScanText,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Info,
  XCircle,
} from 'lucide-react';

export function OcrWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [searchablePdfUrl, setSearchablePdfUrl] = useState<string | null>(null);
  const [textDownloadUrl, setTextDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (searchablePdfUrl) memoryManager.revokeUrl(searchablePdfUrl);
      if (textDownloadUrl) memoryManager.revokeUrl(textDownloadUrl);
    };
  }, [searchablePdfUrl, textDownloadUrl]);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    setErrorMessage(null);

    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
        stage: 'Initializing in-browser OCR worker...',
      });

      const ocrRes = await performClientOcr(file, {
        pageRange,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      const pdfUrl = memoryManager.createTrackedUrl(ocrRes.searchablePdfBlob);
      const txtUrl = memoryManager.createTrackedUrl(ocrRes.textBlob);

      setSearchablePdfUrl(pdfUrl);
      setTextDownloadUrl(txtUrl);
      setResult(ocrRes);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('OCR processing was cancelled.');
      } else {
        console.error('OCR error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'performing OCR on document'));
      }
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
  };

  const handleReset = () => {
    if (searchablePdfUrl) {
      memoryManager.revokeUrl(searchablePdfUrl);
      setSearchablePdfUrl(null);
    }
    if (textDownloadUrl) {
      memoryManager.revokeUrl(textDownloadUrl);
      setTextDownloadUrl(null);
    }
    setSourceFile(null);
    setResult(null);
    setIsProcessing(false);
    setProgress(null);
    setErrorMessage(null);
    cancelTokenRef.current = null;
    setCopied(false);
  };

  const handleCopyText = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Honest OCR limitation notice */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">In-Browser Optical Character Recognition</p>
          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            Performs local OCR entirely within your browser memory. Ideal for scanned receipts, articles, and invoices. Large multi-hundred-page scans are processed page-by-page to safeguard device memory.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      {!sourceFile && !isProcessing && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <ScanText className="w-4 h-4 text-primary-500" />
              <span>Page Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="all (e.g., 1-5, 8)"
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-44"
              />
              <span className="text-xs text-slate-400">Leave &quot;all&quot; for full file</span>
            </div>
          </div>

          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop scanned PDF here to run OCR"
            subtitle="Converts scanned image pages into searchable text and selectable PDFs"
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="inline-flex p-4 bg-primary-50 dark:bg-primary-950/50 rounded-2xl text-primary-600 dark:text-primary-400 animate-pulse">
            <ScanText className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Running In-Browser OCR...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stage || 'Processing scanned pages sequentially...'}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress?.percentage || 15}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>
                {progress?.currentPage && progress?.totalPages
                  ? `Page ${progress.currentPage} of ${progress.totalPages}`
                  : 'Initializing'}
              </span>
              <span>{progress?.percentage || 15}%</span>
            </div>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Cancel OCR
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !isProcessing && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">OCR Processing Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Results */}
      {result && searchablePdfUrl && textDownloadUrl && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  OCR Completed Successfully
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{result.totalPages} {result.totalPages === 1 ? 'Page' : 'Pages'}</span>
                  <span>•</span>
                  <span>{result.totalWords} Words Extracted</span>
                  <span>•</span>
                  <span>{(result.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="flex-1 sm:flex-none justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                OCR Another
              </Button>
              <a
                href={searchablePdfUrl}
                download={sourceFile ? sourceFile.name.replace(/\.pdf$/i, '_searchable.pdf') : 'searchable.pdf'}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Searchable PDF
                </Button>
              </a>
              <a
                href={textDownloadUrl}
                download={sourceFile ? sourceFile.name.replace(/\.pdf$/i, '_ocr_text.txt') : 'ocr_text.txt'}
                className="flex-1 sm:flex-none"
              >
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Text (.txt)
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Scanned Pages</span>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {result.pagesScanned}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Digital Pages</span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {result.pagesWithNativeText}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Avg Confidence</span>
              <p className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
                {result.averageConfidence}%
              </p>
            </div>
          </div>

          {/* Extracted Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                Recognized Text Preview
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied to clipboard!' : 'Copy text'}
              </button>
            </div>
            <textarea
              readOnly
              value={result.text}
              rows={8}
              className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
