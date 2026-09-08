'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { PdfThumbnail } from '@/components/pdf/PdfThumbnail';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { rotatePdfDocument } from '@/lib/pdf/rotate';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  RotateCw,
  RotateCcw,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
  Compass,
} from 'lucide-react';

interface RotatePageState {
  id: string;
  originalIndex: number;
  userDelta: number; // 0, 90, 180, 270
  selected: boolean;
}

export function RotateWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RotatePageState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{
    totalPages: number;
    fileSize: number;
    fileName: string;
  } | null>(null);
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
      setProgressStage('Loading PDF pages...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      const initialPages: RotatePageState[] = [];
      for (let i = 0; i < count; i++) {
        initialPages.push({
          id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          originalIndex: i,
          userDelta: 0,
          selected: false,
        });
      }

      setPages(initialPages);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  // Selection
  const selectedCount = pages.filter((p) => p.selected).length;
  const allSelected = pages.length > 0 && selectedCount === pages.length;

  const toggleSelectAll = () => {
    const nextState = !allSelected;
    setPages((prev) => prev.map((p) => ({ ...p, selected: nextState })));
  };

  const toggleSelectPage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  // Rotation actions
  const applyRotation = (delta: number, applyToAll = false) => {
    setPages((prev) =>
      prev.map((p) => {
        if (applyToAll || p.selected || selectedCount === 0) {
          const nextDelta = ((p.userDelta + delta) % 360 + 360) % 360;
          return { ...p, userDelta: nextDelta };
        }
        return p;
      })
    );
  };

  const rotateSinglePage = (index: number, delta: number) => {
    setPages((prev) =>
      prev.map((p, i) => {
        if (i === index) {
          const nextDelta = ((p.userDelta + delta) % 360 + 360) % 360;
          return { ...p, userDelta: nextDelta };
        }
        return p;
      })
    );
  };

  const handleResetRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, userDelta: 0 })));
  };

  const handleResetAll = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setPages([]);
    setResultStats(null);
    setErrorMessage(null);
  };

  const handleProcessRotation = async () => {
    if (!sourceFile || pages.length === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressStage('Applying permanent rotation...');
      setProgressPct(10);

      const instructions = pages.map((p) => ({
        pageIndex: p.originalIndex,
        deltaRotation: p.userDelta,
      }));

      const result = await rotatePdfDocument({
        file: sourceFile,
        rotations: instructions,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const trackedUrl = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(trackedUrl);
      setResultStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Rotation failed:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'rotating this PDF'));
    }
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Error message banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dropzone view */}
      {!sourceFile && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
          />
        </div>
      )}

      {/* Workspace view */}
      {sourceFile && !resultStats && (
        <div className="space-y-6">
          {/* Action and tool bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs"
                disabled={isProcessing}
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1 text-indigo-600" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Select All ({pages.length})
                  </>
                )}
              </Button>
              <span className="text-xs text-slate-500 font-medium">
                {selectedCount > 0
                  ? `${selectedCount} selected`
                  : 'All pages target'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyRotation(270)}
                disabled={isProcessing}
                className="text-xs"
                title="Rotate selected or all pages left (-90°)"
              >
                <RotateCcw className="w-4 h-4 mr-1 text-indigo-600" />
                Left 90°
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => applyRotation(90)}
                disabled={isProcessing}
                className="text-xs"
                title="Rotate selected or all pages right (+90°)"
              >
                <RotateCw className="w-4 h-4 mr-1 text-indigo-600" />
                Right 90°
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => applyRotation(180)}
                disabled={isProcessing}
                className="text-xs"
                title="Invert 180°"
              >
                <RefreshCw className="w-4 h-4 mr-1 text-slate-500" />
                180°
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetRotations}
                disabled={isProcessing}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Reset Angle
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                disabled={isProcessing}
                className="text-xs text-slate-500"
              >
                Change File
              </Button>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => toggleSelectPage(index)}
                className={`relative group bg-white dark:bg-slate-900 rounded-2xl p-3 border cursor-pointer transition-all ${
                  page.selected
                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header bar: Checkbox & angle badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={page.selected}
                      onChange={() => {}} // handled by parent div onClick
                      aria-label={`Select page ${index + 1}`}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Page {index + 1}
                    </span>
                  </div>

                  {page.userDelta !== 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                      +{page.userDelta}°
                    </span>
                  )}
                </div>

                {/* Rotating preview container */}
                <div className="w-full aspect-[3/4] overflow-hidden flex items-center justify-center relative bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div
                    style={{ transform: `rotate(${page.userDelta}deg)` }}
                    className="transition-transform duration-200 w-full h-full flex items-center justify-center"
                  >
                    <PdfThumbnail file={sourceFile} pageNumber={page.originalIndex + 1} />
                  </div>
                </div>

                {/* Individual page rotation quick-buttons */}
                <div
                  className="mt-2 flex items-center justify-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => rotateSinglePage(index, 270)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Rotate left"
                    aria-label={`Rotate page ${index + 1} left`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateSinglePage(index, 90)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Rotate right"
                    aria-label={`Rotate page ${index + 1} right`}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar if processing */}
          {isProcessing && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  {progressStage || 'Processing document...'}
                </span>
                <span className="font-mono text-slate-500 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          {!isProcessing && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Ready to Save Orientation
                  </h3>
                  <p className="text-xs text-slate-500">
                    {pages.filter((p) => p.userDelta !== 0).length > 0
                      ? `${pages.filter((p) => p.userDelta !== 0).length} pages modified with permanent rotation.`
                      : 'All pages currently at default orientation.'}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleProcessRotation}
                disabled={isProcessing}
                className="w-full sm:w-auto shadow-md"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Save & Rotate PDF
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {resultStats && downloadUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              PDF Rotated Successfully!
            </h2>
            <p className="text-sm text-slate-500">
              Your document orientation is permanently updated with original vector quality preserved.
            </p>
          </div>

          {/* Stats Box */}
          <div className="inline-flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>{resultStats.totalPages} Pages</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div>{formatBytes(resultStats.fileSize)}</div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="font-mono text-slate-400">{resultStats.fileName}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={downloadUrl}
              download={resultStats.fileName}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Rotated PDF
            </a>

            <Button variant="outline" size="lg" onClick={handleResetAll}>
              Rotate Another PDF
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Processed 100% locally. Zero documents uploaded to any server.</span>
          </div>
        </div>
      )}
    </div>
  );
}
