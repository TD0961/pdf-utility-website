'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  AdPageType,
  AdPlacement,
  AdFormat,
  isAdPlacementAllowed,
  getReservedMinHeight,
  AD_FORMAT_DIMENSIONS,
} from '@/lib/ads/ad-strategy';

export interface AdSlotProps {
  slotId?: string;
  pageType?: AdPageType;
  placement?: AdPlacement;
  format?: AdFormat;
  className?: string;
}

export function AdSlot({
  slotId = 'default-slot',
  pageType,
  placement,
  format = 'auto',
  className,
}: AdSlotProps) {
  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const isTestMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === 'true';
  const adClient =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  const isPlacementAllowed = !pageType || !placement || isAdPlacementAllowed(pageType, placement);
  const isEligible = (isAdSenseEnabled || isTestMode) && isPlacementAllowed;

  const adRef = React.useRef<HTMLModElement>(null);
  const pushedRef = React.useRef(false);

  React.useEffect(() => {
    if (isEligible && isAdSenseEnabled && adClient && adRef.current && !pushedRef.current) {
      try {
        if (typeof window !== 'undefined') {
          if (adRef.current.innerHTML.trim() === '') {
            ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
              (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
            pushedRef.current = true;
          }
        }
      } catch {
        // Silently suppress ad initialization errors from adblockers or pending reviews
      }
    }
  }, [isEligible, isAdSenseEnabled, adClient]);

  // 1. Centralized Policy & Production Disabled Check
  if (!isEligible) {
    return null;
  }

  const minHeight = getReservedMinHeight(format);
  const dimensionInfo = AD_FORMAT_DIMENSIONS[format];

  return (
    <aside
      aria-label="Advertisement"
      data-slot-id={slotId}
      className={cn(
        'my-8 w-full flex flex-col items-center justify-center overflow-hidden',
        className
      )}
      style={{ minHeight: `${minHeight}px` }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-center"
        style={{ minHeight: `${minHeight}px` }}
      >
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-2">
          Advertisement
        </span>

        {isAdSenseEnabled && adClient ? (
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: `${minHeight - 40}px` }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-xs font-mono gap-1">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              [AdSense Test Slot: {slotId}]
            </span>
            <span className="text-[11px] text-slate-400">
              {dimensionInfo.label} • Policy Verified
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
