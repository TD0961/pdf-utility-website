# Production Deployment Guide: Cloudflare Pages

**Project:** PDFSimplify  
**Architecture:** Next.js 16 (Static Export `output: 'export'`)  
**Backend:** ZERO BACKEND (100% Client-Side In-Browser Processing)  
**Registrar:** Ashewa Cloud  
**DNS:** Cloudflare Authoritative DNS  
**Hosting Platform:** Cloudflare Pages  
**Target Production Domain:** `https://pdfsimplify.com`

---

## 1. Domain Registration (Ashewa Cloud) & DNS Delegation

1. Register domain `pdfsimplify.com` through **Ashewa Cloud**.
2. Add `pdfsimplify.com` to your **Cloudflare** account.
3. In your Ashewa Cloud domain management portal, update the domain's nameservers to point to the designated Cloudflare authoritative nameservers (e.g. `alex.ns.cloudflare.com`, `zoe.ns.cloudflare.com`).
4. Allow DNS propagation to complete.

---

## 2. Cloudflare Pages Project Creation

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** in the left sidebar navigation.
3. Click **Create Application** and select the **Pages** tab.
4. Click **Connect to Git** to authorize and link your repository.

---

## 3. GitHub Connection

1. Select your GitHub organization/account.
2. Choose your repository: `pdf-utility-website` (or your private fork).
3. Select the production deployment branch: `main` (or `master`).
4. Click **Begin setup**.

---

## 4. Build & Output Configuration

Configure the build settings under **Build configuration**:

| Setting | Value |
|---|---|
| **Framework preset** | `Next.js (Static HTML Export)` or `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Root directory** | `/` (leave blank if repository root) |

---

## 5. Environment Variables

Configure the following environment variables under **Environment variables** (Production):

| Variable | Value | Description |
|---|---|---|
| `NODE_VERSION` | `20.18.0` (or `22.x`) | Ensures modern Node.js runtime for Next.js compilation |
| `NEXT_PUBLIC_SITE_URL` | `https://pdfsimplify.com` | Sets canonical domain for sitemap and OpenGraph metadata |

---

## 6. Security Headers & Static Routing

The repository includes pre-configured headers in [`public/_headers`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/public/_headers) which are automatically applied by Cloudflare Pages:

- **Strict-Transport-Security (HSTS)**: Enforced for HTTPS integrity.
- **Content-Security-Policy (CSP)**: Scoped strictly to client execution (`default-src 'self' blob:; worker-src 'self' blob:; object-src 'none'`).
- **Cache-Control**:
  - `/_next/static/*`: Immutable caching (`max-age=31536000, immutable`).
  - `/pdf.worker.min.mjs`: Immutable caching for the Mozilla PDF.js worker.
  - `/sw.js`: No-cache (`no-cache, no-store, must-revalidate`) ensuring instant service worker updates.
  - `/manifest.webmanifest` & `/manifest.json`: Revalidated immediately.

---

## 7. Custom Domain Configuration in Cloudflare Pages

1. In your Cloudflare Pages project, click **Custom domains** -> **Set up a domain**.
2. Enter `pdfsimplify.com` and click **Continue**.
3. Cloudflare automatically establishes apex DNS routing and SSL provisioning.
4. Optionally repeat for `www.pdfsimplify.com`.

---

## 8. HTTPS & SSL/TLS Verification

1. In the Cloudflare Dashboard, verify **SSL/TLS encryption mode** is set to **Full** or **Full (strict)**.
2. Enable **Always Use HTTPS** under **SSL/TLS** -> **Edge Certificates**.
3. Enable **Automatic HTTPS Rewrites**.

---

## 9. Post-Deployment Smoke Testing Checklist

Run these checks on the live deployment URL:

- [ ] **HTTP to HTTPS Redirection**: Visiting `http://pdfsimplify.com` redirects with 301 to `https://pdfsimplify.com`.
- [ ] **Homepage Load**: All 30 tool cards and 24 guides render without hydration mismatches.
- [ ] **Client Processing Smoke Test**:
  - Test `merge-pdf`: Select 2 sample files, merge, and download the output.
  - Test `pdf-editor`: Open sample document, draw a freehand mark, and export.
  - Test `pdf-to-csv`: Extract tables into a `.csv` file.
- [ ] **Zero Network Exfiltration**:
  - Open Browser DevTools -> Network Tab.
  - Process a document.
  - Confirm **0 POST/PUT requests** containing document data.
- [ ] **PWA & Offline Test**:
  - Open DevTools -> Application -> Service Workers.
  - Toggle **Offline** mode in Network tab.
  - Refresh the page and confirm tool shells continue operating offline.
- [ ] **Sitemap & Robots**:
  - Verify `https://pdfsimplify.com/sitemap.xml` returns valid XML indexing all 70 static routes.
  - Verify `https://pdfsimplify.com/robots.txt` points to the canonical sitemap.

---

## 10. Instant Rollback Procedure

If any regression occurs in production:
1. Go to **Workers & Pages** -> **pdfsimplify** -> **Deployments**.
2. Identify the previous stable deployment hash.
3. Click the three dots menu (`...`) next to the stable deployment and select **Rollback to this deployment**.
4. Cloudflare Pages switches edge traffic to the previous build in under 5 seconds.
