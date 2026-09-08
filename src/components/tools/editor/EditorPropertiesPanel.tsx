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
import { Copy, Trash2, Info, Palette } from 'lucide-react';
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
  activePage: EditorPage | undefined;
  activeTool: EditorTool;
  toolDefaults: ToolDefaults;
  onUpdateObject: (updates: Partial<EditorObject>) => void;
  onDeleteObject: () => void;
  onDuplicateObject: () => void;
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
  activePage,
  activeTool,
  toolDefaults,
  onUpdateObject,
  onDeleteObject,
  onDuplicateObject,
  onUpdateToolDefaults,
  className,
}: EditorPropertiesPanelProps) {
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
