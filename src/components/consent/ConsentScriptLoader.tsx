'use client';

import { useEffect, useRef } from 'react';
import { useConsent } from '@/lib/consent/useConsent';
import { DEFAULT_ADSENSE_CLIENT_ID } from '@/lib/ads/ad-strategy';
import { trackAdBlockerDetected } from '@/lib/analytics/events';

const GA_MEASUREMENT_ID = 'G-XZ1VE80DQL';
const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ||
  DEFAULT_ADSENSE_CLIENT_ID;

export function ConsentScriptLoader() {
  const { consent, isDnt, isMounted } = useConsent();
  const gaLoadedRef = useRef(false);
  const adsenseLoadedRef = useRef(false);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    // 1. Establish Google Consent Mode v2 defaults
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function (...args: unknown[]) {
        (window.dataLayer = window.dataLayer || []).push(args);
      };
      window.gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
      });
    }

    // 2. Handle Analytics Consent
    if (consent.analytics && !isDnt) {
      // Remove disable flag if previously set
      delete (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`];

      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });

      if (!gaLoadedRef.current && !document.getElementById('google-analytics-script')) {
        const gaScript = document.createElement('script');
        gaScript.id = 'google-analytics-script';
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(gaScript);

        window.gtag('js', new Date());
        window.gtag('config', GA_MEASUREMENT_ID);
        gaLoadedRef.current = true;
      }
    } else {
      // Opt-out or DNT: Set hard disable flag on window
      (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }

    // 3. Handle Advertising Consent & Script Loading
    const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
    if (isAdSenseEnabled) {
      if (consent.advertising) {
        window.gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      } else {
        window.gtag('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }

      // Synchronize official AdSense NPA control on global adsbygoogle array
      const adsWindow = window as unknown as {
        adsbygoogle?: (unknown[] & { requestNonPersonalizedAds?: number });
      };
      adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
      adsWindow.adsbygoogle.requestNonPersonalizedAds = consent.advertising ? 0 : 1;

      if (!adsenseLoadedRef.current && !document.getElementById('adsense-script')) {
        const adScript = document.createElement('script');
        adScript.id = 'adsense-script';
        adScript.async = true;
        adScript.crossOrigin = 'anonymous';
        adScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
        adScript.onerror = () => {
          trackAdBlockerDetected('adsense');
        };
        document.head.appendChild(adScript);
        adsenseLoadedRef.current = true;
      }
    }
  }, [consent, isDnt, isMounted]);

  return null;
}
