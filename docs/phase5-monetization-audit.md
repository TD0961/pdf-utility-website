# PDFSimplify — Phase 5 Monetization Architecture Audit

**Status:** Complete & Verified  
**Date:** October 2026  
**Auditor:** Monetization Engineering & Privacy QA Team  

---

## 1. Executive Summary

This audit establishes the actual, code-level monetization architecture across the PDFSimplify repository. It separates verified code implementations from external dashboard operations, identifies previous architectural defects (e.g., hardcoded unconsented script injection in layouts), and documents the consolidated, privacy-first monetization foundation.

---

## 2. Integrated Advertising Networks & Accounts

| Parameter | Observed Code / Configuration State | Verification Source |
| :--- | :--- | :--- |
| **Primary Ad Network** | Google AdSense | `src/components/consent/ConsentScriptLoader.tsx`, `public/ads.txt` |
| **Publisher Client ID** | `ca-pub-7704232652384788` | `ConsentScriptLoader.tsx`, `.env.example`, `public/ads.txt:1187` |
| **Header Bidding Manager** | Newor Media (`managerdomain=newormedia.com`) | `public/ads.txt:6`, line 1190 (`6bf2d68f-9055-45b5-85b5-8d6fa3b08fd6`) |
| **Publisher Domain** | `pdfsimplify.com` | `siteConfig.domain`, `public/ads.txt:5` |
| **Contact Email** | `hello@newormedia.com` / `tensaedeme61@gmail.com` | `public/ads.txt:7`, `src/config/site.ts` |
| **Secondary Ad Networks** | None active directly in code; programmatic exchange partners declared via Newor Media `ads.txt` | `public/ads.txt` (1,191 lines) |

---

## 3. Script Injection Lifecycle & Consent Coupling

### 3.1 Previous Baseline (Defect Identified)
Prior to Phase 5, `src/app/layout.tsx` contained static script tags in `<head>` loading `adsbygoogle.js` and Google Analytics 4 without waiting for user consent. While an analytics opt-out flag existed in `localStorage`, the script loaded immediately on the initial network request, creating non-compliance risks under GDPR and ePrivacy regulations.

### 3.2 Refactored Phase 5 Architecture
1. **Google Consent Mode v2 Default:**
   In `src/app/layout.tsx`, an inline `<script id="google-consent-default">` immediately executes before any external scripts, configuring default denied permissions:
   ```javascript
   window.dataLayer = window.dataLayer || [];
   function gtag(){dataLayer.push(arguments);}
   gtag('consent', 'default', {
     'analytics_storage': 'denied',
     'ad_storage': 'denied',
     'ad_user_data': 'denied',
     'ad_personalization': 'denied',
     'wait_for_update': 500
   });
   ```
2. **Script Injection & Consent Mode v2 Synchronization (`ConsentScriptLoader.tsx`):**
   - **Google Analytics (`G-XZ1VE80DQL`):** Injected strictly if `consent.analytics === true` and browser DNT/GPC is not set to deny.
   - **Google AdSense (`ca-pub-7704232652384788`):** Injected when `process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true'`. It dynamically communicates Google Consent Mode v2 state:
     - When consent is granted (`consent.advertising === true`): updates `ad_storage: 'granted'`, `ad_user_data: 'granted'`, `ad_personalization: 'granted'` to deliver personalized ads.
     - When consent is ungranted or rejected: updates `ad_storage: 'denied'`, `ad_user_data: 'denied'`, `ad_personalization: 'denied'` to serve cookieless, non-personalized contextual ads to all visitors without tracking cookies.
3. **No Duplicate Injections:**
   Refs `gaLoadedRef` and `adsenseLoadedRef` guarantee that neither script is ever injected more than once per page lifecycle.

---

## 4. Ad Rendering Components

Two consolidated components govern all advertising render logic:

