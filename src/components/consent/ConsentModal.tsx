'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, BarChart3, Megaphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useConsent } from '@/lib/consent/useConsent';

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConsentModal({ isOpen, onClose }: ConsentModalProps) {
  if (!isOpen) return null;
  return <ConsentDialogContent onClose={onClose} />;
}

function ConsentDialogContent({ onClose }: { onClose: () => void }) {
  const { consent, isDnt, updatePreferences } = useConsent();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(consent.analytics);
  const [advertisingEnabled, setAdvertisingEnabled] = useState(consent.advertising);

  const handleSave = () => {
    updatePreferences({
      analytics: analyticsEnabled,
      advertising: advertisingEnabled,
    });
    onClose();
  };

  const handleAcceptAll = () => {
    updatePreferences({
      analytics: true,
      advertising: true,
    });
    onClose();
  };

  const handleRejectAll = () => {
    updatePreferences({
      analytics: false,
      advertising: false,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="consent-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Privacy &amp; Cookie Preferences
              </h2>
              <p className="text-xs text-slate-500">Customize how data is processed on this device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close preferences dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDnt && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
            <strong>Do Not Track active:</strong> Your browser has signaled an opt-out preference. Non-essential categories default to disabled.
          </div>
        )}

        {/* Categories */}
        <div className="space-y-4">
          {/* 1. Essential */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Strictly Necessary
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Core client-side PDF processing, UI state, light/dark theme preference, and security integrity. Never tracks personal identity.
              </p>
            </div>
            <input
              type="checkbox"
              checked
              disabled
              aria-label="Strictly Necessary cookies are required and cannot be disabled"
              className="mt-1 w-4 h-4 accent-indigo-600 rounded cursor-not-allowed opacity-60"
            />
          </div>

          {/* 2. Analytics */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Anonymous Performance Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Aggregated page views and processing success rates via GA4. We strictly omit file names, file sizes, document contents, and passwords.
              </p>
            </div>
            <input
              id="analytics-toggle"
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* 3. Advertising */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  Contextual Advertising
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Allows Google AdSense units to serve advertisements that keep PDFSimplify free. Ads never overlap document controls or download actions.
              </p>
            </div>
            <input
              id="advertising-toggle"
              type="checkbox"
              checked={advertisingEnabled}
              onChange={(e) => setAdvertisingEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="flex-1 sm:flex-none text-xs"
            >
              Reject Optional
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAcceptAll}
              className="flex-1 sm:flex-none text-xs"
            >
              Accept All
            </Button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            rightIcon={<Check className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto text-xs"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
