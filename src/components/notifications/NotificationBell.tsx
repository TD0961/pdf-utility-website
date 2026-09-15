'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Bell, BellRing, BellOff, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
  NotificationPermissionState,
} from '@/lib/notifications/notification-manager';

interface NotificationBellProps {
  className?: string;
}

function subscribePermission(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('focus', callback);
  return () => window.removeEventListener('focus', callback);
}

function getPermissionSnapshot(): NotificationPermissionState {
  return getNotificationPermission();
}

function getPermissionServerSnapshot(): NotificationPermissionState {
  return 'unsupported';
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const syncPermission = useSyncExternalStore(
    subscribePermission,
    getPermissionSnapshot,
    getPermissionServerSnapshot
  );
  const [localPermission, setLocalPermission] = useState<NotificationPermissionState | null>(null);
  const permission = localPermission ?? syncPermission;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (syncPermission === 'unsupported' && !isNotificationSupported()) return null;

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const nextPerm = await requestNotificationPermission();
      setLocalPermission(nextPerm);
      if (nextPerm === 'granted') {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    setIsLoading(true);
    try {
      await sendNotification({
        title: 'PDFSimplify Active! ⚡',
        body: 'Notifications are working perfectly. We will alert you when document operations finish.',
        tag: 'test-notification',
        data: { url: '/pdf-tools', action: 'test' },
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const isGranted = permission === 'granted';
  const isDenied = permission === 'denied';

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[40px] min-w-[40px] flex items-center justify-center ${className}`}
        aria-label="Notification Preferences"
        title="Notification Settings"
      >
        {isGranted ? (
          <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        ) : isDenied ? (
          <BellOff className="w-5 h-5 text-slate-400" />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {/* State Indicator Badge */}
        {isGranted ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        ) : !isDenied ? (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse ring-2 ring-white dark:ring-slate-900" />
        ) : null}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isGranted ? 'Notifications Active' : 'Task Notifications'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isGranted ? 'You will be alerted when tasks finish' : 'Stay notified when PDFs finish'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>Background Alerts:</strong> Switch tabs or minimize windows safely — we alert you when conversions finish.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Tracking:</strong> 100% in-browser notifications. No marketing spam, no server tracking.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {isGranted ? (
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {testSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Notification Sent!</span>
                  </>
                ) : (
                  <span>Send Test Notification</span>
                )}
              </button>
            ) : isDenied ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                Notifications are blocked in your browser. Click the lock/settings icon next to the URL to allow notifications.
              </div>
            ) : (
              <button
                type="button"
                id="enable-notifications-bell-btn"
                onClick={handleRequestPermission}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
