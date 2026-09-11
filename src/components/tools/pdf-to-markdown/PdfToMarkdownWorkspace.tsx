'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToMarkdown, MarkdownExtractionResult } from '@/lib/pdf/extraction/markdown-extractor';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken, ConversionProgress } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileCode,
  Download,
  RotateCcw,
  AlertCircle,
  Info,
  Copy,
  Check,
  XCircle,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

export function PdfToMarkdownWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MarkdownExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [includePageBreaks, setIncludePageBreaks] = useState(true);
  const [copied, setCopied] = useState(false);
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
        stageDescription: 'Analyzing document layout and typography...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToMarkdown(file, {
        includePageBreaks,
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
        setErrorMessage('Conversion was cancelled.');
      } else {
        console.error('PDF to Markdown error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to Markdown'));
      }
    }
  };

  const handleCopy = async () => {
    if (!result?.markdownText) return;
    try {
      await navigator.clipboard.writeText(result.markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
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
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Insert horizontal dividers between pages (---):
            </span>
            <button
              type="button"
              onClick={() => setIncludePageBreaks(!includePageBreaks)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                includePageBreaks
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {includePageBreaks ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to convert to Markdown"
            subtitle="Reconstructs headings, lists, bold/italic styles, and paragraphs locally."
          />
        </div>
      )}

      {/* 2. Progress / Converting State */}
      {isProcessing && progress && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
            <FileCode className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Converting to Markdown...
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
              Cancel Conversion
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

      {/* 4. Result, Preview & Download */}
      {result && downloadUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Markdown Generated Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  {result.wordCount.toLocaleString()} words · {result.charCount.toLocaleString()} characters across {result.totalPages} page(s)
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="hidden sm:inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </Button>
          </div>

          {/* Live Markdown Preview Snippet */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Preview</span>
              <button
                type="button"
                onClick={handleCopy}
                className="sm:hidden text-indigo-600 font-bold"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap border border-slate-800">
              {result.markdownText}
            </pre>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={result.outputFileName}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Markdown (.md)
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Convert Another PDF
            </Button>
          </div>

          {/* Scanned PDF Notice */}
          {result.wordCount < 10 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Minimal text extracted</p>
                <p className="mt-0.5">
                  If this document consists of scanned pages or image bitmaps, run it through our{' '}
                  <Link href="/pdf-tools/ocr-pdf" className="underline font-bold">
                    OCR PDF tool
                  </Link>{' '}
                  to create a searchable text layer first.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Markdown Reconstruction Notice:
        </p>
        <p>
          Headings, lists, and paragraph flows are reconstructed directly from vector positioning and
          relative font sizing. Multi-column documents or complex graphical callouts may require minor
          formatting touch-ups.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
