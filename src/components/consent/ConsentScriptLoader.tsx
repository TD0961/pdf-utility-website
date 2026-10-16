'use client';

import { useEffect, useRef } from 'react';
import { useConsent } from '@/lib/consent/useConsent';

const GA_MEASUREMENT_ID = 'G-XZ1VE80DQL';

export function ConsentScriptLoader() {
  const { consent, isDnt, isMounted } = useConsent();
  const gaLoadedRef = useRef(false);

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
  }, [consent.analytics, isDnt, isMounted]);

  return null;
}
