'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  shouldShowNotificationPrompt,
  requestNotificationPermission,
  dismissNotificationPrompt,
} from '@/lib/notifications/notification-manager';

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Only check in browser
    if (typeof window === 'undefined') return;

    // Delay checking by 3.5s so initial render and critical interactions load smoothly
    const timer = setTimeout(() => {
      if (shouldShowNotificationPrompt()) {
        setIsVisible(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleEnable = async () => {
    setIsClosing(true);
    try {
      await requestNotificationPermission();
    } finally {
      setTimeout(() => setIsVisible(false), 300);
    }
  };

  const handleDismiss = () => {
    setIsClosing(true);
    dismissNotificationPrompt();
    setTimeout(() => setIsVisible(false), 300);
  };

  return (
    <div
      role="region"
      aria-label="Notification Opt-in"
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 transition-all duration-300 transform ${
        isClosing ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Stay updated on your PDF tasks
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label="Dismiss notification banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Get an alert when conversions finish so you can switch tabs freely. Local in-browser notifications without server tracking.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              id="banner-enable-notifications-btn"
              onClick={handleEnable}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Notifications</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
