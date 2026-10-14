# PDFSimplify — Phase 5 Revenue Measurement & Reporting Guide

**Document Version:** 1.0  
**Target Audience:** Engineering Leads, Product Managers, Monetization Analysts  
**Repository Context:** PDFSimplify Static Web Application  

---

## 1. Instrumentation Architecture

To maintain PDFSimplify's non-negotiable zero-backend and zero-custody constraints, monetization instrumentation is cleanly segregated between **client-side observability signals** and **official publisher dashboard data**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PDFSimplify Application                         │
├─────────────────────────────────────┬──────────────────────────────────┤
│        Client-Side Instrumented     │     Provider Dashboard Only      │
│  (GA4 / Custom DOM Observability)   │    (Google AdSense / Newor)      │
├─────────────────────────────────────┼──────────────────────────────────┤
│ • ad_slot_eligible                  │ • Ad Requests & Queries          │
│ • ad_slot_rendered (data-ad-status) │ • Filled Impressions (MRC-valid) │
│ • ad_slot_error (unfilled/exception)│ • Fill Rate (%)                  │
│ • consent_preference_update         │ • Click-Through Rate (CTR)       │
│ • tool_open / tool_complete         │ • Estimated Revenue ($)          │
│ • tool_download_click               │ • Page RPM & Impression RPM      │
│ • Zero Document Data Transmitted    │ • Finalized Monthly Earnings ($) │
└─────────────────────────────────────┴──────────────────────────────────┘
```

---

## 2. Client-Side Instrumented Events

All events are strictly sanitized by `src/lib/analytics/events.ts` before dispatch. They use stable, low-cardinality identifiers:

1. **`ad_slot_eligible`:**
   - **Trigger:** Fired once when an `AdSlot` or `AnchorAd` component mounts, verifies user consent (`consent.advertising === true`), and confirms that the placement is permitted by `AD_STRATEGY`.
   - **Parameters:** `slot_id` (e.g., `tool-merge-pdf-post-tool`), `page_type` (`home` | `tool` | `guide` | `resource`).
   - **Utility:** Establishes the true denominator of ad opportunities unencumbered by ad-blockers or policy bans.

2. **`ad_slot_rendered`:**
   - **Trigger:** Fired when a `MutationObserver` detects that Google AdSense has set `data-ad-status="filled"` on the slot `<ins>` element.
   - **Parameters:** `slot_id`, `page_type`.
   - **Utility:** Client-side proxy for slot fill success.

3. **`ad_slot_error`:**
   - **Trigger:** Fired when either:
     - `adsbygoogle.push({})` throws a caught JavaScript runtime exception (`error_type: 'init_exception'`).
     - Google AdSense sets `data-ad-status="unfilled"` (`error_type: 'unfilled'`).
   - **Parameters:** `slot_id`, `page_type`, `error_type`.
   - **Action Taken:** The slot container collapses to 0 height to prevent Cumulative Layout Shift and avoid showing a blank white box.

4. **`consent_preference_update`:**
   - **Trigger:** Fired whenever a user submits preferences via the consent banner or preferences dialog.
   - **Parameters:** `analytics_allowed` (boolean), `ads_allowed` (boolean).

---

## 3. Metrics Sourced Exclusively from Publisher Dashboards

Because PDFSimplify has no server and no tracking cookies for monetary calculations, the following metrics **must never be fabricated** and can only be obtained directly from the Google AdSense and Newor Media consoles:

1. **Ad Requests:** Real HTTP queries processed by Google ad servers.
2. **Paid Impressions:** Impressions counted after Google's fraud detection filters out bot traffic.
3. **Fill Rate (%):** $\frac{\text{Filled Requests}}{\text{Ad Requests}} \times 100$.
4. **Click-Through Rate (CTR):** $\frac{\text{Clicks}}{\text{Impressions}} \times 100$.
5. **Estimated Daily Revenue ($):** Pre-audit earnings based on auction bid clears.
6. **Finalized Earnings ($):** Post-audit payout amount posted on the 21st of each month.

---

## 4. Comparing Revenue Before and After Architectural Changes

To evaluate whether a placement or consent change improved monetization without hurting user retention, follow this standard procedure:

### Step 1: Establish Comparable Baseline Windows
- Compare identical calendar intervals (e.g. 14 days Monday–Sunday vs. 14 days Monday–Sunday) to normalize weekend traffic variations.
- Segment by geographic tier (Tier 1: US, UK, CA, AU vs. Rest of World) because geographical shifts heavily skew RPM.

### Step 2: Calculate Page RPM and Tool Completion Rate
- **Metric A (Monetization):**
  $$\text{Page RPM} = \frac{\text{AdSense Revenue}}{\text{Cloudflare Pages Total Visits}} \times 1,000$$
- **Metric B (Usability Retention):**
  $$\text{Tool Completion Rate} = \frac{\text{tool\_processing\_complete}}{\text{tool\_processing\_start}} \times 100$$
- **Success Criteria:** Page RPM increases or holds steady while Tool Completion Rate remains $\ge 95\%$. If Tool Completion Rate drops, ad placement is too intrusive and must be rolled back.

### Step 3: Avoid the Estimated vs. Finalized Revenue Trap
- Google AdSense estimates are often adjusted downwards by 2%–8% at the end of the month due to invalid traffic deductions.
- **Rule:** Never celebrate an estimated daily spike until month-end reconciliation confirms the finalized balance.

---

## 5. Weekly Publisher Monetization Reporting Template

Use this Markdown reporting template for regular operational reviews:

```markdown
# PDFSimplify — Weekly Monetization Performance Report
**Reporting Week:** [YYYY-MM-DD to YYYY-MM-DD]  
**Publisher Account:** ca-pub-7704232652384788 (Newor Media / AdSense)  

### 1. High-Level Summary
- Total Pageviews (Cloudflare / GA4): [Number]
- Ad Consent Rate (% Granted): [Number]%
- Estimated Publisher Earnings: $[Amount]
- Overall Page RPM: $[Amount]
- Average Impression RPM: $[Amount]

### 2. Network Delivery Breakdown (Source: AdSense Console)
| Ad Format / Slot | Ad Requests | Filled Impressions | Fill Rate (%) | Est. Revenue ($) | Imp. RPM ($) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Leaderboard (Home / Tools) | [Num] | [Num] | [Num]% | $[Num] | $[Num] |
| Post-Tool (Workspaces)     | [Num] | [Num] | [Num]% | $[Num] | $[Num] |
| Rectangle (Guides End)     | [Num] | [Num] | [Num]% | $[Num] | $[Num] |
| Bottom Anchor (Mobile)     | [Num] | [Num] | [Num]% | $[Num] | $[Num] |
| **Total**                  | **[Num]** | **[Num]** | **[Num]%** | **$[Num]** | **$[Num]** |

### 3. User Experience & Core Web Vitals Correlation
- Cumulative Layout Shift (CLS 75th percentile): [0.0X] (Target: ≤ 0.1)
- Tool Completion Rate (%): [Num]% (Target: ≥ 95%)
- Unfilled Slot Fallback Rate (%): [Num]%

### 4. Observations & Next Steps
- [Notable findings, geographic RPM trends, or optimization proposals]
```
