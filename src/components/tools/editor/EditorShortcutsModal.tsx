'use client';

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface EditorShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Document & Workflows',
    items: [
      { keys: ['Ctrl / ⌘', 'S'], description: 'Export / Save PDF' },
      { keys: ['Ctrl / ⌘', 'P'], description: 'Print Document' },
      { keys: ['Ctrl / ⌘', 'F'], description: 'Search Document Text' },
      { keys: ['Esc'], description: 'Close Modals / Deselect All' },
      { keys: ['?'], description: 'Open Keyboard Shortcuts' },
    ],
  },
  {
    title: 'Edit & History',
    items: [
      { keys: ['Ctrl / ⌘', 'Z'], description: 'Undo Last Action' },
      { keys: ['Ctrl / ⌘', 'Y'], description: 'Redo Action' },
      { keys: ['Ctrl / ⌘', 'Shift', 'Z'], description: 'Alternative Redo' },
      { keys: ['Ctrl / ⌘', 'C'], description: 'Copy Selected Objects' },
      { keys: ['Ctrl / ⌘', 'X'], description: 'Cut Selected Objects' },
      { keys: ['Ctrl / ⌘', 'V'], description: 'Paste Objects' },
      { keys: ['Ctrl / ⌘', 'A'], description: 'Select All Page Objects' },
      { keys: ['Delete / Backspace'], description: 'Delete Selected Objects' },
    ],
  },
  {
    title: 'Object Precision Nudge',
    items: [
      { keys: ['Arrow Keys'], description: 'Nudge Object 1 pt (Rotation-Aware)' },
      { keys: ['Shift', 'Arrow Keys'], description: 'Nudge Object 10 pt' },
    ],
  },
  {
    title: 'View & Navigation',
    items: [
      { keys: ['PageUp / PageDown'], description: 'Previous / Next Page' },
      { keys: ['Ctrl / ⌘', '+ / -'], description: 'Zoom In / Out' },
      { keys: ['Ctrl / ⌘', '0'], description: 'Reset Zoom to 100%' },
    ],
  },
];

export function EditorShortcutsModal({ isOpen, onClose }: EditorShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Productivity shortcuts for fast document editing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-indigo-500" />
            <span>Shortcuts automatically adapt to Windows/Linux (Ctrl) and macOS (⌘)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
