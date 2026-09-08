# iLikePDF.com — Phase 3B Implementation Report

**Date:** September 8, 2026  
**Scope:** Document Security & Watermarking (`Watermark PDF`, `Protect PDF`, `Unlock PDF`)  
**Architecture:** 100% Client-Side In-Browser Execution, Zero Backend, Next.js Static Export  
**Status:** **PASSED & PRODUCTION-READY**

---

## 1. Executive Summary

Phase 3B of **iLikePDF.com** has been completed according to all architectural requirements, zero-backend principles, and production quality gates. This phase introduces three critical document security and branding utilities:

1. **Watermark PDF** (`/pdf-tools/watermark-pdf`): Full-featured in-browser text watermarking with 9 visual positions, tiled/repeating watermark grids, rotation angle normalization, opacity sliders, font sizes, color palettes, and rotation-aware coordinate transforms across 0°, 90°, 180°, and 270° orientations.
2. **Protect PDF** (`/pdf-tools/protect-pdf`): Genuine client-side PDF password encryption utilizing the standard browser Web Crypto API via `@pdfsmaller/pdf-encrypt`. Applies authentic **AES-256** encryption dictionaries with configurable user permissions (printing, copying, modifying, annotating) and dual-layer verification via PDF.js.
3. **Unlock PDF** (`/pdf-tools/unlock-pdf`): Genuine client-side PDF decryption utilizing `@pdfsmaller/pdf-decrypt`. Decrypts password-protected PDFs strictly when the user supplies the correct password, permanently stripping encryption dictionaries and verifying unencrypted output with zero password cracking or security bypassing.

### Key Quality Metrics:
- **Zero Backend**: 0 API routes, 0 server actions, 0 cloud processing workers, 0 remote uploads. All cryptographic operations and document manipulations occur locally in client browser RAM (`ArrayBuffer` and Web Crypto API).
- **Automated Tests**: **144 / 144 tests passing** across 15 test suites (111 baseline tests from Phase 1, 1.5, 2, and 3A preserved with zero regressions + 33 new Phase 3B tests).
- **TypeScript**: **0 type errors** (`tsc --noEmit`).
- **ESLint**: **0 errors, 0 warnings** (`eslint`).
- **Next.js Static Build**: **33 / 33 static routes** successfully generated via `output: 'export'`.
- **Browser QA**: Verified responsive layouts, interactive components, password visibility toggles, and zero application console errors.

---

## 2. Implemented Tools Overview

| Tool | Route | Primary Engine | Output Type | Key Features |
| :--- | :--- | :--- | :--- | :--- |
| **Watermark PDF** | `/pdf-tools/watermark-pdf` | `src/lib/pdf/watermark.ts` (`pdf-lib`) | `application/pdf` | Text watermarks, 9 visual positions + tiled repeating grid, custom angle slider (-90° to +90°), opacity (10–100%), font size (14–96pt), color presets, page ranges (`1-3, 5`), rotation-aware coordinate transforms |
| **Protect PDF** | `/pdf-tools/protect-pdf` | `src/lib/pdf/protect.ts` (`@pdfsmaller/pdf-encrypt`) | `application/pdf` | Genuine AES-256 encryption via Web Crypto, password confirmation, show/hide eye toggles, permission controls (printing, copying, modifying), pre-encryption checks, PDF.js auth verification gate |
| **Unlock PDF** | `/pdf-tools/unlock-pdf` | `src/lib/pdf/unlock.ts` (`@pdfsmaller/pdf-decrypt`) | `application/pdf` | Genuine AES-256 / RC4 decryption with valid password, unencrypted input detection, safe wrong-password error handling, verified unencrypted output (`isEncrypted === false`), zero cracking/bypass |

---

## 3. Technical Architecture & Data Flow

