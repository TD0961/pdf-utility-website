# iLikePDF.com — Phase 1 Architecture & Foundation Report

**Date:** September 7, 2026  
**Platform:** iLikePDF.com  
**Positioning:** *Simple PDF tools. Private by design.*  
**Architecture:** Zero-Backend, 100% Client-Side Processing, Static Next.js App Router  

---

## 1. Project Structure Created

A clean, modular, production-grade Next.js App Router architecture was established:

```text
pdf-utility-website/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Global HTML shell, Navbar, Footer, SkipToContent, Schema
│   │   ├── page.tsx                  # Product homepage with hero, popular tools, FAQ
│   │   ├── globals.css               # Design system tokens and Tailwind v4 imports
│   │   ├── sitemap.ts                # Static XML sitemap generator
│   │   ├── robots.ts                 # Static robots.txt generator
│   │   ├── pdf-tools/
│   │   │   ├── page.tsx              # All tools directory with category filters
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # SSG individual tool page (15 content requirements)
│   │   │       └── ToolClientWorkspace.tsx # Interactive client-side tool engine binder
│   │   ├── guides/
│   │   │   ├── page.tsx              # Guides repository directory
│   │   │   └── [slug]/page.tsx       # SSG educational guide articles
│   │   ├── resources/page.tsx        # Technical architecture references
│   │   ├── about/page.tsx            # Mission and privacy philosophy
│   │   ├── contact/page.tsx          # Direct contact channels
│   │   ├── privacy-policy/page.tsx   # Zero-backend privacy guarantees
│   │   ├── terms/page.tsx            # Terms of service
│   │   └── cookie-policy/page.tsx    # Cookie & storage disclosures
│   ├── components/
│   │   ├── layout/                   # Header, Footer, Container
│   │   ├── navigation/               # Navbar, Breadcrumbs
│   │   ├── pdf/                      # Reusable PDF UI primitives
│   │   │   ├── LocalProcessingNotice.tsx
│   │   │   ├── PdfDropzone.tsx
│   │   │   ├── PdfFileCard.tsx
│   │   │   ├── PdfFileList.tsx
│   │   │   ├── PdfThumbnail.tsx
│   │   │   ├── PdfProgress.tsx
│   │   │   ├── PdfResult.tsx
│   │   │   ├── PdfToolbar.tsx
│   │   │   ├── PdfWorkspace.tsx
│   │   │   ├── DownloadButton.tsx
│   │   │   └── ResetButton.tsx
│   │   ├── ads/
│   │   │   └── AdSlot.tsx            # Non-intrusive AdSense container
│   │   ├── seo/
│   │   │   └── JsonLd.tsx            # JSON-LD schema injector
│   │   ├── accessibility/
│   │   │   └── SkipToContent.tsx     # A11y skip link
│   │   └── ui/                       # Button, Card, Badge primitives
│   ├── lib/
│   │   ├── pdf/
│   │   │   ├── pdf-engine.ts         # pdf-lib manipulation functions
│   │   │   ├── pdf-renderer.ts       # Mozilla PDF.js canvas & text extraction
│   │   │   ├── memory-manager.ts     # Object URL tracking & revocation registry
│   │   │   └── index.ts
│   │   ├── workers/
│   │   │   ├── worker-manager.ts     # Worker lifecycle, progress, and fallback
│   │   │   └── types.ts
│   │   ├── seo/
│   │   │   ├── metadata.ts           # Dynamic metadata generator
│   │   │   └── jsonld.ts             # Schema.org structured data generators
│   │   ├── utils/
│   │   │   └── index.ts              # cn, formatBytes, formatTime, generateId
│   │   └── validation/
│   │       └── file-validator.ts     # PDF magic header verification & limits
│   ├── data/
│   │   ├── tools.ts                  # Comprehensive registry of all 15 PDF tools
│   │   ├── guides.ts                 # Educational tutorials & architecture guides
│   │   └── faq.ts                    # Global FAQ repository
│   └── types/
│       ├── tool.ts                   # Tool domain types & interfaces
│       ├── pdf.ts                    # PDF file, page, and state types
│       └── guide.ts                  # Guide article interfaces
├── public/
│   ├── pdf.worker.min.mjs            # Pre-bundled local Mozilla PDF.js worker
│   └── workers/
│       └── pdf-worker.js             # General off-thread Web Worker script
├── next.config.ts                    # Configured with output: "export"
├── package.json                      # Dependencies and scripts
├── ARCHITECTURE.md                   # In-depth architectural documentation
└── README.md                         # Quickstart and developer guide
```

---

