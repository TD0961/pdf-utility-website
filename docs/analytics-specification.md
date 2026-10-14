# PDFSimplify — Privacy-First Analytics Specification & Event Taxonomy

**Document Version:** 1.0.0  
**Effective Date:** October 2026  
**Target Environment:** Client-Side Only (Cloudflare Pages Static Export, Next.js 16 App Router)  
**Measurement ID:** `G-XZ1VE80DQL`

---

## 1. Overview & Privacy Principles

PDFSimplify processes 100% of PDF documents client-side in the user's browser using WebAssembly, Web Workers, and local canvas manipulation. To uphold our core privacy commitments, all analytics and measurement instrumentation strictly adhere to the following zero-leakage principles:

1. **Zero Content & PII Exfiltration:**
   - Document contents, extracted text, OCR transcriptions, form input values, digital signatures, passwords, and user-generated metadata are **never** logged, tracked, or transmitted.
2. **Zero Identifier & Filename Leakage:**
   - File names, directory paths, storage URIs, and raw user identifiers are stripped before any analytics dispatch.
3. **Zero Raw File Size Telemetry:**
   - Byte counts and raw file sizes are strictly forbidden in telemetry payloads to prevent document fingerprinting.
4. **Coarse Bucketing Only:**
   - Document counts and processing times are grouped into broad, discrete buckets (e.g., `<1s`, `1-5s`, `5-15s`, `15-30s`, `30s+`).
5. **Sanitized Error Classification:**
   - Raw JavaScript exceptions, stack traces, and unparsed error strings are never transmitted. Errors are mapped to an allowlist of high-level error category codes (e.g., `invalid_pdf`, `password_protected`).
6. **DNT & Opt-Out Respect:**
   - Browser `navigator.doNotTrack === '1'` and `localStorage.getItem('pdfsimplify_analytics_optout') === 'true'` completely disable telemetry dispatch.
7. **Client-Side Only Execution:**
   - All tracking logic guards against server-side rendering (SSR) and static site generation (SSG) via `typeof window === 'undefined'`.

---

## 2. Event Taxonomy

All events are dispatched through Google Analytics 4 (`window.gtag`) using strictly typed signatures and run-time sanitization filters.

### 2.1 `tool_open`
Emitted once per route visit when a user enters any of the 30 PDF tool workspaces.

- **Trigger:** Mounted in `ToolPageTracker` via `useEffect` upon page navigation.
- **Deduplication:** Guarded by route slug and tracking session state.
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `tool_slug` | `string` | 30 allowlisted tool slugs | Canonical identifier of the active tool |

### 2.2 `tool_processing_start`
Emitted immediately after client-side document validation passes and the user initiates processing.

- **Trigger:** Inside tool execution handlers (e.g., clicking "Merge PDFs", "Compress PDF", or dropping a valid file for instant conversion).
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `tool_slug` | `string` | 30 allowlisted tool slugs | Tool being executed |
  | `file_count_bucket` | `string` | `'1'`, `'2-5'`, `'6-10'`, `'11+'` | Coarse bucket of input files |

### 2.3 `tool_processing_complete`
Emitted when in-browser document processing finishes successfully and output artifacts (Blob, Data URL, or canvas) are ready.

- **Trigger:** Resolving of processing promise before rendering download actions.
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `tool_slug` | `string` | 30 allowlisted tool slugs | Tool that executed |
  | `duration_bucket` | `string` | `'<1s'`, `'1-5s'`, `'5-15s'`, `'15-30s'`, `'30s+'` | Wall-clock execution duration bucket |
  | `output_format` | `string` | `'pdf'`, `'docx'`, `'pptx'`, `'xlsx'`, `'csv'`, `'md'`, `'txt'`, `'zip'`, `'jpg'`, `'png'`, `'other'` | Format of generated asset |

### 2.4 `tool_processing_error`
Emitted when client-side processing fails due to invalid input, password restriction, worker exhaustion, or unexpected exception.

- **Trigger:** Catch block of processing handlers.
- **Exception:** User-initiated cancellations (abort tokens) explicitly skip this event.
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `tool_slug` | `string` | 30 allowlisted tool slugs | Tool that encountered an error |
  | `error_code` | `string` | `'invalid_pdf'`, `'password_protected'`, `'corrupted_file'`, `'render_failure'`, `'worker_crash'`, `'out_of_memory'`, `'unsupported_feature'`, `'network_error'`, `'unknown_error'` | Standardized error category |

### 2.5 `tool_download_click`
Emitted when the user clicks the primary or secondary download link/button to retrieve their processed file.

- **Trigger:** User click on download anchors (`<a>`) or export buttons.
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `tool_slug` | `string` | 30 allowlisted tool slugs | Tool source of download |
  | `output_format` | `string` | `'pdf'`, `'docx'`, `'pptx'`, `'xlsx'`, `'csv'`, `'md'`, `'txt'`, `'zip'`, `'jpg'`, `'png'`, `'other'` | File format downloaded |

### 2.6 `guide_to_tool_click`
Emitted when a user browsing one of the 30 educational guides clicks an internal contextual link or CTA directing them to a relevant PDF tool.

