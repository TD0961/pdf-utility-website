# Production Deployment Guide: Cloudflare Pages

**Project:** iLikePDF.com  
**Architecture:** Next.js 16 (Static Export `output: 'export'`)  
**Backend:** ZERO BACKEND (100% Client-Side In-Browser Processing)  
**Target Platform:** Cloudflare Pages  
**Target Production Domain:** `https://ilikepdf.com`

---

## 1. Cloudflare Pages Project Creation

1. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** in the left sidebar navigation.
3. Click **Create Application** and select the **Pages** tab.
4. Click **Connect to Git** to authorize and link your repository.

---

## 2. GitHub Connection

1. Select your GitHub organization/account.
2. Choose the repository: `ilikepdf/pdf-utility-website` (or your private fork).
3. Select the production deployment branch: `main` (or `master`).
4. Click **Begin setup**.

---

## 3. Build & Output Configuration

Configure the build settings under **Build configuration**:

| Setting | Value |
|---|---|
| **Framework preset** | `Next.js (Static HTML Export)` or `None` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |
| **Root directory** | `/` (leave blank if repository root) |

---

## 4. Environment Variables

Configure the following environment variables under **Environment variables** (Production):

| Variable | Value | Description |
|---|---|---|
| `NODE_VERSION` | `20.18.0` (or `22.x`) | Ensures modern Node.js runtime for Next.js 16 compilation |
| `NEXT_PUBLIC_SITE_URL` | `https://ilikepdf.com` | Sets canonical domain for sitemap and OpenGraph metadata |

---

## 5. Security Headers & Static Routing

The repository includes pre-configured headers in [`public/_headers`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/public/_headers) which are automatically applied by Cloudflare Pages:

- **Strict-Transport-Security (HSTS)**: Enforced for HTTPS integrity.
- **Content-Security-Policy (CSP)**: Scoped strictly to client execution (`default-src 'self' blob:; worker-src 'self' blob:; object-src 'none'`).
- **Cache-Control**:
  - `/_next/static/*`: Immutable caching (`max-age=31536000, immutable`).
  - `/pdf.worker.min.mjs`: Immutable caching for the Mozilla PDF.js worker.
  - `/sw.js`: No-cache (`no-cache, no-store, must-revalidate`) ensuring instant service worker updates.
  - `/manifest.webmanifest`: Revalidated immediately.

---

## 6. Custom Domain & DNS Configuration

1. In your Cloudflare Pages project, click **Custom domains** -> **Set up a domain**.
2. Enter `ilikepdf.com` and click **Continue**.
3. If your domain's DNS is managed in Cloudflare:
   - Cloudflare will automatically configure the `CNAME` or Apex DNS flattening record.
4. If your domain is hosted with an external registrar (e.g. Namecheap, GoDaddy):
   - Add a `CNAME` record:
     - **Name**: `@` (or `www`)
     - **Target**: `<your-project-name>.pages.dev`
     - **Proxy status**: Proxied (Orange cloud)

---

## 7. HTTPS & SSL/TLS Verification

1. In the Cloudflare Dashboard, verify **SSL/TLS encryption mode** is set to **Full** or **Full (strict)**.
2. Enable **Always Use HTTPS** under **SSL/TLS** -> **Edge Certificates**.
3. Enable **Automatic HTTPS Rewrites**.

---

## 8. Post-Deployment Smoke Testing Checklist

Run these automated or manual checks on the live deployment URL:

- [ ] **HTTP to HTTPS Redirection**: Visiting `http://ilikepdf.com` redirects with 301 to `https://ilikepdf.com`.
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
  - Verify `https://ilikepdf.com/sitemap.xml` returns valid XML indexing all 70 static routes.
  - Verify `https://ilikepdf.com/robots.txt` points to the canonical sitemap.

---

## 9. Instant Rollback Procedure

If any regression occurs in production:
1. Go to **Workers & Pages** -> **ilikepdf** -> **Deployments**.
2. Identify the previous stable deployment hash.
3. Click the three dots menu (`...`) next to the stable deployment and select **Rollback to this deployment**.
4. Cloudflare Pages switches edge traffic to the previous build in under 5 seconds.
