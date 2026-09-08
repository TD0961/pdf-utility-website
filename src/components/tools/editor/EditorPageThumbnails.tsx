'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorPage } from '@/lib/pdf/editor/types';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageThumbnailCardProps {
  page: EditorPage;
  isActive: boolean;
  canDelete: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  sourceBytes: Uint8Array;
  onSelect: () => void;
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
  canDelete,
  canMoveUp,
  canMoveDown,
  sourceBytes,
  onSelect,
  onRotateLeft,
  onRotateRight,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: PageThumbnailCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function renderThumbnail() {
      if (!canvasRef.current || sourceBytes.byteLength === 0) return;

      try {
        setLoading(true);
        setError(false);
        const pdfjs = await getPdfJs();
        const loadingTask = pdfjs.getDocument({ data: sourceBytes.slice(0) });
        const doc = await loadingTask.promise;

        if (isCancelled) {
          await doc.cleanup();
          await loadingTask.destroy();
          return;
        }

        const pdfPage = await doc.getPage(page.originalPageIndex + 1);
        const scale = 0.22;
        const viewport = pdfPage.getViewport({ scale, rotation: page.rotation });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          await pdfPage.render({
            canvasContext: ctx,
            viewport,
            canvas,
          }).promise;
        }

        await doc.cleanup();
        await loadingTask.destroy();

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Thumbnail render error:', err);
        if (!isCancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [sourceBytes, page.originalPageIndex, page.rotation]);

  return (
    <div
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
        isActive
          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-600/30 shadow-md'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
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
  className,
}: EditorPageThumbnailsProps) {
  return (
    <aside
      aria-label="Pages Sidebar"
      className={cn(
        'w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col select-none',
        className
      )}
    >
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>Pages ({pages.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pages.map((page, index) => (
          <PageThumbnailCard
            key={`page-${page.originalPageIndex}-${index}`}
            page={page}
            isActive={activePageIndex === index}
            canDelete={pages.length > 1}
            canMoveUp={index > 0}
            canMoveDown={index < pages.length - 1}
            sourceBytes={sourceBytes}
            onSelect={() => onSelectPage(index)}
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
