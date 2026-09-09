'use client';

import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Layers,
  SlidersHorizontal,
  Search,
  Info,
  Printer,
  Keyboard,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { DocumentSaveState } from '@/lib/pdf/editor/types';

interface EditorToolbarProps {
  fileName: string;
  currentPage: number; // 1-based
  totalPages: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  isExporting: boolean;
  saveState?: DocumentSaveState;
  showThumbnails?: boolean;
  showProperties?: boolean;
  showSearch?: boolean;
  showObjectManager?: boolean;
  objectCount?: number;
  onToggleThumbnails?: () => void;
  onToggleProperties?: () => void;
  onToggleSearch?: () => void;
  onToggleObjectManager?: () => void;
  onOpenMetadata?: () => void;
  onOpenShortcuts?: () => void;
  onPrint?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFirstPage?: () => void;
  onLastPage?: () => void;
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
  saveState = 'clean',
  showThumbnails,
  showProperties,
  showSearch,
  showObjectManager,
  objectCount = 0,
  onToggleThumbnails,
  onToggleProperties,
  onToggleSearch,
  onToggleObjectManager,
  onOpenMetadata,
  onOpenShortcuts,
  onPrint,
  onUndo,
  onRedo,
  onPrevPage,
  onNextPage,
  onFirstPage,
  onLastPage,
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

  // Direct page input with validation (transient while user types)
  const [pageInputVal, setPageInputVal] = useState<string | null>(null);
  const displayedPage = pageInputVal !== null ? pageInputVal : String(currentPage);

  const handlePageCommit = () => {
    if (pageInputVal === null) return;
    const val = parseInt(pageInputVal, 10);
    if (!isNaN(val) && Number.isFinite(val)) {
      const clamped = Math.max(1, Math.min(totalPages, val));
      onSetPage(clamped);
    }
    setPageInputVal(null);
  };

  return (
    <header
      role="banner"
      className={cn(
        'w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none',
        className
      )}
    >
      {/* Left: Document Info, Save State, Info Modal Trigger & Reset */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onOpenMetadata}
          title="Document Information & Intelligence"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors max-w-[180px] sm:max-w-[240px] truncate group"
        >
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-medium truncate" title={fileName}>
            {fileName}
          </span>
          <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 ml-0.5" />
        </button>

        {/* Save State Indicator */}
        {saveState === 'dirty' && (
          <span
            title="You have unsaved changes"
            className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-full"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="hidden md:inline">Unsaved</span>
          </span>
        )}
        {saveState === 'saving' && (
          <span
            title="Saving document..."
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 rounded-full"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden md:inline">Saving...</span>
          </span>
        )}
        {saveState === 'saved' && (
          <span
            title="All changes saved"
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full"
          >
            <Check className="w-3 h-3" />
            <span className="hidden md:inline">Saved</span>
          </span>
        )}

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
            aria-label="Undo"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Enhanced Page Navigation & Search / Zoom */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Improved Page Nav with First/Prev/Input/Next/Last */}
        <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={onFirstPage || (() => onSetPage(1))}
            disabled={currentPage <= 1}
            title="First Page"
            aria-label="First page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors hidden sm:block"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
            aria-label="Previous page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1 text-xs font-medium text-slate-700 dark:text-slate-200">
            <span className="hidden sm:inline text-slate-500">Page</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={displayedPage}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={handlePageCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              aria-label="Page number input"
              className="w-9 text-center font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            title="Next Page"
            aria-label="Next page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLastPage || (() => onSetPage(totalPages))}
            disabled={currentPage >= totalPages}
            title="Last Page"
            aria-label="Last page"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors hidden sm:block"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Find / Search Trigger */}
        {onToggleSearch && (
          <button
            type="button"
            onClick={onToggleSearch}
            title="Search PDF text (Ctrl+F)"
            aria-label="Search PDF"
            className={cn(
              'p-1.5 rounded-xl border transition-colors flex items-center gap-1 text-xs',
              showSearch
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline text-[11px] font-medium">Find</span>
          </button>
        )}

        {/* Zoom Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            title="Reset Zoom (100%)"
            aria-label="Reset zoom"
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            aria-label="Zoom in"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {onFitWidth && (
            <button
              type="button"
              onClick={onFitWidth}
              title="Fit to Width"
              aria-label="Fit to width"
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Sidebar Toggles, Objects Manager, Export CTA */}
      <div className="flex items-center gap-2">
        {onToggleObjectManager && (
          <button
            type="button"
            onClick={onToggleObjectManager}
            title={showObjectManager ? 'Hide Objects Panel' : 'Manage Annotations & Objects'}
            aria-label="Manage objects"
            aria-pressed={showObjectManager}
            className={cn(
              'p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs relative',
              showObjectManager
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-700/60 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Objects</span>
            {objectCount > 0 && (
              <span className="bg-indigo-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.2 min-w-[16px] text-center">
                {objectCount}
              </span>
            )}
          </button>
        )}

        {onToggleThumbnails && (
          <button
            type="button"
            onClick={onToggleThumbnails}
            title={showThumbnails ? 'Hide Pages Sidebar' : 'Show Pages Sidebar'}
            aria-label="Toggle pages sidebar"
            aria-pressed={showThumbnails}
            className={cn(
              'p-1.5 rounded-lg border transition-colors hidden sm:flex items-center gap-1 text-xs',
              showThumbnails
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Pages</span>
          </button>
        )}

        {onToggleProperties && (
          <button
            type="button"
            onClick={onToggleProperties}
            title={showProperties ? 'Hide Properties Panel' : 'Show Properties Panel'}
            aria-label="Toggle properties panel"
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

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            title="Print Document (Ctrl+P)"
            aria-label="Print document"
            className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center gap-1 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Print</span>
          </button>
        )}

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Keyboard shortcuts"
            className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex items-center gap-1 text-xs"
          >
            <Keyboard className="w-3.5 h-3.5" />
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
