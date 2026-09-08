'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { PdfThumbnail } from '@/components/pdf/PdfThumbnail';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { organizePdfDocument, OrganizePageInstruction } from '@/lib/pdf/organize';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import {
  RotateCw,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';

interface OrganizePageState {
  id: string;
  originalIndex: number; // 0-based index in the source PDF
  rotation: number; // degrees: 0, 90, 180, 270
  selected: boolean;
}

export function OrganizeWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<OrganizePageState[]>([]);
  const [initialPages, setInitialPages] = useState<OrganizePageState[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [organizedStats, setOrganizedStats] = useState<{
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
      setProgressStage('Inspecting PDF page structure...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      const initialList: OrganizePageState[] = [];
      for (let i = 0; i < count; i++) {
        initialList.push({
          id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          originalIndex: i,
          rotation: 0,
          selected: false,
        });
      }

      setPages(initialList);
      setInitialPages(initialList);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  // Reordering
  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMove(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Rotation
  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleRotateSelected = () => {
    setPages((prev) =>
      prev.map((p) => (p.selected ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  // Deletion
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMessage('A PDF must contain at least one page. Cannot delete the only remaining page.');
      return;
    }
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    setErrorMessage(null);
  };

  const handleDeleteSelected = () => {
    const remaining = pages.filter((p) => !p.selected);
    if (remaining.length === 0) {
      setErrorMessage('A PDF must contain at least one page. Cannot delete all pages.');
      return;
    }
    setPages(remaining);
    setErrorMessage(null);
  };

  // Duplication
  const handleDuplicatePage = (index: number) => {
    const target = pages[index];
    const duplicate: OrganizePageState = {
      id: `page-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      originalIndex: target.originalIndex,
      rotation: target.rotation,
      selected: false,
    };
    setPages((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicate);
      return updated;
    });
  };

  const handleDuplicateSelected = () => {
    const updated: OrganizePageState[] = [];
    for (const p of pages) {
      updated.push(p);
      if (p.selected) {
        updated.push({
          id: `page-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          originalIndex: p.originalIndex,
          rotation: p.rotation,
          selected: false,
        });
      }
    }
    setPages(updated);
  };

  // Selection
  const toggleSelectPage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = () => {
    const allSelected = pages.every((p) => p.selected);
    setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const handleClearSelection = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  };

  // Reset
  const handleResetToInitial = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setPages(initialPages);
    setOrganizedStats(null);
    setErrorMessage(null);
  };

  const handleClearAll = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setPages([]);
    setInitialPages([]);
    setOrganizedStats(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  // Save / Generate
  const handleSave = async () => {
    if (isProcessing) return;
    if (!sourceFile || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPct(10);
      setProgressStage('Assembling pages in local browser RAM...');

      const instructions: OrganizePageInstruction[] = pages.map((p) => ({
        id: p.id,
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const baseName = sourceFile.name.replace(/\.[^/.]+$/, '');
      const result = await organizePdfDocument({
        file: sourceFile,
        pages: instructions,
        outputFileName: `${baseName}-organized.pdf`,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setOrganizedStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Organize save error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'organizing pages'));
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* STATE 1: UPLOAD TARGET */}
      {!sourceFile && !organizedStats && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Select a PDF to organize"
          subtitle="or drag and drop a PDF file here to reorder, rotate, duplicate, or delete pages"
        />
      )}

      {/* STATE 2: ACTIVE PAGE GRID WORKSPACE */}
      {sourceFile && pages.length > 0 && !organizedStats && (
        <div className="space-y-6">
          {/* Top Info & Batch Selection Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="truncate max-w-xs sm:max-w-md">{sourceFile.name}</span>
                <span className="text-xs font-normal text-slate-400">
                  ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Drag pages to reorder, click to select, or use rotation and delete controls.
              </p>
            </div>

            {/* Selection actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                leftIcon={pages.every((p) => p.selected) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              >
                {pages.every((p) => p.selected) ? 'Deselect all' : 'Select all'}
              </Button>

              {selectedCount > 0 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRotateSelected}
                    leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  >
                    Rotate ({selectedCount})
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicateSelected}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Duplicate ({selectedCount})
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteSelected}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete ({selectedCount})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    Clear
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToInitial}
                title="Reset to original order"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset order
              </Button>
            </div>
          </div>

          {/* Visual Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pages.map((item, index) => (
              <div
                key={item.id}
                draggable={!isProcessing}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-2.5 shadow-xs transition-all flex flex-col justify-between group ${
                  item.selected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              >
                {/* Checkbox selector */}
                <button
                  type="button"
                  onClick={() => toggleSelectPage(index)}
                  aria-label={`Select page ${index + 1}`}
                  className="absolute top-2 left-2 z-10 p-1 rounded-md bg-white/90 dark:bg-slate-900/90 shadow-xs cursor-pointer"
                >
                  {item.selected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  )}
                </button>

                {/* Quick actions top-right */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 rounded-md p-0.5 shadow-xs opacity-90 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleRotatePage(index)}
                    aria-label={`Rotate page ${index + 1}`}
                    title="Rotate 90° clockwise"
                    className="p-1 hover:text-indigo-600 rounded transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicatePage(index)}
                    aria-label={`Duplicate page ${index + 1}`}
                    title="Duplicate page"
                    className="p-1 hover:text-indigo-600 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePage(index)}
                    aria-label={`Delete page ${index + 1}`}
                    title="Delete page"
                    className="p-1 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Thumbnail Preview with rotation transform */}
                <div className="mb-2 mt-6 overflow-hidden rounded-xl">
                  <div
                    style={{
                      transform: `rotate(${item.rotation}deg)`,
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <PdfThumbnail file={sourceFile} pageNumber={item.originalIndex + 1} />
                  </div>
                </div>

                {/* Page Label */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-1">
                  <span>Page {index + 1}</span>
                  {item.rotation > 0 && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {item.rotation}°
                    </span>
                  )}
                </div>

                {/* Accessible Directional Reorder Controls */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={index === 0 || isProcessing}
                    onClick={() => handleMove(index, index - 1)}
                    aria-label={`Move page ${index + 1} left`}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {index + 1} of {pages.length}
                  </span>
                  <button
                    type="button"
                    disabled={index === pages.length - 1 || isProcessing}
                    onClick={() => handleMove(index, index + 1)}
                    aria-label={`Move page ${index + 1} right`}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Feedback during save */}
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
                <span>Rendering organized PDF in local RAM</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Sticky Bottom Toolbar */}
          {!isProcessing && (
            <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} in output
                </span>
                {selectedCount > 0 && (
                  <span className="text-xs text-slate-500">
                    ({selectedCount} selected)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Choose different file
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={pages.length === 0 || isProcessing}
                  onClick={handleSave}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-semibold"
                >
                  Save Organized PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: RESULT & DOWNLOAD */}
      {organizedStats && downloadUrl && (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              PDF organized successfully
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your reordered and rotated document is ready for download.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-500">Total pages</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {organizedStats.totalPages}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Output size</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatBytes(organizedStats.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={organizedStats.fileName}
              className="w-full sm:w-auto"
            >
              <Button
                variant="success"
                size="lg"
                leftIcon={<Download className="w-5 h-5" />}
                className="w-full"
              >
                Download organized PDF
              </Button>
            </a>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleClearAll}
              className="w-full sm:w-auto"
            >
              Organize another PDF
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Processed locally in your browser RAM with zero cloud upload.</span>
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
