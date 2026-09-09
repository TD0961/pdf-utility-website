# Phase 3C.5: PDF True-Redaction Architecture & Technical Specification

## Professional Security Blueprint for Content Stream Sanitization

---

## 1. Executive Summary & Security Disclaimer

### 1.1 The Critical Distinction

> **CRITICAL SECURITY NOTICE:**  
> **Drawing a visual overlay (such as a black vector rectangle, colored shape, or highlighter) DOES NOT constitute PDF redaction.**

In the PDF imaging model (ISO 32000-1 / ISO 32000-2), visual drawing operations are painter's algorithm instructions appended to a page content stream. Drawing an opaque black box over text or an image:
1. Renders the black box in front of the target content on a visual canvas.
2. **Leaves 100% of the underlying text characters, glyph codes, font metrics, and image bitmaps intact in the document body.**
3. Allows any adversary, automated script, screen reader, or standard PDF viewer to select, copy, search, extract (`pdftotext`, `strings`), or programmatically uncover the hidden information.

**Phase 3C.5 does NOT implement true redaction.** It establishes the formal architectural groundwork, threat model, parsing requirements, and validation specifications required for a future security-hardened redaction release.

---

## 2. PDF Document Anatomy & Threat Vectors

To securely excise content, a redaction engine must operate across multiple abstraction layers of the PDF file structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ PDF File Structure & Redaction Attack Surfaces             │
├────────────────────────┬────────────────────────────────────┤
│ Physical Structure     │ Linear/Incremental Trailer Updates │
│ Object Hierarchy       │ Indirect Objects (obj...endobj)    │
│ Page Content Streams   │ Operator Sequences (Tj, TJ, Do, m) │
│ Resource Dictionaries  │ Fonts, XObjects, Color Spaces      │
│ Annotation Arrays      │ /Annots (/Widget, /Highlight, etc) │
│ Document Metadata      │ /Info Dictionary, XMP XML Metadata │
│ Optical/Bitmap Layer   │ Embedded JPEGs/PNGs (Do XObjects)  │
└────────────────────────┴────────────────────────────────────┘
```

### 2.1 Content Streams (`/Contents`)
Page visual content is defined by one or more stream objects containing postfix-notation PDF operators. Text, images, and paths coexist in these streams. Merely obscuring a bounding box leaves the underlying operators unaffected.

### 2.2 Text Operator Excision (`Tj`, `TJ`, `'`, `"`)
PDF text is emitted through specific operators:
- `(text) Tj`: Show character string.
- `[(te) 20 (xt)] TJ`: Show text array with kerning displacements.
- `'`: Move to next line and show string.
- `"`: Set spacing, move to next line, and show string.

Text within an operator may span words or lines, or be fragmented into individual glyph indices mapped through `/ToUnicode` CMaps or `/FontDescriptor` encodings.

### 2.3 Image XObjects (`Do`)
Images in PDFs are stored as external indirect objects (XObjects with `/Subtype /Image`) referenced via the `Do` operator (e.g., `/Im1 Do`).
- Simply placing a rectangle over part of an image leaves the complete unredacted raster bitmap inside the XObject stream.
- An attacker can inspect the XObject dictionary and extract the original uncropped JPEG/Flate stream directly.

### 2.4 Vector Objects & Clipping Paths (`W`, `W*`, `re`, `m`, `l`, `c`)
Vector paths (signatures, drawings, schematics, financial charts) are defined by path construction operators (`m`, `l`, `c`, `re`, `f`, `s`). A redaction region that overlaps vector graphics requires segment intersection, clipping path recalculation, or path removal.

### 2.5 Annotations & Interactive Forms (`/Annots`, `/AcroForm`)
Comments, highlights, sticky notes, and interactive form fields (`/Widget`) are not part of the page content stream; they reside in the page's `/Annots` array. If text or a signature is stored inside an annotation, redaction of page content streams will leave the annotation completely accessible.

### 2.6 Document Metadata (`/Info` and XMP)
Documents frequently leak sensitive context through:
- Document Information Dictionary (`/Info`): `/Title`, `/Author`, `/Subject`, `/Keywords`, `/CreationDate`, `/ModDate`.
- Extensible Metadata Platform (XMP): Embedded RDF/XML stream (`/Metadata` in Catalog) containing edit histories, author computer hostnames, printer spool paths, and deleted text fragments.

### 2.7 Incremental Updates (The "Trailer Trap")
PDF supports incremental saves where new objects and a new cross-reference (xref) table are appended to the end of the file.
- If a redaction tool performs an incremental save, **the entire previous revision—including redacted text and images—remains in earlier byte ranges of the physical file.**
- An attacker can simply open the PDF in a hex editor or truncate the file at the previous `startxref` offset to restore the unredacted document.

