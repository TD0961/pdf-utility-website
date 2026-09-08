'use client';

import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  fileName: string;
  currentPage: number; // 1-based
  totalPages: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  showThumbnails?: boolean;
  showProperties?: boolean;
  onToggleThumbnails?: () => void;
  onToggleProperties?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitWidth?: () => void;
  onExport: () => void;
  onResetDocument: () => void;
  className?: string;
}

export function EditorToolbar({
  fileName,
  currentPage,
  totalPages,
  zoom,
  canUndo,
  canRedo,
  isExporting,
  showThumbnails,
  showProperties,
  onToggleThumbnails,
  onToggleProperties,
  onUndo,
  onRedo,
  onPrevPage,
  onNextPage,
  onSetPage,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onExport,
  onResetDocument,
  className,
}: EditorToolbarProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header
      role="banner"
      className={cn(
        'w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none',
        className
      )}
    >
      {/* Left: Document Info & Reset */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[200px] sm:max-w-[260px] truncate">
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium truncate" title={fileName}>
            {fileName}
          </span>
        </div>

        <button
          type="button"
          onClick={onResetDocument}
          title="Open a different document"
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Change
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            <span className="sr-only">Undo</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
            <span className="sr-only">Redo</span>
          </button>
        </div>
      </div>

      {/* Center: Page Navigation & Zoom */}
      <div className="flex items-center gap-3">
        {/* Page Nav */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Previous Page</span>
          </button>

          <div className="flex items-center gap-1 px-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  onSetPage(val);
                }
              }}
              className="w-10 text-center font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            title="Next Page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="sr-only">Next Page</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="sr-only">Zoom Out</span>
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            title="Reset Zoom (100%)"
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="sr-only">Zoom In</span>
          </button>

          {onFitWidth && (
            <button
              type="button"
              onClick={onFitWidth}
              title="Fit to Width"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="sr-only">Fit to Width</span>
            </button>
          )}
        </div>
      </div>

      {/* Right: Sidebar Toggles & Export CTA */}
      <div className="flex items-center gap-2">
        {onToggleThumbnails && (
          <button
            type="button"
            onClick={onToggleThumbnails}
            title={showThumbnails ? 'Hide Pages Sidebar' : 'Show Pages Sidebar'}
            aria-pressed={showThumbnails}
            className={cn(
              'p-1.5 rounded-lg border transition-colors hidden sm:flex items-center gap-1 text-xs',
              showThumbnails
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Pages</span>
          </button>
        )}

        {onToggleProperties && (
          <button
            type="button"
            onClick={onToggleProperties}
            title={showProperties ? 'Hide Properties Panel' : 'Show Properties Panel'}
            aria-pressed={showProperties}
            className={cn(
              'p-1.5 rounded-lg border transition-colors hidden sm:flex items-center gap-1 text-xs',
              showProperties
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Properties</span>
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
          className="shadow-sm shadow-indigo-600/30 font-semibold"
        >
          {isExporting ? 'Exporting PDF...' : 'Download PDF'}
        </Button>
      </div>
    </header>
  );
}
