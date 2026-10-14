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
          className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-6 flex justify-center pointer-events-none animate-in slide-in-from-bottom duration-300"
        >
          <div className="w-full max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Privacy-First Platform Notice
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                PDFSimplify processes documents 100% locally in your browser with zero file uploads.
                We use strictly necessary cookies to operate the site, and request your permission for optional
                anonymous analytics and advertising. See our{' '}
                <Link href="/privacy-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/cookie-policy" className="underline hover:text-slate-900 dark:hover:text-white">
                  Cookie Policy
                </Link>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <Button
                id="consent-customize-btn"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Customize
              </Button>
              <Button
                id="consent-reject-btn"
                variant="outline"
                size="sm"
                onClick={rejectOptional}
                className="text-xs"
              >
                Reject Non-Essential
              </Button>
              <Button
                id="consent-accept-all-btn"
                variant="primary"
                size="sm"
                onClick={acceptAll}
                className="text-xs font-semibold"
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
