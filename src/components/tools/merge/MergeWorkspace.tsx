'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { PdfThumbnail } from '@/components/pdf/PdfThumbnail';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { mergePdfFiles } from '@/lib/pdf/merge';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  ArrowRight,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import { formatUserFacingPdfError } from '@/lib/validation/file-validator';

interface SelectedMergeFile {
  id: string;
  file: File;
  pageCount?: number;
}

export function MergeWorkspace() {
  const [files, setFiles] = useState<SelectedMergeFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mergedStats, setMergedStats] = useState<{
    fileCount: number;
    totalPages: number;
    fileSize: number;
    fileName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesAdded = async (newFiles: File[]) => {
    setErrorMessage(null);
    const addedItems: SelectedMergeFile[] = newFiles.map((f) => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file: f,
    }));

    setFiles((prev) => [...prev, ...addedItems]);

    // Inspect page counts asynchronously in browser
    for (const item of addedItems) {
      try {
        const count = await getPdfPageCount(item.file);
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, pageCount: count } : f))
        );
      } catch {
        // Page count will remain undefined without blocking the user
      }
    }
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setFiles([]);
    setMergedStats(null);
    setIsProcessing(false);
    setProgressPct(0);
    setProgressStage('');
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    if (isProcessing) return;
    if (files.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPct(5);
      setProgressStage('Initializing local PDF merger...');

      const result = await mergePdfFiles({
        files: files.map((item) => item.file),
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setMergedStats({
        fileCount: result.fileCount,
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Merge error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'merging documents'));
    }
  };

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* Hidden file input for "Add more files" */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        aria-hidden="true"
      />

      {/* STATE 1: INITIAL UPLOAD (EMPTY) */}
      {files.length === 0 && !mergedStats && (
        <PdfDropzone
          onFilesSelected={handleFilesAdded}
          acceptsMultiple={true}
          title="Select PDF files to merge"
          subtitle="or drag and drop multiple PDF files here to combine them locally in your browser"
        />
      )}

      {/* STATE 2: ACTIVE WORKSPACE (FILES SELECTED) */}
      {files.length > 0 && !mergedStats && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Selected Documents ({files.length})
              </h3>
              <p className="text-xs text-slate-500">
                Drag cards or use arrow buttons to set your desired page sequence.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add more PDFs
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-500 hover:text-red-600"
              >
                Clear all
              </Button>
            </div>
          </div>

          {/* Cards Grid with Desktop Drag-and-Drop + Mobile Accessible Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((item, index) => (
              <div
                key={item.id}
                draggable={!isProcessing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-3 shadow-xs transition-all flex flex-col justify-between select-none ${
                  draggedIndex === index
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md opacity-70'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {/* Order Badge */}
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-xs">
                  {index + 1}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${item.file.name}`}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-400 hover:text-red-600 shadow-xs hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Thumbnail Preview */}
                <div className="mb-2">
                  <PdfThumbnail file={item.file} pageNumber={1} />
                </div>

                {/* File Details */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatBytes(item.file.size)}</span>
                    <span>
                      {item.pageCount !== undefined
                        ? `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}`
                        : 'Checking...'}
                    </span>
                  </div>
                </div>

                {/* Accessible Reorder Controls */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0 || isProcessing}
                    onClick={() => handleMoveUp(index)}
                    aria-label={`Move ${item.file.name} earlier in order`}
                    className="p-1 h-7 text-xs"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-[10px] font-mono text-slate-400">
                    {index + 1} of {files.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === files.length - 1 || isProcessing}
                    onClick={() => handleMoveDown(index)}
                    aria-label={`Move ${item.file.name} later in order`}
                    className="p-1 h-7 text-xs"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Add More Tile */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[220px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex flex-col items-center justify-center p-4 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Add another PDF</span>
            </button>
          </div>

          {/* Validation Notice if only 1 file */}
          {files.length === 1 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>At least 2 PDF files are required to merge. Please add at least one more document.</span>
            </div>
          )}

          {/* Processing Progress Feedback */}
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
                <span>Combining in local RAM</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          {!isProcessing && (
            <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>
                  <strong>{files.length}</strong> {files.length === 1 ? 'file' : 'files'} ready to combine
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={files.length < 2 || isProcessing}
                  onClick={handleMerge}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-semibold"
                >
                  Merge PDFs
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: RESULT & DOWNLOAD */}
      {mergedStats && downloadUrl && (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              PDF merged successfully
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Combined directly on your device with zero server upload.
            </p>
          </div>

          {/* Stats Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-500">Files merged</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{mergedStats.fileCount}</p>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">Total pages</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{mergedStats.totalPages}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Output size</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatBytes(mergedStats.fileSize)}</p>
            </div>
          </div>

          {/* Download and Reset buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={mergedStats.fileName}
              className="w-full sm:w-auto"
            >
              <Button
                variant="success"
                size="lg"
                leftIcon={<Download className="w-5 h-5" />}
                className="w-full"
              >
                Download merged PDF
              </Button>
            </a>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Merge more PDFs
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Files never left your device. Local RAM freed upon tab close.</span>
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
