/**
 * Privacy-Preserving Analytics Contract
 *
 * iLikePDF guarantees zero backend and zero document custody.
 * Analytics strictly tracking high-level usage metrics (e.g. tool visits, performance duration).
 *
 * INVARIANT: No document bytes, file contents, filenames, passwords,
 * extracted text, or editor coordinates may ever be passed to analytics.
 */

export type AllowedEventType =
  | 'tool_open'
  | 'tool_complete'
  | 'tool_error'
  | 'guide_view'
  | 'related_tool_click'
  | 'install_prompt_shown'
  | 'pwa_installed';

export interface BaseAnalyticsEvent {
  event: AllowedEventType;
  timestamp?: number;
}

export interface ToolOpenEvent extends BaseAnalyticsEvent {
  event: 'tool_open';
  toolId: string;
}

export interface ToolCompleteEvent extends BaseAnalyticsEvent {
  event: 'tool_complete';
  toolId: string;
  pageCount?: number;
  durationMs?: number;
}

export interface ToolErrorEvent extends BaseAnalyticsEvent {
  event: 'tool_error';
  toolId: string;
  errorCode: string;
}

export interface GuideViewEvent extends BaseAnalyticsEvent {
  event: 'guide_view';
  guideSlug: string;
}

export interface RelatedToolClickEvent extends BaseAnalyticsEvent {
  event: 'related_tool_click';
  fromToolId: string;
  toToolId: string;
}

export interface InstallPromptShownEvent extends BaseAnalyticsEvent {
  event: 'install_prompt_shown';
}

export interface PwaInstalledEvent extends BaseAnalyticsEvent {
  event: 'pwa_installed';
}

export type AnalyticsEvent =
  | ToolOpenEvent
  | ToolCompleteEvent
  | ToolErrorEvent
  | GuideViewEvent
  | RelatedToolClickEvent
  | InstallPromptShownEvent
  | PwaInstalledEvent;

/**
 * Forbidden keys that could accidentally leak sensitive document data or user information.
 */
const FORBIDDEN_KEYS = new Set([
  'file',
  'files',
  'bytes',
  'buffer',
  'arraybuffer',
  'blob',
  'url',
  'dataurl',
  'password',
  'pass',
  'text',
  'content',
  'extractedtext',
  'coordinates',
  'filename',
  'name',
  'pdf',
  'doc',
  'document',
  'metadata',
  'author',
  'title',
]);

/**
 * Validates and sanitizes an analytics payload to prevent document leaks.
 * Drops any field whose key matches forbidden document/privacy terms
 * or whose value is a Blob, File, ArrayBuffer, or excessively long string.
 */
export function sanitizeAnalyticsPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_KEYS.has(lowerKey)) {
      continue;
    }

    // Drop binary or object-based document payloads
    if (
      value instanceof Blob ||
      (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) ||
      (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array)
    ) {
      continue;
    }

    // Drop excessively large payloads (e.g. accidentally serialized text)
    if (typeof value === 'string' && value.length > 256) {
      continue;
    }

    // Only allow primitives (string, number, boolean)
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Dispatches an analytics event if analytics is configured and available in the browser.
 * Operates client-side only without making direct backend API requests.
 */
export function trackEvent(event: AnalyticsEvent): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const { event: eventName, ...params } = event;
  const sanitizedParams = sanitizeAnalyticsPayload({
    ...params,
    timestamp: event.timestamp || Date.now(),
  });

  if (process.env.NODE_ENV === 'development') {
    // Helpful debug logging in local dev
    // console.debug('[Analytics]', eventName, sanitizedParams);
  }

  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', eventName, sanitizedParams);
      return true;
    } catch {
      return false;
    }
  }

  return true;
}
