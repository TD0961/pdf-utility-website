'use client';

import React, { useSyncExternalStore } from 'react';
import { WifiOff, Wifi, ShieldCheck } from 'lucide-react';

let isOnlineGlobal = true;
let isReconnectedGlobal = false;
let reconnectedTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  isOnlineGlobal = window.navigator.onLine;

  window.addEventListener('online', () => {
    isOnlineGlobal = true;
    isReconnectedGlobal = true;
    notifyListeners();

    if (reconnectedTimer) clearTimeout(reconnectedTimer);
    reconnectedTimer = setTimeout(() => {
      isReconnectedGlobal = false;
      notifyListeners();
    }, 3500);
  });

  window.addEventListener('offline', () => {
    isOnlineGlobal = false;
    isReconnectedGlobal = false;
    if (reconnectedTimer) clearTimeout(reconnectedTimer);
    notifyListeners();
  });
}

function subscribeOnline(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getOnlineSnapshot() {
  return isOnlineGlobal;
}

function getReconnectedSnapshot() {
  return isReconnectedGlobal;
}

function getOnlineServerSnapshot() {
  return true;
}

function getReconnectedServerSnapshot() {
  return false;
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  const justReconnected = useSyncExternalStore(
    subscribeOnline,
    getReconnectedSnapshot,
    getReconnectedServerSnapshot
  );

  if (isOnline && !justReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {!isOnline ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md border border-amber-500/40 shadow-xl text-xs sm:text-sm font-medium">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>You are offline</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="flex items-center gap-1 text-emerald-400 font-normal hidden sm:inline-flex">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cached tools process locally</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md border border-emerald-500/40 shadow-xl text-xs sm:text-sm font-medium">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Connection restored</span>
        </div>
      )}
    </div>
  );
}
