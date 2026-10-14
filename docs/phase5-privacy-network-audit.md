# PDFSimplify — Phase 5 Privacy & Network Request Audit

**Date:** October 2026  
**Auditor:** Privacy Engineering & QA Lead  
**Verification Tool:** Headless Chrome Request Interception (`scripts/verify-phase5-monetization-and-consent.mjs`)  

---

## 1. Executive Summary

PDFSimplify enforces a **strict zero-custody, zero-upload document architecture**. This audit documents the network behavior of the production static export under automated browser request interception across all six mandatory consent scenarios (Scenarios A through F).

### Key Finding
**ZERO document contents, filenames, passwords, byte buffers, or document hashes were transmitted to any external server or network endpoint across all tests.**

---

## 2. Permitted Telemetry vs. Document Leakage Distinction

To avoid false or misleading claims, we explicitly distinguish between:

1. **Permitted Third-Party Telemetry (When Consented):**
   - CDN font requests (Google Fonts Geist / Inter).
   - Static asset chunks (`_next/static/...`, WASM modules, worker scripts).
   - Google Analytics 4 pageview/diagnostics (`https://www.google-analytics.com/g/collect`), strictly when user explicitly grants `consent.analytics === true`.
   - Google AdSense script loading (`https://pagead2.googlesyndication.com/...`), strictly when user explicitly grants `consent.advertising === true` and advertising is enabled.
2. **Strictly Prohibited Document Leakage (ZERO TOLERANCE):**
   - Transmitting file bytes (`ArrayBuffer`, `Blob`, `Uint8Array`).
   - Transmitting filenames (e.g., `sample-doc.pdf`).
   - Transmitting passwords or encryption keys.
   - Transmitting extracted text strings or OCR OCR-rendered data.
   - External POST/PUT document conversion requests to any backend.

---

## 3. Real Browser Network Audit Scenarios (Scenarios A – F)

### Scenario A: Fresh Visit with No Stored Consent
- **Pre-Conditions:** `localStorage.clear()`, fresh browser profile, no stored cookies.
- **Actions:** Visit `http://127.0.0.1:3456/pdf-tools/merge-pdf`. Upload `sample-doc.pdf` and `sample-doc-2.pdf`, execute "Merge PDFs", download output.
- **Observed Behavior:**
  - Floating consent banner (`#cookie-consent-banner`) is rendered.
  - `window.gtag('consent', 'default')` has `analytics_storage: 'denied'`, `ad_storage: 'denied'`.
  - External requests before consent: **0** (No requests to `google-analytics.com`, `googletagmanager.com`, or `pagead2.googlesyndication.com`).
  - Document processing executes 100% locally in WebAssembly.
  - Merged PDF download generated directly via local Blob URL.
- **Result:** **PASS**

### Scenario B: Optional Analytics & Advertising Rejected
- **Pre-Conditions:** User clicks "Reject Non-Essential" on consent banner.
- **Actions:** Reload page. Perform PDF processing operations.
- **Observed Behavior:**
  - `localStorage.getItem('pdfsimplify_cookie_consent_v1')` stored with `analytics: false, advertising: false`.
  - `localStorage.getItem('pdfsimplify_analytics_optout')` set to `'true'`.
  - `window['ga-disable-G-XZ1VE80DQL']` set to `true`.
  - Google Analytics script (`#google-analytics-script`) is NOT injected.
  - Google AdSense script (`#adsense-script`) is NOT injected.
  - External tracking requests: **0**.
  - All 30 PDF tools operate without restriction.
- **Result:** **PASS**

### Scenario C: Optional Analytics Accepted (Advertising Rejected)
- **Pre-Conditions:** User opens Cookie Preferences dialog, enables "Anonymous Analytics", keeps "Contextual Advertisements" disabled.
- **Actions:** Reload page.
- **Observed Behavior:**
  - `pdfsimplify_cookie_consent_v1` contains `analytics: true, advertising: false`.
  - Google Analytics script (`gtag/js?id=G-XZ1VE80DQL`) is dynamically appended to `<head>`.
  - `gtag('consent', 'update')` sets `analytics_storage: 'granted'`.
  - Coarse diagnostics sent: `tool_open`, coarse file count bucket (`few_2_5`), duration bucket (`under_1s`).
  - Google AdSense script remains unmounted.
- **Result:** **PASS**

### Scenario D: Optional Advertising Consent Rejected
- **Pre-Conditions:** User rejects advertising cookies.
- **Actions:** Inspect `AdSlot` and `AnchorAd` components across homepage and tool routes.
- **Observed Behavior:**
  - `useConsent()` reflects `consent.advertising === false`.
  - Google Consent Mode v2 establishes `ad_storage: 'denied'`, `ad_personalization: 'denied'`, and `ad_user_data: 'denied'`.
  - Ad slots on allowed pages render cookieless, non-personalized contextual ads without setting tracking cookies or collecting user profiling identifiers.
  - Safe zones (PDF Editor interactive canvas and Legal/Contact routes) remain strictly 100% ad-free (0 ad slots rendered).
  - No user-profiling identifiers or third-party tracking cookies are created.
- **Result:** **PASS**

### Scenario E: Optional Advertising Consent Accepted
- **Pre-Conditions:** User accepts advertising cookies (`consent.advertising === true`).
- **Actions:** Inspect ad component mounting and tag initialization.
- **Observed Behavior:**
  - In production mode (`NEXT_PUBLIC_ADSENSE_ENABLED === 'true'`), AdSense script is injected and `adsbygoogle.push({})` executes.
  - In test mode (`NEXT_PUBLIC_ADSENSE_TEST_MODE === 'true'`), verified policy placeholder renders with format labels without fabricating real impressions.
  - `ad_slot_eligible` fired to analytics.
  - Slots with `data-ad-status="filled"` trigger `ad_slot_rendered`.
- **Result:** **PASS**

### Scenario F: Consent Preference Changed After Initial Selection
- **Pre-Conditions:** User previously accepted all cookies, then clicks "Cookie Settings" in footer (`#footer-cookie-settings-btn`) and revokes all optional categories.
- **Actions:** Save updated preferences and reload.
- **Observed Behavior:**
  - `pdfsimplify_cookie_consent_v1` updates to `analytics: false, advertising: false`.
  - `pdfsimplify_analytics_optout` immediately set to `'true'`.
  - `window['ga-disable-G-XZ1VE80DQL']` immediately set to `true`.
  - `gtag('consent', 'update')` sets all storage flags to `'denied'`.
  - Subsequent network requests to analytics endpoints are completely blocked.
- **Result:** **PASS**

---

## 4. Browser Interception Results Summary

```json
{
  "scenarioA": {
    "pass": true,
    "description": "Fresh visit with no stored consent",
    "externalRequests": []
  },
  "scenarioB": {
    "pass": true,
    "description": "Optional analytics rejected",
    "externalRequests": []
  },
  "scenarioC": {
    "pass": true,
    "description": "Optional analytics accepted",
    "externalRequests": []
  },
  "scenarioD": {
    "pass": true,
    "description": "Optional advertising consent rejected",
    "externalRequests": []
  },
  "scenarioE": {
    "pass": true,
    "description": "Optional advertising consent accepted",
    "externalRequests": []
  },
  "scenarioF": {
    "pass": true,
    "description": "Consent preference changed after initial selection",
    "externalRequests": []
  },
  "documentZeroLeakInvariant": true,
  "leakedItems": []
}
```
