'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToGrayscale, GrayscaleResult } from '@/lib/pdf/grayscale';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken, ConversionProgress } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Moon,
  Download,
  RotateCcw,
  AlertCircle,
  FileCheck,
  XCircle,
} from 'lucide-react';

export function GrayscaleWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [dpiScale, setDpiScale] = useState<number>(2.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<GrayscaleResult | null>(null);
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

  const handleConvert = async () => {
    if (!sourceFile) return;
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress({
        stage: 'initializing',
        stageDescription: 'Starting in-browser grayscale conversion...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const buffer = await sourceFile.arrayBuffer();
      const res = await convertPdfToGrayscale(buffer, {
        dpiScale,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      const blob = new Blob([res.grayscaleBytes as BlobPart], { type: 'application/pdf' });
      const url = memoryManager.createTrackedUrl(blob);
      setDownloadUrl(url);
      setResult(res);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Grayscale conversion was cancelled.');
      } else {
        console.error('Grayscale conversion error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to grayscale'));
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
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to convert to black & white / grayscale"
            subtitle="Converts full-color PDFs to print-ready monochrome pages locally."
          />
        </div>
      )}

      {/* 2. Configuration & Start Card */}
      {sourceFile && !result && !isProcessing && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {(sourceFile.size / 1024).toFixed(1)} KB · Ready to convert
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change File
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Print Resolution Quality:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDpiScale(1.5)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dpiScale === 1.5
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                Standard (1.5×)
              </button>
              <button
                type="button"
                onClick={() => setDpiScale(2.0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  dpiScale === 2.0
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                }`}
              >
                High Res (2.0×)
              </button>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Moon className="w-4 h-4 mr-2" />
            Convert to Grayscale PDF
          </Button>
        </div>
      )}

      {/* 3. Progress State */}
      {isProcessing && progress && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center animate-pulse">
            <Moon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Converting Pages to Grayscale...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {progress.stageDescription}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-slate-700 dark:bg-slate-400 h-3 rounded-full transition-all duration-300 ease-out"
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
              Cancel Conversion
            </Button>
          </div>
        </div>
      )}

      {/* 4. Error Notice */}
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

      {/* 5. Result & Download */}
      {result && downloadUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Grayscale Conversion Complete!
              </h3>
              <p className="text-xs text-slate-500">
                Converted {result.totalPages} page(s) to black & white in{' '}
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={sourceFile ? `grayscale_${sourceFile.name}` : 'grayscale.pdf'}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Grayscale PDF
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Convert Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Grayscale Processing Details:
        </p>
        <p>
          Grayscale conversion renders each page to a high-resolution (2× DPI) monochrome canvas using
          standard ITU-R luminance weights (0.299 R + 0.587 G + 0.114 B). The resulting document is optimized
          for printing and monochrome archiving.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
