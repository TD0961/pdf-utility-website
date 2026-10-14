/**
 * PDFSimplify — Privacy-First Analytics Contract (Phase 3)
 *
 * Enforces zero-backend, zero-custody measurement invariants:
 * - Never collects or transmits PDF contents, extracted text, or coordinates.
 * - Never collects file names, file paths, or file sizes.
 * - Never collects passwords, signatures, or cryptographic keys.
 * - Never transmits raw error stack traces or personal identifiers.
 * - Never interferes with or breaks client-side PDF processing.
 *
 * All parameters are strictly typed, allowlisted, and sanitized before dispatch.
 */

export const ALLOWED_TOOL_SLUGS = [
  'merge-pdf',
  'split-pdf',
  'organize-pdf',
  'rotate-pdf',
  'extract-pages',
  'jpg-to-pdf',
  'pdf-to-jpg',
  'pdf-to-text',
  'add-page-numbers',
  'watermark-pdf',
  'compress-pdf',
  'protect-pdf',
  'unlock-pdf',
  'ocr-pdf',
  'pdf-editor',
  'pdf-to-word',
  'pdf-to-ppt',
  'pdf-to-excel',
  'sign-pdf',
  'fill-pdf',
  'crop-pdf',
  'compare-pdf',
  'pdf-to-csv',
  'pdf-to-markdown',
  'extract-images',
  'flatten-pdf',
  'remove-pdf-metadata',
  'resize-pdf',
  'grayscale-pdf',
  'header-footer',
] as const;

export type ToolSlug = (typeof ALLOWED_TOOL_SLUGS)[number];

export const ALLOWED_OUTPUT_FORMATS = [
  'pdf',
  'docx',
  'pptx',
  'xlsx',
  'csv',
  'txt',
  'md',
  'jpg',
  'png',
  'zip',
] as const;

export type OutputFormat = (typeof ALLOWED_OUTPUT_FORMATS)[number];

export const ALLOWED_ERROR_CODES = [
  'invalid_input',
  'password_required',
  'unsupported_format',
  'processing_failed',
  'memory_limit',
  'cancelled',
  'unknown',
] as const;

export type ToolErrorCode = (typeof ALLOWED_ERROR_CODES)[number];

export type FileCountBucket = 'single' | 'few_2_5' | 'batch_6_plus';

export type DurationBucket = 'under_1s' | '1s_to_5s' | '5s_to_15s' | 'over_15s';

export type AllowedEventType =
  // Primary Phase 3 Measurement Contract
  | 'tool_open'
  | 'tool_processing_start'
  | 'tool_processing_complete'
  | 'tool_processing_error'
  | 'tool_download_click'
  | 'guide_to_tool_click'
  // Phase 5 Monetization & Consent Observability Contract
  | 'ad_slot_eligible'
  | 'ad_slot_request_initiated'
  | 'ad_slot_rendered'
  | 'ad_slot_no_fill'
  | 'ad_slot_error'
  | 'ad_slot_excluded'
  | 'ad_slot_blocked_consent'
  | 'ad_blocker_detected'
  | 'consent_preference_update'
  // Backward Compatibility Events
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
  tool_slug: string;
  toolId?: string;
}

export interface ToolProcessingStartEvent extends BaseAnalyticsEvent {
  event: 'tool_processing_start';
  tool_slug: string;
  file_count_bucket?: FileCountBucket;
}

export interface ToolProcessingCompleteEvent extends BaseAnalyticsEvent {
  event: 'tool_processing_complete';
  tool_slug: string;
  duration_bucket?: DurationBucket;
  output_format?: OutputFormat;
}

export interface ToolProcessingErrorEvent extends BaseAnalyticsEvent {
  event: 'tool_processing_error';
  tool_slug: string;
  error_code: ToolErrorCode;
}

export interface ToolDownloadClickEvent extends BaseAnalyticsEvent {
  event: 'tool_download_click';
  tool_slug: string;
  output_format?: OutputFormat;
}

export interface GuideToToolClickEvent extends BaseAnalyticsEvent {
  event: 'guide_to_tool_click';
  guide_slug: string;
  target_tool_slug: string;
}

// Phase 5 Monetization & Consent Observability Interfaces
export interface AdSlotEligibleEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_eligible';
  slot_id: string;
  page_type: string;
}

export interface AdSlotRequestInitiatedEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_request_initiated';
  slot_id: string;
  page_type: string;
  personalized: boolean;
}

export interface AdSlotRenderedEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_rendered';
  slot_id: string;
  page_type: string;
}

export interface AdSlotNoFillEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_no_fill';
  slot_id: string;
  page_type: string;
}

export interface AdSlotErrorEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_error';
  slot_id: string;
  page_type: string;
  error_type: string;
}

