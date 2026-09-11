'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToCsv, CsvExtractionResult } from '@/lib/pdf/extraction/csv-extractor';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken, ConversionProgress } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  AlertCircle,
  Info,
  Table,
  XCircle,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

export function PdfToCsvWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CsvExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [pageRange] = useState('all');
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
        stageDescription: 'Preparing in-browser table extraction engine...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToCsv(file, {
        delimiter,
        pageRange,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      const url = memoryManager.createTrackedUrl(convResult.outputBlob);
      setDownloadUrl(url);
      setResult(convResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Extraction was cancelled.');
      } else {
        console.error('PDF to CSV extraction error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'extracting tables to CSV'));
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
    <div className="space-y-8">
      {/* 1. File Selection / Dropzone */}
      {!sourceFile && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Table className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Delimiter format:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDelimiter(',')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  delimiter === ','
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                Comma (,)
              </button>
              <button
                type="button"
                onClick={() => setDelimiter(';')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  delimiter === ';'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                Semicolon (;)
              </button>
              <button
                type="button"
                onClick={() => setDelimiter('\t')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  delimiter === '\t'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                Tab (\t)
              </button>
            </div>
          </div>

          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to extract tables to CSV"
            subtitle="Processes rows and columns locally with zero server uploads."
          />
        </div>
      )}

      {/* 2. Progress / Converting State */}
      {isProcessing && progress && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Extracting CSV Tables...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {progress.stageDescription}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>{progress.percentage}% completed</span>
              {progress.totalPages > 0 && (
                <span>Page {progress.currentPage} of {progress.totalPages}</span>
              )}
            </div>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Cancel Extraction
            </Button>
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
                CSV Extraction Successful!
              </h3>
              <p className="text-xs text-slate-500">
                Extracted {result.rowCount} rows across {result.totalPages} page(s) in{' '}
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">Output file:</span>
              <span className="font-mono">{result.outputFileName}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">Detected columns:</span>
              <span>{result.columnCount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={result.outputFileName}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV (.csv)
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Convert Another PDF
            </Button>
          </div>

          {/* Scanned PDF notice */}
          {result.rowCount <= 1 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Low text yield detected</p>
                <p className="mt-0.5">
                  If this is a scanned document or image without a digital text layer, run it
                  through our{' '}
                  <Link href="/pdf-tools/ocr-pdf" className="underline font-bold">
                    OCR PDF tool
                  </Link>{' '}
                  to make text selectable before extracting to CSV.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Extraction Notice & Limitations:
        </p>
        <p>
          PDF to CSV works best with clearly structured tables. Complex merged cells, nested headers,
          and visually positioned free-form text may require manual cleanup. Scanned PDFs require OCR.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