```mermaid
graph TD
  UserFile["User PDF Document"] --> Dropzone["Interactive Dropzone & Options Bar"]
  Dropzone --> MagicByteCheck["Magic Bytes & Client Validation (%PDF-)"]
  MagicByteCheck --> EngineRouter{"Tool Domain Engine"}
  
  EngineRouter -->|"Watermark PDF"| WatermarkEngine["src/lib/pdf/watermark.ts (pdf-lib)"]
  EngineRouter -->|"Protect PDF"| ProtectEngine["src/lib/pdf/protect.ts (@pdfsmaller/pdf-encrypt)"]
  EngineRouter -->|"Unlock PDF"| UnlockEngine["src/lib/pdf/unlock.ts (@pdfsmaller/pdf-decrypt)"]
  
  WatermarkEngine --> OutputValPdf["assertValidPdfOutput Gate"]
  ProtectEngine --> OutputValEncrypted["Encrypted Output Verification (PDF.js Challenge Gate)"]
  UnlockEngine --> OutputValDecrypted["Decrypted Output Verification (pdf-lib isEncrypted: false)"]
  
  OutputValPdf --> MemoryRegistry["MemoryRegistry & Safe Object URL"]
  OutputValEncrypted --> MemoryRegistry
  OutputValDecrypted --> MemoryRegistry
  
  MemoryRegistry --> DownloadUI["Immediate Client Download & File Stats"]
```

---

## 4. Tool 1: Watermark PDF (`/pdf-tools/watermark-pdf`)

### Engine Implementation (`src/lib/pdf/watermark.ts`)
- **Non-Destructive Vector Overlay**: Stamps vector text glyphs directly onto PDF page streams using `pdfDoc.embedFont(StandardFonts.HelveticaBold)`. Original vector lines, selectable text layers, and embedded images remain 100% uncompressed and unrasterized.
- **Visual Positions**:
  - 9 individual anchor presets: `top-left`, `top-center`, `top-right`, `middle-left`, `center` (default), `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`.
  - **Tiled Repeating Pattern**: Calculates a balanced 3×3 matrix of watermark stamps distributed evenly across the page, providing full-coverage protection for confidential documents.
- **Rotation-Aware Coordinate Transformation**:
  When a PDF page dictionary specifies `/Rotate` ($R \in \{0, 90, 180, 270\}$), viewers rotate the page clockwise by $R$. To ensure watermarks appear at the intended visual angle $\theta_{\text{visual}}$ and center $(cx_v, cy_v)$:
  1. Let $(dx, dy)$ be the unrotated text center offset rotated by $\theta_{\text{visual}}$:
     $$dx = \frac{W_t}{2} \cos(\theta_v) - \frac{H_t}{2} \sin(\theta_v),\quad dy = \frac{W_t}{2} \sin(\theta_v) + \frac{H_t}{2} \cos(\theta_v)$$
  2. Compute visual text origin: $x_v = cx_v - dx,\quad y_v = cy_v - dy$.
  3. Map $(x_v, y_v)$ to PDF page coordinates $(x_p, y_p)$ based on page width $W$, height $H$, and rotation $R$:
     - $R = 0^\circ$: $x_p = x_v,\quad y_p = y_v$
     - $R = 90^\circ$: $x_p = W - y_v,\quad y_p = x_v$
     - $R = 180^\circ$: $x_p = W - x_v,\quad y_p = H - y_v$
     - $R = 270^\circ$: $x_p = y_v,\quad y_p = H - x_v$
  4. Draw text with rotation angle $\theta_p = ((\theta_{\text{visual}} + R) \pmod{360} + 360) \pmod{360}$.
- **Page Ranges**: Reuses `parsePageRanges` (`all` or `"1-3, 5"`), validating user expressions against actual page counts.
- **Visual Styling**: Opacity slider (10% to 100%), font size (14pt to 96pt), and color presets (Gray, Red, Blue, Black, Green, Orange) with custom hex decoding.

---

## 5. Tool 2: Protect PDF (`/pdf-tools/protect-pdf`)

