'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  className?: string;
}

export function AdSlot({ slotId = 'default-slot', format = 'auto', className }: AdSlotProps) {
  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <aside
      aria-label="Advertisement"
      className={cn(
        'my-8 w-full flex flex-col items-center justify-center overflow-hidden',
        className
      )}
    >
      <div className="w-full max-w-4xl rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-center">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-2">
          Advertisement
        </span>

        {isAdSenseEnabled && adClient ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="py-6 flex items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-mono">
            <span>[AdSense Reserved Slot — {slotId}]</span>
          </div>
        )}
      </div>
    </aside>
  );
}
