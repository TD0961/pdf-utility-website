'use client';

import React from 'react';
import {
  MousePointer,
  Type,
  Highlighter,
  PenTool,
  Square,
  Circle,
  Minus,
  MoveRight,
  Image as ImageIcon,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type EditorTool =
  | 'select'
  | 'text'
  | 'highlight'
  | 'draw'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'image'
  | 'signature';

interface ToolItem {
  id: EditorTool;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLS: ToolItem[] = [
  { id: 'select', label: 'Select & Transform', shortcut: 'V', icon: MousePointer },
  { id: 'text', label: 'Add Text', shortcut: 'T', icon: Type },
  { id: 'highlight', label: 'Highlight Area', shortcut: 'H', icon: Highlighter },
  { id: 'draw', label: 'Freehand Draw', shortcut: 'D', icon: PenTool },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
  { id: 'ellipse', label: 'Circle / Ellipse', shortcut: 'O', icon: Circle },
  { id: 'line', label: 'Straight Line', shortcut: 'L', icon: Minus },
  { id: 'arrow', label: 'Directional Arrow', shortcut: 'A', icon: MoveRight },
  { id: 'image', label: 'Insert Image', shortcut: 'I', icon: ImageIcon },
  { id: 'signature', label: 'Add Signature', shortcut: 'S', icon: PenLine },
];

interface ToolPaletteProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function ToolPalette({
  activeTool,
  onSelectTool,
  orientation = 'vertical',
  className,
}: ToolPaletteProps) {
  return (
    <div
      role="toolbar"
      aria-label="Editor Drawing Tools"
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm flex gap-1 items-center backdrop-blur-sm',
        orientation === 'vertical' ? 'flex-col' : 'flex-row overflow-x-auto max-w-full',
        className
      )}
    >
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            aria-pressed={isActive}
            className={cn(
              'group relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95'
            )}
          >
            <Icon className="w-5 h-5 stroke-[2]" />
            <span className="sr-only">{tool.label}</span>

            {/* Desktop floating hover tooltip */}
            <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block dark:bg-slate-800 z-50 whitespace-nowrap">
              {tool.label}{' '}
              <kbd className="ml-1 rounded bg-slate-700 dark:bg-slate-700 px-1 py-0.5 text-[10px] text-slate-300">
                {tool.shortcut}
              </kbd>
            </span>
          </button>
        );
      })}
    </div>
  );
}
