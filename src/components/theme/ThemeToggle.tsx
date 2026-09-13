'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme, useIsMounted } from './ThemeProvider';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const mounted = useIsMounted();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Handle keyboard navigation (Escape to close)
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4 text-indigo-400" /> },
    { value: 'system', label: 'System', icon: <Laptop className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setOpen(!open)}
        aria-label={`Color theme: ${mounted ? theme : 'system'}. Click to change theme.`}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-10 h-10 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none transition-colors shadow-xs"
      >
        {mounted && resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Color theme options"
          className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