export interface AdSlotExcludedEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_excluded';
  slot_id: string;
  page_type: string;
  reason: string;
}

export interface AdSlotBlockedConsentEvent extends BaseAnalyticsEvent {
  event: 'ad_slot_blocked_consent';
  slot_id: string;
  page_type: string;
  reason: string;
}

export interface AdBlockerDetectedEvent extends BaseAnalyticsEvent {
  event: 'ad_blocker_detected';
  provider: string;
}

export interface ConsentPreferenceUpdateEvent extends BaseAnalyticsEvent {
  event: 'consent_preference_update';
  analytics_allowed: boolean;
  ads_allowed: boolean;
}

// Backward Compatibility Interfaces
export interface LegacyToolCompleteEvent extends BaseAnalyticsEvent {
  event: 'tool_complete';
  toolId: string;
  pageCount?: number;
  durationMs?: number;
}

export interface LegacyToolErrorEvent extends BaseAnalyticsEvent {
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
  | ToolProcessingStartEvent
  | ToolProcessingCompleteEvent
  | ToolProcessingErrorEvent
  | ToolDownloadClickEvent
  | GuideToToolClickEvent
  | AdSlotEligibleEvent
  | AdSlotRequestInitiatedEvent
  | AdSlotRenderedEvent
  | AdSlotNoFillEvent
  | AdSlotErrorEvent
  | AdSlotExcludedEvent
  | AdSlotBlockedConsentEvent
  | AdBlockerDetectedEvent
  | ConsentPreferenceUpdateEvent
  | LegacyToolCompleteEvent
  | LegacyToolErrorEvent
  | GuideViewEvent
  | RelatedToolClickEvent
  | InstallPromptShownEvent
  | PwaInstalledEvent;

/**
 * Normalizes file counts into coarse, privacy-safe buckets without recording exact quantities.
 */
export function bucketFileCount(count = 1): FileCountBucket {
  if (count <= 1) return 'single';
  if (count <= 5) return 'few_2_5';
  return 'batch_6_plus';
}

/**
 * Normalizes execution times into coarse, privacy-safe timing buckets.
 */
export function bucketDuration(durationMs = 0): DurationBucket {
  if (durationMs < 1000) return 'under_1s';
  if (durationMs <= 5000) return '1s_to_5s';
  if (durationMs <= 15000) return '5s_to_15s';
  return 'over_15s';
}

/**
 * Sanitizes errors into a safe allowlisted category without transmitting raw error text.
 */
export function categorizeErrorCode(err: unknown): ToolErrorCode {
  if (!err) return 'unknown';

  if (typeof err === 'object' && err !== null && 'isCancelled' in err) {
    if ((err as { isCancelled: boolean }).isCancelled) {
      return 'cancelled';
    }
  }

  const str = String(err instanceof Error ? err.message : err).toLowerCase();

  if (str.includes('cancel') || str.includes('abort')) {
    return 'cancelled';
  }
  if (str.includes('password') || str.includes('decrypt') || str.includes('encrypt') || str.includes('passcode')) {
    return 'password_required';
  }
  if (
    str.includes('format') ||
    str.includes('extension') ||
    str.includes('unsupported') ||
    str.includes('not a pdf') ||
    str.includes('invalid type')
  ) {
    return 'unsupported_format';
  }
  if (str.includes('memory') || str.includes('allocation') || str.includes('heap') || str.includes('oom')) {
    return 'memory_limit';
  }
  if (
    str.includes('at least') ||
    str.includes('select') ||
    str.includes('range') ||
    str.includes('empty') ||
    str.includes('invalid input')
  ) {
    return 'invalid_input';
  }

  return 'processing_failed';
}

/**
 * Forbidden keys that could accidentally leak sensitive document data or user information.
 * Explicitly forbids filenames, file sizes, document contents, and passwords.
 */
const FORBIDDEN_KEYS = new Set([
  'file',
  'files',
  'filename',
  'file_name',
  'filepath',
  'file_path',
  'size',
  'filesize',
  'file_size',
  'bytes',
  'buffer',
  'arraybuffer',
  'blob',
  'url',
  'dataurl',
  'password',
  'pass',
  'secret',
  'text',
  'content',
  'extractedtext',
  'coordinates',
  'name',
  'pdf',
  'doc',
  'document',
  'metadata',
  'author',
  'title',
  'message',
  'errormessage',
  'error_message',
  'stack',
  'trace',
  'rawerror',
  'exception',
  'email',
  'phone',
  'user',
  'username',
]);

const VALID_EVENT_NAMES = new Set<string>([
  'tool_open',
  'tool_processing_start',
  'tool_processing_complete',
  'tool_processing_error',
  'tool_download_click',
  'guide_to_tool_click',
  // Phase 5 Monetization & Consent Observability
  'ad_slot_eligible',
  'ad_slot_request_initiated',
  'ad_slot_rendered',
  'ad_slot_no_fill',
  'ad_slot_error',
  'ad_slot_excluded',
  'ad_slot_blocked_consent',
  'ad_blocker_detected',
  'consent_preference_update',
  // Legacy / Existing Events
  'tool_complete',
  'tool_error',
  'guide_view',
  'related_tool_click',
  'install_prompt_shown',
  'pwa_installed',
]);

const VALID_TOOL_SLUG_SET = new Set<string>(ALLOWED_TOOL_SLUGS);
const VALID_FORMAT_SET = new Set<string>(ALLOWED_OUTPUT_FORMATS);
const VALID_ERROR_CODE_SET = new Set<string>(ALLOWED_ERROR_CODES);

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
    if (typeof value === 'string' && value.length > 64) {
      continue;
    }

