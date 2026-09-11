'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToPpt, createCancellationToken } from '@/lib/pdf/conversion/converter';
import { ConversionResult, ConversionProgress, CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Presentation,
  Download,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
  Layers,
  FileText,
  XCircle,
} from 'lucide-react';

export function PdfToPptWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        stageDescription: 'Preparing in-browser PresentationML engine...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToPpt(file, {
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
        console.error('PDF to PowerPoint conversion error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to PowerPoint'));
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

      {/* Notice on Slide Reconstruction */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900 dark:text-indigo-100">
            Browser-Based Slide Reconstruction
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            PDF to PowerPoint converts each document page into an individual 16:9 presentation slide with positioned editable text shapes. Scanned image-only PDFs will produce image placeholder slides.
          </p>
        </div>
      </div>

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
          title="Drop your PDF here to convert to PowerPoint"
          subtitle="Reconstruct editable .pptx slides with vector text shapes locally in your browser"
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
              Converting to PowerPoint (.pptx)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stageDescription || 'Reconstructing presentation slides...'}
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
              <span>{progress?.currentPage ? `Slide ${progress.currentPage} of ${progress.totalPages}` : 'Positioning...'}</span>
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    PowerPoint Presentation Ready
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.fileName} • {(result.fileSizeBytes / 1024).toFixed(1)} KB • {result.totalPages} slides
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
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
                    Download .pptx
                  </Button>
                </a>
                <Button variant="outline" size="lg" onClick={handleReset} aria-label="Convert another file">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-left">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Slides</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.totalPages}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Text Shapes</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalBlocks}
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
        </div>
      )}
    </div>
  );
}
