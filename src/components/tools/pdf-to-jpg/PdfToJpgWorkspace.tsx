'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { convertPdfToJpg, JpgQuality } from '@/lib/pdf/pdf-to-jpg';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { parsePageRanges } from '@/lib/pdf/range-parser';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileText,
  FileImage,
  ArrowRight,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Archive,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';

export function PdfToJpgWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [quality, setQuality] = useState<JpgQuality>('high');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{
    pageCount: number;
    fileName: string;
    isZip: boolean;
    fileSize: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live range validation
  const parsedRangeResult =
    rangeMode === 'custom' && totalPages > 0 ? parsePageRanges(rangeInput, totalPages) : null;
  const rangeError =
    parsedRangeResult && !parsedRangeResult.valid ? parsedRangeResult.error || 'Invalid range syntax.' : null;

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
      setProgressStage('Inspecting PDF page structure...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      setTotalPages(count);
      setRangeInput(count > 1 ? `1-${Math.min(count, 3)}` : '1');
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error reading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setTotalPages(0);
    setResultStats(null);
    setIsProcessing(false);
    setProgressPct(0);
    setProgressStage('');
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (isProcessing) return;
    if (!sourceFile || totalPages === 0) return;

    if (rangeMode === 'custom' && rangeError) {
      setErrorMessage(rangeError);
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPct(5);
      setProgressStage('Initializing browser page rasterizer...');

      const result = await convertPdfToJpg({
        file: sourceFile,
        pages: rangeMode === 'all' ? 'all' : rangeInput,
        quality,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setResultStats({
        pageCount: result.pageCount,
        fileName: result.fileName,
        isZip: result.isZip,
        fileSize: result.blob.size,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('PDF to JPG error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to JPG'));
    }
  };

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* STATE 1: INITIAL UPLOAD */}
      {!sourceFile && !resultStats && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          acceptedTypes={['.pdf', 'application/pdf']}
          title="Select a PDF to convert to JPG"
          subtitle="or drag and drop your PDF here to export pages as high-resolution images"
        />
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-800 dark:text-rose-300 animate-in fade-in-50 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold">Operation notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE CONVERSION WORKSPACE */}
      {sourceFile && totalPages > 0 && !resultStats && (
        <div className="space-y-6">
          {/* File Header */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-sm sm:max-w-md">
                  {sourceFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatBytes(sourceFile.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500 self-start sm:self-auto">
              Change file
            </Button>
          </div>

          {/* Options Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Conversion Settings</span>
            </h3>

            {/* Mode selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pages to Convert
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setRangeMode('all')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    rangeMode === 'all'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">All Pages</div>
                  <div className="text-[10px] text-slate-500">Convert every page (1 to {totalPages})</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRangeMode('custom')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    rangeMode === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">Page Range</div>
                  <div className="text-[10px] text-slate-500">Select specific pages or ranges</div>
                </button>
              </div>

              {/* Custom Range Input */}
              {rangeMode === 'custom' && (
                <div className="pt-2 max-w-md space-y-1.5">
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                  {rangeError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {rangeError}
                    </p>
                  )}
                  {parsedRangeResult?.valid && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Selected {parsedRangeResult.allPageIndices.length} {parsedRangeResult.allPageIndices.length === 1 ? 'page' : 'pages'} (pages: {parsedRangeResult.allPageIndices.map((i) => i + 1).join(', ')})
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quality Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Image Resolution / Clarity
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => setQuality('standard')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    quality === 'standard'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">Standard</div>
                  <div className="text-[10px] text-slate-500">Fast rendering (~108 DPI)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuality('high')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    quality === 'high'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold mb-0.5 flex items-center gap-1">
                    <span>High (Recommended)</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                  <div className="text-[10px] text-slate-500">Sharp text & photos (~144 DPI)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setQuality('very-high')}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    quality === 'very-high'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-bold mb-0.5">Very High</div>
                  <div className="text-[10px] text-slate-500">Maximum detail (~216 DPI)</div>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Feedback during rendering */}
          {isProcessing && (
            <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md text-center space-y-4">
              <div className="flex items-center justify-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {progressStage}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Rasterizing pages in local RAM</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          {!isProcessing && (
            <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileImage className="w-4 h-4 text-indigo-600" />
                <span>
                  Ready to export pages as JPEG images
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={isProcessing || (rangeMode === 'custom' && Boolean(rangeError))}
                  onClick={handleConvert}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-semibold"
                >
                  Convert to JPG
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: RESULT & DOWNLOAD */}
      {resultStats && downloadUrl && (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            {resultStats.isZip ? <Archive className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {resultStats.isZip ? 'Images Ready in ZIP Archive!' : 'JPEG Image Ready!'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {resultStats.isZip
                ? `${resultStats.pageCount} pages rendered and packaged into a ZIP archive in your browser.`
                : 'Your PDF page has been rendered into a high-quality JPEG image directly in memory.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800 text-left text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Pages Converted</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {resultStats.pageCount} {resultStats.pageCount === 1 ? 'page' : 'pages'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Download Size</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatBytes(resultStats.fileSize)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Convert another PDF
            </Button>
            <a
              href={downloadUrl}
              download={resultStats.fileName}
              className="w-full sm:w-auto inline-block"
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full sm:w-auto font-semibold shadow-md hover:shadow-lg"
              >
                {resultStats.isZip ? 'Download ZIP Archive' : 'Download JPG'}
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
