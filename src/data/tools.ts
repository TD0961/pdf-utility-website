import { ToolMetadata } from '@/types/tool';

export const TOOLS_REGISTRY: ToolMetadata[] = [
  // --- Category: Organize ---
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    shortDescription: 'Combine multiple PDF documents into a single organized file in seconds.',
    metaDescription: 'Merge multiple PDF files into one directly in your browser. Fast, free, and 100% private with no server uploads.',
    category: 'organize',
    badge: 'Popular',
    status: 'available',
    icon: 'Combine',
    acceptsMultiple: true,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Combine unlimited PDF documents in your browser',
      'Drag and drop reordering of files',
      'Zero server upload — full local privacy',
      'Preserves original vector quality and links',
    ],
    howItWorks: 'iLikePDF reads each PDF file locally in memory using WebAssembly and Web Workers, reassembles the page hierarchy in the order you specify, and generates the consolidated PDF document directly on your device.',
    steps: [
      { step: 1, title: 'Select Files', description: 'Choose two or more PDF files from your device.' },
      { step: 2, title: 'Reorder Pages', description: 'Drag and drop files to set your preferred page sequence.' },
      { step: 3, title: 'Merge & Download', description: 'Click Merge PDF to assemble and instantly download your document.' },
    ],
    tips: [
      'Ensure files are sorted before merging for faster workflow.',
      'Check page count previews to confirm the files you intend to combine.',
    ],
    commonProblems: [
      'Encrypted or password-protected PDFs must be unlocked before merging.',
      'Extremely large files (e.g., >100MB each) require sufficient device RAM.',
    ],
    faqs: [
      {
        question: 'Are my PDF files uploaded to a remote server?',
        answer: 'No. iLikePDF operates 100% inside your web browser. Your files never leave your computer or mobile device.',
      },
      {
        question: 'Is there a limit on how many PDFs I can merge?',
        answer: 'There is no artificial limit imposed by our platform. Limits depend solely on your computer’s available memory.',
      },
    ],
    relatedTools: ['split-pdf', 'organize-pdf', 'extract-pages'],
    relatedGuides: ['how-to-merge-pdf-files', 'how-browser-based-pdf-processing-works'],
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    shortDescription: 'Separate pages or extract specific page ranges into standalone PDF files.',
    metaDescription: 'Split PDF files into individual pages or custom ranges locally in your browser with complete privacy.',
    category: 'organize',
    badge: 'Popular',
    status: 'available',
    icon: 'Split',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Split by page ranges (e.g. 1-3, 5, 8-10)',
      'Burst entire document into single-page PDFs',
      'Instant browser-side extraction',
      'No data sent over the internet',
    ],
    howItWorks: 'The document structure is parsed locally in the browser. You select page ranges or individual pages, and our engine creates new standalone PDF binaries instantly.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF file you wish to split.' },
      { step: 2, title: 'Specify Ranges', description: 'Enter the page numbers or ranges to extract.' },
      { step: 3, title: 'Split & Save', description: 'Process the file and save individual PDF parts.' },
    ],
    tips: [
      'Use commas for multiple ranges like 1-5, 8, 11-14.',
      'Preview thumbnails to verify exact page numbers.',
    ],
    commonProblems: [
      'Specifying page numbers higher than total pages will produce an error notice.',
    ],
    faqs: [
      {
        question: 'Can I split a scanned document?',
        answer: 'Yes, scanned PDFs can be split just as easily as digital PDFs.',
      },
    ],
    relatedTools: ['merge-pdf', 'extract-pages', 'organize-pdf'],
    relatedGuides: ['how-to-split-a-pdf'],
  },
  {
    slug: 'organize-pdf',
    name: 'Organize PDF',
    shortDescription: 'Sort, reorder, rotate, or delete individual pages with an intuitive visual grid.',
    metaDescription: 'Visually organize, reorder, rotate, and delete PDF pages directly in your browser. Fast and completely secure.',
    category: 'organize',
    status: 'available',
    icon: 'LayoutGrid',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Interactive visual thumbnail grid',
      'Drag-and-drop page reordering',
      'One-click page rotation and deletion',
      '100% private local execution',
    ],
    howItWorks: 'Page thumbnails are rendered in an HTML5 canvas locally. Reordering actions update an in-memory page index table, allowing seamless document restructuring.',
    steps: [
      { step: 1, title: 'Load PDF', description: 'Select your PDF document.' },
      { step: 2, title: 'Arrange Pages', description: 'Drag thumbnails to reorder or click icons to rotate or remove.' },
      { step: 3, title: 'Export', description: 'Download your newly arranged PDF.' },
    ],
    tips: ['Hover over thumbnails to access quick rotate and delete actions.'],
    commonProblems: ['Documents with hundreds of pages may take a few seconds to render all initial thumbnails.'],
    faqs: [
      {
        question: 'Does reorganizing alter image quality?',
        answer: 'No. Page organization modifies structural page pointers without re-compressing imagery.',
      },
    ],
    relatedTools: ['merge-pdf', 'rotate-pdf', 'extract-pages'],
    relatedGuides: ['how-to-rotate-pdf-pages'],
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF',
    shortDescription: 'Rotate upside-down or sideways pages 90, 180, or 270 degrees permanently.',
    metaDescription: 'Rotate PDF pages permanently in your browser. Fix orientation on all or individual pages with complete privacy.',
    category: 'organize',
    status: 'available',
    icon: 'RotateCw',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Rotate all pages or specific pages',
      'Clockwise and counter-clockwise rotation',
      'Permanent orientation saving',
      'Instant in-browser rendering',
    ],
    howItWorks: 'Adjusts the internal `/Rotate` metadata dictionary for selected pages directly inside the client without re-encoding content streams.',
    steps: [
      { step: 1, title: 'Select File', description: 'Upload the PDF needing orientation correction.' },
      { step: 2, title: 'Choose Rotation', description: 'Rotate all pages or click individual thumbnails.' },
      { step: 3, title: 'Save Document', description: 'Export the rotated document.' },
    ],
    tips: ['Use the Rotate All button to quickly orient documents scanned in landscape.'],
    commonProblems: ['Some viewers remember local viewing rotation; saving here applies a permanent document-level rotation.'],
    faqs: [
      {
        question: 'Will rotating reduce quality?',
        answer: 'No. Rotation is a metadata attribute transformation; original vectors and fonts are unmodified.',
      },
    ],
    relatedTools: ['organize-pdf', 'split-pdf'],
    relatedGuides: ['how-to-rotate-pdf-pages'],
  },
  {
    slug: 'extract-pages',
    name: 'Extract Pages',
    shortDescription: 'Pull out specific pages from a PDF document into a fresh, standalone file.',
    metaDescription: 'Extract specific pages from any PDF document directly in your browser. Completely private, fast, and free.',
    category: 'organize',
    status: 'available',
    icon: 'FileSpreadsheet',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Select pages via visual grid or comma-separated numbers',
      'Preserve bookmarks and links where available',
      'Client-side extraction with zero upload',
    ],
    howItWorks: 'Copies page objects and necessary font/resource dictionaries into a new PDF document structure entirely inside your browser.',
    steps: [
      { step: 1, title: 'Upload File', description: 'Choose your document.' },
      { step: 2, title: 'Pick Pages', description: 'Click the pages you wish to extract.' },
      { step: 3, title: 'Download', description: 'Save the extracted pages as a new PDF.' },
    ],
    tips: ['Hold shift or use range syntax for quick bulk selection.'],
    commonProblems: ['Ensure at least one page is selected before clicking extract.'],
    faqs: [
      {
        question: 'Does this remove pages from my original file?',
        answer: 'No. Your original file on your computer remains completely untouched.',
      },
    ],
    relatedTools: ['split-pdf', 'organize-pdf'],
    relatedGuides: ['how-to-extract-pages-from-a-pdf'],
  },

  // --- Category: Convert ---
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    shortDescription: 'Convert JPG, PNG, and WebP images into clean, standardized PDF documents.',
    metaDescription: 'Convert JPG and PNG images into PDF in seconds. Browser-side conversion guarantees complete privacy.',
    category: 'convert',
    badge: 'Popular',
    status: 'available',
    icon: 'Image',
    acceptsMultiple: true,
    acceptedFileTypes: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    features: [
      'Supports JPG, PNG, and modern WebP formats',
      'Reorder images before generating PDF',
      'Automatic page dimension matching',
      'No quality loss or cloud compression',
    ],
    howItWorks: 'Reads image binary streams directly into HTML5 ArrayBuffers, embeds image dictionaries into a fresh PDF container, and writes the PDF file in memory.',
    steps: [
      { step: 1, title: 'Choose Images', description: 'Select one or more image files.' },
      { step: 2, title: 'Arrange Order', description: 'Drag images to set the desired sequence.' },
      { step: 3, title: 'Convert', description: 'Generate and download your combined PDF.' },
    ],
    tips: ['Combine receipt or document photos in order for easy filing.'],
    commonProblems: ['Extremely large photo files (e.g. 50MP RAW exports) should be converted to standard JPG first.'],
    faqs: [
      {
        question: 'Can I combine multiple photos into one PDF?',
        answer: 'Yes, select as many images as you need and arrange them in any order.',
      },
    ],
    relatedTools: ['pdf-to-jpg', 'merge-pdf'],
    relatedGuides: ['how-to-convert-jpg-to-pdf'],
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    shortDescription: 'Export each PDF page as high-resolution JPG or PNG image files.',
    metaDescription: 'Convert PDF pages to JPG images in your browser. Download high-quality page images directly with zero cloud upload.',
    category: 'convert',
    badge: 'Popular',
    status: 'available',
    icon: 'FileImage',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Render pages to high-resolution JPEG images',
      'Bulk download as a single ZIP archive',
      'Zero server upload — runs in browser canvas',
    ],
    howItWorks: 'Uses Mozilla PDF.js to rasterize vector pages to an offscreen HTML5 canvas at high DPI, then serializes the canvas pixels into JPG blobs.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose the PDF to convert.' },
      { step: 2, title: 'Render', description: 'Watch pages render locally in your browser.' },
      { step: 3, title: 'Download Images', description: 'Download individual images or a ZIP archive.' },
    ],
    tips: ['For documents with more than 3 pages, download the combined ZIP for convenience.'],
    commonProblems: ['Browser memory limits may slow down conversion on documents over 100 pages.'],
    faqs: [
      {
        question: 'What is the image resolution?',
        answer: 'Pages are rendered at high DPI (up to 300 DPI equivalent) for sharp text and images.',
      },
    ],
    relatedTools: ['jpg-to-pdf', 'pdf-to-text'],
    relatedGuides: ['how-to-convert-pdf-to-jpg'],
  },
  {
    slug: 'pdf-to-text',
    name: 'PDF to Text',
    shortDescription: 'Extract readable plain text content from digital PDF documents instantly.',
    metaDescription: 'Extract text from PDF documents quickly and privately in your browser. No files uploaded to any server.',
    category: 'convert',
    status: 'available',
    icon: 'FileText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Extract text layers from all pages',
      'Copy to clipboard or download as .txt file',
      'Maintains page separation indicators',
      'Instant client-side parsing',
    ],
    howItWorks: 'Inspects PDF text stream operators directly via PDF.js content streams and decodes Unicode glyphs without sending content to third parties.',
    steps: [
      { step: 1, title: 'Upload File', description: 'Select your PDF document.' },
      { step: 2, title: 'Extract', description: 'Text streams are parsed across all pages.' },
      { step: 3, title: 'Copy or Save', description: 'Copy text to clipboard or download .txt.' },
    ],
    tips: ['Works best on digital PDFs (PDFs created from Word, Docs, or digital exports).'],
    commonProblems: ['Scanned paper documents require OCR rather than simple text stream extraction.'],
    faqs: [
      {
        question: 'Why is some text missing from a scanned PDF?',
        answer: 'Scanned PDFs contain pictures of text rather than selectable text streams. Use our OCR tool for scanned documents.',
      },
    ],
    relatedTools: ['ocr-pdf', 'pdf-to-jpg'],
    relatedGuides: ['what-is-ocr'],
  },

  // --- Category: Enhance ---
  {
    slug: 'add-page-numbers',
    name: 'Add Page Numbers',
    shortDescription: 'Stamp customized page numbers (e.g. Page 1 of N) onto every page.',
    metaDescription: 'Add page numbers to your PDF documents directly in the browser. Choose position, format, and typography with 100% privacy.',
    category: 'enhance',
    status: 'available',
    icon: 'Hash',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Select placement: bottom-center, bottom-right, top-right',
      'Formats: "Page X of Y" or simple "X"',
      'High-precision Helvetica typography',
      'Zero server upload',
    ],
    howItWorks: 'Calculates page dimensions and draws standard Type-1 font glyphs directly onto each page stream using PDF-Lib.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the file needing page numbers.' },
      { step: 2, title: 'Choose Style', description: 'Pick your preferred position and number format.' },
      { step: 3, title: 'Download', description: 'Save your newly numbered document.' },
    ],
    tips: ['Bottom-center is the standard format for academic and legal briefs.'],
    commonProblems: ['Ensure your document margins have at least 0.5 inches of clearance for number placement.'],
    faqs: [
      {
        question: 'Can I number only a subset of pages?',
        answer: 'Currently numbering applies across all pages sequentially.',
      },
    ],
    relatedTools: ['watermark-pdf', 'organize-pdf'],
    relatedGuides: ['how-to-add-page-numbers-to-a-pdf'],
  },
  {
    slug: 'watermark-pdf',
    name: 'Watermark PDF',
    shortDescription: 'Stamp customizable diagonal text watermarks (e.g. CONFIDENTIAL, DRAFT).',
    metaDescription: 'Add watermarks to PDF files directly in your browser. Customize text, opacity, and angle with complete client-side privacy.',
    category: 'enhance',
    status: 'available',
    icon: 'Stamp',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Custom text stamps (Confidential, Draft, Sample, etc.)',
      'Adjustable opacity and angle',
      'Applies cleanly across all pages',
      'Runs 100% locally in browser',
    ],
    howItWorks: 'Draws a semi-transparent text layer rotated diagonally across the center of each page dictionary.',
    steps: [
      { step: 1, title: 'Select File', description: 'Upload the PDF to watermark.' },
      { step: 2, title: 'Enter Text', description: 'Type your desired watermark phrase.' },
      { step: 3, title: 'Download', description: 'Export the watermarked PDF.' },
    ],
    tips: ['Use an opacity of 20-30% to keep background text readable.'],
    commonProblems: ['Avoid very long phrases that might exceed page margins at 48pt font.'],
    faqs: [
      {
        question: 'Can the watermark be easily removed?',
        answer: 'The watermark becomes part of the PDF content stream, making casual removal difficult.',
      },
    ],
    relatedTools: ['add-page-numbers', 'protect-pdf'],
    relatedGuides: ['how-to-add-a-watermark-to-a-pdf'],
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    shortDescription: 'Reduce PDF file size by stripping redundant metadata and optimizing streams.',
    metaDescription: 'Compress PDF files directly in your browser. Shrink document size without uploading your sensitive files to any server.',
    category: 'enhance',
    badge: 'Phase 2',
    status: 'beta',
    icon: 'Minimize2',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Removes unneeded metadata and orphaned objects',
      'Flattens unnecessary font descriptors',
      'No server-side processing or external API calls',
    ],
    howItWorks: 'Cleans and repacks internal PDF object references and strips unused streams directly in the browser environment.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the file you want to compress.' },
      { step: 2, title: 'Optimize', description: 'Inspect structure and optimize streams in memory.' },
      { step: 3, title: 'Download', description: 'Save the optimized PDF file.' },
    ],
    tips: ['Compressing already heavily compressed PDFs (e.g. text only) will show minimal size change.'],
    commonProblems: ['Photographic PDFs with embedded low-res images cannot be further compressed without lossy re-encoding.'],
    faqs: [
      {
        question: 'How much size reduction can I expect?',
        answer: 'Typically 10% to 50% depending on embedded metadata, fonts, and object redundancies.',
      },
    ],
    relatedTools: ['merge-pdf', 'organize-pdf'],
    relatedGuides: ['how-to-compress-a-pdf'],
  },

  // --- Category: Secure ---
  {
    slug: 'protect-pdf',
    name: 'Protect PDF',
    shortDescription: 'Encrypt your PDF with a password so only authorized viewers can open it.',
    metaDescription: 'Password-protect PDF files client-side in your browser with standard AES-256 encryption. Processed locally on your device with zero cloud uploads.',
    category: 'secure',
    status: 'available',
    icon: 'Lock',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'AES-256 password protection',
      'Configurable printing and copying permissions',
      'Passwords never leave your browser memory',
      'Compatible with Adobe Acrobat and all standard PDF viewers',
    ],
    howItWorks: 'Applies standard AES-256 PDF encryption dictionaries client-side using the browser Web Crypto API.',
    steps: [
      { step: 1, title: 'Upload File', description: 'Select the PDF to protect.' },
      { step: 2, title: 'Set Password', description: 'Type a strong, memorable password.' },
      { step: 3, title: 'Download', description: 'Save your password-protected PDF.' },
    ],
    tips: ['Save your password in a password manager. Forgotten passwords cannot be recovered.'],
    commonProblems: ['Do not close the tab before the encryption stream finishes saving.'],
    faqs: [
      {
        question: 'Can iLikePDF recover my password if I lose it?',
        answer: 'No. Because everything runs strictly in your browser without accounts or servers, we never see or store your password.',
      },
    ],
    relatedTools: ['unlock-pdf', 'watermark-pdf'],
    relatedGuides: ['how-to-protect-a-pdf'],
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock PDF',
    shortDescription: 'Remove password protection from PDFs you have the password for.',
    metaDescription: 'Unlock password-protected PDF files in your browser. Remove security restrictions locally with complete privacy when you know the password.',
    category: 'secure',
    status: 'available',
    icon: 'Unlock',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Remove open and editing restrictions',
      'Requires known password for decryption',
      'Saves an unrestricted version locally',
      'Zero server upload or password cracking',
    ],
    howItWorks: 'Decrypts the document using the provided password locally in your browser and re-saves the document without security restrictions.',
    steps: [
      { step: 1, title: 'Select Protected PDF', description: 'Choose the locked document.' },
      { step: 2, title: 'Enter Password', description: 'Provide the document password.' },
      { step: 3, title: 'Download Unlocked', description: 'Save the unlocked PDF.' },
    ],
    tips: ['Useful for removing passwords from statements before archiving.'],
    commonProblems: ['We cannot crack unknown passwords. You must know the password to decrypt the file.'],
    faqs: [
      {
        question: 'Does this hack unknown passwords?',
        answer: 'No. Decryption requires the valid password. We do not support brute-force password cracking.',
      },
    ],
    relatedTools: ['protect-pdf'],
    relatedGuides: ['how-to-protect-a-pdf'],
  },

  // --- Advanced Tools ---
  {
    slug: 'ocr-pdf',
    name: 'OCR PDF',
    shortDescription: 'Recognize and extract text from scanned documents using in-browser OCR.',
    metaDescription: 'Convert scanned PDF documents into searchable text using client-side OCR. 100% private, no server upload required.',
    category: 'convert',
    badge: 'Phase 3',
    status: 'planned',
    icon: 'ScanText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Optical Character Recognition in the browser',
      'Extract text from image-only scans',
      'Uses client-side WebAssembly engine',
    ],
    howItWorks: 'Runs optical character recognition using browser Web Workers and WebAssembly without sending sensitive documents to external cloud OCR APIs.',
    steps: [
      { step: 1, title: 'Upload Scanned File', description: 'Select your scanned PDF.' },
      { step: 2, title: 'Run OCR Engine', description: 'Text characters are identified page by page.' },
      { step: 3, title: 'Download Text', description: 'Save your searchable document.' },
    ],
    tips: ['High-contrast scans yield the highest accuracy.'],
    commonProblems: ['OCR on large documents requires modern hardware with adequate CPU performance.'],
    faqs: [
      {
        question: 'Does OCR require an internet connection?',
        answer: 'Once the worker script is cached by your browser, OCR processing executes entirely offline.',
      },
    ],
    relatedTools: ['pdf-to-text', 'pdf-to-jpg'],
    relatedGuides: ['what-is-ocr'],
  },
  {
    slug: 'pdf-editor',
    name: 'PDF Editor',
    shortDescription: 'Add text annotations, shapes, and signature marks directly to your document.',
    metaDescription: 'Edit PDF documents directly in your browser. Annotate, highlight, and sign with complete privacy and zero server uploads.',
    category: 'enhance',
    badge: 'Phase 3',
    status: 'available',
    icon: 'Edit3',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Interactive canvas annotation tools',
      'Draw shapes, text boxes, and highlights',
      'Burn annotations into output PDF',
    ],
    howItWorks: 'Layers an interactive canvas over rendered PDF pages and compiles visual modifications back into the PDF content stream.',
    steps: [
      { step: 1, title: 'Open Document', description: 'Load your PDF into the visual editor.' },
      { step: 2, title: 'Annotate', description: 'Add notes, highlights, or markings.' },
      { step: 3, title: 'Export', description: 'Save your edited document.' },
    ],
    tips: ['Use zoom controls for detailed text placements.'],
    commonProblems: ['Editing existing complex vector text layouts requires desktop publishing software; this tool focuses on visual annotations.'],
    faqs: [
      {
        question: 'Is this an Adobe Acrobat replacement?',
        answer: 'No. iLikePDF provides lightweight annotations and additions without claiming to replace full enterprise desktop publishing suites.',
      },
    ],
    relatedTools: ['watermark-pdf', 'organize-pdf'],
    relatedGuides: ['how-to-edit-a-pdf'],
  },
];

export const TOOL_CATEGORIES = [
  { id: 'organize', name: 'Organize & Manage', description: 'Merge, split, extract, rotate, and arrange PDF pages.' },
  { id: 'convert', name: 'Convert & Extract', description: 'Convert between PDF, JPG, and extract plain text.' },
  { id: 'enhance', name: 'Enhance & Stamp', description: 'Add page numbers, watermarks, and compress files.' },
  { id: 'secure', name: 'Security & Privacy', description: 'Protect documents with passwords and manage encryption.' },
] as const;

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return TOOLS_REGISTRY.filter((t) => t.category === category);
}

export function getRelatedTools(tool: ToolMetadata): ToolMetadata[] {
  return tool.relatedTools
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is ToolMetadata => Boolean(t));
}
