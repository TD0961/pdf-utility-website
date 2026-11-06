'use client';

import { useSyncExternalStore, useCallback } from 'react';
import {
  ConsentPreferences,
  DEFAULT_UNSET_CONSENT,
  CONSENT_STORAGE_KEY,
  hasConsentDecision,
  setConsentPreferences,
  acceptAllConsent,
  rejectOptionalConsent,
  subscribeToConsent,
  isDntOrGpcActive,
} from './consent-manager';

const SERVER_SNAPSHOT = JSON.stringify(DEFAULT_UNSET_CONSENT);

let cachedRaw: string | null = null;
let cachedSnapshot: string = SERVER_SNAPSHOT;
let cachedConsent: ConsentPreferences = DEFAULT_UNSET_CONSENT;

function updateCache(): void {
  if (typeof window === 'undefined') {
    cachedRaw = null;
    cachedSnapshot = SERVER_SNAPSHOT;
    cachedConsent = DEFAULT_UNSET_CONSENT;
    return;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === cachedRaw) {
      return;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = SERVER_SNAPSHOT;
      cachedConsent = DEFAULT_UNSET_CONSENT;
      return;
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.analytics === 'boolean' && typeof parsed.advertising === 'boolean') {
      cachedConsent = {
        essential: true,
        analytics: parsed.analytics,
        advertising: parsed.advertising,
        timestamp: parsed.timestamp || 0,
        version: parsed.version || 1,
      };
      cachedSnapshot = JSON.stringify(cachedConsent);
    } else {
      cachedSnapshot = SERVER_SNAPSHOT;
      cachedConsent = DEFAULT_UNSET_CONSENT;
    }
  } catch {
    cachedRaw = null;
    cachedSnapshot = SERVER_SNAPSHOT;
    cachedConsent = DEFAULT_UNSET_CONSENT;
  }
}

function subscribe(callback: () => void) {
  const unsubscribeConsent = subscribeToConsent(() => {
    updateCache();
    callback();
  });

  const handleStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY) {
      updateCache();
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    unsubscribeConsent();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function getConsentSnapshot(): string {
  updateCache();
  return cachedSnapshot;
}

function getServerSnapshot(): string {
  return SERVER_SNAPSHOT;
}

export function useConsent() {
  useSyncExternalStore(subscribe, getConsentSnapshot, getServerSnapshot);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const consent = isMounted ? cachedConsent : DEFAULT_UNSET_CONSENT;
  const hasDecision = isMounted && hasConsentDecision();
  const isDnt = isMounted && isDntOrGpcActive();

  const acceptAll = useCallback(() => {
    acceptAllConsent();
  }, []);

  const rejectOptional = useCallback(() => {
    rejectOptionalConsent();
  }, []);

  const updatePreferences = useCallback((prefs: { analytics: boolean; advertising: boolean }) => {
    setConsentPreferences(prefs);
  }, []);

  return {
    consent,
    hasDecision,
    isDnt,
    isMounted,
    acceptAll,
    rejectOptional,
    updatePreferences,
  };
}
