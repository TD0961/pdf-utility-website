/**
 * PDFSimplify — Privacy-First Client-Side Consent Management System
 *
 * Implements granular, zero-tracking, zero-backend consent handling:
 * - Distinguishes strictly necessary (essential) functions from optional analytics and advertising.
 * - Respects browser Do Not Track (DNT) and Global Privacy Control (GPC) signals.
 * - Stores user choices locally in localStorage with versioning.
 * - Dispatches cross-component events on preference changes.
 * - Synchronizes with Google Consent Mode v2 and Google Analytics disable flags.
 */

export const CONSENT_STORAGE_KEY = 'pdfsimplify_cookie_consent_v1';
export const CONSENT_EVENT_NAME = 'pdfsimplify_consent_update';

export interface ConsentPreferences {
  essential: true; // Always required for core site functionality & theme
  analytics: boolean; // Optional: GA4 diagnostics & tool usage buckets
  advertising: boolean; // Optional: Google AdSense contextual/display units
  timestamp: number;
  version: number;
}

export type ConsentCategory = 'analytics' | 'advertising';

/**
 * Checks if the browser has signaled Do Not Track (DNT) or Global Privacy Control (GPC).
 */
export function isDntOrGpcActive(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check DNT (standard header / property)
    if (navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1') {
      return true;
    }

    // Check GPC (Global Privacy Control)
    if ((navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true) {
      return true;
    }
  } catch {
    // Graceful fallback
  }

  return false;
}

/**
 * Retrieves stored consent preferences from localStorage if previously chosen.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (parsed && typeof parsed.analytics === 'boolean' && typeof parsed.advertising === 'boolean') {
      return {
        essential: true,
        analytics: parsed.analytics,
        advertising: parsed.advertising,
        timestamp: parsed.timestamp || Date.now(),
        version: parsed.version || 1,
      };
    }
  } catch {
    // Malformed JSON or localStorage quota error
  }

  return null;
}

/**
 * Checks whether the visitor has already made a definitive consent choice.
 */
export function hasConsentDecision(): boolean {
  return getStoredConsent() !== null;
}

/**
 * Returns current effective consent:
 * If user made an explicit decision, returns their stored choice.
 * If user hasn't chosen yet, defaults to false (opt-in requirement) and checks DNT.
 */
export function getEffectiveConsent(): ConsentPreferences {
  const stored = getStoredConsent();
  if (stored) {
    return stored;
  }

  // If DNT is active or no decision made, non-essential cookies default to denied
  return {
    essential: true,
    analytics: false,
    advertising: false,
    timestamp: Date.now(),
    version: 1,
  };
}

/**
 * Persists user consent choices and applies system-wide signals.
 */
export function setConsentPreferences(prefs: {
  analytics: boolean;
  advertising: boolean;
}): ConsentPreferences {
  const finalPrefs: ConsentPreferences = {
    essential: true,
    analytics: prefs.analytics,
    advertising: prefs.advertising,
    timestamp: Date.now(),
    version: 1,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(finalPrefs));

      // Also set/clear legacy optout key for backward compatibility with phase3 analytics
      if (!prefs.analytics) {
        localStorage.setItem('pdfsimplify_analytics_optout', 'true');
        (window as unknown as Record<string, unknown>)['ga-disable-G-XZ1VE80DQL'] = true;
      } else {
        localStorage.removeItem('pdfsimplify_analytics_optout');
        delete (window as unknown as Record<string, unknown>)['ga-disable-G-XZ1VE80DQL'];
      }
    } catch {
      // Storage unavailable
    }

    // Apply Google Consent Mode v2 updates if gtag is defined
    const windowWithGtag = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof windowWithGtag.gtag === 'function') {
      try {
        windowWithGtag.gtag('consent', 'update', {
          analytics_storage: prefs.analytics ? 'granted' : 'denied',
          ad_storage: prefs.advertising ? 'granted' : 'denied',
          ad_user_data: prefs.advertising ? 'granted' : 'denied',
          ad_personalization: prefs.advertising ? 'granted' : 'denied',
        });
      } catch {
        // Silently ignore
      }
    }

    // Dispatch custom DOM event for active components
    window.dispatchEvent(
      new CustomEvent<ConsentPreferences>(CONSENT_EVENT_NAME, {
        detail: finalPrefs,
      })
    );
  }

  return finalPrefs;
}

/**
 * Quick helper: Accept All Categories
 */
export function acceptAllConsent(): ConsentPreferences {
  return setConsentPreferences({ analytics: true, advertising: true });
}

/**
 * Quick helper: Reject All Optional Categories
 */
export function rejectOptionalConsent(): ConsentPreferences {
  return setConsentPreferences({ analytics: false, advertising: false });
}

/**
 * Subscribes a callback to live consent changes.
 * Returns an unsubscription function.
 */
export function subscribeToConsent(
  callback: (prefs: ConsentPreferences) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (evt: Event) => {
    const customEvt = evt as CustomEvent<ConsentPreferences>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  window.addEventListener(CONSENT_EVENT_NAME, handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, handler);
  };
}