---

## 3. Required Future Architecture: True Redaction Pipeline

A production-grade, client-side true redaction engine must implement a deterministic five-stage pipeline:

```text
1. Coordinate Definition & Geometry Intersection
   ↓
2. Content Stream Lexing & Tokenization
   ↓
3. Operator-Level Excision & Transformation
   ↓
4. Image Raster Sub-Area Baking / Cropping
   ↓
5. Metadata Sanitization & Fresh Document Compaction
```

### Stage 1: Geometry & Intersection Resolution
- User specifies one or more redaction bounding boxes:
  $$R_k = [x_{\min}, y_{\min}, x_{\max}, y_{\max}] \quad \text{in PDF Point Space}$$
- The engine calculates intersections against all text item bounding boxes, glyph positions, image transformation matrices, and annotation rects.

### Stage 2: Content Stream Lexing
- Uncompress page content stream using FlateDecode (`pako` or browser-native `DecompressionStream`).
- Lex the raw byte stream into a sequence of PDF tokens: numbers, strings, names, arrays, dictionaries, and operators (`q`, `Q`, `cm`, `BT`, `ET`, `Tf`, `Tm`, `Td`, `Tj`, `TJ`, `Do`, etc.).

### Stage 3: Operator Transformation & Text Removal
- Track graphics state transformations:
  - Current Transformation Matrix ($CTM$)
  - Text Matrix ($T_m$) and Line Matrix ($T_{lm}$)
  - Font scaling, character spacing ($T_c$), word spacing ($T_w$), horizontal scaling ($T_z$).
- When encountering text operators (`Tj`, `TJ`):
  - If the glyph bounding box falls entirely within $R_k$, omit the glyph or replace with empty space/kerning advance.
  - If a string partially overlaps $R_k$, split the string token into three segments: preceding text, excised gap, following text.
  - Recalculate horizontal displacements so subsequent layout does not collapse.
- If an entire text block is redacted, remove the surrounding `BT...ET` operator sequence.

### Stage 4: Image Pixel Excision (Raster Sanitization)
- For every image XObject whose display bounds intersect $R_k$:
  1. Decode the bitmap stream (JPEG via Canvas, or FlateDecode raw bytes).
  2. Compute the sub-rectangle in image pixel space:
     $$x_{\text{pixel}} = \frac{x_{\text{pdf}} - X_0}{W_{\text{pdf}}} \cdot W_{\text{image}}$$
  3. Overwrite the corresponding pixel matrix in memory with solid black (`0x00` or `0x000000`).
  4. Re-encode the sanitized bitmap using PNG or JPEG.
  5. Replace the XObject's stream and `/Length` in the PDF document catalog.

### Stage 5: Non-Incremental Full Compaction & Serialization
- Purge orphaned XObjects and unreferenced font subsets.
- Strip or sanitize `/Info` and XMP `/Metadata` streams.
- Strip overlapping `/Annots` entries.
- Re-serialize the document from scratch (`PDFDocument.save()` with fresh xref generation).
- **Reject incremental updates completely.**

---

## 4. Verification & Testing Strategy

A redaction feature cannot be considered GREEN without strict adversarial validation:

| Test Vector | Validation Method | Acceptance Criteria |
| :--- | :--- | :--- |
| **Raw String Search** | Scan final exported PDF bytes with regex | Zero occurrences of redacted literal string |
| **Flate-Uncompressed Scan** | Decompress all `/Filter /FlateDecode` streams | Zero occurrences of redacted text or glyph IDs |
| **PDF.js Extraction Test** | Extract all text via PDF.js `getTextContent()` | Redacted text is completely absent from parsed tokens |
| **Image Extraction Test** | Extract raw image XObjects and examine pixels | Redacted coordinate pixels are permanently replaced with solid color |
| **Incremental Save Audit** | Inspect file EOF trailer structure | Exactly one xref table and one trailer; no prior revisions |
| **Metadata Audit** | Parse `/Info` dictionary and XMP stream | No redacted terms or sensitive author tags remain |

---

## 5. Summary & Phase 3C.5 Limitations

1. **Current Status in Phase 3C.5:**  
   - Black rectangles, highlights, and drawings are **visual annotations only**.
   - UI prominently displays transparent notices that annotations are non-destructive and do not remove underlying streams.
2. **Roadmap to True Redaction:**  
   - True redaction requires building a streaming PDF content-stream parser and raster re-encoder as outlined in this document.
   - This capability must be developed in a dedicated, security-audited phase.
