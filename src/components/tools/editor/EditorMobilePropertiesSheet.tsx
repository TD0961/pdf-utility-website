'use client';

import React from 'react';
import {
  X,
  Bold,
  Italic,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
} from 'lucide-react';
import { EditorObject, ColorRgb } from '@/lib/pdf/editor/types';
import { COLORS, hexToRgb, rgbToHex } from '@/lib/pdf/editor/objects';
import { ToolDefaults } from './EditorPropertiesPanel';
import { EditorTool } from './ToolPalette';
import { cn } from '@/lib/utils';

interface EditorMobilePropertiesSheetProps {
  isOpen: boolean;
  selectedObject: EditorObject | null;
  activeTool: EditorTool;
  toolDefaults: ToolDefaults;
  onUpdateObject: (updates: Partial<EditorObject>) => void;
  onDeleteObject: () => void;
  onDuplicateObject?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onUpdateToolDefaults: (updates: Partial<ToolDefaults>) => void;
  onClose: () => void;
}

const COLOR_SWATCHES: { label: string; value: ColorRgb; hex: string }[] = [
  { label: 'Black', value: COLORS.BLACK, hex: '#000000' },
  { label: 'Indigo', value: hexToRgb('#4F46E5'), hex: '#4F46E5' },
  { label: 'Emerald', value: hexToRgb('#059669'), hex: '#059669' },
  { label: 'Amber', value: hexToRgb('#D97706'), hex: '#D97706' },
  { label: 'Red', value: hexToRgb('#DC2626'), hex: '#DC2626' },
  { label: 'Purple', value: hexToRgb('#9333EA'), hex: '#9333EA' },
  { label: 'White', value: COLORS.WHITE, hex: '#FFFFFF' },
];

export function EditorMobilePropertiesSheet({
  isOpen,
  selectedObject,
  toolDefaults,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onBringForward,
  onSendBackward,
  onUpdateToolDefaults,
  onClose,
}: EditorMobilePropertiesSheetProps) {
  if (!isOpen) return null;

  const isText = selectedObject?.type === 'text';
  const isHighlight = selectedObject?.type === 'highlight';
  const hasStroke =
    selectedObject &&
    ['rectangle', 'ellipse', 'line', 'arrow', 'draw'].includes(selectedObject.type);

  const getActiveRgb = (): ColorRgb => {
    if (selectedObject) {
      if (selectedObject.type === 'text' || selectedObject.type === 'highlight') {
        return selectedObject.color;
      }
      if ('strokeColor' in selectedObject && selectedObject.strokeColor) {
        return selectedObject.strokeColor;
      }
    }
    return toolDefaults.strokeColor;
  };

  const activeRgb = getActiveRgb();
  const activeHex = rgbToHex(activeRgb);

  return (
    <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Sheet Content */}
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[80vh] overflow-y-auto flex flex-col pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Handle Bar */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {selectedObject
                ? `${selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)} Styling`
                : 'Tool Styling Defaults'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {selectedObject
                ? 'Adjust colors, sizing, and layering'
                : 'Customize default appearance for new annotations'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            aria-label="Close properties sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 1. Color Palette Swatches */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isText ? 'Text Color' : isHighlight ? 'Highlight Color' : 'Stroke / Accent Color'}
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = activeHex.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() => {
                      if (selectedObject) {
                        if (selectedObject.type === 'text' || selectedObject.type === 'highlight') {
                          onUpdateObject({ color: swatch.value });
                        } else if ('strokeColor' in selectedObject) {
                          onUpdateObject({ strokeColor: swatch.value });
                        }
                      } else {
                        onUpdateToolDefaults({
                          strokeColor: swatch.value,
                          textColor: swatch.value,
                        });
                      }
                    }}
                    title={swatch.label}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-transform active:scale-90 shrink-0 flex items-center justify-center',
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-110'
                        : 'border-slate-300 dark:border-slate-600'
                    )}
                    style={{ backgroundColor: swatch.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* 2. Text-Specific Controls */}
          {isText && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Font Size Stepper */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Font Size
                </label>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedObject.fontSize || 14;
                      onUpdateObject({ fontSize: Math.max(8, current - 2) });
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedObject.fontSize || 14}pt
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedObject.fontSize || 14;
                      onUpdateObject({ fontSize: Math.min(72, current + 2) });
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bold & Italic Toggles */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Style
                </label>
                <div className="flex items-center gap-1.5 h-[34px]">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateObject({ bold: !selectedObject.bold });
                    }}
                    className={cn(
                      'flex-1 h-full rounded-xl border flex items-center justify-center text-xs font-bold transition-colors',
                      selectedObject.bold
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateObject({ italic: !selectedObject.italic });
                    }}
                    className={cn(
                      'flex-1 h-full rounded-xl border flex items-center justify-center text-xs font-bold transition-colors',
                      selectedObject.italic
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    )}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Shape-Specific Controls */}
          {(hasStroke || (!selectedObject && toolDefaults)) && (
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              {/* Stroke Width Stepper */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Border / Stroke Thickness
                </label>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        selectedObject && 'strokeWidth' in selectedObject
                          ? selectedObject.strokeWidth
                          : toolDefaults.strokeWidth;
                      const next = Math.max(1, current - 1);
                      if (selectedObject && 'strokeWidth' in selectedObject) {
                        onUpdateObject({ strokeWidth: next });
                      } else {
                        onUpdateToolDefaults({ strokeWidth: next });
                      }
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedObject && 'strokeWidth' in selectedObject
                      ? selectedObject.strokeWidth
                      : toolDefaults.strokeWidth}
                    px
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        selectedObject && 'strokeWidth' in selectedObject
                          ? selectedObject.strokeWidth
                          : toolDefaults.strokeWidth;
                      const next = Math.min(20, current + 1);
                      if (selectedObject && 'strokeWidth' in selectedObject) {
                        onUpdateObject({ strokeWidth: next });
                      } else {
                        onUpdateToolDefaults({ strokeWidth: next });
                      }
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Opacity Stepper */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Opacity
                </label>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        selectedObject?.opacity !== undefined
                          ? selectedObject.opacity
                          : toolDefaults.opacity;
                      const next = Math.max(0.2, Math.round((current - 0.1) * 10) / 10);
                      if (selectedObject) onUpdateObject({ opacity: next });
                      else onUpdateToolDefaults({ opacity: next });
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    {Math.round(
                      (selectedObject?.opacity !== undefined
                        ? selectedObject.opacity
                        : toolDefaults.opacity) * 100
                    )}
                    %
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        selectedObject?.opacity !== undefined
                          ? selectedObject.opacity
                          : toolDefaults.opacity;
                      const next = Math.min(1.0, Math.round((current + 0.1) * 10) / 10);
                      if (selectedObject) onUpdateObject({ opacity: next });
                      else onUpdateToolDefaults({ opacity: next });
                    }}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Action Buttons when an object is selected */}
          {selectedObject && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-2">
              {onBringForward && (
                <button
                  type="button"
                  onClick={onBringForward}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200"
                >
                  <ArrowUp className="w-4 h-4 mb-0.5" />
                  Forward
                </button>
              )}
              {onSendBackward && (
                <button
                  type="button"
                  onClick={onSendBackward}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200"
                >
                  <ArrowDown className="w-4 h-4 mb-0.5" />
                  Backward
                </button>
              )}
              {onDuplicateObject && (
                <button
                  type="button"
                  onClick={onDuplicateObject}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-slate-200"
                >
                  <Copy className="w-4 h-4 mb-0.5" />
                  Duplicate
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onDeleteObject();
                  onClose();
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-semibold hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mb-0.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
