'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { compressPdf, CompressionLevel, CompressionResult, CompressionProgress } from '@/lib/pdf/compress';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Minimize2,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
  Sliders,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function CompressWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    try {
      setIsProcessing(true);
      setProgress({ percentage: 5, stage: 'Starting local compression...' });

      const compResult = await compressPdf(file, {
        level,
        onProgress: (p) => setProgress(p),
      });

      const url = memoryManager.createTrackedUrl(compResult.blob);
      setDownloadUrl(url);
      setResult(compResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      console.error('Compression error:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'compressing PDF'));
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
  };

  const getOutputFilename = () => {
    if (!sourceFile) return 'compressed.pdf';
    return sourceFile.name.replace(/\.pdf$/i, '_compressed.pdf');
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Mode Selector */}
      {!sourceFile && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Sliders className="w-4 h-4 text-primary-500" />
            <span>Select Compression Mode:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setLevel('basic')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                level === 'basic'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Basic</span>
                <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">Fast</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Optimizes object streams without touching fonts or imagery.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLevel('balanced')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                level === 'balanced'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Balanced</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Recommended</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Removes redundant metadata and compacts cross-reference streams.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLevel('strong')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                level === 'strong'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                <span>Strong</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">Max</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Aggressive catalog pruning and stream compaction.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Dropzone */}
      {!sourceFile && !isProcessing && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to compress"
          subtitle="Genuine client-side optimization with zero server upload"
        />
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="inline-flex p-4 bg-primary-50 dark:bg-primary-950/50 rounded-2xl text-primary-600 dark:text-primary-400 animate-pulse">
            <Minimize2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Compressing PDF Locally...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stage || 'Compacting object streams and removing orphaned metadata...'}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-primary-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress?.percentage || 20}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>Optimizing catalog</span>
              <span>{progress?.percentage || 20}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !isProcessing && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Compression Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Results & Download */}
      {result && downloadUrl && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {getOutputFilename()}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{result.pageCount} {result.pageCount === 1 ? 'Page' : 'Pages'}</span>
                  <span>•</span>
                  <span className="capitalize">{result.level} Mode</span>
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
                Compress Another
              </Button>
              <a
                href={downloadUrl}
                download={getOutputFilename()}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download PDF
                </Button>
              </a>
            </div>
          </div>

          {/* Size Comparison Card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Original Size</span>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {formatBytes(result.originalSize)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Compressed Size</span>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatBytes(result.compressedSize)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Size Reduction</span>
              <p className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
                {result.isAlreadyOptimized ? '0%' : `-${result.savedPercent}%`}
              </p>
            </div>
          </div>

          {result.isAlreadyOptimized && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3.5 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                This document is already highly optimized. Further reduction without degrading image resolution was not possible.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
