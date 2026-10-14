import React from 'react';
import { ToolMetadata } from '@/types/tool';
import { Cpu } from 'lucide-react';

interface ToolEducationalContentProps {
  tool: ToolMetadata;
}

export interface ToolDeepDive {
  title: string;
  engine: string;
  aspects: Array<{
    heading: string;
    description: string;
  }>;
  considerations: Array<string>;
}

export const TOOL_DEEP_DIVES: Record<string, ToolDeepDive> = {
  // --- 1. Organize Category ---
  'merge-pdf': {
    title: 'Technical Guide to In-Browser PDF Merging',
    engine: 'pdf-lib Document Tree Assembly',
    aspects: [
      {
        heading: 'Mixed Page Dimensions & Orientations',
        description:
          'When merging documents from different sources, individual pages may vary between US Letter, A4, or architectural blueprints. The merging engine preserves each page’s native MediaBox and CropBox geometry, ensuring no pages are cropped, stretched, or distorted.',
      },
      {
        heading: 'Vector Integrity & Font Descriptors',
        description:
          'Vector graphics, embedded TrueType/OpenType fonts, and selectable text remain in their native format. The document tree is reorganized at the structural dictionary level rather than rasterizing pages to images.',
      },
      {
        heading: 'Bookmarks & Form Fields',
        description:
          'Merged files maintain their visual clarity. Interactive AcroForm fields from individual documents are concatenated into the target document structure without naming collisions.',
      },
    ],
    considerations: [
      'Encrypted or password-protected files must be unlocked before merging.',
      'Merging 50+ high-resolution files simultaneously depends on your device’s available browser memory (RAM).',
      'Original vector paths and text layers are preserved with zero downsampling.',
    ],
  },
  'split-pdf': {
    title: 'Page Tree Decomposition & Range Extraction Architecture',
    engine: 'pdf-lib Object Tree Slicing & Isolated Binary Serializer',
    aspects: [
      {
        heading: 'Custom Range Tokenization',
        description:
          'Our range parser evaluates complex expressions (e.g. "1-3, 5, 8-10") directly in memory. It verifies page boundaries against the document catalog before constructing output sub-documents.',
      },
      {
        heading: 'Independent Resource Dictionary Cloning',
        description:
          'When pages are extracted, associated font descriptors, images, and shading dictionaries are isolated and copied into the new container, ensuring extracted pages remain visually self-contained.',
      },
      {
        heading: 'Burst vs Range Splitting',
        description:
          'In burst mode, each page is emitted as an individual standalone PDF file and bundled into a standard in-browser ZIP archive without sending any data over external networks.',
      },
    ],
    considerations: [
      'Page numbers are 1-based matching standard document conventions.',
      'Extracted sub-documents preserve original vector typography and embedded images at 100% fidelity.',
      'Files requiring passwords must be authenticated prior to extraction.',
    ],
  },
  'organize-pdf': {
    title: 'Visual Grid Reordering & Matrix Rotation Architecture',
    engine: 'DOM Drag-and-Drop Matrix & pdf-lib Page Index Mutation',
    aspects: [
      {
        heading: 'Non-Destructive Visual Thumbnail Previews',
        description:
          'Rendered canvas previews allow visual drag-and-drop sequencing. Page objects in the PDF /Pages tree are reindexed at export time rather than duplicating underlying byte streams.',
      },
      {
        heading: 'Per-Page Orientation Adjustments',
        description:
          'Individual pages can be rotated by 90°, 180°, or 270° increments. The rotation angle is written directly to each page’s /Rotate dictionary tag without re-encoding vector streams.',
      },
      {
        heading: 'Interactive Page Pruning',
        description:
          'Pages marked for removal are cleanly unlinked from the root page tree, reducing output file size while preserving document structural integrity.',
      },
    ],
    considerations: [
      'Canvas thumbnails are purged from memory once the document session is finalized.',
      'Reordering maintains internal links, outline bookmarks, and vector layers.',
      'Export writes a clean, standards-compliant PDF file directly to local storage.',
    ],
  },
  'extract-pages': {
    title: 'Precision Page Slicing & Discrete Document Generation',
    engine: 'pdf-lib Page Tree Slicing & Memory Array Assembly',
    aspects: [
      {
        heading: 'Arbitrary & Inverted Sequence Support',
        description:
          'Pages can be extracted in any sequence—including non-consecutive or inverted orders (e.g. 5, 2, 1). The target document builds a clean reference tree according to your exact ordering.',
      },
      {
        heading: 'Zero Rasterization Guarantee',
        description:
          'Extracted pages are never converted to flat bitmap images. Selectable text, searchable words, embedded vectors, and hyperlink annotations remain intact.',
      },
      {
        heading: 'Single-Pass Memory Efficiency',
        description:
          'Target pages are copied in a single memory pass into a fresh PDF container, minimizing heap consumption even when handling multi-hundred-page archives.',
      },
    ],
    considerations: [
      'Out-of-bounds page entries are validated and highlighted prior to generation.',
      'Extracted files have their own independent page numbering starting at 1.',
      'Runs locally inside your web browser sandbox with zero cloud exposure.',
    ],
  },
  'rotate-pdf': {
    title: 'Metadata-Level Page Rotation & Geometry Alignment',
    engine: 'pdf-lib /Rotate Dictionary Tag Manipulation',
    aspects: [
      {
        heading: 'Instantaneous Metadata Modification',
        description:
          'Rotating pages alters only the /Rotate entry in the page dictionary. Because no graphical recalculation or image re-encoding is performed, processing completes near-instantaneously.',
      },
      {
        heading: 'Cumulative Angle Normalization',
        description:
          'Documents with pre-existing rotation flags are normalized correctly. Adding 90° to a page previously rotated by 270° calculates to 0° rather than producing malformed rotation values.',
      },
      {
        heading: 'Selective vs Global Rotation',
        description:
          'Rotate all pages uniformly (ideal for landscape scanner batches) or target specific odd/even pages to fix upside-down scanned pages.',
      },
    ],
    considerations: [
      'Rotated pages retain their original MediaBox and CropBox coordinate boundaries.',
      'Compatible with standard PDF readers including Adobe Acrobat, Apple Preview, and mobile viewers.',
      'No quality loss or file size expansion occurs during rotation.',
    ],
  },
  'crop-pdf': {
    title: 'Coordinate Box Manipulation & Bounding Box Adjustment',
    engine: 'PDF Box Hierarchy Modification (CropBox & MediaBox Geometry)',
    aspects: [
      {
        heading: 'PDF Coordinate Box Hierarchy',
        description:
          'PDFs define boundaries via MediaBox (physical paper), CropBox (viewable area), and TrimBox. Our cropping tool updates the CropBox coordinates to trim unwanted margins without altering core page data.',
      },
      {
        heading: 'Proportional Margin Trimming',
        description:
          'Trim headers, footers, printer crop marks, or excessive scanning margins uniformly across selected pages or custom document subsets.',
      },
      {
        heading: 'Non-Destructive Viewport Adjustments',
        description:
          'Because cropping adjusts viewable boundaries, visual elements outside the CropBox are hidden from view in compliant readers while original vector objects remain intact.',
      },
    ],
    considerations: [
      'To permanently remove sensitive text outside the crop area, use metadata removal or redaction.',
      'Standard PDF viewers and printing dialogs default to displaying the cropped boundaries.',
      'All boundary recalculations happen locally in memory.',
    ],
  },

  // --- 2. Security & Compliance Category ---
  'protect-pdf': {
    title: 'PDF Security & Cryptographic Standards',
    engine: 'Standard Cryptographic Engine (AES-256 / AES-128)',
    aspects: [
      {
        heading: 'Standard Cipher Specifications',
        description:
          'Documents are protected using standard symmetric key cryptography (AES-256 or AES-128) specified in PDF standards. Passwords derive cryptographic keys via standard PBKDF2 hashing routines.',
      },
      {
        heading: 'User (Open) vs Owner (Permissions) Passwords',
        description:
          'User passwords require authentication simply to view or decrypt the document. Owner passwords enforce restrictions on printing, content copying, and annotation modification.',
      },
      {
        heading: 'No Backdoor Policy',
        description:
          'Because the encryption standard is mathematically robust, forgotten passwords cannot be bypassed or recovered by PDFSimplify or any third party.',
      },
    ],
    considerations: [
      'Always keep a secure record of your password; encrypted files cannot be opened without the key.',
      'Local encryption prevents password transmission over the internet.',
      'Supported by standard PDF readers including Adobe Acrobat, Apple Preview, and modern web browsers.',
    ],
  },
  'unlock-pdf': {
    title: 'Decryption & Document Recovery Architecture',
    engine: 'Client-Side Cryptographic Decryption & XRef Re-generation',
    aspects: [
      {
        heading: 'In-Memory Decryption',
        description:
          'When you supply the correct password, your browser decrypts the document objects in local RAM, strips the encryption dictionary, and writes a standard unencrypted PDF stream.',
      },
      {
        heading: 'Preserving Document Layout',
        description:
          'Decryption does not alter page dimensions, vector layers, embedded images, or bookmarks. The output file is a clean, standard PDF that opens without password prompts.',
      },
      {
        heading: 'Owner vs User Authentication',
        description:
          'If a document has an owner password restricting printing or copying, authenticating with the owner password enables full permission restoration.',
      },
    ],
    considerations: [
      'You must possess the legitimate password to decrypt the document.',
      'Brute-force password guessing is not supported; enter the known password.',
      'All decryption math executes inside your local browser memory.',
    ],
  },
  'remove-pdf-metadata': {
    title: 'Document Sanitization & Metadata Packet Stripping',
    engine: 'PDF /Info Dictionary & XMP Metadata Stream Stripper',
    aspects: [
      {
        heading: 'Info Dictionary Purging',
        description:
          'Standard PDF metadata entries including Title, Author, Subject, Keywords, Creator software, Producer utility, and CreationDate are wiped from the root trailer dictionary.',
      },
      {
        heading: 'XMP Extensible Metadata Stream Neutralization',
        description:
          'Modern document processors embed extensive XML-based XMP metadata packets containing edit histories, camera models, and organization IDs. These streams are detached and pruned.',
      },
      {
        heading: 'Content Preservation',
        description:
          'Page contents, text streams, high-resolution figures, and document visual formatting remain completely untouched while stripping unseen metadata fingerprints.',
      },
    ],
    considerations: [
      'Crucial step prior to public release, legal discovery, or academic peer review.',
      'Removes software signatures left by Microsoft Word, Adobe InDesign, and scanner firmware.',
      'All scrubbing runs on your device with zero cloud file ingestion.',
    ],
  },
  'flatten-pdf': {
    title: 'AcroForm Baking & Graphic State Merging Architecture',
    engine: 'pdf-lib AcroForm Baking & Graphic State Merging',
    aspects: [
      {
        heading: 'Interactive Field Baking',
        description:
          'Editable text fields, checkboxes, and radio buttons are converted from interactive AcroForm widgets into static vector paths permanently drawn onto the page content stream.',
      },
      {
        heading: 'Annotation Appearance Solidification',
        description:
          'Annotation layers (comments, highlights, stamps) are merged into the underlying page dictionary, preventing subsequent viewers from repositioning or deleting markings.',
      },
      {
        heading: 'Cross-Device Rendering Stability',
        description:
          'Flattened documents look identical across all operating systems, mobile devices, and legacy PDF viewers that lack interactive form engines.',
      },
    ],
    considerations: [
      'Flattening is irreversible in the generated output; keep an editable original if future changes are needed.',
      'Essential for official document submission, government tax filing, and digital signature records.',
      'Reduces complex dictionary overhead, often decreasing file size.',
    ],
  },

  // --- 3. Optimization & Conversion Category ---
  'compress-pdf': {
    title: 'Understanding PDF Compression: Mechanics & Trade-offs',
    engine: 'HTML5 Canvas Bitmap Re-sampling & Object Stream Compaction',
    aspects: [
      {
        heading: 'Raster Image Optimization vs Vector Text',
        description:
          'PDF compression primarily targets embedded raster imagery (photos, scanned pages, and figures). Text layers, typography, and mathematical vector shapes occupy very little byte size and are preserved without visual degradation.',
      },
      {
        heading: 'Why Some PDFs Compress Minimally',
        description:
          'Documents composed entirely of vector text, forms, or images that are already aggressively compressed (such as pre-optimized WebP or JPEG streams) have little redundant data, resulting in smaller percentage reductions.',
      },
      {
        heading: 'Balancing Resolution & Readability',
        description:
          'Our compression modes allow you to select the appropriate balance between file size and display sharpness for email distribution, web publishing, or long-term storage.',
      },
    ],
    considerations: [
      'Scanned documents with high initial DPI yield the largest compression ratios.',
      'Pure digital PDFs containing only vector text and minimal images will see modest reductions.',
      'All processing runs locally on your device with no document copies transmitted over external networks.',
    ],
  },
  'ocr-pdf': {
    title: 'Optical Character Recognition: Engine & Capabilities',
    engine: 'Tesseract OCR Engine Compiled to WebAssembly',
    aspects: [
      {
        heading: 'In-Browser Machine Learning Pipeline',
        description:
          'The OCR utility utilizes neural network models compiled into WebAssembly to detect glyph contours, segment words, and recognize characters directly on your computer’s CPU.',
      },
      {
        heading: 'Invisible Searchable Text Layer',
        description:
          'Rather than replacing your visual scan with plain text, our engine positions an invisible, selectable text layer exactly over the original scanned characters. This preserves your document’s original appearance while enabling full-text search and copy-paste.',
      },
      {
        heading: 'Factors Influencing OCR Accuracy',
        description:
          'Recognition accuracy depends directly on image clarity, scan resolution (300 DPI recommended), skew angle, and contrast. High-contrast, unwrinkled pages yield near-flawless recognition.',
      },
    ],
    considerations: [
      'Clear, 300 DPI scans yield the highest recognition accuracy.',
      'Complex cursive handwriting or low-contrast thermal receipts may have lower recognition rates than clean printed typography.',
      'The OCR neural network model executes in memory within your browser sandbox.',
    ],
  },
  'jpg-to-pdf': {
    title: 'Image Packaging & Multi-Format Ingestion Architecture',
    engine: 'Multi-Format Image Parser (JPG, PNG, WebP) & In-Memory Container Assembler',
    aspects: [
      {
        heading: 'Broad Format Support: JPG, PNG, and WebP',
        description:
          'Although titled JPG to PDF for standard search recognition, the engine natively parses JPG, JPEG, PNG, and WebP images. Each file is decoded and embedded into a standards-compliant PDF wrapper.',
      },
      {
        heading: 'Dimension & Margin Matching',
        description:
          'Choose between fitting images to standard paper sizes (A4, US Letter) or preserving original image pixel aspect ratios to prevent letterboxing, stretching, or unwanted white borders.',
      },
      {
        heading: 'Zero Cloud Downsampling',
        description:
          'Image bytes are wrapped into PDF /XObject image streams directly in your browser. Original camera megapixels and color fidelity are preserved without cloud compression.',
      },
    ],
    considerations: [
      'Transparent PNG images are composited cleanly onto white backgrounds.',
      'Batch conversion bundles multiple photos into a single consolidated PDF document.',
      'Local RAM handles multi-image processing instantly without upload wait times.',
    ],
  },
  'pdf-to-jpg': {
    title: 'High-Resolution PDF Rasterization Engine',
    engine: 'Mozilla PDF.js Canvas Rasterization & In-Browser ZIP Compression',
    aspects: [
      {
        heading: 'Configurable Resolution Scales',
        description:
          'Select between Standard (1.5x scale / ~110 DPI), High (2.0x scale / ~150 DPI), and Ultra (3.0x scale / ~300 DPI) rendering profiles to match display vs print requirements.',
      },
      {
        heading: 'Vector Anti-Aliasing Fidelity',
        description:
          'Font glyphs and vector paths are rendered through HTML5 OffscreenCanvas with subpixel anti-aliasing, ensuring sharp typography even at zoomed resolutions.',
      },
      {
        heading: 'Zero-Padded Multi-Page Archiving',
        description:
          'Multi-page documents are converted sequentially and packaged into an in-memory ZIP archive with zero-padded filenames (e.g. page-001.jpg, page-002.jpg) for easy sorting.',
      },
    ],
    considerations: [
      'Ultra 3.0x scale requires more browser memory for large documents with 50+ pages.',
      'Produces standard JPEG images viewable on every operating system and mobile device.',
      'Processing executes purely on your device hardware with zero data uploads.',
    ],
  },
  'pdf-to-text': {
    title: 'Text Stream Extraction & Layout-Aware Tokenization',
    engine: 'PDF.js Glyph Stream Extractor & Layout-Aware Tokenizer',
    aspects: [
      {
        heading: 'Coordinate-Aware Reading Order',
        description:
          'PDF documents do not store text as sentences; they store positioned glyph coordinates. Our tokenizer sorts text items by vertical and horizontal baseline coordinates to reconstruct natural reading order.',
      },
      {
        heading: 'Multi-Page Delimited Formatting',
        description:
          'Extracted output separates consecutive pages with clear "--- Page N ---" headers, making the resulting plaintext file ideal for analysis, terminal pipelines, or LLM ingestion.',
      },
      {
        heading: 'Unicode & Ligature Preservation',
        description:
          'Standard typographical ligatures (such as "fi", "fl") and international accented characters are normalized into valid UTF-8 plaintext characters.',
      },
    ],
    considerations: [
      'Scanned PDFs without digital text layers require OCR PDF before plain text can be extracted.',
      'Downloads instantly as a clean .txt file without external software dependencies.',
      'Files with password protection must be unlocked before text extraction.',
    ],
  },
  'pdf-to-word': {
    title: 'OpenXML WordprocessingML (.docx) Reconstruction Architecture',
    engine: 'OpenXML WordprocessingML (.docx) In-Browser Serializer',
    aspects: [
      {
        heading: 'Paragraph & Style Mapping',
        description:
          'Font sizes, line heights, and paragraph boundaries extracted from PDF text matrices are mapped to OpenXML <w:p> and <w:r> run elements, preserving headings, bold styling, and italics.',
      },
      {
        heading: 'Tabular Structure Detection',
        description:
          'Aligned rows and columns are reconstructed using native Word table elements (<w:tbl>, <w:tr>, <w:tc>), ensuring numbers and tabular data can be edited in Word.',
      },
      {
        heading: 'Standards-Compliant Packaging',
        description:
          'Document XML parts, relationships, styles, and content types are compiled into a valid .docx ZIP container in browser memory, opening seamlessly in Microsoft Word, Google Docs, and LibreOffice.',
      },
    ],
    considerations: [
      'Best suited for text-centric and tabular business documents, contracts, and reports.',
      'Heavily stylized magazine layouts or floating desktop publishing designs may require minor spacing adjustments in Word.',
      'Client-side execution means confidential company documents never leave your local device.',
    ],
  },
  'pdf-to-ppt': {
    title: 'PresentationML (.pptx) Slide Reconstruction Architecture',
    engine: 'PresentationML (.pptx) Slide Architecture Serializer',
    aspects: [
      {
        heading: 'Slide-by-Slide Geometry Adaptation',
        description:
          'Each PDF page is translated into an individual presentation slide (<p:sld>). Page aspect ratios are analyzed to automatically format slides in standard 16:9 widescreen or portrait orientation.',
      },
      {
        heading: 'Vector Text Shape Boxing',
        description:
          'Text lines are clustered into editable text boxes with matching font sizes and colors, allowing slide presenters to modify bullet points, titles, and captions.',
      },
      {
        heading: 'Vector & Raster Content Preservation',
        description:
          'Background elements, figures, and high-resolution images are mapped to slide shape trees without downsampling, maintaining presentation visual impact.',
      },
    ],
    considerations: [
      'Generated .pptx files are fully compatible with Microsoft PowerPoint, Google Slides, and Apple Keynote.',
      'Complex CAD vector drawings are imported as high-fidelity background shapes.',
      'Zero server upload ensures confidential pitch decks and quarterly business reviews stay private.',
    ],
  },
  'pdf-to-excel': {
    title: 'SpreadsheetML (.xlsx) Tabular Parsing & Grid Assembly',
    engine: 'SpreadsheetML (.xlsx) Tabular Parsing & JSZip Package Generation',
    aspects: [
      {
        heading: 'Coordinate-Based Cell Clustering',
        description:
          'Text glyphs with overlapping horizontal baselines and aligned vertical column coordinates are clustered into spreadsheet cells (<c r="A1">), reconstructing financial grids from PDFs.',
      },
      {
        heading: 'Intelligent Type Detection',
        description:
          'Numeric entries, currency figures, percentages, and dates are recognized and stored as native spreadsheet numeric types rather than strings, enabling formulas and sums to work immediately.',
      },
      {
        heading: 'Multi-Sheet Organization',
        description:
          'Choose between compiling all document tables into a single master sheet or splitting each PDF page into its own dedicated workbook tab.',
      },
    ],
    considerations: [
      'Optimized for financial statements, bank records, invoices, and structured data tables.',
      'Scanned PDFs without selectable text require OCR conversion before spreadsheet cell extraction.',
      'Exports clean .xlsx files ready for immediate use in Microsoft Excel and Google Sheets.',
    ],
  },
  'pdf-to-csv': {
    title: 'RFC 4180 CSV Tabular Extraction Architecture',
    engine: 'Coordinate-Aware Table Parser & RFC 4180 CSV Serializer',
    aspects: [
      {
        heading: 'Spatial Column Boundary Detection',
        description:
          'Our client-side engine calculates inter-column whitespace thresholds to differentiate distinct data cells from spaces within a single text block.',
      },
      {
        heading: 'RFC 4180 Compliant Escaping',
        description:
          'Cells containing commas, quotation marks, or line breaks are wrapped in double quotes and escaped according to RFC 4180 standards to prevent CSV parsing errors.',
      },
      {
        heading: 'Lightweight Data Science Pipeline',
        description:
          'Outputs clean, comma-delimited plaintext files ready for immediate ingestion into Python Pandas, R, SQL databases, or business intelligence tools.',
      },
    ],
    considerations: [
      'Fast, minimal overhead processing that executes even on low-powered mobile devices.',
      'Works with native selectable PDF tables; scanned images require OCR first.',
      'Completely private processing ensures sensitive financial records never touch cloud servers.',
    ],
  },
  'pdf-to-markdown': {
    title: 'Semantic Markdown Structure & Document Parsing',
    engine: 'Semantic Hierarchy Parser & Markdown Serializer',
    aspects: [
      {
        heading: 'Font-Size Heading Deduction',
        description:
          'By analyzing relative typography scale across pages, the parser deduces structural headings and prefixes them with appropriate Markdown tokens (#, ##, ###).',
      },
      {
        heading: 'List & Table Formatting',
        description:
          'Bullet points and numbered outlines are formatted as standard Markdown lists, and aligned data grids are formatted into GitHub Flavored Markdown (GFM) pipe tables.',
      },
      {
        heading: 'LLM & Developer Optimization',
        description:
          'Strips binary PDF container overhead while preserving semantic document structure, making the resulting .md file ideal for feeding documentation into AI models or static site generators.',
      },
    ],
    considerations: [
      'Extracts clean UTF-8 plaintext with clear hierarchical section boundaries.',
      'Complex floating layout sidebars are linearized into continuous reading flow.',
      'Zero server round-trips guarantee confidentiality of proprietary documentation.',
    ],
  },
  'extract-images': {
    title: 'XObject Binary Parsing & Raw Image Stream Extraction',
    engine: 'PDF /XObject Resource Tree Parser & Stream Extractor',
    aspects: [
      {
        heading: 'Original Binary Stream Extraction',
        description:
          'Rather than capturing screen renders, the extractor parses the PDF /Resources dictionary and extracts raw embedded image streams (JPEG, PNG masks, FlateDecode).',
      },
      {
        heading: 'Zero Quality Loss',
        description:
          'Extracted photos and diagrams retain their exact original resolution, color space, and pixel dimensions as initially embedded by the author.',
      },
      {
        heading: 'Batch Packaging',
        description:
          'All extracted image assets across the document are numbered sequentially and bundled into a single ZIP archive for one-click downloading.',
      },
    ],
    considerations: [
      'Extracts embedded raster images; vector shapes composed of line instructions are not raster images and remain part of the PDF.',
      'Color profiles (ICC profiles) embedded with images are preserved where present.',
      'Operates entirely in local browser RAM without transmitting image assets.',
    ],
  },
  'resize-pdf': {
    title: 'Proportional Vector Scaling & Page Matrix Resizing',
    engine: 'pdf-lib Page Matrix Scaling & MediaBox Adjustment',
    aspects: [
      {
        heading: 'Standard Dimensions Library',
        description:
          'Convert documents between standard international and North American sizes including A4, A3, A5, US Letter, Legal, and Tabloid.',
      },
      {
        heading: 'Mathematical Vector Scaling',
        description:
          'Because vectors scale via coordinate transformation matrices, text, lines, and figures rescale with zero blurriness, pixelation, or downsampling.',
      },
      {
        heading: 'Auto-Centering & Aspect Ratio Protection',
        description:
          'When converting between differing aspect ratios (such as US Letter to A4), content is automatically centered on the new canvas with proportional margins.',
      },
    ],
    considerations: [
      'Useful for standardizing mixed-size documents prior to printing or commercial binding.',
      'Selectable text layers and interactive links remain fully functional after scaling.',
      'Fast, local processing with zero external server dependencies.',
    ],
  },
  'grayscale-pdf': {
    title: 'Luminance-Preserving Desaturation & Ink Optimization',
    engine: 'DeviceGray Color Space Mapping & Canvas Desaturation',
    aspects: [
      {
        heading: 'Precise Luminance Calculation',
        description:
          'Colors are converted to grayscale using standard ITU-R luminance formulas (0.299R + 0.587G + 0.114B), ensuring high visual contrast between text and colored backgrounds.',
      },
      {
        heading: 'Printer Ink & Toner Savings',
        description:
          'Converting color brochures, scanned forms, and presentations to pure monochrome reduces printer toner consumption and prevents color cartridge depletion.',
      },
      {
        heading: 'Vector & Raster Desaturation',
        description:
          'Both embedded raster photography and vector fills are desaturated into standard DeviceGray color spaces.',
      },
    ],
    considerations: [
      'Ideal for academic printing, archival compliance, and legal filings that require black-and-white documents.',
      'Preserves original page geometry, text selectable layers, and bookmark navigation.',
      'Executes locally inside your browser memory.',
    ],
  },
  'header-footer': {
    title: 'Dynamic Page Stamping & Macro Substitution Architecture',
    engine: 'Dual-Margin Coordinate Projection & Dynamic Token Stamping',
    aspects: [
      {
        heading: 'Multi-Zone Precision Stamping',
        description:
          'Place custom text across six discrete target zones (Left, Center, Right in Header and Footer) with independent margin offsets.',
      },
      {
        heading: 'Dynamic Token Expansion',
        description:
          'Embed dynamic macros including [Page], [Total], [Date], and [Title]. The engine evaluates each token dynamically for every individual page in the document.',
      },
      {
        heading: 'Title Page Exclusions',
        description:
          'Configure headers and footers to start on page 2 or custom offsets, keeping cover pages clean and presentation-ready.',
      },
    ],
    considerations: [
      'Headers and footers are stamped as vector typography without rasterizing pages.',
      'Margin guards ensure stamped text does not overlap existing document content.',
      'Processes in-memory on your device with complete confidentiality.',
    ],
  },
  'add-page-numbers': {
    title: 'Typography Injection & Geometric Coordinate Mapping',
    engine: 'pdf-lib TrueType Glyphs & Coordinate Projection Engine',
    aspects: [
      {
        heading: 'Flexible Numbering Schemes',
        description:
          'Support for multiple numbering formats including simple numbers (1, 2, 3), "Page X of Y", Roman numerals (i, ii, iii), and custom prefix/suffix strings.',
      },
      {
        heading: 'Six Standard Anchor Presets',
        description:
          'Place numbers in top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right with millimeter-precise margin controls.',
      },
      {
        heading: 'Cover Page Suppression',
        description:
          'Easily skip cover pages or front matter, starting number sequences on page 2 or any custom starting index.',
      },
    ],
    considerations: [
      'Page numbers are embedded as true vector typography and remain crisp at any print resolution.',
      'Original text layers and document links remain untouched.',
      'All calculations run locally in your browser.',
    ],
  },
  'watermark-pdf': {
    title: 'Alpha-Blended Graphic State Stamping Architecture',
    engine: 'Matrix Transformation & Opacity Graphic State (/ExtGState) Stamping',
    aspects: [
      {
        heading: 'Alpha Transparency Controls',
        description:
          'Configure text transparency from 10% to 100% via PDF /ExtGState opacity dictionaries, ensuring underlying document text remains legible beneath status stamps.',
      },
      {
        heading: 'Rotational Geometry',
        description:
          'Apply diagonal -45° stamps (standard for "CONFIDENTIAL", "DRAFT", or "DO NOT COPY") or horizontal watermarks with customizable font sizes and colors.',
      },
      {
        heading: 'Tiled vs Center Stamping',
        description:
          'Choose between single centered watermark stamps or continuous repeating tiled patterns across the entire page canvas to deter unauthorized redistribution.',
      },
    ],
    considerations: [
      'Watermarks are injected as vector text states without rasterizing the underlying pages.',
      'Underlying document text remains fully searchable and selectable.',
      'Complete local processing ensures sensitive drafts are never uploaded.',
    ],
  },

  // --- 4. Interactive & Editor Category ---
  'pdf-editor': {
    title: 'Non-Destructive Annotation Architecture',
    engine: 'HTML5 Canvas Vector Overlay & pdf-lib Content Injection',
    aspects: [
      {
        heading: 'Zero Rasterization of Underlying Pages',
        description:
          'Many online editors rasterize (convert to flat images) entire PDF pages, degrading typography sharpness. PDFSimplify keeps the original PDF vectors untouched and injects annotations as standard PDF content streams.',
      },
      {
        heading: 'Coordinate Precision Across Rotations',
        description:
          'Annotations are mapped accurately regardless of whether individual pages have native 90°, 180°, or 270° rotation metadata, ensuring stamps and text appear exactly where intended.',
      },
      {
        heading: 'Multi-Layer Editing',
        description:
          'Add freehand drawings, rectangle highlights, text notes, and signatures with full undo/redo history and layer reordering before final export.',
      },
    ],
    considerations: [
      'Original vector paths and high-resolution images are preserved during editing.',
      'Signatures and drawings are rendered as vector paths for crisp print output.',
      'Saving generates a clean PDF without uploading document content to external servers.',
    ],
  },
  'sign-pdf': {
    title: 'Electronic Signature Placement & Coordinate Injection Architecture',
    engine: 'HTML5 Signature Canvas & pdf-lib Coordinate Injection',
    aspects: [
      {
        heading: 'Visual Electronic Signature Placement',
        description:
          'Create smooth vector signatures using touch, stylus, or mouse, or upload a clean signature scan. The signature is placed interactively onto any page and scaled with precision.',
      },
      {
        heading: 'Transparent Alpha Blending',
        description:
          'Signatures are embedded as high-resolution transparent image streams over the signature line, preserving the underlying contract text without opaque white box artifacts.',
      },
      {
        heading: 'Electronic vs Cryptographic Digital Signatures',
        description:
          'This tool applies visual electronic signatures suitable for standard business agreements, purchase orders, and rental contracts. It does not issue PKI cryptographic certificates (X.509 certificates).',
      },
    ],
    considerations: [
      'Signatures are embedded directly into the document content stream in local memory.',
      'Documents remain fully editable unless subsequently flattened.',
      'Zero server storage ensures personal signature handwriting is never stored on third-party servers.',
    ],
  },
  'fill-pdf': {
    title: 'AcroForm Interactive Field Inspection & Population',
    engine: 'pdf-lib Interactive AcroForm Parser & Stream Field Injector',
    aspects: [
      {
        heading: 'AcroForm Field Inspection',
        description:
          'The parser inspects the document catalog for /AcroForm dictionaries, extracting interactive text inputs, checkboxes, radio groups, and dropdown options with their default values.',
      },
      {
        heading: 'Interactive In-Browser Population',
        description:
          'Fill out form fields through a streamlined, mobile-friendly interface. Values are written directly to field dictionaries in memory, preserving interactive usability for recipients.',
      },
      {
        heading: 'Optional Post-Fill Flattening',
        description:
          'Choose between leaving form fields interactive or flattening them into permanent page text to lock values before official submission.',
      },
    ],
    considerations: [
      'Works with standard interactive AcroForm PDFs; non-interactive scanned forms can be annotated using the PDF Editor.',
      'Populated documents can be saved, re-opened, and modified in any standard PDF reader.',
      'All form data stays completely private inside your device memory.',
    ],
  },
  'compare-pdf': {
    title: 'Visual & Structural Document Comparison',
    engine: 'Side-by-Side Dual Canvas Rendering & Diff Highlighting',
    aspects: [
      {
        heading: 'High-Resolution Visual Diffing',
        description:
          'Both PDF documents are rendered synchronously into memory canvases at identical DPI settings. Pixel-level difference algorithms highlight layout shifts, modified numbers, and text additions.',
      },
      {
        heading: 'Synchronized Navigation',
        description:
          'Page flipping and scroll actions are locked between the two documents, allowing instant visual spot-checking of complex legal contracts and engineering blueprints.',
      },
      {
        heading: 'Structural Integrity',
        description:
          'Neither document is modified during comparison. You can inspect differences between revisions with complete confidentiality.',
      },
    ],
    considerations: [
      'Best suited for comparing revisions of the same contract, specification, or presentation.',
      'Documents with differing page counts can be aligned by navigating individual pages.',
      'Comparison rendering runs locally without document transmission.',
    ],
  },
};

export function ToolEducationalContent({ tool }: ToolEducationalContentProps) {
  const deepDive = TOOL_DEEP_DIVES[tool.slug];

  if (!deepDive) {
    return null;
  }

  return (
    <section className="paper-sheet bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-7 space-y-5">
      <div className="space-y-1.5 border-b border-stone-100 dark:border-stone-800 pb-4">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-stone-500 dark:text-stone-400">
          <Cpu className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
          <span>{deepDive.engine}</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 font-sans">
          {deepDive.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deepDive.aspects.map((aspect, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-stone-50/60 dark:bg-stone-950/40 border border-stone-200/60 dark:border-stone-800/80 space-y-1.5"
          >
            <h3 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
              {aspect.heading}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-normal">
              {aspect.description}
            </p>
          </div>
        ))}
      </div>

      {deepDive.considerations.length > 0 && (
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block">
            Technical Notes
          </span>
          <ul className="space-y-1">
            {deepDive.considerations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-stone-400 dark:text-stone-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