    // Validate tool_slug against allowlist
    if ((key === 'tool_slug' || key === 'target_tool_slug') && typeof value === 'string') {
      if (!VALID_TOOL_SLUG_SET.has(value)) {
        continue;
      }
    }

    // Validate output_format against allowlist
    if (key === 'output_format' && typeof value === 'string') {
      if (!VALID_FORMAT_SET.has(value)) {
        continue;
      }
    }

    // Validate error_code against allowlist
    if (key === 'error_code' && typeof value === 'string') {
      if (!VALID_ERROR_CODE_SET.has(value)) {
        continue;
      }
    }

    // Only allow safe primitives (string, number, boolean)
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
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

/**
 * Checks whether user has explicitly opted out of analytics or enabled Do-Not-Track.
 */
export function isAnalyticsAllowed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Check local storage opt-out flag
    if (localStorage.getItem('pdfsimplify_analytics_optout') === 'true') {
      return false;
    }

    // Check GA disable flag
    if (window['ga-disable-G-XZ1VE80DQL'] === true) {
      return false;
    }

    // Check Do Not Track and Global Privacy Control browser preferences
    if (typeof navigator !== 'undefined') {
      if (
        navigator.doNotTrack === '1' ||
        (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true
      ) {
        return false;
      }
    }
    if (typeof window !== 'undefined' && (window as unknown as { doNotTrack?: string }).doNotTrack === '1') {
      return false;
    }

    // Check stored cookie consent state
    const rawConsent = localStorage.getItem('pdfsimplify_cookie_consent_v1');
    if (rawConsent) {
      try {
        const parsed = JSON.parse(rawConsent);
        if (parsed && parsed.analytics === false) {
          return false;
        }
      } catch {
        // Fall through
      }
    }
  } catch {
    // Silently allow default in strict privacy sandboxes without crashing
    return true;
  }

  return true;
}

/**
 * Dispatches an analytics event if analytics is configured and available in the browser.
 * Operates client-side only without making direct backend API requests.
 */
export function trackEvent(event: AnalyticsEvent): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!isAnalyticsAllowed()) {
    return false;
  }

  const { event: eventName, ...params } = event;

  if (!VALID_EVENT_NAMES.has(eventName)) {
    return false;
  }

  const sanitizedParams = sanitizeAnalyticsPayload({
    ...params,
    timestamp: event.timestamp || Date.now(),
  });

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

// -------------------------------------------------------------
// High-Level Ergonomic Tracking Helpers for Tool Lifecycles
// -------------------------------------------------------------

/**
 * Triggered once when a user opens a tool page.
 */
export function trackToolOpen(toolSlug: string): boolean {
  if (!VALID_TOOL_SLUG_SET.has(toolSlug)) return false;
  return trackEvent({
    event: 'tool_open',
    tool_slug: toolSlug,
  });
}

/**
 * Triggered once immediately before genuine processing begins, after validation.
 */
export function trackToolProcessingStart(toolSlug: string, fileCount = 1): boolean {
  if (!VALID_TOOL_SLUG_SET.has(toolSlug)) return false;
  return trackEvent({
    event: 'tool_processing_start',
    tool_slug: toolSlug,
    file_count_bucket: bucketFileCount(fileCount),
  });
}

/**
 * Triggered once when processing completes successfully and valid output is available.
 */
export function trackToolProcessingComplete(
  toolSlug: string,
  durationMs: number,
  outputFormat: OutputFormat = 'pdf'
): boolean {
  if (!VALID_TOOL_SLUG_SET.has(toolSlug)) return false;
  return trackEvent({
    event: 'tool_processing_complete',
    tool_slug: toolSlug,
    duration_bucket: bucketDuration(durationMs),
    output_format: outputFormat,
  });
}

/**
 * Triggered once on a genuine processing error with sanitized category.
 */
