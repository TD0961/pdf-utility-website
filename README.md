# iLikePDF.com — Privacy-Focused In-Browser PDF Platform

> **Simple PDF tools. Private by design.**
> Powerful browser-based document utilities running 100% client-side with zero server uploads.

---

## Architectural Highlights

- **Zero Backend**: There are no API routes, Node.js servers, databases, or cloud processing workers.
- **100% Client-Side Processing**: Documents are read into browser RAM (`ArrayBuffer`) and manipulated locally via pure JavaScript and WebAssembly (`pdf-lib`, Mozilla `PDF.js`).
- **Static Deployment**: Fully compatible with `output: 'export'`. Can be hosted on Cloudflare Pages, Vercel Static, GitHub Pages, AWS S3, or any static HTTP CDN.
- **Memory Lifecycle Protection**: Dedicated `MemoryRegistry` tracks and revokes all Blob Object URLs (`URL.revokeObjectURL`) to prevent memory leaks.
- **Privacy Guaranteed**: Files never leave the user's device. No filenames, document contents, passwords, or extracted text are ever transmitted to analytics or advertising providers.

---

## Getting Started

### Prerequisites

- Node.js >= 18.17 (Node 20+ recommended)
- npm >= 9

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

### Production Build & Static Export

```bash
npm run build
```

This compiles the Next.js application into the `out/` directory containing static HTML, CSS, JavaScript, `sitemap.xml`, and `robots.txt`.

### Preview Static Build Locally

```bash
npx serve out -p 3000
```

---

## How to Add a New PDF Tool

1. **Register Tool Metadata in `src/data/tools.ts`**:
   Add a new `ToolMetadata` entry with:
   - `slug`: e.g., `'rotate-pdf'`
   - `name`: e.g., `'Rotate PDF'`
   - `category`: `'organize' | 'convert' | 'enhance' | 'secure'`
   - `features`, `steps`, `tips`, `commonProblems`, and `faqs`

2. **Add Client-Side Logic in `src/lib/pdf/pdf-engine.ts`**:
   Write a pure JavaScript/WASM function using `pdf-lib` or `pdfjs-dist`:
   ```ts
   export async function myPdfOperation(file: File): Promise<Uint8Array> {
     const buffer = await file.arrayBuffer();
     const doc = await PDFDocument.load(buffer);
     // Transform document...
     return await doc.save();
   }
   ```

3. **Wire into `src/app/pdf-tools/[slug]/ToolClientWorkspace.tsx`**:
   Add the action handler under the matching `slug`.

4. **Verify Static Export**:
   Run `npm run build` to verify the new route is prerendered in `out/pdf-tools/<slug>.html`.

---

## License

Proprietary © iLikePDF.com. All rights reserved.
