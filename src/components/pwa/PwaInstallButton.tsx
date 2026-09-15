'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';
import { showAppInstalledNotification } from '@/lib/notifications/notification-manager';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot() {
  return false;
}

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'button' | 'pill';
}

export function PwaInstallButton({ className = '', variant = 'nav' }: PwaInstallButtonProps) {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      console.log('[PWA] PDFSimplify was successfully installed!');
      // Trigger post-install welcome notification to re-engage user
      showAppInstalledNotification().catch((err) => {
        console.warn('[PWA] Post-install notification error:', err);
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (err) {
      console.warn('[PWA] Install prompt failed:', err);
    }
  };

  if (isStandalone || !installPrompt) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shadow-sm ${className}`}
        aria-label="Install PDFSimplify application"
      >
        <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      aria-label="Install PDFSimplify application"
    >
      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      <span>Install App</span>
    </button>
  );
}
