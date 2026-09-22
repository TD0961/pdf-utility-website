'use client';

import React from 'react';
import {
  MousePointer,
  Type,
  Highlighter,
  PenTool,
  Square,
  PenLine,
  Image as ImageIcon,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorTool } from './ToolPalette';

export type MobileTab = 'tools' | 'pages' | 'properties' | 'objects' | null;

interface EditorMobileBottomBarProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
  hasSelectedObject: boolean;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFitWidth?: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  isExporting: boolean;
  objectCount?: number;
}

const PRIMARY_TOOLS: { id: EditorTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'select', label: 'Select', icon: MousePointer },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'highlight', label: 'Highlight', icon: Highlighter },
  { id: 'draw', label: 'Draw', icon: PenTool },
  { id: 'rectangle', label: 'Shape', icon: Square },
  { id: 'signature', label: 'Sign', icon: PenLine },
  { id: 'image', label: 'Image', icon: ImageIcon },
];

export function EditorMobileBottomBar({
  activeTool,
  onSelectTool,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  activeTab,
  onSelectTab,
  hasSelectedObject,
  onDeleteSelected,
  onDuplicateSelected,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFitWidth,
}: EditorMobileBottomBarProps) {
  const [showZoomPopup, setShowZoomPopup] = React.useState(false);

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl pb-safe">
      {/* 1. Contextual Quick Action Pill when an object is selected */}
      {hasSelectedObject && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/90 dark:bg-indigo-950/80 border-b border-indigo-100 dark:border-indigo-900/50 text-xs">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Selected Element
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectTab(activeTab === 'properties' ? null : 'properties')}
              className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Style
            </button>
            {onDuplicateSelected && (
              <button
                type="button"
                onClick={onDuplicateSelected}
                title="Duplicate Object"
                className="p-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                title="Delete Object"
                className="p-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Tool Strip (Horizontal scrolling when Tools mode is active) */}
      {activeTab === 'tools' && (
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800/80 scrollbar-none bg-slate-50/80 dark:bg-slate-900/80">
          {PRIMARY_TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTool(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all active:scale-95',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Floating Zoom Controls Popup */}
      {showZoomPopup && (
        <div className="absolute bottom-16 right-4 z-50 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 transition-colors"
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          {onZoomFitWidth && (
            <button
              type="button"
              onClick={() => {
                onZoomFitWidth();
                setShowZoomPopup(false);
              }}
              className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors whitespace-nowrap"
              title="Fit Document to Screen Width"
            >
              Fit Width
            </button>
          )}
          <button
            type="button"
            onClick={onZoomIn}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Primary Bottom Navigation Tabs (iLovePDF Style) */}
      <div className="flex items-center justify-around px-2 py-1.5 gap-1">
        {/* Tools Tab */}
        <button
          id="mobile-tab-tools"
          type="button"
          onClick={() => onSelectTab(activeTab === 'tools' ? null : 'tools')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px]',
            activeTab === 'tools'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <PenTool className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">Tools</span>
        </button>

        {/* Pages Drawer Tab */}
        <button
          id="mobile-tab-pages"
          type="button"
          onClick={() => onSelectTab(activeTab === 'pages' ? null : 'pages')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] relative',
            activeTab === 'pages'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">Pages</span>
          <span className="absolute top-0 right-1 text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1 rounded-full">
            {totalPages}
          </span>
        </button>

        {/* Quick Page Nav Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-1 py-0.5 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="p-1 text-slate-600 dark:text-slate-300 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-1 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[36px] text-center">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
            className="p-1 text-slate-600 dark:text-slate-300 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Style / Properties Tab */}
        <button
          id="mobile-tab-style"
          type="button"
          onClick={() => onSelectTab(activeTab === 'properties' ? null : 'properties')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px]',
            activeTab === 'properties'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <SlidersHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">Style</span>
        </button>

        {/* Zoom Trigger Button */}
        <button
          id="mobile-tab-zoom"
          type="button"
          onClick={() => setShowZoomPopup((prev) => !prev)}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px]',
            showZoomPopup
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <Maximize2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">{Math.round(zoom * 100)}%</span>
        </button>
      </div>
    </div>
  );
}
