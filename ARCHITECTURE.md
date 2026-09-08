# iLikePDF.com — Architecture Documentation

## 1. Executive Summary & Core Architectural Rule

**iLikePDF.com** is a privacy-focused browser-based document utility platform engineered with a strict requirement:

> **ZERO BACKEND — 100% CLIENT-SIDE PDF PROCESSING**

There is no custom backend, API route, server action, cloud worker, database, or external processing pipeline. All document manipulation happens directly on the user's client hardware.

```text
User Device
   │
   ├─► Selected PDF File (File / Blob)
   │     │
   │     ▼
   ├─► Browser RAM (ArrayBuffer)
   │     │
   │     ▼
   ├─► Client Engine (pdf-lib / Mozilla PDF.js / Web Workers)
   │     │
   │     ▼
   ├─► Transformed Binary Stream (Uint8Array)
   │     │
   │     ▼
   ├─► Local Blob & Object URL (URL.createObjectURL)
   │     │
   │     ▼
   └─► Instant Client Download (URL.revokeObjectURL on unmount)
```

---

## 2. Project Directory Structure

```text
src/
├── app/
│   ├── layout.tsx                # Global HTML structure, Navbar, Footer, SkipToContent
│   ├── page.tsx                  # Landing page (hero, popular tools, how-it-works, FAQ)
│   ├── globals.css               # Modern design tokens and Tailwind v4 imports
│   ├── sitemap.ts                # Static sitemap.xml generator
│   ├── robots.ts                 # Static robots.txt generator
│   ├── pdf-tools/
│   │   ├── page.tsx              # All Tools directory grouped by category
│   │   └── [slug]/               # Static SSG tool routes (generateStaticParams)
│   ├── guides/
│   │   ├── page.tsx              # Educational guides directory
│   │   └── [slug]/               # Static guide articles (generateStaticParams)
│   ├── resources/page.tsx        # Technical architecture documentation
│   ├── about/page.tsx            # Mission and privacy philosophy
│   ├── contact/page.tsx          # Support channels and FAQ pointers
│   ├── privacy-policy/page.tsx   # Accurate architectural disclosures
│   ├── terms/page.tsx            # Legal terms of service
│   └── cookie-policy/page.tsx    # Cookie and local storage disclosures
│
├── components/
│   ├── layout/                   # Header, Footer, Container
│   ├── navigation/               # Navbar, Breadcrumbs
│   ├── pdf/                      # Reusable PDF UI Primitives
│   │   ├── LocalProcessingNotice.tsx
│   │   ├── PdfDropzone.tsx
│   │   ├── PdfFileCard.tsx
│   │   ├── PdfFileList.tsx
│   │   ├── PdfThumbnail.tsx
│   │   ├── PdfProgress.tsx
│   │   ├── PdfResult.tsx
│   │   ├── PdfToolbar.tsx
│   │   ├── PdfWorkspace.tsx
│   │   ├── DownloadButton.tsx
│   │   └── ResetButton.tsx
│   ├── ads/
│   │   └── AdSlot.tsx            # Moderate, isolated AdSense container
│   ├── seo/
│   │   └── JsonLd.tsx            # Structured data injector
│   └── ui/                       # Button, Card, Badge primitives
│
├── lib/
│   ├── pdf/
│   │   ├── pdf-engine.ts         # pdf-lib manipulation (merge, split, rotate, watermark)
│   │   ├── pdf-renderer.ts       # Mozilla PDF.js canvas rendering and text extraction
│   │   └── memory-manager.ts     # Object URL registry & lifecycle cleanup
│   ├── workers/
│   │   ├── worker-manager.ts     # Web Worker lifecycle & fallback dispatcher
│   │   └── types.ts              # Worker message protocols
│   ├── seo/
│   │   ├── metadata.ts           # Metadata builder (OpenGraph, canonicals)
│   │   └── jsonld.ts             # Schema.org generators (WebSite, WebApplication, Article)
│   ├── utils/                    # cn, formatBytes, formatTime, generateId
│   └── validation/
│       └── file-validator.ts     # Header magic-byte inspection & size checks
│
├── data/
│   ├── tools.ts                  # Comprehensive registry of all 15 PDF tools
│   ├── guides.ts                 # Educational guides dataset
│   └── faq.ts                    # Global FAQ repository
│
└── types/                        # Domain TypeScript definitions (tool, pdf, guide)
```

---

## 3. PDF Infrastructure & Memory Lifecycle

### 3.1 PDF.js Integration
- Mozilla `pdfjs-dist` is dynamically loaded strictly inside client modules.
- The pre-bundled worker `pdf.worker.min.mjs` is served statically from `/public/pdf.worker.min.mjs`, guaranteeing zero external CDN dependencies and offline compatibility.

### 3.2 pdf-lib Manipulation
- `pdf-lib` handles in-memory document recombination, page extraction, rotation, numbering, watermarking, and metadata stripping.
- Runs without browser canvas dependencies, making it extremely lightweight and fast.

### 3.3 Memory Safety
Processing large PDFs in browser memory requires strict lifecycle discipline:
- `MemoryRegistry` tracks every created `blob:` URL.
- When resetting the workspace or unmounting a tool page, `URL.revokeObjectURL()` is invoked on all active URLs.
- Canvases are cleared and detached immediately after rendering to allow Garbage Collection.

---

## 4. Web Worker Architecture

To guarantee the UI remains 60fps responsive during intensive operations:
- `WorkerManager` encapsulates worker creation, message correlation via task IDs, progress forwarding, and graceful termination.
- If worker threads fail or are blocked by specific client sandboxes, tasks fall back seamlessly to main-thread processing.

---

## 5. SEO & Structured Data Architecture

- **Semantic HTML**: Proper `h1` through `h4` hierarchy, semantic `<nav>`, `<main>`, `<article>`, `<header>`, and `<footer>` tags.
- **Dynamic Metadata**: Every tool and guide has unique canonical URLs, Open Graph tags, and descriptive meta titles.
- **JSON-LD**:
  - `WebSite` schema on root layout.
  - `WebApplication` schema on all tool pages.
  - `Article` schema on guide articles.
  - `BreadcrumbList` schema dynamically matching navigation path.
- **Static Sitemap & Robots**: Generated at build time via `sitemap.ts` and `robots.ts`.

---

## 6. Advertising Architecture (AdSense)

- Handled exclusively via `AdSlot.tsx`.
- Advertisements are strictly sandboxed and visually demarcated with uppercase `"ADVERTISEMENT"` labels.
- Ads are never placed over or inside:
  - Upload dropzones
  - Download buttons
  - Workspace progress bars
- No fake download buttons or dark patterns.
- Ad slots receive zero document data or metadata.

---

## 7. Static Build & Production Deployment

Configured with `output: 'export'` in `next.config.ts`.
Running `npm run build` produces the `out/` directory with 100% pre-rendered static files. Deployable directly to:
- Cloudflare Pages
- Vercel Static Hosting
- GitHub Pages
- AWS S3 + CloudFront
- Nginx / Caddy static servers
