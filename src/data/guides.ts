import { GuideArticle } from '@/types/guide';

export const GUIDES_REGISTRY: GuideArticle[] = [
  {
    slug: 'how-browser-based-pdf-processing-works',
    title: 'How Browser-Based PDF Processing Works (And Why It Protects Your Privacy)',
    shortDescription:
      'Understand how modern WebAssembly and Web Workers enable full PDF manipulation directly in your browser without uploading files.',
    metaDescription:
      'Learn how client-side PDF processing works in modern web browsers. Understand the technology that protects your privacy without server uploads.',
    category: 'Privacy & Architecture',
    readTime: '5 min read',
    publishedDate: '2025-01-15',
    updatedDate: '2025-02-10',
    relatedToolSlug: 'merge-pdf',
    relatedGuides: ['how-to-merge-pdf-files', 'what-is-ocr'],
    content: {
      intro:
        'Historically, online PDF tools required you to upload confidential files to third-party servers. Today, modern web standards allow browsers to manipulate PDF documents locally on your device.',
      sections: [
        {
          heading: '1. The Problem with Traditional Server-Based PDF Converters',
          body: [
            'Traditional websites operate as file brokers: you pick a file, send it across the internet to their cloud servers, wait for a remote worker to alter it, and download it back.',
            'This architecture introduces severe privacy risks. Sensitive financial records, legal filings, medical summaries, and confidential contracts sit in remote temporary directories or cloud buckets, vulnerable to interception or data harvesting.',
          ],
        },
        {
          heading: '2. The Client-Side Paradigm: HTML5, WebAssembly, and Memory Arrays',
          body: [
            'Modern browsers are sophisticated execution environments capable of running low-level compilation targets.',
            'When you drop a file into iLikePDF, your browser reads the raw bytes into an ArrayBuffer in local RAM. Using pure JavaScript and WebAssembly libraries like pdf-lib and PDF.js, we parse the PDF object tree, rewrite xref tables, and draw canvas previews directly on your hardware.',
            'Your PDF is processed locally in your browser. No network payload containing your document data ever leaves your device. Once you close the tab, the memory is cleared.',
          ],
          callout: {
            type: 'info',
            text: 'You can verify this yourself: open your browser’s Network tab in Developer Tools and process a PDF. You will see zero outbound file upload requests.',
          },
        },
        {
          heading: '3. Technical Benefits and Considerations',
          body: [
            'Zero latency: Processing begins instantly without waiting for 50MB file uploads.',
            'No bandwidth costs: Perfect for users on metered connections or traveling with limited mobile hotspot data.',
            'Device limits: Because files run in your browser’s memory, processing 1GB+ archives requires sufficient RAM on your personal device.',
          ],
        },
      ],
      summary:
        'Client-side processing represents the future of document utility software: zero data custody, zero server upload risks, and lightning-fast local performance.',
    },
  },
  {
    slug: 'how-to-merge-pdf-files',
    title: 'How to Merge PDF Files Offline in Your Browser',
    shortDescription:
      'A step-by-step guide to combining multiple PDFs into one consolidated document quickly and privately.',
    metaDescription:
      'Step-by-step guide to merging PDF files directly in your web browser. Free, fast, private, and simple.',
    category: 'Organize',
    readTime: '4 min read',
    publishedDate: '2025-01-20',
    updatedDate: '2025-02-12',
    relatedToolSlug: 'merge-pdf',
    relatedGuides: ['how-to-split-a-pdf', 'how-to-organize-and-reorder-pdf-pages'],
    content: {
      intro:
        'Combining multiple PDF documents into a single cohesive report is one of the most common productivity tasks. Here is how to do it in seconds with complete privacy.',
      sections: [
        {
          heading: 'Why Merge Client-Side?',
          body: [
            'Whether compiling receipts for tax season or combining project blueprints, confidential documents should not reside on remote web servers.',
            'Client-side merging re-indexes page reference dictionaries in your browser RAM without touching an external server.',
          ],
        },
        {
          heading: 'Step-by-Step Instructions',
          body: [
            '1. Open the iLikePDF Merge tool.',
            '2. Drag and drop your target PDF files into the upload area, or browse your local file system.',
            '3. Reorder the files into your intended reading sequence by dragging file cards.',
            '4. Click "Merge PDF" to produce the combined file.',
            '5. Click "Download Merged PDF" to save the consolidated result to your Downloads folder.',
          ],
          callout: {
            type: 'tip',
            text: 'You can merge different page sizes (e.g. Letter and A4) into a single document seamlessly.',
          },
        },
      ],
      summary:
        'Merging PDFs in your browser is fast, preserves original resolution, and keeps your private paperwork strictly on your device.',
    },
  },
  {
    slug: 'how-to-split-a-pdf',
    title: 'How to Split a PDF into Separate Pages or Custom Ranges',
    shortDescription:
      'Learn how to pull apart large PDF documents into manageable chapters or individual pages.',
    metaDescription:
      'Learn how to split PDF files into individual pages or custom ranges without uploading files to third-party servers.',
    category: 'Organize',
    readTime: '3 min read',
    publishedDate: '2025-01-22',
    updatedDate: '2025-02-14',
    relatedToolSlug: 'split-pdf',
    relatedGuides: ['how-to-merge-pdf-files', 'how-to-extract-pages-from-a-pdf'],
    content: {
      intro:
        'Large multi-page PDF documents frequently contain extra boilerplate or sections you need to share separately. Splitting lets you isolate exactly what you need.',
      sections: [
        {
          heading: 'Splitting Methods',
          body: [
            'Custom Ranges: Extract grouped pages like "1-4, 8, 12-15" into targeted files.',
            'Burst to Single Pages: Convert a 20-page document into 20 standalone single-page PDFs.',
          ],
        },
        {
          heading: 'How to Split Using iLikePDF',
          body: [
            '1. Upload your multi-page PDF into the Split tool.',
            '2. Define your desired range intervals.',
            '3. Click Split PDF to generate the distinct sub-documents instantly in your browser.',
          ],
        },
      ],
      summary:
        'Extracting chapters or isolated pages takes seconds and requires no subscription or software installation.',
    },
  },
  {
    slug: 'how-to-compress-a-pdf',
    title: 'How to Compress a PDF and Reduce File Size in Your Browser',
    shortDescription:
      'Techniques for shrinking bloated PDF documents by stripping orphan objects and optimizing internal streams.',
    metaDescription:
      'Learn how to reduce PDF file size directly in your browser. Clean metadata, optimize object streams, and shrink documents privately.',
    category: 'Optimization',
    readTime: '4 min read',
    publishedDate: '2025-02-05',
    updatedDate: '2025-02-20',
    relatedToolSlug: 'compress-pdf',
    relatedGuides: ['how-to-organize-and-reorder-pdf-pages', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'Email attachments and government portals frequently impose strict file size limits (e.g. 5MB or 10MB). Discover how client-side PDF optimization reduces file weight without sacrificing legibility.',
      sections: [
        {
          heading: 'What Makes PDF Files Bloated?',
          body: [
            'PDFs accumulate hidden bloat over time: redundant embedded font subsets, unreferenced orphan objects, excessive thumbnail streams, and uncompressed XML metadata catalogs.',
            'By inspecting the internal Cross-Reference (xref) table, an optimizer can purge dead object pointers and re-pack content streams using FlateDecode compression.',
          ],
        },
        {
          heading: 'Optimization Best Practices',
          body: [
            '1. Clean metadata catalogs: Strip legacy editing logs and revision trees.',
            '2. Flatten unnecessary form XObjects if interactive fields are no longer needed.',
            '3. Maintain vector text fidelity: True compression should never blur typography or vector diagrams.',
          ],
          callout: {
            type: 'info',
            text: 'Text-heavy documents with few images are already compact; the biggest percentage gains occur in scanned documents or multi-author revisions.',
          },
        },
      ],
      summary:
        'Local PDF optimization is fast, confidential, and lets you fit within email attachment limits without transmitting documents to cloud queues.',
    },
  },
  {
    slug: 'how-to-organize-and-reorder-pdf-pages',
    title: 'How to Visually Organize, Reorder, and Delete PDF Pages',
    shortDescription:
      'A practical guide to rearranging pages, deleting unwanted sheets, and fixing document flow using a visual grid.',
    metaDescription:
      'Learn how to visually arrange, reorder, rotate, and delete PDF pages directly in your browser with complete privacy.',
    category: 'Organize',
    readTime: '3 min read',
    publishedDate: '2025-02-06',
    updatedDate: '2025-02-21',
    relatedToolSlug: 'organize-pdf',
    relatedGuides: ['how-to-rotate-pdf-pages', 'how-to-split-a-pdf'],
    content: {
      intro:
        'Scanning a multi-page agreement often produces upside-down pages or misplaced sections. Visual page organization lets you rectify document flow with drag-and-drop simplicity.',
      sections: [
        {
          heading: 'Visual Document Arrangement',
          body: [
            'Instead of guessing page numbers in text fields, modern browser tools render thumbnail previews of every page in real time.',
            'You can drag pages to new positions, rotate upside-down sheets by 90-degree increments, and duplicate sheets when duplicate forms are needed.',
          ],
        },
        {
          heading: 'Step-by-Step Instructions',
          body: [
            '1. Open Organize PDF and choose your document.',
            '2. Drag thumbnails into your intended reading sequence.',
            '3. Use the page rotate icon to correct individual orientations.',
            '4. Click the trash icon on blank or redundant pages to remove them.',
            '5. Click "Organize PDF" and download your clean document.',
          ],
        },
      ],
      summary:
        'Organizing pages visually guarantees that the final PDF looks exactly as intended before you distribute it.',
    },
  },
  {
    slug: 'how-to-rotate-pdf-pages',
    title: 'How to Permanently Rotate PDF Pages (0°, 90°, 180°, 270°)',
    shortDescription:
      'Why viewing rotation in Acrobat does not always save to disk, and how to permanently stamp correct page orientation.',
    metaDescription:
      'Learn how to permanently rotate PDF pages clockwise or counterclockwise directly in your browser without server uploads.',
    category: 'Organize',
    readTime: '3 min read',
    publishedDate: '2025-02-08',
    updatedDate: '2025-02-22',
    relatedToolSlug: 'rotate-pdf',
    relatedGuides: ['how-to-organize-and-reorder-pdf-pages', 'how-to-extract-pages-from-a-pdf'],
    content: {
      intro:
        'Have you ever rotated a PDF in your desktop viewer, only to have it open upside-down again when emailed to someone else? Here is why that happens and how to permanently fix it.',
      sections: [
        {
          heading: 'Viewport Rotation vs. Dictionary Rotation',
          body: [
            'Most desktop PDF viewers provide a "Rotate View" shortcut. This only changes how the current window displays the page on your monitor; it does NOT modify the PDF file structure on disk.',
            'To make rotation permanent, the page object dictionary must have its /Rotate entry updated to an integer multiple of 90 (0, 90, 180, or 270 degrees).',
          ],
          callout: {
            type: 'tip',
            text: 'Permanent rotation modifies the metadata dictionary, so vector text and embedded images remain 100% crisp without lossy re-encoding.',
          },
        },
        {
          heading: 'Steps to Permanently Rotate in Your Browser',
          body: [
            '1. Drag and drop your PDF into the Rotate PDF tool.',
            '2. Select individual pages or click Rotate All to orient every page 90°, 180°, or 270° clockwise or counter-clockwise.',
            '3. Click Apply and download your permanently rotated PDF.',
          ],
        },
      ],
      summary:
        'Using iLikePDF Rotate updates the authentic PDF dictionary entries, ensuring all recipients see the pages oriented properly across every device.',
    },
  },
  {
    slug: 'how-to-extract-pages-from-a-pdf',
    title: 'How to Extract Pages from a PDF Document',
    shortDescription:
      'Select and extract specific pages or custom range intervals into a clean, standalone PDF file.',
    metaDescription:
      'Extract single pages or ranges from any PDF document in your browser. Fast, free, and completely local.',
    category: 'Organize',
    readTime: '3 min read',
    publishedDate: '2025-02-09',
    updatedDate: '2025-02-23',
    relatedToolSlug: 'extract-pages',
    relatedGuides: ['how-to-split-a-pdf', 'how-to-organize-and-reorder-pdf-pages'],
    content: {
      intro:
        'When you only need pages 3, 7, and 12-15 from a 100-page manual, page extraction creates a lightweight, focused document ready for sharing.',
      sections: [
        {
          heading: 'Precision Extraction Approaches',
          body: [
            'Click Selection: Click individual thumbnail cards to curate a custom set of pages.',
            'Range Notation: Type expressions like "1-3, 5, 8-10" to extract batches instantaneously.',
          ],
        },
        {
          heading: 'Preserving Document Fidelity',
          body: [
            'High-quality extraction clones the exact page content stream, including vector fonts and embedded images, while stripping unneeded pages from the xref table.',
          ],
        },
      ],
      summary:
        'Extracted PDFs maintain original vector quality, hyperlinks, and bookmarks without unnecessary document bulk.',
    },
  },
  {
    slug: 'how-to-convert-jpg-to-pdf',
    title: 'How to Convert JPG and PNG Images to PDF Documents',
    shortDescription:
      'Compile photos, scanned receipts, and graphic images into a single standardized PDF file.',
    metaDescription:
      'Convert JPG and PNG images into a professional PDF in your browser. Custom page sizes, margins, and orientations with zero uploads.',
    category: 'Convert',
    readTime: '4 min read',
    publishedDate: '2025-02-11',
    updatedDate: '2025-02-24',
    relatedToolSlug: 'jpg-to-pdf',
    relatedGuides: ['how-to-convert-pdf-to-jpg', 'how-to-merge-pdf-files'],
    content: {
      intro:
        'Photos of paperwork taken with smartphones are difficult to print consistently. Converting images into a standardized PDF formats them into clean, paginated reports.',
      sections: [
        {
          heading: 'Image Embedding vs. Quality Preservation',
          body: [
            'Direct image embedding places JPEG and PNG byte streams into PDF XObjects without lossy canvas recompression.',
            'This preserves the full resolution of your original camera photos while standardizing dimensions to Letter or A4 standards.',
          ],
        },
        {
          heading: 'Configurable Layout Options',
          body: [
            'Fit to Page: Scales large camera photos to fit within page borders.',
            'Margins: Adds comfortable white borders for hole punching or stapling.',
            'Orientation: Supports portrait, landscape, or automatic per-image orientation detection.',
          ],
        },
      ],
      summary:
        'Converting images to PDF provides a universal document format that opens identically on any computer or mobile phone.',
    },
  },
  {
    slug: 'how-to-convert-pdf-to-jpg',
    title: 'How to Convert PDF Pages to High-Resolution JPG Images',
    shortDescription:
      'Render vector PDF pages into crisp JPEG image files for presentations, web publishing, or archiving.',
    metaDescription:
      'Convert PDF pages into high-resolution JPG images directly in your browser. Download individual images or complete ZIP archives.',
    category: 'Convert',
    readTime: '4 min read',
    publishedDate: '2025-02-12',
    updatedDate: '2025-02-25',
    relatedToolSlug: 'pdf-to-jpg',
    relatedGuides: ['how-to-convert-jpg-to-pdf', 'how-to-extract-text-from-a-pdf'],
    content: {
      intro:
        'When you need to insert a PDF slide into PowerPoint or share a page on social media, rasterizing PDF pages into high-definition JPEG images is the ideal solution.',
      sections: [
        {
          heading: 'Canvas Rasterization at Scale',
          body: [
            'Using Mozilla PDF.js, each page is rasterized onto an offscreen HTML5 canvas at 2x density (144-150 DPI) to ensure sharp text rendering.',
            'Images are converted to JPEG blobs sequentially with strict memory recycling, preventing browser memory crashes on large documents.',
          ],
          callout: {
            type: 'tip',
            text: 'For multi-page files, iLikePDF bundles all rendered JPEG images into a single zero-padded ZIP archive (e.g. page-001.jpg) for easy extraction.',
          },
        },
        {
          heading: 'Batch Processing and Resolution Control',
          body: [
            'Select any PDF document from your device. Each page is processed sequentially in local memory to preserve high quality without consuming excessive system resources.',
            'Once rendering completes, download individual pages as high-resolution images or save the complete document packaged as an organized ZIP archive.',
          ],
        },
      ],
      summary:
        'Exporting PDF pages to images allows universal previewing on any image gallery or presentation software.',
    },
  },
  {
    slug: 'how-to-extract-text-from-a-pdf',
    title: 'How to Extract Plain Text from a PDF Without Software',
    shortDescription:
      'Extract selectable text streams with correct reading order, line breaks, and word counts in your browser.',
    metaDescription:
      'Extract readable plain text from PDF documents in your browser. Preserves reading order and paragraphs without cloud uploads.',
    category: 'Convert',
    readTime: '3 min read',
    publishedDate: '2025-02-14',
    updatedDate: '2025-02-26',
    relatedToolSlug: 'pdf-to-text',
    relatedGuides: ['what-is-ocr', 'how-to-convert-pdf-to-jpg'],
    content: {
      intro:
        'Copying large sections of text from a multi-page PDF often results in garbled line breaks or missing spaces. Text extraction reconstructs the natural reading flow automatically.',
      sections: [
        {
          heading: 'Reading Order Reconstruction',
          body: [
            'PDFs store text snippets with absolute (X, Y) coordinates rather than paragraphs. A quality text extractor groups text items by vertical baseline and horizontal proximity.',
            'This produces formatted paragraphs and maintains column structure for straightforward copying into Word or Google Docs.',
          ],
        },
        {
          heading: 'Digital vs. Scanned Documents',
          body: [
            'Digital PDFs with selectable text extract instantaneously.',
            'If a PDF is a photo scan, text extraction will notify you that the file contains no digital text layer and recommend OCR processing.',
          ],
        },
      ],
      summary:
        'Plain text extraction strips away visual styling, giving you clean, raw text for analysis, summarization, or translation.',
    },
  },
  {
    slug: 'how-to-add-page-numbers-to-a-pdf',
    title: 'How to Add Page Numbers to a PDF Document',
    shortDescription:
      'Stamp sequential page numbering across headers and footers with custom positions, offsets, and formats.',
    metaDescription:
      'Add page numbers to PDF documents in your browser. Choose position, font size, custom starting numbers, and page range offsets.',
    category: 'Enhance',
    readTime: '3 min read',
    publishedDate: '2025-02-15',
    updatedDate: '2025-02-27',
    relatedToolSlug: 'add-page-numbers',
    relatedGuides: ['how-to-add-a-watermark-to-a-pdf', 'how-to-organize-and-reorder-pdf-pages'],
    content: {
      intro:
        'Professional submissions, academic dissertations, and legal briefs require clean, consistent page numbering. Here is how to stamp numbers onto your document without altering underlying vector art.',
      sections: [
        {
          heading: 'Positioning & Format Styles',
          body: [
            'Common Formats: "Page X of Y", "X / Y", or simple numerals "1, 2, 3".',
            'Placements: Bottom-center, bottom-right, bottom-left, top-right, or custom margin offsets.',
          ],
        },
        {
          heading: 'Rotation-Aware Stamping',
          body: [
            'Documents often contain mixed portrait and landscape orientations. A robust page numbering engine calculates rotation-aware coordinate transforms (0°, 90°, 180°, 270°) so that numbers always appear at the visual foot of each page.',
          ],
        },
      ],
      summary:
        'Stamping page numbers provides formal document organization suitable for publication or court filings.',
    },
  },
  {
    slug: 'how-to-add-a-watermark-to-a-pdf',
    title: 'How to Watermark a PDF with Text or Stamps',
    shortDescription:
      'Brand your documents or declare status (CONFIDENTIAL, DRAFT) with customizable opacity and rotation.',
    metaDescription:
      'Add text watermarks to PDF files in your browser. Customize opacity, angle, color, and position with 100% privacy.',
    category: 'Enhance',
    readTime: '3 min read',
    publishedDate: '2025-02-16',
    updatedDate: '2025-02-27',
    relatedToolSlug: 'watermark-pdf',
    relatedGuides: ['how-to-protect-a-pdf', 'how-to-add-page-numbers-to-a-pdf'],
    content: {
      intro:
        'Whether distributing preview manuscripts or safeguarding proprietary trade secrets, watermarking clearly signals document confidentiality.',
      sections: [
        {
          heading: 'Diagonal vs. Tiled Watermarks',
          body: [
            'Diagonal Center: A large semi-transparent stamp (e.g. 45-degree angle) spanning the center of every page.',
            'Tiled Repeating Grid: A repeating matrix of subtle markings across the entire background, making unauthorized redaction difficult.',
          ],
        },
        {
          heading: 'Opacity Control',
          body: [
            'Setting opacity between 15% and 25% ensures the watermark remains clearly visible to readers while keeping the text underneath completely legible.',
          ],
        },
      ],
      summary:
        'Client-side watermarking embeds text layers directly into the PDF content stream without exposing confidential files to online servers.',
    },
  },
  {
    slug: 'how-to-protect-a-pdf',
    title: 'How to Password Protect and Encrypt a PDF with AES-256',
    shortDescription:
      'Secure confidential documents with military-grade encryption and configurable permissions in your browser.',
    metaDescription:
      'Password protect PDF documents client-side using authentic AES-256 encryption. Control printing, copying, and modification permissions.',
    category: 'Security',
    readTime: '4 min read',
    publishedDate: '2025-02-18',
    updatedDate: '2025-02-28',
    relatedToolSlug: 'protect-pdf',
    relatedGuides: ['how-to-unlock-a-pdf', 'how-to-add-a-watermark-to-a-pdf'],
    content: {
      intro:
        'Sending unencrypted financial statements or proprietary agreements over email is a major data security risk. Encrypting PDFs with AES-256 ensures only authorized recipients with the password can open them.',
      sections: [
        {
          heading: 'Standard AES-256 Encryption',
          body: [
            'Standard PDF encryption applies 256-bit Advanced Encryption Standard (AES) cipher algorithms to all document streams and cross-reference entries.',
            'Using modern Web Crypto API primitives, encryption happens directly inside your browser RAM. Your chosen password is never transmitted across the network.',
          ],
          callout: {
            type: 'warning',
            text: 'Always save your encryption password in a secure password manager. Because iLikePDF does not store passwords or document copies, lost passwords cannot be recovered.',
          },
        },
        {
          heading: 'Configurable User Permissions',
          body: [
            'In addition to an open password, you can restrict permissions: disallowing printing, preventing text copying, and prohibiting annotations without an owner credential.',
          ],
        },
      ],
      summary:
        'Client-side encryption ensures enterprise-grade security without trusting third-party cloud servers with your passwords.',
    },
  },
  {
    slug: 'how-to-unlock-a-pdf',
    title: 'How to Unlock a Password-Protected PDF (When You Know the Password)',
    shortDescription:
      'Permanently remove password encryption from documents you have authorized access to.',
    metaDescription:
      'Remove password protection from PDF documents client-side when you know the password. Fast, free, and processed locally in your browser.',
    category: 'Security',
    readTime: '3 min read',
    publishedDate: '2025-02-19',
    updatedDate: '2025-03-01',
    relatedToolSlug: 'unlock-pdf',
    relatedGuides: ['how-to-protect-a-pdf', 'how-to-merge-pdf-files'],
    content: {
      intro:
        'Repeatedly typing a password to open your monthly bank statements or insurance certificates is tedious. If you are authorized to view the file, you can decrypt and save an unencrypted copy.',
      sections: [
        {
          heading: 'Authentic Decryption vs. Password Cracking',
          body: [
            'iLikePDF does not crack passwords or bypass security. You provide the authentic password, the browser uses Web Crypto to decrypt the object streams, and the encryption dictionary is stripped from the document catalog.',
            'The output file can then be opened in any PDF viewer without password prompts.',
          ],
        },
        {
          heading: 'Zero Server Exposure for Passwords',
          body: [
            'Unlike traditional online unlockers where your document and password are sent across the web, iLikePDF unlocks documents entirely inside your browser memory.',
            'Neither your original document, decrypted contents, nor entered passwords ever leave your computer or touch an external server.',
          ],
        },
      ],
      summary:
        'Permanently unlocking authorized files streamlines document workflows while keeping credentials local to your device.',
    },
  },
  {
    slug: 'how-to-edit-a-pdf',
    title: 'How to Edit a PDF in Your Browser (Annotate, Draw, and Sign)',
    shortDescription:
      'Add text annotations, draw shapes, highlight passages, and place digital signatures directly on your PDF.',
    metaDescription:
      'Edit PDF documents directly in your browser with complete privacy. Add text, shapes, highlights, and sign documents locally.',
    category: 'Enhance',
    readTime: '5 min read',
    publishedDate: '2025-02-22',
    updatedDate: '2025-03-02',
    relatedToolSlug: 'pdf-editor',
    relatedGuides: ['how-to-add-a-watermark-to-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'Need to fill out an application, sign an agreement, or markup a draft? You do not need expensive desktop software like Adobe Acrobat for everyday visual annotations.',
      sections: [
        {
          heading: 'Interactive Canvas Annotations',
          body: [
            'iLikePDF provides a full-featured visual editor running on HTML5 Canvas. You can type text anywhere on the page, customize font size and color, draw vector shapes (rectangles, ellipses, arrows, lines), and apply semi-transparent highlights.',
            'All edits exist as vector objects that you can select, move, resize, align, or reorder at any time.',
          ],
        },
        {
          heading: 'Signing Documents Privately',
          body: [
            'Draw your handwritten signature using a mouse, trackpad, or touch screen. The signature is rendered with cubic bezier smoothing and stamped directly into the exported document.',
            'Because everything runs client-side, your personal signature mark is never uploaded to an external server.',
          ],
          callout: {
            type: 'tip',
            text: 'Use keyboard shortcuts (Ctrl+Z for undo, Ctrl+S for export, arrow keys for 1pt precision nudge) to edit documents faster.',
          },
        },
      ],
      summary:
        'The in-browser PDF Editor gives you document annotation and signing capabilities with zero subscription fees and client-side processing.',
    },
  },
  {
    slug: 'what-is-ocr',
    title: 'What Is OCR and How Does Optical Character Recognition Work?',
    shortDescription:
      'Discover how OCR converts pictures of letters into searchable, selectable text streams.',
    metaDescription:
      'A beginner-friendly guide to Optical Character Recognition (OCR) and how scanned PDFs become selectable text.',
    category: 'Technology',
    readTime: '5 min read',
    publishedDate: '2025-02-01',
    updatedDate: '2025-02-18',
    relatedToolSlug: 'ocr-pdf',
    relatedGuides: ['how-browser-based-pdf-processing-works', 'how-to-extract-text-from-a-pdf'],
    content: {
      intro:
        'If you have ever scanned a physical paper document with an office scanner or smartphone camera, you may have noticed you cannot highlight or copy the text. Here is why, and how OCR fixes it.',
      sections: [
        {
          heading: 'Image Pixels vs. Digital Vector Text',
          body: [
            'A digital PDF created in Word contains font glyph instructions and Unicode character mappings. The computer understands the word "contract" as specific letter codes.',
            'A scanned PDF, however, is simply a photo embedded inside a PDF wrapper. The computer sees only a grid of colored pixels, not words.',
          ],
        },
        {
          heading: 'How OCR Solves This',
          body: [
            'Optical Character Recognition (OCR) analyzes the pixel shapes, identifies baseline edges, and matches patterns to recognized letterforms.',
            'The engine then embeds an invisible, selectable text layer directly behind the scanned image, allowing you to highlight, search (Ctrl+F), and copy text.',
          ],
        },
      ],
      summary:
        'OCR transforms static photos of paper into actionable, indexable, and accessible digital documents.',
    },
  },

  // ==========================================
  // Phase 6C Guides
  // ==========================================
  {
    slug: 'how-to-convert-pdf-to-csv',
    title: 'How to Convert a PDF Table to CSV for Excel and Spreadsheets',
    shortDescription:
      'Learn how coordinate-aware browser extraction detects rows and columns to convert PDF tables into standard CSV files.',
    metaDescription:
      'Step-by-step guide on extracting tables from PDF files into CSV format. Fast, private, and browser-based with zero server uploads.',
    category: 'Create & Convert',
    readTime: '4 min read',
    publishedDate: '2025-02-15',
    updatedDate: '2025-02-22',
    relatedToolSlug: 'pdf-to-csv',
    relatedGuides: ['how-to-extract-text-from-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'PDF documents frequently store financial statements, research data, and inventory tables. However, copying tabular data directly from a PDF reader often scrambles the alignment into disorganized text strings. Here is how coordinate-aware extraction solves this.',
      sections: [
        {
          heading: 'Why Direct Copy-Paste Fails on PDF Tables',
          body: [
            'PDF documents are visual display representations, not semantic databases. Text is positioned with absolute X and Y coordinates rather than grid cells or HTML table tags.',
            'When you copy text across a row, standard PDF viewers often read vertically or group unrelated columns together based on stream order rather than visual alignment.',
          ],
        },
        {
          heading: 'How Browser-Side Table Extraction Works',
          body: [
            'Our engine extracts the exact coordinates of every text glyph on the page using Mozilla PDF.js.',
            'Vertical proximity clustering groups elements into horizontal rows, while horizontal anchor detection clusters text items into unified column bins.',
            'The resulting 2D matrix is encoded into RFC 4180 standard CSV text directly in browser memory, ready for immediate import into Excel, Google Sheets, or Python data pipelines.',
          ],
        },
        {
          heading: 'Handling Scanned Tables',
          body: [
            'If your PDF is a scan of a physical paper receipt or invoice, it contains only pixels rather than digital text. Run the document through OCR PDF first to generate a digital text layer before extracting to CSV.',
          ],
        },
      ],
      summary:
        'Converting PDF tables to CSV enables instant data analysis in spreadsheet software while keeping sensitive financial data private and secure on your local device.',
    },
  },
  {
    slug: 'pdf-to-markdown-guide',
    title: 'PDF to Markdown: What Gets Preserved and How It Works',
    shortDescription:
      'Discover how semantic typography analysis reconstructs headings, paragraphs, lists, and emphasis into clean GitHub Flavored Markdown.',
    metaDescription:
      'A complete guide to converting PDF documents to Markdown (.md). Understand how typography and layout are reconstructed into clean notes.',
    category: 'Create & Convert',
    readTime: '5 min read',
    publishedDate: '2025-02-16',
    updatedDate: '2025-02-24',
    relatedToolSlug: 'pdf-to-markdown',
    relatedGuides: ['how-to-extract-text-from-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'Markdown is the lingua franca of developer documentation, personal knowledge bases (Obsidian, Notion), and AI context prompts. Converting PDFs to clean Markdown allows seamless integration of static documents into modern note-taking and knowledge workflows.',
      sections: [
        {
          heading: 'Reconstructing Semantics from Visual Geometry',
          body: [
            'Standard PDFs lack HTML tags like <h1>, <p>, or <ul>. They only contain draw-string operators at specific coordinates.',
            'To generate meaningful Markdown, our client-side layout analyzer computes the median body font size across the entire document. Text items with font sizes 1.5× the median become Level 1 Headings (#), items 1.25× become Level 2 Headings (##), and remaining items form paragraphs.',
          ],
        },
        {
          heading: 'List and Emphasis Detection',
          body: [
            'Lines starting with bullet glyphs (•, -, *) or sequential numbers (1., 2.) are mapped into standard markdown list syntax.',
            'Embedded font descriptors identifying bold or italic variants are preserved as **bold** and *italic* markdown spans.',
          ],
        },
        {
          heading: 'Ideal Workflows for PDF to Markdown',
          body: [
            'Importing whitepapers, API specifications, and research papers into Obsidian or Notion.',
            'Preparing clean, token-efficient text for Large Language Model (LLM) prompts without messy binary formatting.',
            'Publishing documentation directly to GitHub repositories.',
          ],
        },
      ],
      summary:
        'Client-side PDF to Markdown converts rigid document layouts into flexible, portable, and easily editable text for modern digital knowledge systems.',
    },
  },
  {
    slug: 'how-to-extract-images-from-a-pdf',
    title: 'How to Extract Original Images from a PDF Without Quality Loss',
    shortDescription:
      'Extract full-resolution embedded raster pictures directly from PDF containers without taking low-quality screenshots.',
    metaDescription:
      'Learn how to extract original embedded JPG and PNG images from PDF documents in high resolution directly in your web browser.',
    category: 'Organize',
    readTime: '4 min read',
    publishedDate: '2025-02-18',
    updatedDate: '2025-02-25',
    relatedToolSlug: 'extract-images',
    relatedGuides: ['how-to-convert-pdf-to-jpg', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'When you need a photo embedded inside a PDF report or presentation, taking a desktop screenshot reduces resolution and degrades quality. Here is how direct stream extraction extracts the exact original image bytes.',
      sections: [
        {
          heading: 'How Images Live Inside a PDF',
          body: [
            'PDF documents store photographs and illustrations as independent XObject image streams inside the document container.',
            'Most digital photos are compressed using DCTDecode (the standard JPEG compression format). When you view the PDF, your viewer decompresses this stream to render the page.',
          ],
        },
        {
          heading: 'Direct Stream Extraction vs. Screenshots',
          body: [
            'Taking a screenshot captures only your display resolution (often 72 or 96 DPI), losing the underlying high-resolution details.',
            'Direct stream extraction reads the raw binary byte stream of the original embedded image directly from the PDF file structure. You get the 300 DPI original photograph exactly as the author uploaded it, without any recompression artifacts.',
          ],
        },
        {
          heading: 'Handling Duplicate Images and Icons',
          body: [
            'In corporate brochures, company logos and header graphics are often reused on every single page. Our extraction engine tracks indirect object reference IDs, preventing the same logo from being downloaded dozens of times.',
          ],
        },
      ],
      summary:
        'Direct browser-side image extraction recovers original photos, charts, and media assets in seconds with full fidelity and complete privacy.',
    },
  },
  {
    slug: 'how-to-flatten-a-fillable-pdf',
    title: 'How to Flatten a Fillable PDF Form (And Why You Should)',
    shortDescription:
      'Understand why flattening interactive forms prevents accidental tampering and ensures universal viewer compatibility.',
    metaDescription:
      'Guide to flattening PDF forms in your browser. Lock AcroForm fields permanently into page content for secure document submission.',
    category: 'Security',
    readTime: '4 min read',
    publishedDate: '2025-02-20',
    updatedDate: '2025-02-26',
    relatedToolSlug: 'flatten-pdf',
    relatedGuides: ['how-to-protect-a-pdf', 'how-to-edit-a-pdf'],
    content: {
      intro:
        'Fillable PDF forms are convenient for entering data, but submitting an interactive form to a court, bank, or government portal can cause unexpected problems. Flattening solves this.',
      sections: [
        {
          heading: 'The Difference Between Interactive and Flattened PDFs',
          body: [
            'In an interactive AcroForm, form values exist inside dynamic input widgets floating above the page content. A recipient opening the file in a web browser or mobile phone might see empty boxes if their viewer lacks interactive form support.',
            'Flattening takes the current text in those boxes and "burns" it directly into the static vector page description. The input boxes disappear, and your answers become permanent text on the page.',
          ],
        },
        {
          heading: 'Security and Anti-Tampering Benefits',
          body: [
            'Interactive form fields can be altered by anyone who opens the document. Flattening locks your entered information, preventing accidental edits or unauthorized changes to signed agreements.',
            'Flattened documents are also significantly more reliable when archiving records or printing on commercial printing presses.',
          ],
        },
      ],
      summary:
        'Always flatten completed forms before emailing or archiving to guarantee that every recipient sees your answers exactly as you entered them.',
    },
  },
  {
    slug: 'how-to-remove-metadata-from-a-pdf',
    title: 'How to Remove Hidden Metadata from a PDF Before Sharing',
    shortDescription:
      'Protect your privacy by stripping author identities, editing timestamps, and software signatures from PDF documents.',
    metaDescription:
      'Learn how to inspect and remove sensitive document metadata from PDF files in your browser. Protect privacy before public sharing.',
    category: 'Privacy & Architecture',
    readTime: '4 min read',
    publishedDate: '2025-02-22',
    updatedDate: '2025-02-27',
    relatedToolSlug: 'remove-pdf-metadata',
    relatedGuides: ['how-to-protect-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'When you export a PDF from Word, Google Docs, or InDesign, the application automatically embeds hidden metadata tags. These tags can reveal your full name, company name, local computer username, software versions, and exact creation timestamps.',
      sections: [
        {
          heading: 'What Hidden Information Is Stored in a PDF?',
          body: [
            'Document Info Dictionaries store Title, Author, Subject, Keywords, Creator (application name), and Producer (PDF generation library).',
            'Many applications also embed XML Metadata (XMP) catalogs that track document revision history, original file paths on your hard drive, and device serial fingerprints.',
          ],
        },
        {
          heading: 'When Should You Remove Metadata?',
          body: [
            'Submitting anonymous peer reviews, job applications, or blind proposals.',
            'Sharing legal filings or investigative research where author identities must remain confidential.',
            'Publishing corporate whitepapers or press releases to prevent leaking internal author identities or draft timelines.',
          ],
        },
        {
          heading: 'How Local Stripping Works',
          body: [
            'iLikePDF reads the PDF dictionary and catalog streams directly in your browser. It clears standard info strings and deletes root XMP metadata streams without changing a single character of visible document text.',
          ],
        },
      ],
      summary:
        'Sanitizing document metadata takes only seconds and prevents unintentional leakage of personal and organizational information.',
    },
  },
  {
    slug: 'how-to-resize-pdf-pages',
    title: 'How to Change PDF Page Size (A4, US Letter, Legal) Without Blurriness',
    shortDescription:
      'Convert PDF dimensions between standard international paper sizes while preserving razor-sharp vector typography.',
    metaDescription:
      'Guide to resizing PDF pages to A4, Letter, Legal, or custom sizes. 100% vector-preserving with zero rasterization in your browser.',
    category: 'Edit & Annotate',
    readTime: '4 min read',
    publishedDate: '2025-02-24',
    updatedDate: '2025-02-28',
    relatedToolSlug: 'resize-pdf',
    relatedGuides: ['how-to-rotate-pdf-pages', 'how-to-organize-and-reorder-pdf-pages'],
    content: {
      intro:
        'Sharing documents internationally often creates printing issues due to regional paper size standards. European and Asian offices rely on A4 (210 × 297 mm), while North American offices use US Letter (8.5 × 11 in). Here is how to resize pages cleanly.',
      sections: [
        {
          heading: 'The Risk of Raster-Based Resizing',
          body: [
            'Many basic web converters resize PDFs by converting pages into low-resolution JPEG images and placing those images on a new canvas. This destroys selectable text, makes vector logos blurry, and balloons file size.',
            'Proper PDF resizing embeds the original vector page description inside a new page canvas, scaling the mathematical coordinate matrix without turning text into pixels.',
          ],
        },
        {
          heading: 'Scale to Fit vs. Center Modes',
          body: [
            'Scale to Fit: Proportionally scales the page content so the entire original layout fits inside the target paper dimensions with balanced margins. This is the recommended mode when converting between Letter and A4.',
            'Center: Keeps original content at 100% scale and centers it on the new paper size. Best when adding wider margins to an existing layout.',
          ],
        },
      ],
      summary:
        'Vector page resizing ensures your documents print cleanly on any standard paper tray anywhere in the world without quality degradation.',
    },
  },
  {
    slug: 'how-to-convert-pdf-to-grayscale',
    title: 'How to Convert a PDF to Grayscale for Printing and Archiving',
    shortDescription:
      'Transform full-color PDFs into monochrome black and white documents to save printer ink and standardize archives.',
    metaDescription:
      'Learn how to convert color PDF documents to grayscale in your browser. High-resolution print-ready monochrome conversion.',
    category: 'Optimize',
    readTime: '4 min read',
    publishedDate: '2025-02-25',
    updatedDate: '2025-03-01',
    relatedToolSlug: 'grayscale-pdf',
    relatedGuides: ['how-to-compress-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro:
        'Color printing is expensive, and many business archives, court systems, and scanning depositories require documents in uniform monochrome format. Here is how client-side grayscale conversion works.',
      sections: [
        {
          heading: 'Luminance-Weighted Grayscale Desaturation',
          body: [
            'Simply stripping color channels or averaging Red, Green, and Blue produces muddy contrast because human eyes perceive green light much brighter than blue light.',
            'Our engine applies standard ITU-R luminance weights (0.299 Red + 0.587 Green + 0.114 Blue) across pixel buffers. This preserves high visual contrast between dark text and colored backgrounds.',
          ],
        },
        {
          heading: 'Why Resolution Matters for Monochrome Printing',
          body: [
            'When converting color pages into print-ready grayscale, our browser engine renders pages at 2× DPI. This ensures fine text serifs, lines, and chart axes remain crisp when printed on office laser printers.',
          ],
        },
      ],
      summary:
        'Grayscale conversion standardizes document appearances and prevents costly color ink charges with instant local execution.',
    },
  },
  {
    slug: 'how-to-add-headers-and-footers-to-a-pdf',
    title: 'How to Add Headers, Footers, and Dynamic Page Numbers to a PDF',
    shortDescription:
      'Stamp professional document headers, confidentiality notices, and automated page numbers onto your PDFs.',
    metaDescription:
      'Step-by-step guide to adding headers and footers to PDF files in your browser. Customize titles, dates, and dynamic page numbering.',
    category: 'Edit & Annotate',
    readTime: '4 min read',
    publishedDate: '2025-02-26',
    updatedDate: '2025-03-02',
    relatedToolSlug: 'header-footer',
    relatedGuides: ['how-to-add-page-numbers-to-a-pdf', 'how-to-add-a-watermark-to-a-pdf'],
    content: {
      intro:
        'Whether preparing corporate audit reports, academic theses, or confidential legal discoveries, professional documents require clear headers and footers. Here is how to format your documents quickly.',
      sections: [
        {
          heading: 'Dynamic Tokens for Automated Pagination',
          body: [
            'Rather than typing page numbers manually on every page, use dynamic tokens like "Page {page} of {total}". The stamping engine calculates the exact page count and current sequence automatically.',
            'You can also include the current date ({date}) or confidentiality notices like "Confidential — Internal Distribution Only".',
          ],
        },
        {
          heading: 'Rotation and Alignment Awareness',
          body: [
            'PDFs with mixed portrait and landscape orientations can cause headers to appear sideways in basic editors.',
            'Our engine checks the rotation dictionary of each individual page, ensuring top headers always align to the visual top of the page and bottom footers align to the visual bottom.',
          ],
        },
      ],
      summary:
        'Custom headers and footers transform rough document drafts into polished, formal business presentations in seconds.',
    },
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES_REGISTRY.find((g) => g.slug === slug);
}

export function getRelatedGuides(slug: string, limit = 2): GuideArticle[] {
  const guide = getGuideBySlug(slug);
  if (!guide) return [];
  return guide.relatedGuides
    .map((s) => getGuideBySlug(s))
    .filter((g): g is GuideArticle => Boolean(g))
    .slice(0, limit);
}
