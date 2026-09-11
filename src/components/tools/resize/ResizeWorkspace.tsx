'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { resizePdf, PagePreset, PageOrientation, ResizeMode, ResizeResult } from '@/lib/pdf/resize';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Scaling,
  Download,
  RotateCcw,
  AlertCircle,
  FileCheck,
  XCircle,
} from 'lucide-react';

export function ResizeWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<PagePreset>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [mode, setMode] = useState<ResizeMode>('fit');
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [pageRange] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ResizeResult | null>(null);
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

  const handleResize = async () => {
    if (!sourceFile) return;
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const buffer = await sourceFile.arrayBuffer();

      const res = await resizePdf(buffer, {
        preset,
        customDimensions: preset === 'Custom' ? { width: customWidth, height: customHeight } : undefined,
        orientation,
        mode,
        pageRange,
        cancellationToken: cancelToken,
      });

      const blob = new Blob([res.resizedBytes as BlobPart], { type: 'application/pdf' });
      const url = memoryManager.createTrackedUrl(blob);
      setDownloadUrl(url);
      setResult(res);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Resizing was cancelled.');
      } else {
        console.error('Resize PDF error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'resizing PDF pages'));
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
            title="Drop your PDF here to resize page dimensions"
            subtitle="Change to A4, Letter, Legal, or custom sizes with 100% vector preservation."
          />
        </div>
      )}

      {/* 2. Resize Configuration Card */}
      {sourceFile && !result && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Scaling className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {(sourceFile.size / 1024).toFixed(1)} KB · Configure target size
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change File
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Size Preset */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Target Page Size
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as PagePreset)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">US Letter (8.5 × 11 in)</option>
                <option value="Legal">US Legal (8.5 × 14 in)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="A5">A5 (148 × 210 mm)</option>
                <option value="Custom">Custom Dimensions</option>
              </select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="auto">Auto (Match original)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            {/* Scaling Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Fitting Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ResizeMode)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="fit">Scale to Fit (No clipping)</option>
                <option value="fill">Scale to Fill (Bleed margins)</option>
                <option value="center">Center Original (No scale)</option>
              </select>
            </div>
          </div>

          {/* Custom dimensions inputs */}
          {preset === 'Custom' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Width (Points, 72 pt = 1 in):
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 595)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Height (Points):
                </label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 842)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleResize}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Scaling className="w-4 h-4 mr-2" />
              {isProcessing ? 'Resizing Document...' : `Resize PDF to ${preset}`}
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
                PDF Resized Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Adjusted {result.totalPages} page(s) to {preset} in{' '}
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={sourceFile ? `resized_${preset.toLowerCase()}_${sourceFile.name}` : 'resized.pdf'}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Resized PDF
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Resize Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Vector Preservation Notice:
        </p>
        <p>
          Page resizing preserves 100% of original vector typography, embedded fonts, and vector paths.
          Documents are never rasterized or converted to low-resolution bitmaps during page transformation.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
