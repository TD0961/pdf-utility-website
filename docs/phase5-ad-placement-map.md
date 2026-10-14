# PDFSimplify — Ad Placement Map & Monetization Inventory

**Document Version:** 1.0  
**Governing Module:** `src/lib/ads/ad-strategy.ts`  
**Components:** `AdSlot.tsx`, `AnchorAd.tsx`  

---

## 1. Core Placement Principles

PDFSimplify prioritizes **document processing utility, privacy, and user trust** over aggressive ad density. Advertisements are placed only where they do not compete with primary user workflows or risk accidental clicks.

### Non-Negotiable Safe Zone Principles
1. **Never Overlap Tool Controls:** Advertisements are strictly forbidden within or above file drop zones, page reordering grids, password input boxes, compression sliders, or signature drawing canvases.
2. **Never Obstruct Download Actions:** No ads may be placed between a user and their generated download button or error recovery alerts.
3. **Primary Workflow Isolation:** The primary user workflow must always follow an uninterrupted linear path:
   $$\text{Select Files} \longrightarrow \text{Configure Options} \longrightarrow \text{Process} \longrightarrow \text{Download}$$
4. **Visually Distinct Framing:** All ad slots feature a restrained uppercase label reading `"Advertisement"` and an isolated border container with subtle background shading (`bg-slate-50/50 dark:bg-slate-900/30`), preventing any confusion with application UI buttons.
5. **Strictly Prohibited Formats:**
   - No interstitial overlays.
   - No pop-up or modal advertisements.
   - No deceptive fake "Download Now" buttons.
   - No audio-autoplay video units.

---

## 2. Complete Inventory by Page Type

### 2.1 Homepage (`/`)
- **Allowed Placements:** `in-content` (1 slot max)
- **Active Slot ID:** `home-leaderboard`
- **Location:** Below the "Four Document Worlds" interactive narrative section, directly above the "Complete Tool Index" directory.
- **Rationale:** Positioned at a natural reading pause point after the visitor learns about PDFSimplify's architecture, before exploring specific tools. Completely separated from navigation headers and action links.
- **Dimensions:** Responsive auto (min-height 100px).

### 2.2 PDF Tools Directory (`/pdf-tools`)
- **Allowed Placements:** `in-content` (1 slot max)
- **Active Slot ID:** `tools-directory-bottom`
- **Location:** At the bottom of the tools grid, separated from the category filters.
- **Rationale:** High viewability after users browse through categories, with zero interference with tool selection cards.
- **Dimensions:** Responsive auto (min-height 100px).

### 2.3 Tool Workspaces (`/pdf-tools/[slug]`) — 29 Standard Tools
- **Allowed Placements:** `post-tool` (1 slot), `anchor` (1 slot)
- **Active Slot IDs:**
  - `tool-[slug]-post-tool`: Placed directly below the interactive workspace and output download card, above the educational "How to Use" guide and FAQ sections.
  - `tool-[slug]-anchor`: Sticky viewport bottom anchor banner (mobile/desktop).
- **Rationale:**
  - `post-tool`: High viewability when users complete their task and scroll down to read FAQs or tips. Does not alter layout before or during processing.
  - `anchor`: Standard high-viewability unit with an explicit dismiss button (`X`). Positioned at the bottom of the viewport so it never obscures top navigation or interactive controls.
- **Dimensions:**
  - `post-tool`: Horizontal Leaderboard (min-height 90px).
  - `anchor`: Responsive horizontal (50px mobile, 90px desktop).

### 2.4 PDF Editor Workspace (`/pdf-tools/pdf-editor`) — STRICT ZERO-AD ZONE
- **Allowed Placements:** `end-content` (1 slot max, highly separated)
- **Active Placements in Code:** **0 active slots** (`isAnchorAllowed('editor') === false`)
- **Rationale:** The PDF Editor is a high-precision, interactive canvas featuring zoom controls, multi-page thumbnails, drawing pens, text insertion, and shape placement. Any banner, especially an anchor ad, risks catastrophic accidental clicks, obscuring zoom controls, or causing viewport jitter during canvas manipulation.
- **Safety Policy:** Anchor ads and post-tool ads are **strictly disabled by policy** in `ad-strategy.ts`.

### 2.5 Guides Index (`/guides`)
- **Allowed Placements:** `in-content` (1 slot max)
- **Active Slot ID:** `guides-index-bottom`
- **Location:** Below the article grid, above footer.
- **Rationale:** Natural editorial placement for readers browsing tutorials.
- **Dimensions:** Responsive auto (min-height 100px).

### 2.6 Guide Articles (`/guides/[slug]`) — 30 Long-Form Tutorials
- **Allowed Placements:** `end-content` (1 slot), `anchor` (1 slot)
- **Active Slot IDs:**
  - `guide-bottom-content`: Placed at the conclusion of the long-form tutorial text, before related articles.
  - `guide-anchor`: Bottom sticky anchor banner with dismiss button.
- **Rationale:** Long-form editorial content achieves high reader dwell time (2–4 minutes). Placing a medium rectangle unit at the conclusion delivers strong viewability without interrupting article reading flow.
- **Dimensions:**
  - `guide-bottom-content`: Medium Rectangle (min-height 250px).
  - `guide-anchor`: Responsive horizontal (50px / 90px).

### 2.7 Legal, Compliance & Contact Pages — ZERO-AD POLICY
- **Routes:** `/privacy`, `/privacy-policy`, `/terms`, `/terms-of-service`, `/cookie-policy`, `/security`, `/contact`
- **Allowed Placements:** **Empty array `[]`** (`maxAdsPerPage: 0`)
- **Rationale:** Showing advertisements on legal disclosures, terms of service, security audits, or user support contact forms damages institutional trust and violates Google AdSense compliance policies regarding high-utility pages.
- **Enforcement:** Hard-coded return `null` in `AdSlot.tsx` and `AnchorAd.tsx` when `pageType === 'legal'` or `pageType === 'contact'`.

---

## 3. Ad Density Analysis

| Metric | PDFSimplify Benchmark | Industry Average (Ad-Heavy PDF Utilities) |
| :--- | :--- | :--- |
| **Max Ads Per Tool Page** | 1 banner + 1 anchor | 5 to 9 banners + video interstitial |
| **Max Ads Per Guide Page** | 1 content + 1 anchor | 4 to 8 banners + taboola feed |
| **Ads on PDF Editor** | **0** | 2 to 4 intrusive banners |
| **Ads on Legal Pages** | **0** | 1 to 3 banners |
| **Cumulative Layout Shift (CLS)** | $\le 0.05$ (Pre-reserved minHeight) | $0.25 - 0.60$ (Unreserved jumpy banners) |
| **Accidental Click Risk** | Near Zero (Physical separation > 200px) | High (Banners next to download buttons) |
