'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AdPageType, isAnchorAllowed } from '@/lib/ads/ad-strategy';

export interface AnchorAdProps {
  pageType: AdPageType;
  slotId?: string;
}

export function AnchorAd({ pageType, slotId = 'anchor-ad-bottom' }: AnchorAdProps) {
  const [dismissed, setDismissed] = useState(false);

  // 1. Policy Guard: Strictly disallow on editor, legal, and disabled page types
  if (!isAnchorAllowed(pageType) || dismissed) {
    return null;
  }

  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const isTestMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === 'true';
  const adClient =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  if (!isAdSenseEnabled && !isTestMode) {
    return null;
  }

  return (
    <aside
      aria-label="Bottom Anchor Advertisement"
      data-slot-id={slotId}
      data-ad-type="anchor"
      className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom"
    >
      <div className="w-full max-w-4xl relative px-4 py-2 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">
          Advertisement
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss advertisement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-full max-w-3xl min-h-[50px] sm:min-h-[90px] flex items-center justify-center pb-2 px-4">
        {isAdSenseEnabled && adClient ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'inline-block', width: '100%', height: '50px' }}
            data-ad-client={adClient}
            data-ad-slot={slotId}
            data-ad-format="horizontal"
          />
        ) : (
          <div className="text-center font-mono text-[11px] text-slate-400 py-2">
            [Anchor Ad: {slotId} • {pageType}]
          </div>
        )}
      </div>
    </aside>
  );
}
