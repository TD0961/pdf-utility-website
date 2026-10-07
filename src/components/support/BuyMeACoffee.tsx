'use client';

import React from 'react';
import { Coffee, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { BUY_ME_A_COFFEE_URL } from '@/config/site';
import { cn } from '@/lib/utils';

export interface BuyMeACoffeeProps {
  variant?: 'card' | 'button' | 'banner';
  className?: string;
  customUrl?: string;
}

export function BuyMeACoffee({
  variant = 'card',
  className,
  customUrl,
}: BuyMeACoffeeProps) {
  const url = customUrl || BUY_ME_A_COFFEE_URL;

  if (variant === 'button') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support the developer on Buy Me a Coffee"
        className={cn(
          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold',
          'bg-amber-400 hover:bg-amber-300 text-slate-900',
          'shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
          className
        )}
      >
        <Coffee className="w-3.5 h-3.5 text-slate-900 fill-amber-900/20" />
        <span>Buy me a coffee</span>
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <aside
        aria-label="Support PDFSimplify Developer"
        className={cn(
          'my-8 w-full max-w-4xl mx-auto rounded-2xl p-5',
          'border border-amber-200/80 dark:border-amber-800/40',
          'bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-50/70',
          'dark:from-amber-950/20 dark:via-slate-900/40 dark:to-amber-950/20',
          'flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left',
          className
        )}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <Coffee className="w-5 h-5 fill-amber-900/20" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <span>Free, Private & In-Browser</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                <Sparkles className="w-2.5 h-2.5" /> Ad-Free
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Support independent development to keep PDFSimplify fast, free, and privacy-first.
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Buy Tensae a coffee</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </aside>
    );
  }

  // Default: 'card' (Optimized for the Download / Result screen in PdfResult.tsx)
  return (
    <div
      className={cn(
        'w-full rounded-2xl p-5 text-left transition-all duration-200',
        'border border-amber-200/90 dark:border-amber-800/40',
        'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/30',
        'dark:from-amber-950/25 dark:via-slate-900/60 dark:to-amber-950/15',
        'shadow-sm hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
          <Coffee className="w-6 h-6 fill-amber-900/20" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full">
              <Heart className="w-3 h-3 fill-amber-500 text-amber-600 dark:text-amber-400" />
              Creator Support
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Did PDFSimplify save you time?
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            PDFSimplify is 100% free and runs entirely on your device without server custody or subscriptions.
            If this tool saved your deadline or helped your workflow, buying Tensae a coffee keeps the tools ad-free and actively maintained!
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold',
                'bg-amber-400 hover:bg-amber-300 text-slate-950',
                'shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
              )}
            >
              <Coffee className="w-4 h-4 fill-amber-900/20" />
              <span>Buy Tensae a Coffee ($3)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Zero subscriptions • 100% voluntary
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
