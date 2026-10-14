'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AdPageType,
  AdPlacement,
  AdFormat,
  isAdPlacementAllowed,
  getReservedMinHeight,
  AD_FORMAT_DIMENSIONS,
  DEFAULT_ADSENSE_CLIENT_ID,
} from '@/lib/ads/ad-strategy';
import { useConsent } from '@/lib/consent/useConsent';
import {
  trackAdSlotEligible,
  trackAdSlotRequestInitiated,
  trackAdSlotRendered,
  trackAdSlotNoFill,
  trackAdSlotError,
  trackAdSlotExcluded,
} from '@/lib/analytics/events';

export interface AdSlotProps {
  slotId?: string;
  pageType?: AdPageType;
  placement?: AdPlacement;
  format?: AdFormat;
  className?: string;
  showSupporterFallback?: boolean;
}

export function AdSlot({
  slotId = 'default-slot',
  pageType,
  placement,
  format = 'auto',
  className,
}: AdSlotProps) {
  const { consent, isMounted } = useConsent();
  const [isUnfilled, setIsUnfilled] = useState(false);
  const pushedRef = useRef(false);
  const eligibleTrackedRef = useRef(false);
  const adRef = useRef<HTMLModElement>(null);

  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const isTestMode = process.env.NEXT_PUBLIC_ADSENSE_TEST_MODE === 'true';
  const adClient =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT ||
    DEFAULT_ADSENSE_CLIENT_ID;

  // 1. Centralized Policy Check: strictly prohibit placements forbidden by policy
  const isPlacementAllowed = !pageType || !placement || isAdPlacementAllowed(pageType, placement);

  // 2. Monetization Eligibility: Render ads for all visitors on allowed page types
  // Google Consent Mode v2 handles personalized vs contextual/cookieless ad delivery
  const isEligible = isPlacementAllowed && (isAdSenseEnabled || isTestMode);

  // 3. Track placement exclusion or eligibility when mounted
  useEffect(() => {
    if (!isMounted) return;

    if (!isPlacementAllowed) {
      trackAdSlotExcluded(slotId, pageType || 'general', 'policy_forbidden');
      return;
    }

    if (isEligible && !eligibleTrackedRef.current) {
      eligibleTrackedRef.current = true;
      trackAdSlotEligible(slotId, pageType || 'general');
    }
  }, [isMounted, isPlacementAllowed, isEligible, slotId, pageType]);

  // 4. Initialize AdSense tag & monitor fill status via DOM MutationObserver
  useEffect(() => {
    if (!isMounted || !isEligible || !isAdSenseEnabled || !adClient || !adRef.current) {
      return;
    }

    if (!pushedRef.current) {
      try {
        if (typeof window !== 'undefined') {
          if (adRef.current.innerHTML.trim() === '') {
            trackAdSlotRequestInitiated(slotId, pageType || 'general', Boolean(consent.advertising));
            const adsWindow = window as unknown as {
              adsbygoogle?: (unknown[] & { requestNonPersonalizedAds?: number });
            };
            adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
            // Official Google AdSense API to request non-personalized ads (NPA)
            adsWindow.adsbygoogle.requestNonPersonalizedAds = consent.advertising ? 0 : 1;
            adsWindow.adsbygoogle.push({});
            pushedRef.current = true;
          }
        }
      } catch {
        trackAdSlotError(slotId, pageType || 'general', 'init_exception');
      }
    }

    // Observe data-ad-status attribute changes by Google AdSense script
    const targetNode = adRef.current;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-ad-status'
        ) {
          const status = targetNode.getAttribute('data-ad-status');
          if (status === 'filled') {
            trackAdSlotRendered(slotId, pageType || 'general');
          } else if (status === 'unfilled') {
            setIsUnfilled(true);
            trackAdSlotNoFill(slotId, pageType || 'general');
          }
        }
      }
    });

    observer.observe(targetNode, {
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isMounted, isEligible, isAdSenseEnabled, adClient, consent.advertising, slotId, pageType]);

  // If placement not allowed or visitor rejected advertising (and not in test mode), render nothing
  if (!isPlacementAllowed || !isEligible) {
    return null;
  }

  // If provider confirmed unfilled, gracefully collapse container to avoid awkward empty space
  if (isUnfilled) {
    return null;
  }

  const minHeight = getReservedMinHeight(format);
  const dimensionInfo = AD_FORMAT_DIMENSIONS[format];

  return (
    <aside
      aria-label="Advertisement"
      data-slot-id={slotId}
      className={cn(
        'my-8 w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300',
        className
      )}
      style={{ minHeight: `${minHeight}px` }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4 text-center transition-colors"
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
              {dimensionInfo?.label || 'Responsive Dynamic'} • Policy Verified
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
