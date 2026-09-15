'use client';

import React, { useEffect, useRef } from 'react';
import { RotateCw, Copy, Trash2, X, Check } from 'lucide-react';
import { EditorPage } from '@/lib/pdf/editor/types';
import { getPdfJs, getPdfLoadingParams } from '@/lib/pdf/pdf-renderer';
import { cn } from '@/lib/utils';

interface EditorMobilePageDrawerProps {
  isOpen: boolean;
  pages: EditorPage[];
  activePageIndex: number;
  sourceBytes: Uint8Array;
  onSelectPage: (index: number) => void;
  onRotatePage: (pageIndex: number, deltaDeg: 90 | -90) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onClose: () => void;
}

export function EditorMobilePageDrawer({
  isOpen,
  pages,
  activePageIndex,
  sourceBytes,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onClose,
}: EditorMobilePageDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Sheet Content */}
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[75vh] flex flex-col pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Handle Bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Manage Pages ({pages.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap a page to jump, or rotate, duplicate, and delete
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            aria-label="Close pages drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Page Thumbnail Strip */}
        <div className="p-4 overflow-x-auto flex gap-3 scrollbar-none items-center">
          {pages.map((page, index) => {
            const isActive = index === activePageIndex;

            return (
              <div
                key={page.pageIndex ?? index}
                className={cn(
                  'flex flex-col items-center shrink-0 w-32 p-2 rounded-2xl border transition-all duration-150',
                  isActive
                    ? 'border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-slate-300'
                )}
              >
                {/* Clickable thumbnail area */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectPage(index);
                  }}
                  className="w-full flex flex-col items-center group relative cursor-pointer"
                >
                  <div className="w-24 h-32 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative">
                    <MobilePageCanvasThumbnail
                      sourceBytes={sourceBytes}
                      pageIndex={page.originalPageIndex}
                      rotation={page.rotation}
                    />

                    {isActive && (
                      <span className="absolute top-1 right-1 p-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <span
                    className={cn(
                      'mt-2 text-xs font-semibold px-2 py-0.5 rounded-full',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    Page {index + 1}
                  </span>
                </button>

                {/* Actions per card */}
                <div className="flex items-center gap-1 mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 w-full justify-around">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(index, 90);
                    }}
                    title="Rotate 90° Clockwise"
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(index);
                    }}
                    title="Duplicate Page"
                    className="p-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(index);
                    }}
                    disabled={pages.length <= 1}
                    title="Delete Page"
                    className="p-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 disabled:opacity-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MobilePageCanvasThumbnail({
  sourceBytes,
  pageIndex,
  rotation,
}: {
  sourceBytes: Uint8Array;
  pageIndex: number;
  rotation: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderThumbnail() {
      if (!canvasRef.current || !sourceBytes) return;

      try {
        const pdfjs = await getPdfJs();
        const loadingTask = pdfjs.getDocument(getPdfLoadingParams(sourceBytes));
        const doc = await loadingTask.promise;
        const page = await doc.getPage(pageIndex + 1);

        if (cancelled) return;

        const viewport = page.getViewport({
          scale: 0.25,
          rotation: (page.rotate + rotation) % 360,
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          canvas,
          viewport,
        }).promise;
      } catch {
        // Thumbnail render error fallback
      }
    }

    renderThumbnail();
    return () => {
      cancelled = true;
    };
  }, [sourceBytes, pageIndex, rotation]);

  return <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />;
}
