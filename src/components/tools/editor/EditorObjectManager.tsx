'use client';

import React, { useState, useMemo } from 'react';
import {
  EditorObject,
  EditorPage,
} from '@/lib/pdf/editor/types';
import {
  Type,
  Image as ImageIcon,
  PenTool,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Highlighter,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  FileText,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorObjectManagerProps {
  pages: EditorPage[];
  activePageIndex: number;
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  onSelectObject: (id: string, pageIndex: number) => void;
  onDeleteObject: (objectId: string, pageIndex: number) => void;
  onDuplicateObject: (objectId: string) => void;
  onBringForward: (objectId: string) => void;
  onSendBackward: (objectId: string) => void;
  onClose?: () => void;
  className?: string;
}

type ObjectFilter = 'all' | 'text' | 'image' | 'shape' | 'drawing' | 'highlight';

function getObjectIcon(type: EditorObject['type']) {
  switch (type) {
    case 'text':
      return <Type className="w-3.5 h-3.5 text-blue-500" />;
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />;
    case 'signature':
      return <PenTool className="w-3.5 h-3.5 text-purple-500" />;
    case 'rectangle':
      return <Square className="w-3.5 h-3.5 text-indigo-500" />;
    case 'ellipse':
      return <Circle className="w-3.5 h-3.5 text-amber-500" />;
    case 'line':
      return <Minus className="w-3.5 h-3.5 text-teal-500" />;
    case 'arrow':
      return <ArrowRight className="w-3.5 h-3.5 text-rose-500" />;
    case 'drawing':
      return <PenTool className="w-3.5 h-3.5 text-orange-500" />;
    case 'highlight':
      return <Highlighter className="w-3.5 h-3.5 text-yellow-500" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function getObjectLabel(obj: EditorObject): string {
  switch (obj.type) {
    case 'text': {
      const sanitized = obj.text.replace(/\s+/g, ' ').trim();
      const snippet = sanitized.length > 20 ? sanitized.substring(0, 20) + '...' : sanitized;
      return snippet ? `Text — "${snippet}"` : 'Text';
    }
    case 'rectangle':
      return 'Rectangle';
    case 'ellipse':
      return 'Ellipse';
    case 'line':
      return 'Line';
    case 'arrow':
      return 'Arrow';
    case 'drawing':
      return 'Freehand Drawing';
    case 'image':
      return 'Image';
    case 'signature':
      return 'Signature';
    case 'highlight':
      return 'Highlight';
    default:
      return 'Object';
  }
}

export function EditorObjectManager({
  pages,
  activePageIndex,
  selectedObjectId,
  selectedObjectIds,
  onSelectObject,
  onDeleteObject,
  onDuplicateObject,
  onBringForward,
  onSendBackward,
  onClose,
  className,
}: EditorObjectManagerProps) {
  const [filter, setFilter] = useState<ObjectFilter>('all');
  const [filterPageOnly, setFilterPageOnly] = useState(false);

  // Flatten all objects with page reference
  const allItems = useMemo(() => {
    const list: { object: EditorObject; pageIndex: number; pageNumber: number }[] = [];
    pages.forEach((page, pIdx) => {
      page.objects.forEach((obj) => {
        list.push({
          object: obj,
          pageIndex: pIdx,
          pageNumber: pIdx + 1,
        });
      });
    });
    return list;
  }, [pages]);

  const filteredItems = useMemo(() => {
    return allItems.filter(({ object, pageIndex }) => {
      if (filterPageOnly && pageIndex !== activePageIndex) {
        return false;
      }
      if (filter === 'all') return true;
      if (filter === 'text') return object.type === 'text';
      if (filter === 'image') return object.type === 'image' || object.type === 'signature';
      if (filter === 'shape') {
        return ['rectangle', 'ellipse', 'line', 'arrow'].includes(object.type);
      }
      if (filter === 'drawing') return object.type === 'drawing';
      if (filter === 'highlight') return object.type === 'highlight';
      return true;
    });
  }, [allItems, filter, filterPageOnly, activePageIndex]);

  const totalCount = allItems.length;

  return (
    <aside
      role="complementary"
      aria-label="Object and annotation manager"
      className={cn(
        'w-72 sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full select-none z-20',
        className
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Objects ({totalCount})
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close objects panel"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Scope Toggle */}
      <div className="px-3 pt-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Scope</span>
          <button
            type="button"
            onClick={() => setFilterPageOnly(!filterPageOnly)}
            className={cn(
              'px-2 py-0.5 rounded-md font-medium transition-colors',
              filterPageOnly
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {filterPageOnly ? `Page ${activePageIndex + 1} Only` : 'All Pages'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'text', label: 'Text' },
              { id: 'image', label: 'Media' },
              { id: 'shape', label: 'Shapes' },
              { id: 'drawing', label: 'Draw' },
              { id: 'highlight', label: 'Highlight' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                'px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors',
                filter === t.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Object List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
            <p>
              {totalCount === 0
                ? 'No editor objects added yet. Use the tool palette to add annotations or text.'
                : 'No objects match the current filter.'}
            </p>
          </div>
        ) : (
          filteredItems.map(({ object, pageIndex, pageNumber }) => {
            const isSelected =
              selectedObjectId === object.id || selectedObjectIds.includes(object.id);
            const isCurrentPage = pageIndex === activePageIndex;

            return (
              <div
                key={object.id}
                onClick={() => onSelectObject(object.id, pageIndex)}
                className={cn(
                  'group flex items-center justify-between gap-2 p-2 rounded-xl text-xs cursor-pointer transition-all border',
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 text-indigo-950 dark:text-indigo-100 font-medium shadow-sm'
                    : 'bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/70 border-transparent text-slate-700 dark:text-slate-300'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1 rounded-md bg-white dark:bg-slate-800 shadow-xs shrink-0">
                    {getObjectIcon(object.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs">{getObjectLabel(object)}</div>
                    <div className="text-[10px] text-slate-400">
                      Page {pageNumber}
                      {isCurrentPage ? ' • Active' : ''}
                    </div>
                  </div>
                </div>

                {/* Actions on hover or when selected */}
                <div
                  className={cn(
                    'flex items-center gap-0.5 shrink-0 transition-opacity',
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isCurrentPage && (
                    <>
                      <button
                        type="button"
                        onClick={() => onBringForward(object.id)}
                        title="Bring Forward"
                        aria-label="Bring forward"
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendBackward(object.id)}
                        title="Send Backward"
                        aria-label="Send backward"
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateObject(object.id)}
                        title="Duplicate Object"
                        aria-label="Duplicate object"
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteObject(object.id, pageIndex)}
                    title="Delete Object"
                    aria-label="Delete object"
                    className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
