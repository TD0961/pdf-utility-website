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
  // 1. Centralized Policy Check: Validate placement against page type
  if (pageType && placement && !isAdPlacementAllowed(pageType, placement)) {
    return null;
  }

  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const isTestMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === 'true';
  const adClient =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  // 2. Production Disabled Check: Zero DOM footprint when disabled and not testing
  if (!isAdSenseEnabled && !isTestMode) {
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