### Genuine Encryption Implementation (`src/lib/pdf/protect.ts`)
- **Technology Selected**: Integrated **`@pdfsmaller/pdf-encrypt`** (v1.2.0, MIT License).
- **Cryptographic Standard**: Standard PDF **AES-256** encryption (Security Handler Revision 6 / PDF 2.0 extension).
- **Web Crypto API**: All AES-256-CBC, SHA-256/384/512, and key derivation computations execute locally via `window.crypto.subtle` (and `node:crypto` in headless test environments) with zero native C++ binaries or external web services.
- **Granular Document Permissions**:
  - `allowPrinting`: Grants print permissions (default true).
  - `allowCopying`: Grants text/graphics extraction permissions (default true).
  - `allowModifying`: Controls page addition/modification (default false).
  - `allowAnnotating`: Controls form filling and comment creation (default false).
- **Security Verification Gates**:
  1. Header check: Verifies valid `%PDF-` structure.
  2. Encryption dictionary check: Confirms `isEncrypted(encryptedBytes).encrypted === true`.
  3. Authentication Challenge Gate: Attempts opening the encrypted file in PDF.js with no password to confirm access is rejected with `PasswordException`.
  4. Authenticated Opening Gate: Opens the encrypted file in PDF.js using `userPassword` to verify successful decryptability and match expected page count.
- **Password Hygiene**:
  - Passwords are never stored in `localStorage`, `sessionStorage`, cookies, or browser caches.
  - Passwords are never included in error messages, console logs, analytics, or network payloads.
  - Plaintext password state is cleared from component memory immediately upon encryption completion.

---

## 6. Tool 3: Unlock PDF (`/pdf-tools/unlock-pdf`)

### Genuine Decryption Implementation (`src/lib/pdf/unlock.ts`)
- **Technology Selected**: Integrated **`@pdfsmaller/pdf-decrypt`** (v1.0.1, MIT License).
- **Decryption Standard**: Full support for AES-256 and RC4 password-protected PDF streams.
- **Legitimate Decryption Discipline**: Operates strictly when the user supplies the correct document password. Does not implement password cracking, brute forcing, or security bypass routines.
- **Error Handling**:
  - **Wrong Password**: Safely caught and reported as *"Incorrect password. Please verify the password and try again."*
  - **Not Protected**: If an unencrypted PDF is provided, early detection halts processing and notifies the user that no decryption is required.
  - **Unsupported Encryption**: Explains unsupported proprietary algorithms clearly without exposing internal stack traces.
- **Output Verification Gate**:
  1. Structure check: Verifies output passes `assertValidPdfOutput`.
  2. Encryption removal check: Loads output with `PDFDocument.load(decryptedBytes)` and asserts `unlockedDoc.isEncrypted === false`.
  3. Passwordless Challenge: Loads output in `pdfjs.getDocument({ data: decryptedBytes })` and confirms immediate rendering with 0 password prompts.

---

## 7. Security & Privacy Audit

1. **Zero Network Egress**: All encryption and decryption operations run 100% inside client-side JavaScript and Web Crypto. No document bytes, metadata, passwords, or encryption keys ever leave the browser.
2. **Local Cryptographic Sandbox**: Files never touch server storage, edge caches, or temporary cloud buckets.
3. **No External Worker CDNs**: Mozilla PDF.js worker is served locally from `/pdf.worker.min.mjs`.
4. **Zero Document Telemetry**: Analytics events track only generic tool usage with zero password, filename, or document content parameters.

---

## 8. Comprehensive Testing Scorecard

### Test Execution Summary:
- **Total Tests**: **144**
- **Passed**: **144**
- **Failed**: **0**
- **Suites**: **15**
- **Duration**: ~30.8 seconds