### 4.1 `src/components/ads/AdSlot.tsx`
- **Purpose:** In-page responsive banner slots for homepage, tool pages, guides, and resource hubs.
- **Universal Delivery:** Renders on eligible pages for all visitors (`isPlacementAllowed && (isAdSenseEnabled || isTestMode)`). Google Consent Mode v2 governs whether personalized or contextual cookieless ads are displayed.
- **Policy Enforcement:** Evaluates `isAdPlacementAllowed(pageType, placement)` against `AD_STRATEGY`. Strictly rejects illegal placements (e.g. editor workspace, legal pages).
- **Layout Shift Protection (CLS):** Reserves explicit container height based on ad format (`horizontal`: 90px, `rectangle`: 250px, `multiplex`: 280px, `auto`: 100px).
- **Observable Lifecycle:**
  - Fires `ad_slot_eligible` on mount when verified.
  - Monitors Google AdSense DOM mutation attribute `data-ad-status`:
    - `filled`: Fires `ad_slot_rendered`.
    - `unfilled`: Fires `ad_slot_error` (`'unfilled'`) and cleanly collapses the reserved container to prevent blank gaps.
  - Traps initialization exceptions with `ad_slot_error` (`'init_exception'`).

### 4.2 `src/components/ads/AnchorAd.tsx`
- **Purpose:** Viewport-pinned bottom mobile/desktop anchor banner.
- **Universal Delivery:** Renders on eligible pages for all visitors; Google Consent Mode v2 determines personalization.
- **Policy Enforcement:** Strictly prohibited on PDF Editor (`pageType === 'editor'`), Legal pages (`pageType === 'legal'`), and Contact pages (`pageType === 'contact'`). Dismissal button allows visitors to close the anchor for their current session.
- **User Control:** Includes visible dismiss button (`X` icon with `aria-label="Dismiss advertisement"`).

---

## 5. Inventory of Existing Placements

| Route / Page Type | Component | Slot ID | Placement | Dimensions / Format | Policy Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage (`/`)** | `AdSlot` | `home-leaderboard` | `in-content` | Horizontal / Auto | Allowed (1 slot max) |
| **Tools Index (`/pdf-tools`)** | `AdSlot` | `tools-directory-bottom` | `in-content` | Horizontal / Auto | Allowed (1 slot max) |
| **30 Tool Workspaces (`/pdf-tools/[slug]`)** | `AdSlot` | `tool-[slug]-post-tool` | `post-tool` | Horizontal (min 90px) | Allowed on 29 tools; **Blocked on PDF Editor** |
| **30 Tool Workspaces (`/pdf-tools/[slug]`)** | `AnchorAd` | `tool-[slug]-anchor` | `anchor` | Bottom Viewport (50-90px) | Allowed on 29 tools; **Blocked on PDF Editor** |
| **Guides Index (`/guides`)** | `AdSlot` | `guides-index-bottom` | `in-content` | Horizontal / Auto | Allowed (1 slot max) |
| **30 Guide Articles (`/guides/[slug]`)** | `AdSlot` | `guide-bottom-content` | `end-content` | Medium Rectangle (min 250px) | Allowed (1 slot) |
| **30 Guide Articles (`/guides/[slug]`)** | `AnchorAd` | `guide-anchor` | `anchor` | Bottom Viewport (50-90px) | Allowed (1 slot) |
| **PDF Editor (`/pdf-tools/pdf-editor`)** | None | N/A | N/A | None | **Strictly Forbidden (0 ads)** |
| **Legal Pages (`/privacy`, `/terms`, etc.)**| None | N/A | N/A | None | **Strictly Forbidden (0 ads)** |
| **Contact Page (`/contact`)** | None | N/A | N/A | None | **Strictly Forbidden (0 ads)** |

---

## 6. Cleanup of Old or Unused Artifacts

1. **Obsolete Ad Scripts:** Removed unconditional scripts from `src/app/layout.tsx`.
2. **Placeholder IDs:** Confirmed no `pub-XXXXXXXXXXXXXXXX` or placeholder strings exist in `public/ads.txt` or code.
3. **Environment Flags:** Centralized environment variable contract in `.env.example`:
   - `NEXT_PUBLIC_ADSENSE_ENABLED` (`'true'` / `'false'`)
   - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (`'ca-pub-7704232652384788'`)
   - `NEXT_PUBLIC_ADSENSE_TEST_MODE` (`'true'` / `'false'`)
