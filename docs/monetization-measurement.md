# PDFSimplify — Trustworthy Monetization Measurement Model

**Document Version:** 1.0  
**Effective Date:** October 2026  
**Applicability:** PDFSimplify Web Application (`pdfsimplify.com`)  

---

## 1. Purpose & Principles

This specification establishes standard, unambiguous definitions and mathematical formulations for measuring advertising performance, revenue, viewability, and user engagement on PDFSimplify.

### Core Non-Negotiable Rules
1. **No Fabricated Revenue:** PDFSimplify operates on a 100% client-side, zero-backend architecture. Monetary revenue ($) can never be computed or inferred locally from tool-open events, client clicks, or estimated CPMs. All monetary figures originate exclusively from the official Google AdSense and Newor Media publisher dashboards.
2. **Measurement Source Distinction:** Every metric must state its authoritative data source (Client Analytics vs. Publisher Dashboard).
3. **Privacy Invariant:** Monetization telemetry must never contain document names, file sizes, document contents, encryption passwords, or sensitive parameters.

---

## 2. Core Metric Definitions & Formulas

### 2.1 Pageviews
- **Definition:** Total instances of an HTML page being loaded and rendered in a user's browser.
- **Source:** Google Analytics 4 (`page_view`) and Cloudflare Pages edge analytics.
- **Reporting Period:** Real-time / Daily aggregated.

### 2.2 Eligible Pageviews
- **Definition:** Pageviews where the user has granted advertising consent (`consent.advertising === true`), the page type is permitted to show ads under platform policy (`isAdPlacementAllowed === true`), and the browser is not running a network ad blocker.
- **Formula:**
  $$\text{Eligible Pageviews} = \text{Total Pageviews} \times \text{Ad Consent Rate} \times (1 - \text{AdBlock Rate}) \times (1 - \text{Excluded Page Ratio})$$
- **Source:** Client analytics (`ad_slot_eligible` presence per session).

### 2.3 Ad Requests
- **Definition:** An attempt by an ad tag on PDFSimplify to request an advertisement from the Google AdSense or Newor Media ad server. Triggered when `adsbygoogle.push({})` executes inside an eligible `AdSlot`.
- **Source:** Google AdSense / Newor Media Publisher Dashboard.
- **Client Proxy Event:** `ad_slot_eligible` (indicates tag eligibility, not fill).

### 2.4 Filled Ad Requests
- **Definition:** An ad request where the advertising server successfully returns an ad creative to the browser (status code 200, non-empty response).
- **Source:** Google AdSense Dashboard.
- **Client Observable Indicator:** `data-ad-status="filled"` attribute mutation on `<ins class="adsbygoogle">`.

### 2.5 Impressions
- **Definition:** An ad creative that has been successfully rendered in the user's viewport and satisfies the MRC (Media Rating Council) standard (at least 50% of ad pixels in view for at least 1 continuous second).
- **Source:** Google AdSense / Google Ad Manager Publisher Reporting.
- **Critical Caveat:** A successful script load or tag injection is NOT an impression. Client code must never label a slot request as an impression.

### 2.6 Fill Rate
- **Definition:** The percentage of measurable ad requests that resulted in a filled ad returned by the network.
- **Formula:**
  $$\text{Fill Rate (\%)} = \left(\frac{\text{Filled Ad Requests}}{\text{Measurable Ad Requests}}\right) \times 100$$
- **Source:** Publisher Network Dashboard.

### 2.7 Page RPM (Revenue Per Mille)
- **Definition:** Estimated publisher earnings for every 1,000 pageviews across the site.
- **Formula:**
  $$\text{Page RPM} = \left(\frac{\text{Estimated Publisher Revenue}}{\text{Pageviews}}\right) \times 1,000$$
- **Source:** Combined (Revenue from AdSense Dashboard $\div$ Pageviews from GA4 / Cloudflare).

### 2.8 Impression RPM
- **Definition:** Estimated publisher earnings for every 1,000 verified ad impressions.
- **Formula:**
  $$\text{Impression RPM} = \left(\frac{\text{Estimated Publisher Revenue}}{\text{Impressions}}\right) \times 1,000$$
- **Source:** Publisher Dashboard.

### 2.9 Estimated Revenue vs. Finalized Revenue
- **Estimated Revenue:** Approximate publisher earnings accumulated during the active billing period (daily/weekly). Subject to deductions for invalid clicks, bot filtering, and reconciliation adjustments by Google/Newor.
- **Finalized Revenue:** Audited, verified earnings posted at the close of the calendar month after deduplication and fraud invalidation. This is the sole figure used for accounting and payout.
- **Rule:** Never confuse estimated daily dashboard earnings with finalized earnings in reporting.

### 2.10 Ad-Related Layout Shifts (CLS)
- **Definition:** Visual instability score caused by ad slots expanding or collapsing dynamically after the surrounding DOM has rendered.
- **Target:** Cumulative Layout Shift $\le 0.1$ at the 75th percentile.
- **Mitigation:** Pre-reserved container min-heights (`minHeight: 90px`, `250px`, etc.) and graceful zero-shift collapse for unfilled slots via `data-ad-status`.
- **Source:** Chrome User Experience Report (CrUX) and local Lighthouse/PerformanceObserver audits.

### 2.11 Tool Engagement and Successful Processing
- **Definition:** Total client-side document operations that successfully complete and generate a valid output binary for the user without errors.
- **Formula:**
  $$\text{Tool Completion Rate (\%)} = \left(\frac{\text{tool\_processing\_complete}}{\text{tool\_processing\_start}}\right) \times 100$$
- **Source:** Client analytics (`tool_processing_complete`).
- **Monetization Significance:** High completion rate preserves user retention, recurring sessions, and long-term brand equity, which drives organic RPM growth.

---

## 3. Observability Matrix

| Metric Name | Measurement Source | Capture Mechanism | Privacy Safeguard |
| :--- | :--- | :--- | :--- |
| **Slot Eligibility** | Client Analytics | `trackAdSlotEligible(slotId, pageType)` | Coarse slot ID only (`tool_post_workspace`) |
| **Slot Render Success** | Client Analytics | MutationObserver on `data-ad-status="filled"` | Zero document parameters |
| **Slot Tag Error** | Client Analytics | `try / catch` on `adsbygoogle.push({})` | Sanitized error code (`init_exception`, `unfilled`) |
| **Consent Transitions** | Client Analytics | `trackConsentPreferenceUpdate(analytics, ads)` | Binary flags only, no PII |
| **Ad Requests** | Google AdSense | Provider HTTP tag | Handled by Google sandbox iframe |
| **Impressions** | Google AdSense | MRC-compliant viewability beacons | Handled by provider |
| **Estimated Revenue** | Google AdSense / Newor | AdSense Publisher Portal | Extracted via dashboard export |
| **Finalized Revenue** | Google AdSense / Newor | Monthly reconciliation ledger | Extracted via monthly statement |
