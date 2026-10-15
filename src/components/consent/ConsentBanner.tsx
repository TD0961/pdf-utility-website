'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConsent } from '@/lib/consent/useConsent';
import { ConsentModal } from './ConsentModal';

export function ConsentBanner() {
  const { hasDecision, isMounted, acceptAll, rejectOptional } = useConsent();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen for global open event (e.g. from footer link)
  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener('open_cookie_preferences', handleOpen);
    return () => {
      window.removeEventListener('open_cookie_preferences', handleOpen);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {!hasDecision && (
        <aside
          id="cookie-consent-banner"
          role="dialog"
          aria-label="Privacy and Cookie Preferences"
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 max-w-sm sm:max-w-md pointer-events-none animate-in slide-in-from-bottom duration-300"
        >
          <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                Privacy-First Platform Notice
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              PDFSimplify processes documents 100% locally in your browser memory. We request permission for optional anonymous analytics and ads. See{' '}
              <Link href="/privacy-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                Privacy
              </Link>{' '}
              &amp;{' '}
              <Link href="/cookie-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                Cookies
              </Link>.
            </p>

            <div className="flex items-center gap-2 pt-1 justify-end">
              <Button
                id="consent-customize-btn"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Settings2 className="w-3 h-3" />}
                className="text-[11px] h-7 px-2"
              >
                Customize
              </Button>
              <Button
                id="consent-reject-btn"
                variant="outline"
                size="sm"
                onClick={rejectOptional}
                className="text-[11px] h-7 px-2.5"
              >
                Reject
              </Button>
              <Button
                id="consent-accept-all-btn"
                variant="primary"
                size="sm"
                onClick={acceptAll}
                className="text-[11px] h-7 px-3 font-semibold"
              >
                Accept All
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Dialog */}
      <ConsentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