export function trackToolProcessingError(toolSlug: string, err: unknown): boolean {
  if (!VALID_TOOL_SLUG_SET.has(toolSlug)) return false;
  const errorCode = categorizeErrorCode(err);
  return trackEvent({
    event: 'tool_processing_error',
    tool_slug: toolSlug,
    error_code: errorCode,
  });
}

/**
 * Triggered when user explicitly initiates downloading the generated output.
 */
export function trackToolDownloadClick(
  toolSlug: string,
  outputFormat: OutputFormat = 'pdf'
): boolean {
  if (!VALID_TOOL_SLUG_SET.has(toolSlug)) return false;
  return trackEvent({
    event: 'tool_download_click',
    tool_slug: toolSlug,
    output_format: outputFormat,
  });
}

/**
 * Triggered when a reader clicks an internal tool link inside an educational guide.
 */
export function trackGuideToToolClick(
  guideSlug: string,
  targetToolSlug: string
): boolean {
  if (!VALID_TOOL_SLUG_SET.has(targetToolSlug)) return false;
  return trackEvent({
    event: 'guide_to_tool_click',
    guide_slug: guideSlug,
    target_tool_slug: targetToolSlug,
  });
}

// -------------------------------------------------------------
// Phase 5 Monetization & Consent Observability Helpers
// -------------------------------------------------------------

/**
 * Deduplication registry to prevent duplicate ad events from React remounts
 * or repeated DOM mutation observer callbacks.
 */
const adEventDeduplicationCache = new Set<string>();

/**
 * Clears the ad event deduplication cache (useful for testing and page navigations).
 */
export function resetAdEventDeduplication(): void {
  adEventDeduplicationCache.clear();
}

/**
 * Triggered when an ad slot is evaluated and verified eligible to render on a page.
 */
export function trackAdSlotEligible(slotId: string, pageType = 'general'): boolean {
  const dedupKey = `ad_slot_eligible:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_eligible',
    slot_id: slotId,
    page_type: pageType,
  });
}

/**
 * Triggered when a tag request is genuinely initiated to the ad provider.
 */
export function trackAdSlotRequestInitiated(
  slotId: string,
  pageType = 'general',
  personalized = false
): boolean {
  const dedupKey = `ad_slot_request_initiated:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_request_initiated',
    slot_id: slotId,
    page_type: pageType,
    personalized,
  });
}

/**
 * Triggered when an ad slot is genuinely confirmed rendered by the provider DOM status.
 */
export function trackAdSlotRendered(slotId: string, pageType = 'general'): boolean {
  const dedupKey = `ad_slot_rendered:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_rendered',
    slot_id: slotId,
    page_type: pageType,
  });
}

/**
 * Triggered when the ad provider returns no-fill for the requested slot.
 */
export function trackAdSlotNoFill(slotId: string, pageType = 'general'): boolean {
  const dedupKey = `ad_slot_no_fill:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_no_fill',
    slot_id: slotId,
    page_type: pageType,
  });
}

/**
 * Triggered when an ad slot fails to load or script encounters an observable error.
 */
export function trackAdSlotError(
  slotId: string,
  pageType = 'general',
  errorType = 'load_error'
): boolean {
  return trackEvent({
    event: 'ad_slot_error',
    slot_id: slotId,
    page_type: pageType,
    error_type: errorType,
  });
}

/**
 * Triggered when an ad placement is excluded by page policy rules (e.g. editor or legal).
 */
export function trackAdSlotExcluded(
  slotId: string,
  pageType = 'general',
  reason = 'policy_forbidden'
): boolean {
  const dedupKey = `ad_slot_excluded:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_excluded',
    slot_id: slotId,
    page_type: pageType,
    reason,
  });
}

/**
 * Triggered when an ad request is blocked due to consent or provider policy constraints.
 */
export function trackAdSlotBlockedConsent(
  slotId: string,
  pageType = 'general',
  reason = 'consent_denied'
): boolean {
  const dedupKey = `ad_slot_blocked_consent:${slotId}:${pageType}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_slot_blocked_consent',
    slot_id: slotId,
    page_type: pageType,
    reason,
  });
}

/**
 * Triggered when client-side ad blocking is reliably detected (e.g. script onerror).
 */
export function trackAdBlockerDetected(provider = 'adsense'): boolean {
  const dedupKey = `ad_blocker_detected:${provider}`;
  if (adEventDeduplicationCache.has(dedupKey)) return true;
  adEventDeduplicationCache.add(dedupKey);

  return trackEvent({
    event: 'ad_blocker_detected',
    provider,
  });
}

/**
 * Triggered when a visitor updates their cookie or tracking preferences.
 */
export function trackConsentPreferenceUpdate(analyticsAllowed: boolean, adsAllowed: boolean): boolean {
  return trackEvent({
    event: 'consent_preference_update',
    analytics_allowed: analyticsAllowed,
    ads_allowed: adsAllowed,
  });
}