## 2. Dependencies Added

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `next` | 16.3.4 | Core framework (App Router, SSG static export) |
| `react` / `react-dom` | 19.2.8 | UI component library |
| `tailwindcss` | ^4.0 | Modern utility-first styling system |
| `pdf-lib` | ^1.17.1 | In-browser PDF manipulation (merge, split, rotate, watermark, page numbers) |
| `pdfjs-dist` | ^6.3.289 | Mozilla PDF.js for canvas rendering, thumbnails, and text extraction |
| `jszip` | ^3.10.1 | Client-side ZIP creation for batch page exports |
| `lucide-react` | ^1.41.0 | Accessible UI icons |
| `clsx` / `tailwind-merge` | Latest | Conditional styling utilities |
| `typescript` | ^5.0 | Strict type checking |
| `eslint` / `eslint-config-next` | Latest | Code linting and style enforcement |

---

## 3. Architecture Decisions

1. **Zero-Backend Constraint**: Completely eliminated all server-side file endpoints. There are no API routes, Route Handlers, Server Actions, databases, or third-party cloud conversion APIs.
2. **Static Export (`output: 'export'`)**: Configured Next.js to pre-render the entire website as static HTML, CSS, and JS. The application can be hosted on any static CDN (Cloudflare Pages, Vercel Static, GitHub Pages, S3).
3. **App Router with SSG Separation**: Content-heavy and informational pages (Homepage, Tool descriptions, Guides, Legal) are statically pre-rendered for instant load times and optimal SEO. Interactive PDF workspaces are isolated as client components.
4. **Local Worker Assets**: Avoided external CDN dependencies (such as cdnjs or unpkg) by hosting `pdf.worker.min.mjs` directly in the `public/` directory, ensuring reliable offline operation.
5. **Memory Safety**: Designed an explicit `MemoryRegistry` to track and release Object URLs upon workspace resets or unmounting, mitigating tab crashes.

---

## 4. PDF Libraries Configured

- **`pdf-lib`**:
  - `mergePdfs`: Merges multiple PDF byte arrays.
  - `splitPdf`: Splits documents by page indices.
  - `rotatePdfPages`: Adjusts `/Rotate` dictionary tags permanently without recompression.
  - `extractPdfPages`: Copies page trees to fresh documents.
  - `addPageNumbersToPdf`: Stamped Helvetica numbers with customizable position and format.
  - `addWatermarkToPdf`: Diagonal text watermarking with opacity control.
  - `convertImagesToPdf`: Embeds JPEG/PNG images into standardized PDF containers.
  - `sanitizePdfMetadata`: Clears authors, software producers, and tracking metadata.
- **`pdfjs-dist`**:
  - Local worker configured to `/pdf.worker.min.mjs`.
  - `renderPdfPageToDataUrl`: Rasterizes pages to offscreen HTML5 canvas at custom scale.
  - `getPdfPageCount`: Fast page count inspection.
  - `extractTextFromPdf`: Iterates text content streams to extract readable plain text.

---

## 5. Worker Architecture

- Implemented `WorkerManager` (`src/lib/workers/worker-manager.ts`) to execute heavy tasks off the main thread.
- Progress reporting is supported via postMessage events.
- Graceful error boundary and cancellation support: terminating workers frees background execution threads immediately.
- Automatic fallback: if Web Workers are unavailable or blocked by restrictive browser security sandboxes, operations run on the main thread without failing.

---

## 6. Routes Created

Every route is statically pre-rendered with `output: 'export'`:

1. **Homepage**: `/`
2. **Tools Directory**: `/pdf-tools`
3. **15 Individual Tool Pages (`/pdf-tools/[slug]`)**:
   - `/pdf-tools/merge-pdf`
   - `/pdf-tools/split-pdf`
   - `/pdf-tools/organize-pdf`
   - `/pdf-tools/rotate-pdf`
   - `/pdf-tools/extract-pages`
   - `/pdf-tools/jpg-to-pdf`
   - `/pdf-tools/pdf-to-jpg`
   - `/pdf-tools/pdf-to-text`
   - `/pdf-tools/add-page-numbers`
   - `/pdf-tools/watermark-pdf`
   - `/pdf-tools/compress-pdf`
   - `/pdf-tools/protect-pdf`
   - `/pdf-tools/unlock-pdf`
   - `/pdf-tools/ocr-pdf`
   - `/pdf-tools/pdf-editor`
4. **Guides Directory**: `/guides`
5. **Individual Guides (`/guides/[slug]`)**:
   - `/guides/how-browser-based-pdf-processing-works`
   - `/guides/how-to-merge-pdf-files`
   - `/guides/how-to-split-a-pdf`
   - `/guides/what-is-ocr`
6. **Institutional & Legal Pages**:
   - `/resources`
   - `/about`
   - `/contact`
   - `/privacy-policy`
   - `/terms`
   - `/cookie-policy`
7. **Crawler & SEO Endpoints**:
   - `/sitemap.xml`
   - `/robots.txt`

