'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { EditorPage } from '@/lib/pdf/editor/types';
import { getPdfJs, getPdfLoadingParams } from '@/lib/pdf/pdf-renderer';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  FileText,
  Loader2,
  CheckSquare,
  Square,
  X,
  ListFilter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePageRanges } from '@/lib/pdf/range-parser';

interface PageThumbnailCardProps {
  page: EditorPage;
  isActive: boolean;
  isSelectedInBatch: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  sourceBytes: Uint8Array;
  onSelect: () => void;
  onToggleBatchSelect: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function PageThumbnailCard({
  page,
  isActive,
  isSelectedInBatch,
  canDelete,
  canMoveUp,
  canMoveDown,
  sourceBytes,
  onSelect,
  onToggleBatchSelect,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PageThumbnailCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lazy render observer: only render thumbnail if card is near or within view
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '250px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let isCancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    let docToCleanup: { cleanup: () => Promise<void> } | null = null;
    let loadingTaskToDestroy: { destroy: () => Promise<void> } | null = null;

    async function renderThumbnail() {
      if (!canvasRef.current || sourceBytes.byteLength === 0) return;

      try {
        setLoading(true);
        setError(false);
        const pdfjs = await getPdfJs();
        const loadingTask = pdfjs.getDocument(getPdfLoadingParams(sourceBytes));
        loadingTaskToDestroy = loadingTask;
        const doc = await loadingTask.promise;
        docToCleanup = doc;

        if (isCancelled) return;

        // 1-based index in PDF.js
        const pdfPage = await doc.getPage(page.originalPageIndex + 1);

        if (isCancelled) return;

        const unrotatedViewport = pdfPage.getViewport({ scale: 1 });
        const targetWidth = 140;
        const scale = targetWidth / unrotatedViewport.width;

        const effectiveRotation = (pdfPage.rotate + page.rotation) % 360;
        const viewport = pdfPage.getViewport({ scale, rotation: effectiveRotation });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        renderTask = pdfPage.render({
          canvasContext: context,
          canvas,
          viewport,
          intent: 'display',
        });

        await renderTask.promise;

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err: unknown) {
        const errName = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
        if (errName !== 'RenderingCancelledException' && !isCancelled) {
          console.error('Thumbnail render error:', err);
          setError(true);
          setLoading(false);
        }
      }
    }

    renderThumbnail();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation
        }
      }
      if (docToCleanup) {
        docToCleanup.cleanup().catch(() => {});
      }
      if (loadingTaskToDestroy) {
        loadingTaskToDestroy.destroy().catch(() => {});
      }
    };
  }, [isVisible, sourceBytes, page.originalPageIndex, page.rotation]);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect();
        }
      }}
      className={cn(
        'group relative flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer select-none bg-slate-50 dark:bg-slate-850',
        isSelectedInBatch
          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500 shadow-md'
          : isActive
          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {/* Batch Select Checkbox */}
      <button
        type="button"
        title={isSelectedInBatch ? 'Deselect page from batch' : 'Select page for batch operation'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBatchSelect();
        }}
        className={cn(
          'absolute top-2 left-2 z-10 p-1 rounded-md transition-all shadow-xs',
          isSelectedInBatch
            ? 'bg-indigo-600 text-white'
            : 'bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100'
        )}
      >
        {isSelectedInBatch ? (
          <CheckSquare className="w-3.5 h-3.5" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Thumbnail Canvas Container */}
      <div className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        {loading && (
          <div className="flex flex-col items-center justify-center p-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span className="text-[9px] font-mono mt-1">P.{page.pageIndex + 1}</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-2 text-slate-400">
            <FileText className="w-6 h-6 text-slate-400" />
            <span className="text-[10px] text-slate-500">P.{page.pageIndex + 1}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={cn(
            'max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-200',
            loading ? 'opacity-0' : 'opacity-100'
          )}
        />

        {/* Object count badge */}
        {page.objects.length > 0 && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-600 text-white rounded-full shadow-xs">
            {page.objects.length}
          </span>
        )}
      </div>

      {/* Page Info */}
      <div className="w-full flex items-center justify-between mt-2 px-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
        <span>Page {page.pageIndex + 1}</span>
        {page.rotation > 0 && (
          <span className="text-[10px] text-slate-400 font-normal">{page.rotation}°</span>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div
        className="w-full flex items-center justify-center gap-1 mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onRotateLeft}
          title="Rotate 90° Left"
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onRotateRight}
          title="Rotate 90° Right"
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RotateCw className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onDuplicate}
          title="Duplicate Page"
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>

        {canMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            title="Move Page Up"
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
        )}

        {canMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            title="Move Page Down"
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title="Delete Page"
          className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface EditorPageThumbnailsProps {
  pages: EditorPage[];
  activePageIndex: number;
  sourceBytes: Uint8Array;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number, delta: 90 | -90) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onRotatePages?: (indices: number[], delta: 90 | -90 | 180) => void;
  onDuplicatePages?: (indices: number[]) => void;
  onDeletePages?: (indices: number[]) => void;
  className?: string;
}

export function EditorPageThumbnails({
  pages,
  activePageIndex,
  sourceBytes,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onRotatePages,
  onDuplicatePages,
  onDeletePages,
  className,
}: EditorPageThumbnailsProps) {
  const [selectedBatchIndices, setSelectedBatchIndices] = useState<number[]>([]);
  const [showRangeInput, setShowRangeInput] = useState(false);
  const [rangeInputValue, setRangeInputValue] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selectedBatchIndices), [selectedBatchIndices]);

  const toggleSelectPage = (index: number) => {
    setSelectedBatchIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectedBatchIndices(pages.map((_, i) => i));
  };

  const handleClearSelection = () => {
    setSelectedBatchIndices([]);
    setRangeInputValue('');
    setRangeError(null);
  };

  const handleApplyRange = () => {
    if (!rangeInputValue.trim()) {
      setRangeError(null);
      return;
    }
    const result = parsePageRanges(rangeInputValue.trim(), pages.length);
    if (!result.valid) {
      setRangeError(result.error || 'Invalid page range');
      return;
    }
    setSelectedBatchIndices(result.allPageIndices);
    setRangeError(null);
    setShowRangeInput(false);
  };

  // Batch actions
  const handleBatchRotate = (delta: 90 | -90) => {
    if (selectedBatchIndices.length === 0) return;
    if (onRotatePages) {
      onRotatePages(selectedBatchIndices, delta);
    } else {
      for (const idx of selectedBatchIndices) {
        onRotatePage(idx, delta);
      }
    }
  };

  const handleBatchDuplicate = () => {
    if (selectedBatchIndices.length === 0) return;
    if (onDuplicatePages) {
      onDuplicatePages(selectedBatchIndices);
    } else {
      for (const idx of selectedBatchIndices) {
        onDuplicatePage(idx);
      }
    }
    handleClearSelection();
  };

  const handleBatchDelete = () => {
    if (selectedBatchIndices.length === 0) return;
    if (selectedBatchIndices.length >= pages.length) {
      alert('Cannot delete all pages from the document.');
      return;
    }
    if (onDeletePages) {
      onDeletePages(selectedBatchIndices);
    } else {
      // sort descending
      const sorted = [...selectedBatchIndices].sort((a, b) => b - a);
      for (const idx of sorted) {
        onDeletePage(idx);
      }
    }
    handleClearSelection();
  };

  return (
    <aside
      aria-label="Pages Sidebar"
      className={cn(
        'w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col select-none',
        className
      )}
    >
      {/* Top Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>Pages ({pages.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowRangeInput((prev) => !prev)}
            title="Select by range (e.g. 1-3, 5)"
            className={cn(
              'p-1 rounded-md text-xs transition-colors',
              showRangeInput
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <ListFilter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={selectedBatchIndices.length === pages.length ? handleClearSelection : handleSelectAll}
            title={selectedBatchIndices.length === pages.length ? 'Deselect All' : 'Select All'}
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-1 py-0.5"
          >
            {selectedBatchIndices.length === pages.length ? 'Clear' : 'All'}
          </button>
        </div>
      </div>

      {/* Range Selection Dropdown Panel */}
      {showRangeInput && (
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
              Page Range
            </span>
            <button
              type="button"
              onClick={() => setShowRangeInput(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. 1-3, 5"
              value={rangeInputValue}
              onChange={(e) => setRangeInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyRange();
                }
              }}
              className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleApplyRange}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-[11px]"
            >
              Select
            </button>
          </div>
          {rangeError && (
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">{rangeError}</p>
          )}
        </div>
      )}

      {/* Sticky Batch Actions Bar */}
      {selectedBatchIndices.length > 0 && (
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between text-xs">
          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[11px]">
            {selectedBatchIndices.length} {selectedBatchIndices.length === 1 ? 'page' : 'pages'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleBatchRotate(90)}
              title="Rotate selected pages 90°"
              className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBatchDuplicate}
              title="Duplicate selected pages"
              className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={selectedBatchIndices.length >= pages.length}
              title={
                selectedBatchIndices.length >= pages.length
                  ? 'Cannot delete all pages'
                  : 'Delete selected pages'
              }
              className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              title="Deselect all"
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pages.map((page, index) => (
          <PageThumbnailCard
            key={`page-${page.originalPageIndex}-${index}`}
            page={page}
            isActive={activePageIndex === index}
            isSelectedInBatch={selectedSet.has(index)}
            canDelete={pages.length > 1}
            canMoveUp={index > 0}
            canMoveDown={index < pages.length - 1}
            sourceBytes={sourceBytes}
            onSelect={() => onSelectPage(index)}
            onToggleBatchSelect={() => toggleSelectPage(index)}
            onRotateLeft={() => onRotatePage(index, -90)}
            onRotateRight={() => onRotatePage(index, 90)}
            onDuplicate={() => onDuplicatePage(index)}
            onDelete={() => onDeletePage(index)}
            onMoveUp={() => onMovePage(index, index - 1)}
            onMoveDown={() => onMovePage(index, index + 1)}
          />
        ))}
      </div>
    </aside>
  );
}