- **Trigger:** Click on `<GuideToolLink>` component in guide sidebars, in-body callouts, or footers.
- **Parameters:**
  | Parameter | Type | Allowed Values | Description |
  | :--- | :--- | :--- | :--- |
  | `guide_slug` | `string` | 30 allowlisted guide slugs | Originating guide article |
  | `target_tool_slug`| `string` | 30 allowlisted tool slugs | Target tool destination |

---

## 3. Metric Definitions & Formulas

The event schema provides clean, comparable metrics across all tools without tracking personal data.

### 3.1 Tool Funnel Conversion Rate
Measures end-to-end completion rate from page landing to successful output download.

$$\text{Tool Funnel Conversion Rate} = \frac{\text{Count of unique sessions with } \texttt{tool\_download\_click}}{\text{Count of unique sessions with } \texttt{tool\_open}}$$

- **Step 1 (Open):** $\texttt{tool\_open}$
- **Step 2 (Start):** $\texttt{tool\_processing\_start}$
- **Step 3 (Complete):** $\texttt{tool\_processing\_complete}$
- **Step 4 (Download):** $\texttt{tool\_download\_click}$

### 3.2 Tool Processing Completion Rate
Measures client-side processing reliability independent of page drop-off before file selection.

$$\text{Processing Completion Rate} = \frac{\sum \texttt{tool\_processing\_complete}}{\sum \texttt{tool\_processing\_start}}$$

### 3.3 Tool Error Rate
Measures the proportion of processing attempts resulting in errors.

$$\text{Processing Error Rate} = \frac{\sum \texttt{tool\_processing\_error}}{\sum \texttt{tool\_processing\_start}}$$

### 3.4 Guide-to-Tool Click-Through Rate (CTR)
Measures the effectiveness of educational guides in funneling organic search traffic to functional tools.

$$\text{Guide-to-Tool CTR} = \frac{\sum \texttt{guide\_to\_tool\_click} \text{ for guide } g}{\text{Unique Pageviews of guide } g}$$

### 3.5 Processing Duration Distribution
Breakdown of execution latency by bucket across tools to identify performance bottlenecks on resource-constrained devices:
- Fast: `<1s`
- Normal: `1-5s`
- Medium: `5-15s`
- Heavy: `15-30s`
- Prolonged: `30s+`

---

## 4. Allowlist Values & Validation Tables

### 4.1 30 Tool Slugs (`ToolSlug`)
```
merge-pdf             split-pdf             organize-pdf          rotate-pdf
extract-pages         jpg-to-pdf            pdf-to-jpg            pdf-to-text
add-page-numbers      watermark-pdf         protect-pdf           unlock-pdf
compress-pdf          ocr-pdf               pdf-editor            pdf-to-word
pdf-to-ppt            pdf-to-excel          sign-pdf              fill-pdf
crop-pdf              compare-pdf           pdf-to-csv            pdf-to-markdown
extract-images        flatten-pdf           remove-pdf-metadata   resize-pdf
grayscale-pdf         header-footer
```

### 4.2 Output Formats (`OutputFormat`)
`'pdf'`, `'docx'`, `'pptx'`, `'xlsx'`, `'csv'`, `'md'`, `'txt'`, `'zip'`, `'jpg'`, `'png'`, `'other'`

### 4.3 Error Codes (`ErrorCode`)
| Error Code | Classification Trigger |
| :--- | :--- |
| `invalid_pdf` | Header magic bytes missing `%PDF-` or unparsable PDF structure |
| `password_protected` | PDF has user/owner encryption and requires password |
| `corrupted_file` | Truncated xref table, EOF missing, or decompression failure |
| `render_failure` | Canvas context failure, PDF.js render page exception |
| `worker_crash` | Web Worker terminated abruptly or failed script loading |
| `out_of_memory` | ArrayBuffer allocation failed or browser heap exhaustion |
| `unsupported_feature` | XFA forms, unsupported font encodings, JBIG2 errors |
| `network_error` | Fetch failure when loading external worker/font assets |
| `unknown_error` | Generic or unclassified client runtime error |

---

## 5. Privacy Guard Implementation

The sanitization routine enforces runtime stripping of unsafe keys:

```typescript
const FORBIDDEN_KEY_PATTERN = /(size|file|name|text|pass|content|stack|url|uri|path|msg|message)/i;
```

Any parameter key matching this pattern is automatically omitted. In addition, parameter values are sanitized using an alphanumeric/hyphen/underscore allowlist (`/^[a-z0-9_-]+$/i`) or matched directly against type allowlists before invocation of `window.gtag('event', name, payload)`.

---

## 6. GA4 Configuration & Custom Dimensions

To visualize these metrics in Google Analytics 4 and Looker Studio, configure the following **Custom Dimensions** under **Admin > Custom definitions**:

| Dimension Name | Scope | Event Parameter | Description |
| :--- | :--- | :--- | :--- |
| Tool Slug | Event | `tool_slug` | Identifier of the PDF tool |
| File Count Bucket | Event | `file_count_bucket` | Number of files processed (coarse) |
| Duration Bucket | Event | `duration_bucket` | Wall-clock execution time range |
| Output Format | Event | `output_format` | Format extension of resulting file |
| Error Code | Event | `error_code` | Categorical failure code |
| Guide Slug | Event | `guide_slug` | Slug of the educational guide |
| Target Tool Slug | Event | `target_tool_slug` | Destination tool linked from guide |