---

## 7. SEO Infrastructure

- Dynamic metadata helper `constructMetadata` configuring `title`, `description`, canonical URLs, Open Graph, and Twitter Cards for every route.
- Structured data via `JsonLd.tsx`:
  - `WebSite` schema on homepage and layout.
  - `WebApplication` schema for every tool page.
  - `Article` schema for every guide article.
  - `BreadcrumbList` schema dynamically reflecting hierarchy.
- Native `sitemap.xml` and `robots.txt` generation supporting search engine discovery.

---

## 8. AdSlot Infrastructure

- Created reusable `AdSlot` component (`src/components/ads/AdSlot.tsx`).
- In development: renders a tasteful, clearly marked dashed box labeled `ADVERTISEMENT`.
- In production: conditionally renders responsive Google AdSense `<ins>` tag using `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADSENSE_ENABLED`.
- Strictly placed away from interactive buttons (dropzones, download buttons, action toolbars).
- Ads receive zero document contents or metadata.

---

## 9. Privacy Implementation

- **Strict zero-server guarantee**: Files are read via `FileReader` or `file.arrayBuffer()` directly in the browser.
- **Accurate disclosures**: Explicit statements ("Your PDF is processed locally in your browser"). No dishonest claims like "100% unbreakable".
- **Local cleanup**: All object URLs revoked on component unmount and reset.
- **Header validation**: `file-validator.ts` checks `%PDF-` magic header client-side.

---

## 10. Tests Performed

- **TypeScript Compilation**: `npm run typecheck` passed with **0 errors**.
- **ESLint**: `npm run lint` passed with **0 errors and 0 warnings**.
- **Static Export Generation**: Verified all 33 HTML static routes, `sitemap.xml`, and `robots.txt` generated in `out/`.

---

## 11. Build Result

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Running next.config.ts took 36ms
  Creating an optimized production build ...
✓ Compiled successfully in 866ms
  Finished TypeScript in 3.1s    ✓ Finished TypeScript in 3.1s 
  Collecting page data using 3 workers in 908ms    ✓ Collecting page data using 3 workers in 908ms 
✓ Generating static pages using 3 workers (33/33) in 1081ms
  Finalizing page optimization in 524ms    ✓ Finalizing page optimization in 524ms 
Exit Code: 0
```

---

## 12. Static Export Result

All 33 static pages successfully exported to the `out/` directory:

```text
out/
├── 404.html
├── index.html
├── about.html
├── contact.html
├── cookie-policy.html
├── privacy-policy.html
├── terms.html
├── resources.html
├── sitemap.xml
├── robots.txt
├── pdf.worker.min.mjs
├── pdf-tools.html
├── pdf-tools/
│   ├── merge-pdf.html
│   ├── split-pdf.html
│   ├── organize-pdf.html
│   ├── rotate-pdf.html
│   ├── extract-pages.html
│   ├── jpg-to-pdf.html
│   ├── pdf-to-jpg.html
│   ├── pdf-to-text.html
│   ├── add-page-numbers.html
│   ├── watermark-pdf.html
│   ├── compress-pdf.html
│   ├── protect-pdf.html
│   ├── unlock-pdf.html
│   ├── ocr-pdf.html
│   └── pdf-editor.html
├── guides.html
└── guides/
    ├── how-browser-based-pdf-processing-works.html
    ├── how-to-merge-pdf-files.html
    ├── how-to-split-a-pdf.html
    └── what-is-ocr.html
```

---

## 13. Issues Encountered & Resolved

1. **Turbopack vs Custom Webpack Config**: Next.js 16 defaults to Turbopack. Using a webpack config without specifying Turbopack caused a build error. Resolved by configuring `turbopack: {}` and relying on dynamic browser-only imports for `pdfjs-dist`, which compiled in under 1 second.
2. **PDF.js v6 API Changes**: PDF.js v6 requires `canvas` inside `RenderParameters` alongside `canvasContext`, and uses `doc.cleanup()` and `loadingTask.destroy()`. Resolved and fully typed.
3. **Worker Minified Linting**: ESLint attempted to scan the 1.2MB `public/pdf.worker.min.mjs` bundle. Resolved by adding `public/**` to `eslint.config.mjs` global ignores.

---

## 14. Recommended Next Step

The foundation is complete, verified, and ready for tool-by-tool enhancement.
The recommended next step is to begin **Phase 1 Tool Refinement & Testing**:
1. Build advanced visual reordering controls for `merge-pdf` and `organize-pdf` (multi-page drag-and-drop grid with instant canvas previews).
2. Enhance `split-pdf` with visual page selection and range parsing (`1-5, 8, 11-14`).
3. Enhance `pdf-to-jpg` with high-DPI canvas export and client-side ZIP packaging via `JSZip`.
