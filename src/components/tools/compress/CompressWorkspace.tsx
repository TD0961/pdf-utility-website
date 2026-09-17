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
  const [compressionType, setCompressionType] = useState<'preset' | 'target'>('preset');
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [targetSizeMb, setTargetSizeMb] = useState<string>('2');
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

  const runCompression = async (
    file: File,
    selectedLevel: CompressionLevel,
    targetMb?: number
  ) => {
    setErrorMessage(null);
    try {
      setIsProcessing(true);
      setProgress({ percentage: 5, stage: 'Starting local compression...' });

      const compResult = await compressPdf(file, {
        level: selectedLevel,
        targetSizeMb: targetMb,
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

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    const targetMbNum = compressionType === 'target' ? parseFloat(targetSizeMb) || 2 : undefined;
    await runCompression(file, level, targetMbNum);
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

      {/* Compression Configuration Card */}
      {!sourceFile && !isProcessing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
          {/* Tabs: Presets vs Target Size */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Sliders className="w-4 h-4 text-primary-500" />
              <span>Compression Strategy</span>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setCompressionType('preset')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  compressionType === 'preset'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Quality Presets
              </button>
              <button
                type="button"
                onClick={() => setCompressionType('target')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  compressionType === 'target'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Target File Size
              </button>
            </div>
          </div>

          {/* Mode 1: Quality Presets */}
          {compressionType === 'preset' ? (
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
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-mono">Lossless</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Compacts object streams. Preserves 100% full original image resolution.
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
                  Smart optimization. Re-encodes oversized graphics at 75% quality.
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
                  Maximum reduction. Re-encodes graphics to 50% quality for small uploads.
                </p>
              </button>
            </div>
          ) : (
            /* Mode 2: Custom Target File Size */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Desired Maximum File Size (MB):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-xs flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="100"
                      value={targetSizeMb}
                      onChange={(e) => setTargetSizeMb(e.target.value)}
                      placeholder="e.g. 2.0"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">
                      MB
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    ≈ {((parseFloat(targetSizeMb) || 0) * 1024).toFixed(0)} KB
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Under 5 MB (Email)', value: '5' },
                  { label: 'Under 2 MB (Web Portal)', value: '2' },
                  { label: 'Under 1 MB (Job Applications)', value: '1' },
                  { label: 'Under 500 KB (Strict Limit)', value: '0.5' },
                ].map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setTargetSizeMb(chip.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      targetSizeMb === chip.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                The compression engine will dynamically downscale image dimensions and calibrate quality levels to compress your PDF under this target limit.
              </p>
            </div>
          )}
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
                  {compressionType === 'target' ? (
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      Target: Under {targetSizeMb} MB
                    </span>
                  ) : (
                    <span className="capitalize font-medium">{result.level} Mode</span>
                  )}
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

          {/* In-Place Fine-Tune & Re-compress Panel */}
          {sourceFile && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary-500" />
                    <span>Adjust Compression & Re-run</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Want a different size or quality? Pick another preset or set your target size and re-compress instantly.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCompressionType('preset')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      compressionType === 'preset'
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Quality Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompressionType('target')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      compressionType === 'target'
                        ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Target File Size
                  </button>
                </div>
              </div>

              {/* Strategy 1: Quality Presets */}
              {compressionType === 'preset' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setLevel('basic')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      level === 'basic'
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Basic</span>
                      <span className="text-primary-600 dark:text-primary-400 font-mono">Lossless</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Compacts object streams. Preserves 100% full original image resolution.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel('balanced')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      level === 'balanced'
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Balanced</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Smart optimization. Re-encodes oversized graphics at 72% quality.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLevel('strong')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      level === 'strong'
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                      <span>Strong</span>
                      <span className="text-purple-600 dark:text-purple-400 font-mono">Max</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Maximum reduction. Re-encodes graphics to 50% quality for small uploads.
                    </p>
                  </button>
                </div>
              ) : (
                /* Strategy 2: Target File Size */
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Desired Maximum File Size (MB):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative w-32">
                        <input
                          type="number"
                          step="0.1"
                          min="0.2"
                          max="100"
                          value={targetSizeMb}
                          onChange={(e) => setTargetSizeMb(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                        />
                        <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">MB</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        ≈ {((parseFloat(targetSizeMb) || 0) * 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Under 5 MB', value: '5' },
                      { label: 'Under 2 MB', value: '2' },
                      { label: 'Under 1 MB', value: '1' },
                      { label: 'Under 500 KB', value: '0.5' },
                    ].map((chip) => (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => setTargetSizeMb(chip.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          targetSizeMb === chip.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-compress Action Button */}
              <div className="flex justify-end pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!sourceFile) return;
                    const targetMbNum = compressionType === 'target' ? parseFloat(targetSizeMb) || 2 : undefined;
                    runCompression(sourceFile, level, targetMbNum);
                  }}
                  className="gap-1.5"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Re-compress with Selected Settings</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