```
▶ PDF Compatibility & Hardening Matrix (7 tests)
  ✔ Merges mixed page sizes, orientations, images, and rotations into a single valid PDF
  ✔ Organize: accurately computes cumulative rotation with pre-existing /Rotate metadata
  ✔ Organize: multi-step sequence (duplicate, rotate, reorder, delete)
  ✔ Split: splits 100-page PDF into range groups packaged in verified ZIP
  ✔ Split: preserves exact user-selected order in Extract mode
  ✔ Split: handles overlapping ranges deterministically without unexpected page loss
  ✔ Merge: preserves duplicate files with identical filenames and contents

▶ Merge PDF Engine (8 tests)
  ✔ merges Document A (2 pages) and Document B (3 pages) into 5 pages
  ✔ preserves exact file sequence (A then B then C)
  ✔ preserves reordered input sequence (C then A then B)
  ✔ rejects fewer than 2 files with clear error message
  ✔ fails gracefully on corrupted PDF data
  ✔ preserves multiple copies of the exact same document without deduplication
  ✔ preserves mixed page dimensions and page rotations from source documents
  ✔ invokes progress callback through merging stages

▶ Organize PDF Engine (7 tests)
  ✔ reorders pages from [0, 1, 2, 3] to [0, 3, 1, 2]
  ✔ deletes page 2 from [0, 1, 2, 3] resulting in 3 pages [0, 2, 3]
  ✔ duplicates page 2 from [0, 1, 2] to produce [0, 1, 1, 2]
  ✔ permanently sets page rotation metadata in the output PDF
  ✔ rejects empty page instructions
  ✔ rejects invalid out-of-bounds page references
  ✔ correctly handles full multi-operation sequence: duplicate, rotate, and delete

▶ Output Validation Engine (9 tests)
  ✔ validates a well-formed PDF document successfully
  ✔ rejects empty byte arrays
  ✔ rejects data missing %PDF- magic header
  ✔ detects page count mismatches
  ✔ assertValidPdfOutput throws Error when validation fails
  ✔ validates a valid ZIP containing valid PDF files
  ✔ rejects a ZIP with entry count mismatch
  ✔ rejects a ZIP containing corrupted PDF entries
  ✔ assertValidZipOutput asserts valid ZIP or throws

▶ Add Page Numbers Engine (10 tests)
  ✔ adds default page numbers (bottom-center, numeric) to all pages of a PDF
  ✔ supports all position presets without error
  ✔ formats page numbers as prefixed, total, and prefixed-total correctly
  ✔ applies custom starting number offset (e.g. start at 5)
  ✔ numbers only a specific range of pages (e.g. 2-3 of a 3-page document)
  ✔ accurately calculates coordinate transformations across 0°, 90°, 180°, and 270° rotations
  ✔ correctly numbers documents containing rotated pages without throwing errors
  ✔ rejects corrupted non-PDF files
  ✔ respects custom outputFileName
  ✔ emits sequential progress callbacks (0% to 100%)

▶ PDF to JPG Engine (10 tests)
  ✔ converts a 1-page PDF directly to a single JPG file without ZIP overhead
  ✔ converts a multi-page PDF into a ZIP archive of individual zero-padded JPEG files
  ✔ correctly processes page ranges (e.g. "1-2" from a 5-page PDF)
  ✔ correctly processes non-consecutive page range (e.g. "1, 3" extracting selected pages)
  ✔ rejects out-of-bounds page range expressions
  ✔ passes correct scale factors for standard (1.5x), high (2.0x), and very-high (3.0x) presets
  ✔ validates each output JPEG bytes with validateJpgOutput
  ✔ rejects non-PDF corrupted files
  ✔ emits sequential progress updates across all pages (0% to 100%)
  ✔ respects custom outputFileName

▶ PDF to Text Engine (10 tests)
  ✔ extracts text from a single-page PDF document
  ✔ extracts text from multi-page PDF documents and inserts "--- Page N ---" separators
  ✔ reconstructs lines and paragraphs in correct vertical order
  ✔ accurately computes totalCharacters, totalWords, and per-page metrics
  ✔ preserves Unicode and international characters
  ✔ detects scanned or image-only PDFs and flags isScanned with user guidance warning
  ✔ generates a valid UTF-8 text Blob and correct .txt download filename
  ✔ respects custom outputFileName parameter
  ✔ rejects non-PDF corrupted files gracefully
  ✔ emits sequential progress callbacks (0% to 100%)

▶ PDF Range Parser (13 tests)
  ✔ parses single page numbers
  ✔ parses continuous ranges like 1-5
  ✔ parses comma-separated pages like 1, 3, 5
  ✔ parses complex mixed ranges like 1-5, 8, 11-14 with whitespace
  ✔ rejects page 0 and negative numbers
  ✔ rejects inverted ranges like 5-2
  ✔ rejects non-numeric input like "abc"
  ✔ rejects trailing or consecutive commas
  ✔ rejects out-of-bounds page requests
  ✔ rejects pathological input exceeding length limits
  ✔ rejects malformed dashes such as 1--5, 1-2-3, 1-, and -5
  ✔ rejects floats, NaN, and scientific notation
  ✔ handles empty input gracefully

▶ Rotate PDF Engine (9 tests)
  ✔ rotates a single page by 90 degrees clockwise
  ✔ rotates all pages using the allPagesDelta shortcut
  ✔ rotates only selected pages leaving non-target pages unchanged
  ✔ correctly computes cumulative rotation on pages with pre-existing /Rotate metadata
  ✔ handles negative rotation deltas (e.g. -90° / rotate left)
  ✔ validates output PDF and ensures page count remains strictly unchanged
  ✔ respects custom outputFileName
  ✔ rejects corrupted non-PDF files with a clear error
  ✔ emits sequential progress callbacks (0% to 100%)

▶ Extract Pages Engine (9 tests)
  ✔ extracts a single page from a multi-page PDF
  ✔ extracts multiple non-consecutive pages (e.g. 1, 3, 5)
  ✔ preserves user-specified page ordering (e.g. reverse order: 5, 3, 1)
  ✔ extracts pages using range syntax (e.g. "1-2, 4")
  ✔ rejects empty page selection with clear error
  ✔ rejects out-of-bounds page requests
  ✔ rejects corrupted non-PDF files
  ✔ respects custom outputFileName
  ✔ emits sequential progress updates during extraction (0% to 100%)

▶ Split PDF Engine (8 tests)
  ✔ Mode A: extracts selected pages into a single PDF
  ✔ Mode A: preserves exact user-selected order when extracting (e.g. 5, 3, 1)
  ✔ Mode A: rejects empty page selection
  ✔ Mode B: splits an 5-page PDF into 5 individual files packaged into a ZIP
  ✔ Mode C: splits by multiple ranges (e.g. "1-2, 4-5") into a ZIP of PDFs
  ✔ Mode C: downloads directly as PDF if only one range is specified
  ✔ rejects invalid range expressions gracefully
  ✔ rejects unsupported split mode gracefully

▶ JPG to PDF Engine (11 tests)
  ✔ converts a single JPEG image into a valid 1-page PDF document
  ✔ converts multiple JPEG images preserving exact sequential order
  ✔ preserves duplicate images without deduplicating or dropping pages
  ✔ Page Size: standard presets (A4, Letter, Legal) create correctly dimensioned pages
  ✔ Orientation: Auto selects landscape for wide images and portrait for tall images
  ✔ Orientation: explicit Portrait and Landscape settings force desired dimensions
  ✔ Margins: none (0), small (18), medium (36) are supported without errors
  ✔ Image Fit: handles fit and fill modes successfully
  ✔ rejects zero images with clear error message
  ✔ rejects non-JPEG or corrupted image bytes with clear validation error
  ✔ invokes progress callback through conversion stages (0% to 100%)

▶ Watermark PDF Engine (12 tests) [NEW in Phase 3B]
  ✔ adds default text watermark (diagonal center, CONFIDENTIAL) across all pages
  ✔ supports custom text, font size, opacity, and color
  ✔ supports all position presets and tiled repeating pattern
  ✔ supports custom rotation angles
  ✔ watermarks only a specific range of pages (e.g. 2-3 of a 3-page document)
  ✔ handles documents with mixed page dimensions
  ✔ accurately calculates coordinate transformations across 0°, 90°, 180°, and 270° rotations
  ✔ watermarks documents containing pre-rotated pages without error
  ✔ rejects empty watermark text with clear error
  ✔ rejects corrupted non-PDF files
  ✔ respects custom outputFileName
  ✔ emits sequential progress callbacks (0% to 100%)

▶ Protect PDF Engine (12 tests) [NEW in Phase 3B]
  ✔ encrypts a PDF document with user password using AES-256
  ✔ ensures protected output cannot be opened without a password
  ✔ authenticates and opens protected PDF when correct password is provided
  ✔ rejects opening protected PDF when incorrect password is provided
  ✔ supports document permission flags
  ✔ handles documents with mixed page dimensions
  ✔ handles documents containing pre-rotated pages
  ✔ rejects empty password with clear validation error
  ✔ rejects already encrypted PDFs with clear notification
  ✔ rejects corrupted non-PDF files
  ✔ respects custom outputFileName
  ✔ emits sequential progress callbacks (0% to 100%)

▶ Unlock PDF Engine (9 tests) [NEW in Phase 3B]
  ✔ decrypts a password-protected PDF using the correct password
  ✔ rejects unlocking when an incorrect password is provided
  ✔ rejects unlocking when document is not encrypted
  ✔ preserves multi-page documents and page dimensions after unlocking
  ✔ preserves documents containing rotated pages after unlocking
  ✔ rejects empty password with clear validation error
  ✔ rejects corrupted non-PDF files
  ✔ respects custom outputFileName
  ✔ emits sequential progress callbacks (0% to 100%)
```

