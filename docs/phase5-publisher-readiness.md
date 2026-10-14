# PDFSimplify — Phase 5 Publisher Readiness & Launch Checklist

**Document Version:** 1.0  
**Domain:** `https://pdfsimplify.com`  
**Hosting Target:** Cloudflare Pages (Static Export `out/`)  
**Publisher Program:** Google AdSense / Newor Media Header Bidding  

---

## 1. Code-Level Configuration Matrix

| Asset / Config | Status | Code Verification Details |
| :--- | :--- | :--- |
| **`public/ads.txt`** | **READY** | 1,191 verified lines. Managed by Newor Media (`managerdomain=newormedia.com`). Contains direct publisher line: `google.com, pub-7704232652384788, DIRECT, f08c47fec0942fa0`. Zero placeholder IDs. |
| **`sitemap.xml`** | **READY** | Dynamically generated from `src/app/sitemap.ts` (`export const dynamic = 'force-static'`). Exactly 70 canonical URLs (10 core + 30 tools + 30 guides). Zero staging/localhost URLs. |
| **`robots.txt`** | **READY** | Generated from `src/app/robots.ts`. Allows all user agents (`/`) and references canonical sitemap `https://pdfsimplify.com/sitemap.xml`. |
| **Canonical Tags** | **READY** | Generated via `constructMetadata()` in `src/lib/seo/metadata.ts`. Every page injects an `<link rel="canonical" href="https://pdfsimplify.com/...">`. |
| **Static Redirects** | **READY** | `public/_redirects` configured for Cloudflare Pages edge redirects: `/terms-of-service` $\to$ `/terms` (301), `/privacy` $\to$ `/privacy-policy` (301). |
| **Cloudflare Headers** | **READY** | `public/_headers` enforces strict security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **NoIndex Safety** | **READY** | Utility alias routes (`/privacy`, `/terms-of-service`) marked `noIndex: true` to prevent duplicate indexation. Core pages marked indexable. |
| **Zero Secrets** | **READY** | No live API keys, tokens, or environment files (`.env`, `.env.production`) committed to Git. `.env.example` provides documented templates. |

---

## 2. Mandatory Publisher Account & Dashboard Actions

The following items cannot be performed within the local code repository and require publisher account authorization in external consoles:

### 2.1 Google AdSense Console (`adsense.google.com`)
1. **Domain Ownership Verification:**
   - Log into AdSense account associated with `ca-pub-7704232652384788`.
   - Add `pdfsimplify.com` to "Sites" list.
   - Verify domain via DNS TXT record or HTML verification snippet.
2. **Auto Ads Configuration:**
   - Under AdSense Site Settings for `pdfsimplify.com`, **disable** Anchor Ads and In-Page Auto Ads if relying on our centralized `AdSlot` and `AnchorAd` components to prevent conflicting ad injections on the PDF Editor.
3. **Seller Information Declaration:**
   - Verify that your seller information is set to "Transparent" in the Google Sellers.json registry.

### 2.2 Newor Media Publisher Portal
1. Confirm domain `pdfsimplify.com` is active and mapped to publisher ID `6bf2d68f-9055-45b5-85b5-8d6fa3b08fd6`.
2. Ensure automated `ads.txt` synchronization webhook is configured to notify of any upstream partner updates.

### 2.3 Cloudflare Pages & DNS
1. Bind custom domain `pdfsimplify.com` to the Cloudflare Pages project.
2. Enable Cloudflare Automatic HTTPS Rewrites and Minimum TLS 1.3.
3. Verify that Cloudflare Edge Cache serves `out/ads.txt` with MIME type `text/plain` and 200 OK.
