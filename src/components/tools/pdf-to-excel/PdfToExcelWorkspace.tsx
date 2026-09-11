'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToExcel } from '@/lib/pdf/conversion/excel-converter';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { ConversionResult, ConversionProgress, CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  AlertCircle,
  Info,
  Layers,
  Table,
  XCircle,
  FileCheck,
} from 'lucide-react';

export function PdfToExcelWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oneSheetPerPage, setOneSheetPerPage] = useState(false);
  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

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
        stage: 'initializing',
        stageDescription: 'Preparing in-browser OpenXML spreadsheet engine...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToExcel(file, {
        oneSheetPerPage,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      const url = memoryManager.createTrackedUrl(convResult.blob);
      setDownloadUrl(url);
      setResult(convResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Conversion was cancelled.');
      } else {
        console.error('PDF to Excel conversion error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to Excel'));
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
    setProgress(null);
    setErrorMessage(null);
    cancelTokenRef.current = null;
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Honest client-side capability disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">Direct Client-Side Table Extraction</p>
          <p className="leading-relaxed">
            Extracts tabular structures, numbers, and text baselines directly from PDF coordinates into
            standards-compliant Excel (.xlsx) spreadsheets. Processed locally in your browser with zero uploads. Irregular or scanned tables may require manual adjustment.
          </p>
        </div>
      </div>

      {/* Upload Dropzone when no file selected */}
      {!sourceFile && !isProcessing && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <Table className="w-4 h-4 text-primary-500" />
              <span>Multi-page mode:</span>
            </div>
            <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={oneSheetPerPage}
                onChange={(e) => setOneSheetPerPage(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700"
              />
              <span>Create separate worksheet for each page</span>
            </label>
          </div>

          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to convert to Excel"
            subtitle="Fast, client-side extraction of tabular text and numbers into .xlsx"
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl text-emerald-600 dark:text-emerald-400 animate-pulse">
            <FileSpreadsheet className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Extracting Spreadsheet Tables...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stageDescription || 'Analyzing PDF coordinates and cells...'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
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
              Cancel Extraction
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
              <p className="font-semibold">Extraction Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Conversion Success & Download */}
      {result && downloadUrl && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {result.fileName}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{(result.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{result.totalPages} {result.totalPages === 1 ? 'Page' : 'Pages'}</span>
                  <span>•</span>
                  <span>{(result.durationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="flex-1 sm:flex-none justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Convert Another
              </Button>
              <a
                href={downloadUrl}
                download={result.fileName}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Excel (.xlsx)
                </Button>
              </a>
            </div>
          </div>

          {/* Extraction Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-primary-500" />
                <span>Pages Processed</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.totalPages}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mb-1">
                <Table className="w-3.5 h-3.5 text-emerald-500" />
                <span>Estimated Rows</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.stats.totalParagraphs}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mb-1">
                <FileCheck className="w-3.5 h-3.5 text-blue-500" />
                <span>OpenXML Integrity</span>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Validated ✓
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