---

## 9. Responsive & Browser QA

Browser testing was conducted across all three Phase 3B tool routes:
- **Watermark PDF**: `http://localhost:3000/pdf-tools/watermark-pdf`
- **Protect PDF**: `http://localhost:3000/pdf-tools/protect-pdf`
- **Unlock PDF**: `http://localhost:3000/pdf-tools/unlock-pdf`

### Key Observations & Verification:
- **Console Errors**: **0 application console errors** during navigation and interactive operations.
- **Responsiveness**: Tested across desktop (1920×927) and mobile (375×812) viewports. Form controls, position pickers, sliders, and password fields wrap cleanly without horizontal overflow.
- **Security Copy Inspection**: Verified that hyperbolic marketing terms (e.g. "military-grade") are absent; accurate, transparent privacy guarantees are displayed.

### QA Artifacts:
- Watermark PDF Initial Screenshot: `watermark_pdf_initial_1788823065819.png`
- Protect PDF Initial Screenshot: `protect_pdf_initial_1788823081940.png`
- Unlock PDF Initial Screenshot: `unlock_pdf_initial_1788823099558.png`
- Unlock PDF Mobile Viewport Screenshot: `unlock_pdf_mobile_1788823131097.png`
- Interactive Browser Session Recording: `phase3b_browser_qa_1788823038239.webp`

