'use client';

import React from 'react';
import {
  EditorObject,
  EditorPage,
  ColorRgb,
  SupportedFontFamily,
} from '@/lib/pdf/editor/types';
import { EditorTool } from './ToolPalette';
import { hexToRgb, rgbToHex } from '@/lib/pdf/editor/objects';
import {
  Copy,
  Trash2,
  Info,
  Palette,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  RotateCw,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolDefaults {
  strokeColor: ColorRgb;
  fillColor?: ColorRgb;
  hasFill: boolean;
  strokeWidth: number;
  textColor: ColorRgb;
  fontSize: number;
  fontFamily: SupportedFontFamily;
  highlightColor: ColorRgb;
  opacity: number;
}

interface EditorPropertiesPanelProps {
  selectedObject: EditorObject | null;
  selectedObjects?: EditorObject[];
  activePage: EditorPage | undefined;
  activeTool: EditorTool;
  toolDefaults: ToolDefaults;
  onUpdateObject: (updates: Partial<EditorObject>) => void;
  onDeleteObject: () => void;
  onDuplicateObject: () => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  onAlignSelected?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onUpdateToolDefaults: (updates: Partial<ToolDefaults>) => void;
  className?: string;
}

const COLOR_PRESETS = [
  { label: 'Black', hex: '#000000' },
  { label: 'Red', hex: '#DC2626' },
  { label: 'Blue', hex: '#2563EB' },
  { label: 'Green', hex: '#16A34A' },
  { label: 'Yellow', hex: '#EAB308' },
  { label: 'Orange', hex: '#EA580C' },
  { label: 'Purple', hex: '#9333EA' },
  { label: 'White', hex: '#FFFFFF' },
];

const HIGHLIGHT_PRESETS = [
  { label: 'Yellow', hex: '#FFE500' },
  { label: 'Green', hex: '#86EFAC' },
  { label: 'Blue', hex: '#93C5FD' },
  { label: 'Pink', hex: '#F472B6' },
  { label: 'Orange', hex: '#FDBA74' },
];

export function EditorPropertiesPanel({
  selectedObject,
  selectedObjects,
  activePage,
  activeTool,
  toolDefaults,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onAlignSelected,
  onDistributeSelected,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onUpdateToolDefaults,
  className,
}: EditorPropertiesPanelProps) {
  // 1. Multi-Selection Inspector
  if (selectedObjects && selectedObjects.length > 1) {
    return (
      <aside
        aria-label="Multi-Selection Properties"
        className={cn(
          'w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto select-none text-xs',
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
            {selectedObjects.length} Objects Selected
          </span>
          <div className="flex items-center gap-1">
            {onDuplicateSelected && (
              <button
                type="button"
                onClick={onDuplicateSelected}
                title="Duplicate Selected Objects"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                title="Delete Selected Objects"
                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Alignment controls */}
        {onAlignSelected && (
          <div className="space-y-2">
            <span className="block font-medium text-slate-700 dark:text-slate-300">Align</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => onAlignSelected('left')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
                <span className="text-[10px]">Left</span>
              </button>
              <button
                type="button"
                onClick={() => onAlignSelected('center')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Center (Horizontal)"
              >
                <AlignCenter className="w-4 h-4" />
                <span className="text-[10px]">Center</span>
              </button>
              <button
                type="button"
                onClick={() => onAlignSelected('right')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
                <span className="text-[10px]">Right</span>
              </button>
              <button
                type="button"
                onClick={() => onAlignSelected('top')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Top"
              >
                <ArrowUpToLine className="w-4 h-4" />
                <span className="text-[10px]">Top</span>
              </button>
              <button
                type="button"
                onClick={() => onAlignSelected('middle')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Middle (Vertical)"
              >
                <Minus className="w-4 h-4" />
                <span className="text-[10px]">Middle</span>
              </button>
              <button
                type="button"
                onClick={() => onAlignSelected('bottom')}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center gap-1 transition-colors"
                title="Align Bottom"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span className="text-[10px]">Bottom</span>
              </button>
            </div>
          </div>
        )}

        {/* Distribution controls */}
        {onDistributeSelected && (
          <div className="space-y-2">
            <span className="block font-medium text-slate-700 dark:text-slate-300">Distribute</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={selectedObjects.length < 3}
                onClick={() => onDistributeSelected('horizontal')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1 transition-colors"
                title={selectedObjects.length < 3 ? 'Requires 3 or more objects' : 'Distribute Horizontally'}
              >
                <span className="text-[11px] font-medium">Horizontal</span>
              </button>
              <button
                type="button"
                disabled={selectedObjects.length < 3}
                onClick={() => onDistributeSelected('vertical')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1 transition-colors"
                title={selectedObjects.length < 3 ? 'Requires 3 or more objects' : 'Distribute Vertically'}
              >
                <span className="text-[11px] font-medium">Vertical</span>
              </button>
            </div>
            {selectedObjects.length < 3 && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Select 3 or more objects to distribute spacing evenly.
              </p>
            )}
          </div>
        )}
      </aside>
    );
  }

  if (selectedObject) {
    return (
      <aside
        aria-label="Object Properties"
        className={cn(
          'w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto select-none text-xs',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
              {selectedObject.type} Properties
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDuplicateObject}
              title="Duplicate Object"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDeleteObject}
              title="Delete Object"
              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Text Object Properties */}
        {selectedObject.type === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Text Content
              </label>
              <textarea
                value={selectedObject.text}
                onChange={(e) => onUpdateObject({ text: e.target.value })}
                rows={3}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Font Family
              </label>
              <select
                value={selectedObject.fontFamily}
                onChange={(e) =>
                  onUpdateObject({ fontFamily: e.target.value as SupportedFontFamily })
                }
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Helvetica">Helvetica (Sans-Serif)</option>
                <option value="TimesRoman">Times Roman (Serif)</option>
                <option value="Courier">Courier (Monospace)</option>
              </select>
            </div>

            {/* Text Styling: Bold, Italic, Underline, Alignment */}
            <div>
              <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Style & Alignment
              </span>
              <div className="flex items-center gap-1">
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ bold: !selectedObject.bold })}
                    title="Bold"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.bold
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ italic: !selectedObject.italic })}
                    title="Italic"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.italic
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ underline: !selectedObject.underline })}
                    title="Underline"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.underline
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50/50 dark:bg-slate-800/40 ml-auto">
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ align: 'left' })}
                    title="Align Left"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.align === 'left' || !selectedObject.align
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ align: 'center' })}
                    title="Align Center"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.align === 'center'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateObject({ align: 'right' })}
                    title="Align Right"
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedObject.align === 'right'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Font Size ({selectedObject.fontSize} pt)
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={72}
                value={selectedObject.fontSize}
                onChange={(e) => onUpdateObject({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Text Color */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Font Color
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateObject({ color: hexToRgb(preset.hex) })}
                    title={preset.label}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-transform active:scale-90',
                      rgbToHex(selectedObject.color).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                        : ''
                    )}
                  />
                ))}
                <input
                  type="color"
                  value={rgbToHex(selectedObject.color)}
                  onChange={(e) => onUpdateObject({ color: hexToRgb(e.target.value) })}
                  className="w-6 h-6 rounded-full cursor-pointer p-0 border-0"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Highlight Object Properties */}
        {selectedObject.type === 'highlight' && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Highlight Color
              </label>
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHT_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateObject({ color: hexToRgb(preset.hex) })}
                    title={preset.label}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm transition-transform active:scale-95',
                      rgbToHex(selectedObject.color).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                        : ''
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Drawing Object Properties */}
        {selectedObject.type === 'drawing' && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stroke Color
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateObject({ color: hexToRgb(preset.hex) })}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-transform active:scale-90',
                      rgbToHex(selectedObject.color).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                        : ''
                    )}
                  />
                ))}
                <input
                  type="color"
                  value={rgbToHex(selectedObject.color)}
                  onChange={(e) => onUpdateObject({ color: hexToRgb(e.target.value) })}
                  className="w-6 h-6 rounded-full cursor-pointer p-0 border-0"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Stroke Width ({selectedObject.strokeWidth} px)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={24}
                value={selectedObject.strokeWidth}
                onChange={(e) =>
                  onUpdateObject({ strokeWidth: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Rectangle / Ellipse Properties */}
        {(selectedObject.type === 'rectangle' || selectedObject.type === 'ellipse') && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stroke Color
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateObject({ strokeColor: hexToRgb(preset.hex) })}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-transform active:scale-90',
                      rgbToHex(selectedObject.strokeColor).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                        : ''
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Stroke Width ({selectedObject.strokeWidth} px)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={selectedObject.strokeWidth}
                onChange={(e) =>
                  onUpdateObject({ strokeWidth: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Fill Color */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Fill Color
                </label>
                <input
                  type="checkbox"
                  checked={Boolean(selectedObject.fillColor)}
                  onChange={(e) => {
                    onUpdateObject({
                      fillColor: e.target.checked ? hexToRgb('#2563EB') : undefined,
                    });
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              {selectedObject.fillColor && (
                <div className="flex flex-wrap gap-1.5 items-center mt-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => onUpdateObject({ fillColor: hexToRgb(preset.hex) })}
                      style={{ backgroundColor: preset.hex }}
                      className={cn(
                        'w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600',
                        rgbToHex(selectedObject.fillColor!).toLowerCase() === preset.hex.toLowerCase()
                          ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                          : ''
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Line / Arrow Properties */}
        {(selectedObject.type === 'line' || selectedObject.type === 'arrow') && (
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stroke Color
              </label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateObject({ strokeColor: hexToRgb(preset.hex) })}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 transition-transform active:scale-90',
                      rgbToHex(selectedObject.strokeColor).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                        : ''
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Stroke Width ({selectedObject.strokeWidth} px)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={selectedObject.strokeWidth}
                onChange={(e) =>
                  onUpdateObject({ strokeWidth: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>

            {selectedObject.type === 'arrow' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Arrow Head Size ({selectedObject.headLength ?? 12} px)
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={selectedObject.headLength ?? 12}
                  onChange={(e) =>
                    onUpdateObject({ headLength: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>
        )}

        {/* Image Object Properties */}
        {selectedObject.type === 'image' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Dimensions</span>
                <span className="text-[11px] text-slate-400">
                  {Math.round(selectedObject.width)} × {Math.round(selectedObject.height)} pt
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Width</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={Math.round(selectedObject.width)}
                    onChange={(e) => {
                      const w = Math.max(10, parseInt(e.target.value, 10) || 10);
                      if (selectedObject.lockAspectRatio) {
                        const aspect = selectedObject.height / selectedObject.width;
                        onUpdateObject({ width: w, height: Math.round(w * aspect) });
                      } else {
                        onUpdateObject({ width: w });
                      }
                    }}
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Height</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={Math.round(selectedObject.height)}
                    onChange={(e) => {
                      const h = Math.max(10, parseInt(e.target.value, 10) || 10);
                      if (selectedObject.lockAspectRatio) {
                        const aspect = selectedObject.width / selectedObject.height;
                        onUpdateObject({ height: h, width: Math.round(h * aspect) });
                      } else {
                        onUpdateObject({ height: h });
                      }
                    }}
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedObject.lockAspectRatio ?? true}
                  onChange={(e) => onUpdateObject({ lockAspectRatio: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Lock aspect ratio</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  onUpdateObject({ rotation: ((selectedObject.rotation || 0) + 90) % 360 })
                }
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Signature Object Properties */}
        {selectedObject.type === 'signature' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Dimensions</span>
                <span className="text-[11px] text-slate-400">
                  {Math.round(selectedObject.width)} × {Math.round(selectedObject.height)} pt
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Width</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={Math.round(selectedObject.width)}
                    onChange={(e) => {
                      const w = Math.max(10, parseInt(e.target.value, 10) || 10);
                      const aspect = selectedObject.height / selectedObject.width;
                      onUpdateObject({ width: w, height: Math.round(w * aspect) });
                    }}
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Height</label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={Math.round(selectedObject.height)}
                    onChange={(e) => {
                      const h = Math.max(10, parseInt(e.target.value, 10) || 10);
                      const aspect = selectedObject.width / selectedObject.height;
                      onUpdateObject({ height: h, width: Math.round(h * aspect) });
                    }}
                    className="w-full text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onUpdateObject({ rotation: ((selectedObject.rotation || 0) + 90) % 360 })
                }
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-700 dark:text-slate-300"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opacity ({Math.round(selectedObject.opacity * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(selectedObject.opacity * 100)}
                onChange={(e) =>
                  onUpdateObject({ opacity: parseInt(e.target.value, 10) / 100 })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Layer Order (Stacking / Z-Order) */}
        {(onBringForward || onSendBackward || onBringToFront || onSendToBack) && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="block font-medium text-slate-700 dark:text-slate-300">
              Layer Stacking
            </span>
            <div className="grid grid-cols-4 gap-1">
              {onBringToFront && (
                <button
                  type="button"
                  onClick={onBringToFront}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                  title="Bring to Front"
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                  <span className="text-[9px] mt-0.5">Front</span>
                </button>
              )}
              {onBringForward && (
                <button
                  type="button"
                  onClick={onBringForward}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                  title="Bring Forward"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span className="text-[9px] mt-0.5">Forward</span>
                </button>
              )}
              {onSendBackward && (
                <button
                  type="button"
                  onClick={onSendBackward}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                  title="Send Backward"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="text-[9px] mt-0.5">Back</span>
                </button>
              )}
              {onSendToBack && (
                <button
                  type="button"
                  onClick={onSendToBack}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center justify-center transition-colors text-slate-700 dark:text-slate-300"
                  title="Send to Back"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span className="text-[9px] mt-0.5">Bottom</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Redaction Limitation Notice */}
        <div className="mt-auto p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-normal flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>Visual annotations are not a substitute for true PDF redaction.</span>
        </div>
      </aside>
    );
  }

  // No object selected: show active tool configuration & page stats
  return (
    <aside
      aria-label="Editor Properties"
      className={cn(
        'w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-5 select-none text-xs',
        className
      )}
    >
      {/* Active Tool Configuration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
            {activeTool === 'select' ? 'Tool Settings' : `${activeTool} defaults`}
          </span>
        </div>

        {activeTool === 'draw' && (
          <div className="space-y-3">
            <div>
              <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Stroke Color
              </span>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => onUpdateToolDefaults({ strokeColor: hexToRgb(preset.hex) })}
                    style={{ backgroundColor: preset.hex }}
                    className={cn(
                      'w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600',
                      rgbToHex(toolDefaults.strokeColor).toLowerCase() === preset.hex.toLowerCase()
                        ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110'
                        : ''
                    )}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Stroke Width ({toolDefaults.strokeWidth} px)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={toolDefaults.strokeWidth}
                onChange={(e) =>
                  onUpdateToolDefaults({ strokeWidth: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="space-y-3">
            <div>
              <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Font Family
              </span>
              <select
                value={toolDefaults.fontFamily}
                onChange={(e) =>
                  onUpdateToolDefaults({ fontFamily: e.target.value as SupportedFontFamily })
                }
                className="w-full text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="Helvetica">Helvetica</option>
                <option value="TimesRoman">Times Roman</option>
                <option value="Courier">Courier</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Font Size ({toolDefaults.fontSize} pt)
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={72}
                value={toolDefaults.fontSize}
                onChange={(e) =>
                  onUpdateToolDefaults({ fontSize: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {activeTool === 'highlight' && (
          <div className="space-y-3">
            <span className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Preset Color
            </span>
            <div className="flex flex-wrap gap-1.5">
              {HIGHLIGHT_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => onUpdateToolDefaults({ highlightColor: hexToRgb(preset.hex) })}
                  style={{ backgroundColor: preset.hex }}
                  className={cn(
                    'w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-600',
                    rgbToHex(toolDefaults.highlightColor).toLowerCase() === preset.hex.toLowerCase()
                      ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105'
                      : ''
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {activeTool === 'select' && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 leading-relaxed">
            Click on any annotation on the canvas to edit, resize, move, or delete it.
          </div>
        )}
      </div>

      {/* Page Summary */}
      {activePage && (
        <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>Active Page Info</span>
          </div>
          <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Page Number:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activePage.pageIndex + 1}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Dimensions:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activePage.width} × {activePage.height} pt
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rotation:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activePage.rotation}°
              </span>
            </div>
            <div className="flex justify-between">
              <span>Annotations:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {activePage.objects.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Redaction Limitation Notice */}
      <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 leading-normal flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>Visual annotations are not a substitute for true PDF redaction.</span>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <div className="font-semibold text-slate-600 dark:text-slate-400">Shortcuts:</div>
        <div className="flex justify-between">
          <span>Delete object:</span>
          <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Del / Backspace</kbd>
        </div>
        <div className="flex justify-between">
          <span>Deselect:</span>
          <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd>
        </div>
        <div className="flex justify-between">
          <span>Undo / Redo:</span>
          <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Ctrl+Z / Ctrl+Y</kbd>
        </div>
      </div>
    </aside>
  );
}
