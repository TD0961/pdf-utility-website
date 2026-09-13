'use client';

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'pdfsimplify_theme';
const LEGACY_STORAGE_KEY = 'ilikepdf_theme';

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

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

let memoryTheme: Theme = 'system';

function subscribeToTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('pdfsimplify-theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('pdfsimplify-theme-change', callback);
  };
}

function getStoredThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      memoryTheme = stored;
      return stored;
    }
  } catch {
    // Ignore storage errors in restricted iframe/browser modes
  }
  return memoryTheme;
}

function getStoredThemeServerSnapshot(): Theme {
  return 'system';
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

  const theme = useSyncExternalStore(
    subscribeToTheme,
    getStoredThemeSnapshot,
    getStoredThemeServerSnapshot
  );

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
    memoryTheme = newTheme;
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors in restricted iframe/browser modes
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pdfsimplify-theme-change'));
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