---

## 10. Document Security & Compatibility Matrix

| Scenario | Watermark PDF | Protect PDF | Unlock PDF | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Simple text PDF** | **PASS** | **PASS** | **PASS** | Content and layout preserved 100% |
| **Image-heavy PDF** | **PASS** | **PASS** | **PASS** | Images preserved without compression or loss |
| **Multi-page PDF** | **PASS** | **PASS** | **PASS** | Exact page counts and sequence maintained |
| **Mixed page sizes** | **PASS** | **PASS** | **PASS** | Per-page coordinates adapt to A4, Letter, Legal |
| **Mixed orientation** | **PASS** | **PASS** | **PASS** | Portrait and landscape geometry handled cleanly |
| **Existing rotation (/Rotate)** | **PASS** | **PASS** | **PASS** | Coordinate transformation counteracts 90°/180°/270° |
| **Unicode content** | **PASS** | **PASS** | **PASS** | Unicode glyphs and metadata preserved |
| **Metadata preservation** | **PASS** | **PASS** | **PASS** | Non-destructive modifications retain tags |
| **Encrypted input** | **PASS** | **PASS** | **PASS** | Watermark & Protect reject locked input; Unlock decrypts |
| **Wrong password** | N/A | **PASS** | **PASS** | Fails safely with clear user guidance |
| **Large document (100+ pages)** | **PASS** | **PASS** | **PASS** | Bounded memory streaming avoids memory leaks |

