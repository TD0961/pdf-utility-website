'use client';

import { useSyncExternalStore, useCallback } from 'react';
import {
  ConsentPreferences,
  getEffectiveConsent,
  hasConsentDecision,
  setConsentPreferences,
  acceptAllConsent,
  rejectOptionalConsent,
  subscribeToConsent,
  isDntOrGpcActive,
} from './consent-manager';

const SERVER_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: false,
  advertising: false,
  timestamp: 0,
  version: 1,
};

function subscribe(callback: () => void) {
  return subscribeToConsent(callback);
}

function getConsentSnapshot(): string {
  if (typeof window === 'undefined') return JSON.stringify(SERVER_CONSENT);
  return JSON.stringify(getEffectiveConsent());
}

function getServerSnapshot(): string {
  return JSON.stringify(SERVER_CONSENT);
}

export function useConsent() {
  const consentJson = useSyncExternalStore(subscribe, getConsentSnapshot, getServerSnapshot);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const consent: ConsentPreferences = JSON.parse(consentJson);
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
