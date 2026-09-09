'use client';

import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PdfSearchResult } from '@/lib/pdf/editor/types';

interface EditorSearchBarProps {
  searchResult: PdfSearchResult;
  query: string;
  onQueryChange: (query: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
  className?: string;
}

export function EditorSearchBar({
  searchResult,
  query,
  onQueryChange,
  onNextMatch,
  onPrevMatch,
  onClose,
  className,
}: EditorSearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  const hasQuery = query.trim().length > 0;
  const isScanned = !searchResult.hasExtractedText && hasQuery;

  return (
    <div
      role="search"
      aria-label="Search document"
      className={cn(
        'z-40 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 backdrop-blur-md p-2 transition-all max-w-sm sm:max-w-md w-full',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            maxLength={200}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in document..."
            aria-label="Search PDF text"
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-8 pr-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        {/* Counter */}
        <div className="px-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[50px] text-center">
          {searchResult.isSearching ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
              <span>Indexing...</span>
            </span>
          ) : hasQuery ? (
            searchResult.totalMatches > 0 ? (
              <span>
                {searchResult.activeMatchIndex + 1} / {searchResult.totalMatches}
              </span>
            ) : (
              <span className="text-slate-400">0 results</span>
            )
          ) : null}
        </div>

        {/* Previous Match */}
        <button
          type="button"
          onClick={onPrevMatch}
          disabled={searchResult.totalMatches === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Next Match */}
        <button
          type="button"
          onClick={onNextMatch}
          disabled={searchResult.totalMatches === 0}
          title="Next match (Enter)"
          aria-label="Next match"
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />

        {/* Close Search */}
        <button
          type="button"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scanned PDF warning notice */}
      {isScanned && (
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 px-1 text-[11px] text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            No searchable text was found in this PDF. Scanned pages may require OCR.
          </span>
        </div>
      )}
    </div>
  );
}