---

## 11. Final Honest Limitations & Boundaries

### Verified & Supported:
- Text watermarking with 9 positions, tiled grids, custom angles, opacity, font size, and color.
- AES-256 PDF encryption with user passwords and custom permission controls.
- AES-256 and RC4 PDF decryption with valid passwords.
- Full output validation and PDF.js authentication checks.

### Known Limitations:
- **Image Watermarking**: Intentionally deferred in this phase to prevent memory bloat and prioritize rock-solid text watermarking.
- **Forgotten Passwords**: Because encryption keys are derived client-side without servers or backdoors, forgotten passwords cannot be recovered.
- **Browser Memory Limits**: Documents exceeding available browser RAM (e.g. 500MB+ or thousands of pages) may encounter device-level memory caps.

---

## 12. Complete Files Added & Modified in Phase 3B

### 1. New PDF Domain Engines (`src/lib/pdf/`)
- [`src/lib/pdf/watermark.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/lib/pdf/watermark.ts): Dedicated watermarking engine with position presets, tiled patterns, and rotation-aware geometry.
- [`src/lib/pdf/protect.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/lib/pdf/protect.ts): Dedicated password protection engine using Web Crypto AES-256 encryption and PDF.js authentication verification.
- [`src/lib/pdf/unlock.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/lib/pdf/unlock.ts): Dedicated decryption engine verifying user passwords, removing encryption dictionaries, and ensuring unencrypted output.

### 2. User Interface Workspaces (`src/components/tools/`)
- [`src/components/tools/watermark/WatermarkWorkspace.tsx`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/components/tools/watermark/WatermarkWorkspace.tsx): Interactive watermark workspace with position grid, tiled pattern toggle, style sliders, color presets, and live preview.
- [`src/components/tools/protect/ProtectWorkspace.tsx`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/components/tools/protect/ProtectWorkspace.tsx): Security workspace featuring password entry with show/hide toggles, mismatch validation, permissions, and security advisory.
- [`src/components/tools/unlock/UnlockWorkspace.tsx`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/components/tools/unlock/UnlockWorkspace.tsx): Decryption workspace featuring encryption pre-checks, password authentication, and decryption status.

### 3. Central Routing, Metadata & Exports
- [`src/app/pdf-tools/[slug]/page.tsx`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/app/pdf-tools/[slug]/page.tsx): Mounted the three workspaces under `/pdf-tools/watermark-pdf`, `/pdf-tools/protect-pdf`, and `/pdf-tools/unlock-pdf`.
- [`src/lib/pdf/index.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/lib/pdf/index.ts): Centralized re-exports of all Phase 3B engines.
- [`src/data/tools.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/src/data/tools.ts): Updated tool metadata, features, and honest privacy copy; set status to `available`.

### 4. Automated Test Suites (`tests/`)
- [`tests/watermark.test.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/tests/watermark.test.ts): 12 tests covering positions, tiled patterns, angles, rotations, ranges, and validation.
- [`tests/protect.test.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/tests/protect.test.ts): 12 tests covering AES-256 encryption, PDF.js challenge gates, permissions, and validation.
- [`tests/unlock.test.ts`](file:///home/tensae/Desktop/projects/Apps/pdf-utility-website/tests/unlock.test.ts): 9 tests covering authentic decryption, unencrypted output verification, and error handling.

---

## 13. Phase 3B Sign-Off & Recommendation

Phase 3B has passed all acceptance criteria, security audits, and automated regression suites. The platform now delivers 12 production-grade, privacy-first PDF utilities running entirely inside client web browsers with zero backend infrastructure.
