'use client';

import React, { useEffect, useState } from 'react';
import { toast, ToastMessage } from '@/lib/notifications/toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updated) => {
      setToasts(updated);
    });
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
    >
      {toasts.map((item) => {
        const isError = item.type === 'error';
        const isWarning = item.type === 'warning';
        const isSuccess = item.type === 'success';

        let badgeBg = 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200';
        let cardBg =
          'bg-white/95 dark:bg-stone-900/95 border-stone-200/90 dark:border-stone-800 text-stone-900 dark:text-stone-100';
        let IconComponent = Info;

        if (isSuccess) {
          badgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
          cardBg =
            'bg-white/95 dark:bg-stone-900/95 border-emerald-300/80 dark:border-emerald-800/80 text-stone-900 dark:text-stone-100';
          IconComponent = CheckCircle2;
        } else if (isError) {
          badgeBg = 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
          cardBg =
            'bg-white/95 dark:bg-stone-900/95 border-rose-300/80 dark:border-rose-800/80 text-stone-900 dark:text-stone-100';
          IconComponent = AlertCircle;
        } else if (isWarning) {
          badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
          cardBg =
            'bg-white/95 dark:bg-stone-900/95 border-amber-300/80 dark:border-amber-800/80 text-stone-900 dark:text-stone-100';
          IconComponent = AlertTriangle;
        }

        return (
          <div
            key={item.id}
            role={isError || isWarning ? 'alert' : 'status'}
            aria-live={isError || isWarning ? 'assertive' : 'polite'}
            className={`pointer-events-auto paper-sheet rounded-2xl p-4 shadow-xl border backdrop-blur-md flex items-start gap-3.5 transition-all duration-300 transform translate-y-0 opacity-100 ${cardBg}`}
          >
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${badgeBg}`}>
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {item.title && (
                <h4 className="text-xs font-bold font-sans text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
                  {item.title}
                </h4>
              )}
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed break-words">
                {item.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
