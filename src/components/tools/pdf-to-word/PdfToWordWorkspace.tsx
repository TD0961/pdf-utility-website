'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToWord, createCancellationToken } from '@/lib/pdf/conversion/converter';
import { ConversionResult, ConversionProgress, CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileText,
  Download,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
  Layers,
  Heading,
  AlignLeft,
  XCircle,
  Copy,
  Check,
  Settings2,
  Eye,
  FileCheck,
} from 'lucide-react';

export function PdfToWordWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'flowing' | 'exact'>('flowing');
  const [copied, setCopied] = useState(false);

  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const executeConversion = async (file: File, mode: 'flowing' | 'exact') => {
    setErrorMessage(null);
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setProgress({
        stage: 'initializing',
        stageDescription: 'Preparing in-browser OpenXML engine...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToWord(file, {
        detectHeadings: true,
        includePageBreaks: mode === 'exact',
        layoutMode: mode,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }

      const url = memoryManager.createTrackedUrl(convResult.blob);
      setDownloadUrl(url);
      setResult(convResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Conversion was cancelled.');
      } else {
        console.error('PDF to Word conversion error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to Word'));
      }
    }
  };

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    await executeConversion(file, layoutMode);
  };

  const handleModeChange = async (newMode: 'flowing' | 'exact') => {
    setLayoutMode(newMode);
    if (sourceFile && !isProcessing) {
      await executeConversion(sourceFile, newMode);
    }
  };

  const handleCopyText = async () => {
    if (!result?.extractedText) return;
    try {
      await navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
    setCopied(false);
    cancelTokenRef.current = null;
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Notice on Layout Reconstruction */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900 dark:text-indigo-100">
            Professional Word (.docx) Reconstruction
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Reconstructs editable Microsoft Word documents with full OpenXML standards compliance. Tables, typography, headings, and margins are preserved for seamless opening in Word, Google Docs, and LibreOffice.
          </p>
        </div>
      </div>

      {/* Conversion Options Card */}
      {!isProcessing && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Document Formatting Options</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleModeChange('flowing')}
              className={`p-3 rounded-xl text-left border transition-all text-xs space-y-1 ${
                layoutMode === 'flowing'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="font-bold flex items-center justify-between">
                <span>Flowing Document</span>
                {layoutMode === 'flowing' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Standard editable layout with smooth paragraphs and normal margins. Best for editing and reading.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('exact')}
              className={`p-3 rounded-xl text-left border transition-all text-xs space-y-1 ${
                layoutMode === 'exact'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <p className="font-bold flex items-center justify-between">
                <span>Exact Page Layout</span>
                {layoutMode === 'exact' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Preserves strict page breaks matching each PDF page exactly. Best for reports and forms.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-semibold">Conversion Notice</p>
            <p className="text-xs sm:text-sm">{errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Stage 1: Upload / Dropzone */}
      {!sourceFile && !isProcessing && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to convert to Word"
          subtitle="Reconstruct editable .docx paragraphs and styles locally in your browser"
        />
      )}

      {/* Stage 2: Processing with Progress Bar & Cancel */}
      {isProcessing && (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Converting to Word (.docx)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stageDescription || 'Processing document streams locally...'}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percentage || 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{progress?.currentPage ? `Page ${progress.currentPage} of ${progress.totalPages}` : 'Analyzing...'}</span>
              <span>{progress?.percentage || 10}%</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleCancel} leftIcon={<XCircle className="w-4 h-4" />}>
            Cancel Conversion
          </Button>
        </div>
      )}

      {/* Stage 3: Conversion Result Ready */}
      {result && downloadUrl && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Word Document Ready
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.fileName} • {(result.fileSizeBytes / 1024).toFixed(1)} KB • {result.totalPages} pages • {layoutMode === 'flowing' ? 'Flowing mode' : 'Exact page match'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <a
                  href={downloadUrl}
                  download={result.fileName}
                  className="flex-1 sm:flex-initial"
                >
                  <Button
                    size="lg"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="w-full shadow-md shadow-indigo-500/20"
                  >
                    Download .docx
                  </Button>
                </a>
                {result.extractedText && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCopyText}
                    leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? 'Copied' : 'Copy Text'}
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={handleReset} aria-label="Convert another file">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-left">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pages</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.totalPages}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Heading className="w-3.5 h-3.5" />
                  <span>Headings</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalHeadings}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Paragraphs</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalParagraphs}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Words</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalWords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Document Preview Card */}
          {result.extractedText && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Document Structure & Text Preview</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy All Text'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {result.extractedText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

