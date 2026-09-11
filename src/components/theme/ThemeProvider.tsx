'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'ilikepdf_theme';

function subscribeToSystemTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) {
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  }
  return () => {};
}

function getSystemSnapshot(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSystemServerSnapshot(): ResolvedTheme {
  return 'light';
}

const emptySubscribe = () => () => {};

function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function updateDomTheme(resolved: ResolvedTheme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  root.style.colorScheme = resolved;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useIsMounted();

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    } catch {
      return 'system';
    }
  });

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemSnapshot,
    getSystemServerSnapshot
  );

  // Derived resolved theme
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (isMounted ? systemTheme : 'light') : theme;

  // Synchronize DOM classes when resolvedTheme changes
  useEffect(() => {
    updateDomTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors in restricted iframe/browser modes
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
