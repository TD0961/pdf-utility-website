import { ToolMetadata } from '@/types/tool';
import { getCuratedRelationship } from '@/lib/tools/relationships';

export const TOOLS_REGISTRY: ToolMetadata[] = [
  // ==========================================
  // Category: Organize
  // ==========================================
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    shortDescription: 'Combine multiple PDF documents into a single organized file in seconds.',
    metaDescription: 'Merge multiple PDF files into one directly in your browser. Fast, free, and private with no server uploads.',
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
        answer: 'No. iLikePDF operates locally inside your web browser. Files are processed in your device’s memory without remote uploads.',
      },
      {
        question: 'Is there a limit on how many PDFs I can merge?',
        answer: 'There is no artificial limit imposed by our platform. Limits depend solely on your computer’s available memory.',
      },
    ],
    relatedTools: ['split-pdf', 'organize-pdf', 'extract-pages', 'compress-pdf'],
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
    metaDescription: 'Visually organize, reorder, rotate, and delete PDF pages directly in your browser. Fast, free, and private.',
    category: 'organize',
    status: 'available',
    icon: 'LayoutGrid',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Interactive visual thumbnail grid',
      'Drag-and-drop page reordering',
      'One-click page rotation and deletion',
      'Private local in-browser execution',
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
    relatedTools: ['split-pdf', 'organize-pdf', 'crop-pdf'],
    relatedGuides: ['how-to-extract-pages-from-a-pdf'],
  },
  {
    slug: 'compare-pdf',
    name: 'Compare PDF',
    shortDescription: 'Inspect textual and structural differences between two PDF documents side by side.',
    metaDescription: 'Compare two PDF files locally in your browser. Detect added words, removed passages, and similarity scores with complete privacy.',
    category: 'organize',
    badge: 'New',
    status: 'available',
    icon: 'FileDiff',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Dual-document local side-by-side comparison',
      'Page-by-page word difference analysis',
      'Added, removed, and matching word count metrics',
      'Zero cloud transmission — both files stay in memory',
    ],
    howItWorks: 'Extracts coordinate-level text and vocabulary from both documents using client-side Web Workers, computes set differences and token frequencies, and generates a structured diff report.',
    steps: [
      { step: 1, title: 'Select Document A', description: 'Choose your original PDF.' },
      { step: 2, title: 'Select Document B', description: 'Choose the revised or modified PDF.' },
      { step: 3, title: 'Compare', description: 'View similarity scores and page-by-page differences.' },
    ],
    tips: ['Works best for comparing text revisions, contracts, and essay drafts.'],
    commonProblems: ['Heavily formatted documents with shifting paragraphs may show lower token alignment scores.'],
    faqs: [
      {
        question: 'Does this perform legal redline certification?',
        answer: 'No. iLikePDF provides algorithmic text and word-frequency comparison for convenience and revision tracking, not statutory legal redline verification.',
      },
      {
        question: 'Are either of my files uploaded?',
        answer: 'No. Both documents are processed exclusively in your device browser RAM.',
      },
    ],
    relatedTools: ['merge-pdf', 'organize-pdf', 'extract-pages'],
    relatedGuides: ['how-to-merge-pdf-files', 'how-browser-based-pdf-processing-works'],
  },

  // ==========================================
  // Category: Edit & Annotate
  // ==========================================
  {
    slug: 'pdf-editor',
    name: 'PDF Editor',
    shortDescription: 'Add text annotations, shapes, and markings directly to your document in your browser.',
    metaDescription: 'Edit PDF documents directly in your browser. Annotate, highlight, and draw shapes with complete privacy and zero server uploads.',
    category: 'edit',
    badge: 'Full Suite',
    status: 'available',
    icon: 'Edit3',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Interactive canvas annotation tools',
      'Draw shapes, text boxes, and highlights',
      'Burn annotations directly into the output PDF',
      'Isolated environment with zero advertising clutter',
    ],
    howItWorks: 'Layers an interactive canvas over rendered PDF pages locally in your browser and compiles visual modifications back into the PDF content stream.',
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
    relatedTools: ['sign-pdf', 'fill-pdf', 'watermark-pdf', 'crop-pdf'],
    relatedGuides: ['how-to-edit-a-pdf'],
  },
  {
    slug: 'sign-pdf',
    name: 'Sign PDF',
    shortDescription: 'Draw or upload a visual signature and place it securely on any PDF page.',
    metaDescription: 'Sign PDF documents visually in your browser. Draw, upload, and place signatures on your pages with zero server upload.',
    category: 'edit',
    badge: 'Popular',
    status: 'available',
    icon: 'PenTool',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Draw signature with pen, stylus, mouse, or touch',
      'Upload high-resolution transparent signature images',
      'Draggable and resizable placement preview',
      'Zero server upload — signature never leaves device',
    ],
    howItWorks: 'Captures your signature mark as a high-density vector canvas, maps coordinate positions to PDF page units, and embeds the image into the PDF stream locally.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the document you need to sign.' },
      { step: 2, title: 'Create Signature', description: 'Draw your signature or upload an image.' },
      { step: 3, title: 'Position & Save', description: 'Drag to position on the page, resize, and export.' },
    ],
    tips: ['Use a tablet or smartphone touch screen for natural handwriting signature curves.'],
    commonProblems: ['This produces a visual signature mark, not a cryptographic PKI digital certificate.'],
    faqs: [
      {
        question: 'Is this a cryptographic digital certificate?',
        answer: 'No. This tool adds a visual signature mark to the PDF page. It is not a cryptographic digital certificate or PKI signature.',
      },
      {
        question: 'Is my signature stored on your servers?',
        answer: 'Never. iLikePDF has no backend servers or databases. Your signature exists only in your browser memory during the session.',
      },
    ],
    relatedTools: ['fill-pdf', 'pdf-editor', 'protect-pdf'],
    relatedGuides: ['how-to-edit-a-pdf', 'how-to-protect-a-pdf'],
  },
  {
    slug: 'fill-pdf',
    name: 'Fill PDF',
    shortDescription: 'Fill out interactive AcroForm PDF forms, checkboxes, radio buttons, and dropdowns.',
    metaDescription: 'Fill PDF form fields directly in your browser. Supports text boxes, checkboxes, radios, and dropdowns locally with zero cloud upload.',
    category: 'edit',
    badge: 'New',
    status: 'available',
    icon: 'CheckSquare',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Automatic AcroForm field catalog detection',
      'Interactive inputs for text, checkboxes, radios, and selects',
      'Optional form flattening for tamper-evident distribution',
      'Local in-browser execution with zero server uploads',
    ],
    howItWorks: 'Inspects the internal PDF AcroForm dictionary using pdf-lib, renders interactive form controls for each detected field, and updates the PDF object stream.',
    steps: [
      { step: 1, title: 'Select Form', description: 'Upload your interactive PDF form.' },
      { step: 2, title: 'Enter Information', description: 'Fill in detected text fields, checkboxes, and selections.' },
      { step: 3, title: 'Export', description: 'Save the filled PDF document.' },
    ],
    tips: ['Check the "Flatten form" option if sending to recipients who should not modify your answers.'],
    commonProblems: ['Flat or scanned PDFs without native AcroForm fields can be annotated in our PDF Editor instead.'],
    faqs: [
      {
        question: 'What if my PDF does not have interactive fields?',
        answer: 'If the PDF is a flat scanned document, our tool alerts you and offers a one-click transition to the PDF Editor to place annotations over the lines.',
      },
    ],
    relatedTools: ['sign-pdf', 'pdf-editor', 'protect-pdf'],
    relatedGuides: ['how-to-edit-a-pdf'],
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF',
    shortDescription: 'Rotate upside-down or sideways pages 90, 180, or 270 degrees permanently.',
    metaDescription: 'Rotate PDF pages permanently in your browser. Fix orientation on all or individual pages with complete privacy.',
    category: 'edit',
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
    relatedTools: ['organize-pdf', 'crop-pdf', 'split-pdf'],
    relatedGuides: ['how-to-rotate-pdf-pages'],
  },
  {
    slug: 'crop-pdf',
    name: 'Crop PDF',
    shortDescription: 'Visually trim page margins and bounding boxes across single or all pages.',
    metaDescription: 'Crop PDF pages visually in your browser. Adjust page margins and crop boxes with live preview and zero server uploads.',
    category: 'edit',
    badge: 'New',
    status: 'available',
    icon: 'Crop',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Interactive resizable visual crop box',
      'Accurate screen-to-PDF coordinate transformation',
      'Apply to current page or all pages uniformly',
      'Validates bounding box dimensions to prevent corrupt boxes',
    ],
    howItWorks: 'Calculates viewport-to-point transformations in browser memory and modifies the `/CropBox` entry of the PDF page dictionary locally using pdf-lib.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the file to crop.' },
      { step: 2, title: 'Adjust Bounds', description: 'Drag the visual crop rectangle to frame desired content.' },
      { step: 3, title: 'Apply & Save', description: 'Export your cropped document.' },
    ],
    tips: ['Great for removing printer registration marks and scanning borders.'],
    commonProblems: ['Cropping changes the visible window of the page; underlying vector objects outside the crop box remain in the file structure.'],
    faqs: [
      {
        question: 'Can I crop all pages at once?',
        answer: 'Yes. Select the "All Pages" option to apply the crop boundaries uniformly across the entire document.',
      },
    ],
    relatedTools: ['rotate-pdf', 'organize-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-rotate-pdf-pages', 'how-to-organize-and-reorder-pdf-pages'],
  },
  {
    slug: 'add-page-numbers',
    name: 'Add Page Numbers',
    shortDescription: 'Insert customized page numbers with full control over positioning, font, and format.',
    metaDescription: 'Add page numbers to PDF documents in your browser. Customize format, position, and font size with complete privacy.',
    category: 'edit',
    status: 'available',
    icon: 'Type',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Flexible formatting: "Page X of Y", "X/Y", or simple digits',
      'Position anywhere: top, bottom, corners, or center',
      'Custom start number and font size options',
      'Zero server upload — generated on client',
    ],
    howItWorks: 'Reads document dimensions page by page, calculates geometry coordinates, and draws formatted text onto each page buffer in client memory.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose your document.' },
      { step: 2, title: 'Configure Style', description: 'Pick your position, formatting template, and starting number.' },
      { step: 3, title: 'Download', description: 'Save the numbered PDF.' },
    ],
    tips: ['Bottom-right or bottom-center is the most standard placement for formal reports.'],
    commonProblems: ['If page numbers overlap existing footer text, increase margin padding in options.'],
    faqs: [
      {
        question: 'Can I exclude page numbers on the cover page?',
        answer: 'Yes, set the start numbering option to begin on page 2.',
      },
    ],
    relatedTools: ['watermark-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-add-page-numbers-to-a-pdf'],
  },
  {
    slug: 'watermark-pdf',
    name: 'Watermark PDF',
    shortDescription: 'Stamp text or image watermarks across your PDF pages with adjustable opacity.',
    metaDescription: 'Add watermarks to PDF files in your browser. Protect documents with customized text or image stamps locally with zero cloud upload.',
    category: 'edit',
    status: 'available',
    icon: 'Stamp',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Custom text stamps with configurable rotation and opacity',
      'Upload company logo or badge images as watermark',
      'Adjustable transparency and diagonal angles',
      'Zero cloud transmission',
    ],
    howItWorks: 'Renders watermark vectors onto the page graphics state directly in client browser memory using pdf-lib operators, ensuring the stamp integrates with the page content.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the file to watermark.' },
      { step: 2, title: 'Design Stamp', description: 'Type watermark text or upload an image and choose opacity.' },
      { step: 3, title: 'Stamp & Save', description: 'Download your watermarked document.' },
    ],
    tips: ['Use 20% to 30% opacity so text underneath remains comfortably readable.'],
    commonProblems: ['Avoid pure black text at 100% opacity, which may obscure critical underlying information.'],
    faqs: [
      {
        question: 'Can the watermark be easily removed?',
        answer: 'The watermark becomes part of the PDF content stream, making casual removal difficult.',
      },
    ],
    relatedTools: ['add-page-numbers', 'protect-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-add-a-watermark-to-a-pdf'],
  },

  // ==========================================
  // Category: Create & Convert
  // ==========================================
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    shortDescription: 'Convert JPG, PNG, and WebP images into clean, standardized PDF documents.',
    metaDescription: 'Convert JPG and PNG images into PDF in seconds. Browser-side conversion guarantees complete privacy.',
    category: 'create-convert',
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
    category: 'create-convert',
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
    relatedTools: ['jpg-to-pdf', 'pdf-to-text', 'extract-pages'],
    relatedGuides: ['how-to-convert-pdf-to-jpg'],
  },
  {
    slug: 'pdf-to-text',
    name: 'PDF to Text',
    shortDescription: 'Extract raw selectable text from your PDF document without formatting clutter.',
    metaDescription: 'Extract text from PDF documents directly in your browser. Copy or download clean text locally with zero server upload.',
    category: 'create-convert',
    status: 'available',
    icon: 'FileText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Fast client-side text extraction',
      'One-click copy to clipboard',
      'Download as .txt file',
      'Zero data transmission over the internet',
    ],
    howItWorks: 'Extracts unicode glyph streams directly from PDF content streams using in-browser Web Workers, preserving natural line breaks.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the document containing text.' },
      { step: 2, title: 'Extract', description: 'Text is parsed instantly on your device.' },
      { step: 3, title: 'Copy or Save', description: 'Copy to clipboard or download as a text file.' },
    ],
    tips: ['Ideal for extracting body copy, research quotes, and data tables.'],
    commonProblems: ['Image-based scanned documents require OCR to extract text; use our OCR PDF tool for image-only scans.'],
    faqs: [
      {
        question: 'Why is no text extracted from my scanned PDF?',
        answer: 'Scanned documents contain picture pixels rather than digital text characters. Use our OCR tool to recognize characters on scans.',
      },
    ],
    relatedTools: ['ocr-pdf', 'pdf-to-word', 'pdf-to-excel'],
    relatedGuides: ['how-to-extract-text-from-a-pdf'],
  },
  {
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    shortDescription: 'Convert PDF documents into editable Microsoft Word (.docx) files directly in your browser.',
    metaDescription: 'Convert PDF to Word DOCX in your browser. Reconstructs text, headings, and paragraphs with zero server upload.',
    category: 'create-convert',
    badge: 'Popular',
    status: 'available',
    icon: 'FileText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Generates standards-compliant OpenXML (.docx) files',
      'Reconstructs headings, paragraphs, and reading order',
      'Preserves bold, italic, font sizing, and text alignment',
      'Local in-browser conversion with zero cloud APIs',
    ],
    howItWorks: 'Analyzes PDF coordinate streams using client-side algorithms, clusters text fragments into semantic paragraphs and headings, and compiles an OpenXML DOCX archive using JSZip.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Upload the document you want to convert.' },
      { step: 2, title: 'Convert', description: 'Our in-browser engine reconstructs paragraphs and styles.' },
      { step: 3, title: 'Download DOCX', description: 'Download your editable Word document.' },
    ],
    tips: ['Digital PDFs with selectable text yield the cleanest Word formatting.'],
    commonProblems: ['Complex magazine or flyer layouts may require minor manual formatting adjustments in Word.'],
    faqs: [
      {
        question: 'Will this convert scanned documents?',
        answer: 'If your PDF is a scanned image without digital text, use our OCR tool first to create a searchable document.',
      },
      {
        question: 'Are my confidential documents uploaded to a conversion server?',
        answer: 'No. The entire OpenXML Word file is assembled directly in your browser memory.',
      },
    ],
    relatedTools: ['ocr-pdf', 'pdf-to-text', 'pdf-to-ppt', 'compress-pdf'],
    relatedGuides: ['how-to-extract-text-from-a-pdf', 'what-is-ocr'],
  },
  {
    slug: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    shortDescription: 'Convert PDF pages into editable Microsoft PowerPoint (.pptx) presentation slides.',
    metaDescription: 'Convert PDF to PowerPoint PPTX in your browser. Transform PDF pages into presentation slides with zero server uploads.',
    category: 'create-convert',
    badge: 'New',
    status: 'available',
    icon: 'Presentation',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Generates valid PresentationML (.pptx) packages',
      'Maps each PDF page to a presentation slide',
      'Reconstructs editable text shapes with font sizing and styling',
      'Preserves source page aspect ratio without forced distortion',
    ],
    howItWorks: 'Reads page geometry and text items, groups content into slide text frames with matching typography, and packages OpenXML presentation parts in browser RAM.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Choose your presentation document.' },
      { step: 2, title: 'Build Slides', description: 'Slides and text boxes are generated locally.' },
      { step: 3, title: 'Download PPTX', description: 'Save your editable PowerPoint presentation.' },
    ],
    tips: ['Slide decks exported to PDF convert cleanly back into PowerPoint presentations.'],
    commonProblems: ['Vector illustrations and logos are preserved where supported; complex overlapping shapes may flatten.'],
    faqs: [
      {
        question: 'Does this create genuine PowerPoint slides?',
        answer: 'Yes. It generates standard OpenXML (.pptx) files containing slide XML parts, text shapes, and relationships.',
      },
    ],
    relatedTools: ['pdf-to-word', 'extract-pages', 'compress-pdf'],
    relatedGuides: ['how-to-extract-pages-from-a-pdf', 'how-browser-based-pdf-processing-works'],
  },
  {
    slug: 'pdf-to-excel',
    name: 'PDF to Excel',
    shortDescription: 'Extract tables, rows, and numbers from PDF files into Microsoft Excel (.xlsx) spreadsheets.',
    metaDescription: 'Convert PDF tables to Excel XLSX spreadsheets in your browser. Extract tabular rows and numbers locally with zero cloud upload.',
    category: 'create-convert',
    badge: 'New',
    status: 'available',
    icon: 'FileSpreadsheet',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Generates valid OpenXML (.xlsx) workbooks',
      'Clusters text items into rows and columns based on coordinates',
      'Detects numeric data cells for calculation readiness',
      'Zero server upload — full local financial privacy',
    ],
    howItWorks: 'Analyzes spatial coordinates of text elements across PDF pages, identifies tabular alignment baselines, and generates a structured SpreadsheetML workbook using JSZip.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose your document containing tables.' },
      { step: 2, title: 'Extract Grid', description: 'Table rows and columns are identified in memory.' },
      { step: 3, title: 'Download XLSX', description: 'Open your spreadsheet directly in Excel or Google Sheets.' },
    ],
    tips: ['Documents with clear column spacing and borders provide the most accurate spreadsheet conversion.'],
    commonProblems: ['Scanned receipts without digital text require OCR before table data can be extracted.'],
    faqs: [
      {
        question: 'Can I open the generated file in Excel and Google Sheets?',
        answer: 'Yes. It produces standards-compliant OpenXML (.xlsx) files supported by Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.',
      },
    ],
    relatedTools: ['pdf-to-text', 'pdf-to-word', 'ocr-pdf'],
    relatedGuides: ['how-to-extract-text-from-a-pdf'],
  },

  // ==========================================
  // Category: Optimize
  // ==========================================
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    shortDescription: 'Reduce PDF file size by stripping redundant metadata and optimizing object streams.',
    metaDescription: 'Compress PDF files directly in your browser. Shrink document size without uploading your sensitive files to any server.',
    category: 'optimize',
    badge: 'Optimized',
    status: 'available',
    icon: 'Minimize2',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Basic, Balanced, and Strong optimization modes',
      'Removes unreferenced objects and duplicate resources',
      'Enables Flate object stream compaction',
      'Preserves selectable text, page dimensions, and vector clarity',
    ],
    howItWorks: 'Reconstructs the PDF object catalog into a clean document container in client browser memory, strips redundant metadata streams, and compacts cross-reference tables locally using modern Flate compression.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the file you want to compress.' },
      { step: 2, title: 'Choose Mode', description: 'Pick Basic, Balanced, or Strong compression.' },
      { step: 3, title: 'Download', description: 'View size savings and save the optimized PDF.' },
    ],
    tips: ['Documents with bloated metadata or multiple revisions see significant size reduction.'],
    commonProblems: ['Already compressed text-only files will show honest zero-reduction notices rather than fake reduction.'],
    faqs: [
      {
        question: 'Will compression degrade readability?',
        answer: 'No. Our Balanced mode focuses on structural compaction and metadata stripping without rasterizing text layers.',
      },
      {
        question: 'What if my file is already compressed?',
        answer: 'iLikePDF honestly notifies you if the file cannot be shrunk further and allows you to keep the original without alteration.',
      },
    ],
    relatedTools: ['pdf-to-word', 'pdf-to-jpg', 'ocr-pdf', 'merge-pdf'],
    relatedGuides: ['how-to-compress-a-pdf'],
  },
  {
    slug: 'ocr-pdf',
    name: 'OCR PDF',
    shortDescription: 'Recognize text from scanned documents using in-browser Optical Character Recognition.',
    metaDescription: 'Convert scanned PDF documents into searchable text and searchable PDFs using client-side OCR with zero cloud uploads.',
    category: 'optimize',
    badge: 'Smart OCR',
    status: 'available',
    icon: 'ScanText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'In-browser Optical Character Recognition with zero cloud APIs',
      'Converts scanned image pages into searchable PDFs',
      'Extracts clean plain text (.txt) for copying',
      'Sequential page processing to safeguard device memory',
    ],
    howItWorks: 'Renders scanned pages to an offscreen HTML5 canvas, analyzes glyph contours, and overlays an invisible searchable text layer over the image using pdf-lib.',
    steps: [
      { step: 1, title: 'Upload Scan', description: 'Select your scanned PDF.' },
      { step: 2, title: 'Run OCR', description: 'Characters are analyzed page by page in memory.' },
      { step: 3, title: 'Download', description: 'Save your searchable PDF or copy extracted text.' },
    ],
    tips: ['High-contrast scans with dark text on white backgrounds produce the highest accuracy.'],
    commonProblems: ['Faint handwriting or low-resolution faxes may result in lower character recognition confidence.'],
    faqs: [
      {
        question: 'Does this tool send my scans to an OCR cloud server?',
        answer: 'No. All image rendering and character recognition algorithms execute 100% locally on your computer.',
      },
      {
        question: 'Can I download the text as a .txt file?',
        answer: 'Yes. You can download a searchable PDF, a plain text file, or copy the text directly to your clipboard.',
      },
    ],
    relatedTools: ['pdf-to-text', 'pdf-to-word', 'pdf-to-excel'],
    relatedGuides: ['what-is-ocr', 'how-to-extract-text-from-a-pdf'],
  },

  // ==========================================
  // Category: Security
  // ==========================================
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
      'Passwords processed locally in browser memory',
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
    relatedTools: ['unlock-pdf', 'watermark-pdf', 'sign-pdf'],
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
    relatedTools: ['protect-pdf', 'watermark-pdf'],
    relatedGuides: ['how-to-unlock-a-pdf', 'how-to-protect-a-pdf'],
  },

  // ==========================================
  // Phase 6C Tools
  // ==========================================
  {
    slug: 'pdf-to-csv',
    name: 'PDF to CSV',
    shortDescription: 'Extract tables and structured data from PDF files into standard CSV format.',
    metaDescription: 'Convert PDF tables to CSV directly in your browser. Fast, private table extraction with custom delimiters and zero server uploads.',
    category: 'create-convert',
    badge: 'Tables',
    status: 'available',
    icon: 'FileSpreadsheet',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Extract rows and columns into RFC 4180 CSV format',
      'Custom delimiter options (comma, semicolon, tab)',
      'Coordinate-aware column and row clustering',
      'Multi-page table extraction with page range selection',
      'Local in-browser table parsing with zero server uploads',
    ],
    howItWorks: 'Analyzes the positional geometry and text bounding boxes of each page locally. Clusters text elements into horizontal rows and vertical column anchors, formatting the aligned grid into standard CSV format without network transmission.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the PDF document containing tables.' },
      { step: 2, title: 'Configure Delimiter', description: 'Choose comma, semicolon, or tab separator.' },
      { step: 3, title: 'Download CSV', description: 'Extract tables and save your clean CSV file.' },
    ],
    tips: [
      'Works best on digital PDFs with clear visual column spacing.',
      'For scanned tables or receipts, run through OCR PDF first.',
    ],
    commonProblems: [
      'Complex merged header cells or irregular layouts may require manual column adjustments in spreadsheet software.',
    ],
    faqs: [
      {
        question: 'Can I open the extracted CSV in Microsoft Excel or Google Sheets?',
        answer: 'Yes. The output adheres to RFC 4180 standard CSV, making it compatible with Excel, Sheets, Numbers, and data science libraries like Pandas.',
      },
      {
        question: 'Does this convert scanned paper tables?',
        answer: 'Scanned pages must first be processed with our OCR PDF tool to generate digital selectable text before table extraction.',
      },
    ],
    relatedTools: ['pdf-to-excel', 'ocr-pdf', 'pdf-to-text', 'pdf-editor'],
    relatedGuides: ['how-to-convert-pdf-to-csv', 'how-to-extract-text-from-a-pdf'],
  },
  {
    slug: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    shortDescription: 'Convert PDF documents into clean, structured GitHub Flavored Markdown.',
    metaDescription: 'Convert PDF files to Markdown (.md) locally in your browser. Reconstructs headings, lists, bold/italic formatting, and paragraphs privately.',
    category: 'create-convert',
    badge: 'Docs',
    status: 'available',
    icon: 'FileCode',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Automatic heading level classification (#, ##, ###)',
      'Bullet and numbered list detection',
      'Bold and italic typographic emphasis mapping',
      'Optional page break dividers (---)',
      'Instant markdown preview with one-click clipboard copy',
    ],
    howItWorks: 'Extracts positional text spans locally in your browser using Mozilla PDF.js, reconstructs reading order, and evaluates relative font sizing to determine semantic heading levels, paragraphs, and list items into standard Markdown syntax.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose your document for Markdown conversion.' },
      { step: 2, title: 'Preview & Copy', description: 'Review the generated Markdown syntax directly in the browser.' },
      { step: 3, title: 'Download .md', description: 'Save the markdown file to your device.' },
    ],
    tips: [
      'Ideal for importing documentation into Obsidian, Notion, GitHub, or LLM knowledge bases.',
    ],
    commonProblems: [
      'Scanned documents without digital text layers will yield minimal text. Run through OCR PDF first.',
    ],
    faqs: [
      {
        question: 'Will images and diagrams be converted to Markdown?',
        answer: 'Markdown represents text structure. Use our Extract Images tool to download embedded raster images alongside your Markdown notes.',
      },
    ],
    relatedTools: ['pdf-to-text', 'pdf-to-word', 'ocr-pdf', 'extract-images'],
    relatedGuides: ['pdf-to-markdown-guide', 'how-to-extract-text-from-a-pdf'],
  },
  {
    slug: 'extract-images',
    name: 'Extract Images',
    shortDescription: 'Extract all embedded raster images from PDF files in original resolution.',
    metaDescription: 'Extract embedded JPG and PNG images from PDF files directly in your browser. Download individually or as a complete ZIP archive with full privacy.',
    category: 'organize',
    badge: 'Media',
    status: 'available',
    icon: 'Image',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Extract original embedded JPEG and PNG images',
      'Preserve native resolution without recompression',
      'Deduplicate shared image object streams',
      'Interactive visual thumbnail gallery',
      'Download individual images or all images as a ZIP',
    ],
    howItWorks: 'Inspects indirect PDF stream dictionaries locally. Identifies embedded raster XObjects (DCTDecode and FlateDecode), extracts raw binary image buffers, and packages them with zero loss in resolution.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose the PDF containing images you want to extract.' },
      { step: 2, title: 'Review Gallery', description: 'Inspect extracted images, dimensions, and file sizes.' },
      { step: 3, title: 'Download', description: 'Save individual pictures or download all in a ZIP file.' },
    ],
    tips: [
      'Great for recovering full-resolution photos from brochures, resumes, and presentation decks.',
    ],
    commonProblems: [
      'Mathematical vector drawings, line art, and colored shapes are not raster images and will not appear in the image gallery.',
    ],
    faqs: [
      {
        question: 'Does this compress or degrade image quality?',
        answer: 'No. Raw embedded image streams are extracted directly from the PDF container without lossy transcoding.',
      },
    ],
    relatedTools: ['pdf-to-jpg', 'jpg-to-pdf', 'pdf-editor', 'extract-pages'],
    relatedGuides: ['how-to-extract-images-from-a-pdf', 'how-to-convert-pdf-to-jpg'],
  },
  {
    slug: 'flatten-pdf',
    name: 'Flatten PDF',
    shortDescription: 'Lock fillable form fields and annotations permanently into page appearance.',
    metaDescription: 'Flatten fillable PDF forms directly in your browser. Burn interactive form fields and signatures permanently into the page stream with complete privacy.',
    category: 'secure',
    badge: 'Security',
    status: 'available',
    icon: 'Layers',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Locks AcroForm text fields, checkboxes, and dropdowns',
      'Converts interactive widgets into static page content',
      'Prevents accidental tampering or edits in form viewers',
      'Preserves original vector visual appearance',
      'Zero server upload or external processing',
    ],
    howItWorks: 'Parses the document’s AcroForm dictionary locally in your browser using pdf-lib. Renders and burns existing field values into the visual page stream, removing interactive input widgets while preserving visual fidelity.',
    steps: [
      { step: 1, title: 'Upload Form PDF', description: 'Select the filled PDF form to flatten.' },
      { step: 2, title: 'Inspect Fields', description: 'Review detected interactive fields.' },
      { step: 3, title: 'Flatten & Save', description: 'Download your permanently flattened PDF.' },
    ],
    tips: [
      'Essential before submitting government, legal, or financial forms to ensure inputs cannot be changed.',
    ],
    commonProblems: [
      'Dynamic XML-based XFA forms created with proprietary software are not supported. Use standard AcroForms.',
    ],
    faqs: [
      {
        question: 'Can a flattened PDF form be un-flattened later?',
        answer: 'No. Flattening burns field text directly into the page stream, permanently removing the editable input structure.',
      },
    ],
    relatedTools: ['fill-pdf', 'sign-pdf', 'protect-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-flatten-a-fillable-pdf', 'how-to-protect-a-pdf'],
  },
  {
    slug: 'remove-pdf-metadata',
    name: 'Remove PDF Metadata',
    shortDescription: 'Inspect and remove hidden author names, timestamps, and software tags.',
    metaDescription: 'Remove hidden document metadata from PDF files in your browser. Strip author, title, creation software, and timestamps locally for maximum privacy.',
    category: 'secure',
    badge: 'Privacy',
    status: 'available',
    icon: 'FileCode2',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Inspect title, author, subject, keywords, and creator tags',
      'Strip document info dictionary and XMP metadata streams',
      'Preserve 100% of visible document text and vector layout',
      'Re-validate clean document structure before download',
      'Zero server upload — full local sanitization',
    ],
    howItWorks: 'Reads the PDF trailer Info dictionary and root catalog /Metadata stream. Clears author identities, editing history, and creation application fingerprints locally in device RAM.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose your document to inspect embedded tags.' },
      { step: 2, title: 'Review Metadata', description: 'Inspect detected authors, software, and dates.' },
      { step: 3, title: 'Clean & Download', description: 'Strip metadata and save the sanitized PDF.' },
    ],
    tips: [
      'Recommended before public distribution of business proposals, legal briefs, and academic papers.',
    ],
    commonProblems: [
      'This removes standard document metadata. It does not alter visible text on page surfaces.',
    ],
    faqs: [
      {
        question: 'Does removing metadata affect my document’s visible content?',
        answer: 'No. Only hidden document properties are removed. All visible text, images, and formatting remain unchanged.',
      },
    ],
    relatedTools: ['protect-pdf', 'flatten-pdf', 'unlock-pdf', 'compress-pdf'],
    relatedGuides: ['how-to-remove-metadata-from-a-pdf', 'how-to-protect-a-pdf'],
  },
  {
    slug: 'resize-pdf',
    name: 'Resize PDF',
    shortDescription: 'Change PDF page dimensions to A4, Letter, Legal, or custom sizes.',
    metaDescription: 'Resize PDF pages to standard paper sizes (A4, Letter, Legal, A3, A5) or custom dimensions in your browser. 100% vector-preserving with zero rasterization.',
    category: 'edit',
    badge: 'Dimensions',
    status: 'available',
    icon: 'Scaling',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Standard presets: A4, US Letter, US Legal, A3, A5',
      'Custom width and height in points',
      'Portrait, landscape, and automatic orientation',
      'Scale to Fit, Scale to Fill, and Center modes',
      '100% vector preservation — zero pixelation or rasterization',
    ],
    howItWorks: 'Creates a new document canvas with the target dimensions directly in your browser. Embeds source pages as vector content streams with proportional scaling and centering, preserving crisp vector typography.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Upload the document you need to resize.' },
      { step: 2, title: 'Choose Target Size', description: 'Pick a preset like A4 or Letter, or enter custom dimensions.' },
      { step: 3, title: 'Resize & Save', description: 'Download your resized document immediately.' },
    ],
    tips: [
      'Use Scale to Fit to prevent content clipping when switching between Letter and A4.',
    ],
    commonProblems: [
      'Center mode without scaling may clip content if the target size is smaller than the original.',
    ],
    faqs: [
      {
        question: 'Does resizing make my PDF blurry or pixelated?',
        answer: 'No. iLikePDF uses mathematical vector transformations. Vector text, fonts, and illustrations remain razor sharp at any target size.',
      },
    ],
    relatedTools: ['crop-pdf', 'rotate-pdf', 'compress-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-resize-pdf-pages', 'how-to-rotate-pdf-pages'],
  },
  {
    slug: 'grayscale-pdf',
    name: 'Grayscale PDF',
    shortDescription: 'Convert color PDFs to clean, print-ready black and white / grayscale.',
    metaDescription: 'Convert color PDF files to monochrome grayscale in your browser. High-resolution print-ready black and white conversion with complete local privacy.',
    category: 'optimize',
    badge: 'Monochrome',
    status: 'available',
    icon: 'Moon',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Converts full-color pages into monochrome black & white',
      'Standard ITU-R luminance weighting (0.299R + 0.587G + 0.114B)',
      'High-resolution print rendering (up to 2.0× DPI)',
      'Sequential page processing to protect browser RAM',
      'Zero server upload — local in-browser execution',
    ],
    howItWorks: 'Renders pages sequentially onto an in-memory canvas at high resolution, applies ITU-R grayscale desaturation algorithms across pixel buffers, and synthesizes a print-ready monochrome PDF.',
    steps: [
      { step: 1, title: 'Select PDF', description: 'Choose your color PDF document.' },
      { step: 2, title: 'Select Resolution', description: 'Pick standard or high-resolution print quality.' },
      { step: 3, title: 'Convert & Download', description: 'Download your grayscale PDF.' },
    ],
    tips: [
      'Ideal for reducing printer ink usage and standardizing black-and-white archives.',
    ],
    commonProblems: [
      'Because pages are rendered to high-resolution monochrome raster canvases, selectable text is converted into image pages.',
    ],
    faqs: [
      {
        question: 'Why convert a PDF to grayscale?',
        answer: 'Grayscale PDFs prevent expensive color printer ink usage and ensure clean, uniform contrast for scanning and formal filings.',
      },
    ],
    relatedTools: ['compress-pdf', 'pdf-to-jpg', 'ocr-pdf', 'pdf-editor'],
    relatedGuides: ['how-to-convert-pdf-to-grayscale', 'how-to-compress-a-pdf'],
  },
  {
    slug: 'header-footer',
    name: 'Header & Footer',
    shortDescription: 'Add customizable text, dates, confidentiality notices, and page numbers.',
    metaDescription: 'Add headers and footers to PDF documents directly in your browser. Customize titles, dynamic dates, page numbers, and margins with complete privacy.',
    category: 'edit',
    badge: 'Formatter',
    status: 'available',
    icon: 'FileText',
    acceptsMultiple: false,
    acceptedFileTypes: ['.pdf', 'application/pdf'],
    features: [
      'Add top headers and bottom footers with custom text',
      'Dynamic tokens: {page}, {total}, and {date}',
      'Left, center, and right text alignment',
      'Skip cover page / first page option',
      'Vector text stamping with zero rasterization',
    ],
    howItWorks: 'Stamps crisp vector typography into the PDF content stream locally in your browser using pdf-lib. Evaluates page rotation and dimensions to position text accurately at top and bottom margins.',
    steps: [
      { step: 1, title: 'Upload PDF', description: 'Select the document you want to stamp.' },
      { step: 2, title: 'Configure Text', description: 'Enter header and footer text with alignment and tokens.' },
      { step: 3, title: 'Apply & Save', description: 'Download your professional, formatted PDF.' },
    ],
    tips: [
      'Use {page} of {total} in the footer for automated pagination.',
      'Check "Skip first page" when formatting documents with title covers.',
    ],
    commonProblems: [
      'Ensure top/bottom margins are large enough so text does not overlap existing page content.',
    ],
    faqs: [
      {
        question: 'Can I add different headers on even and odd pages?',
        answer: 'Currently headers and footers are applied uniformly with an option to skip the cover page.',
      },
    ],
    relatedTools: ['add-page-numbers', 'watermark-pdf', 'pdf-editor', 'crop-pdf'],
    relatedGuides: ['how-to-add-headers-and-footers-to-a-pdf', 'how-to-add-page-numbers-to-a-pdf'],
  },
];

export const TOOL_CATEGORIES = [
  { id: 'create-convert', name: 'Create & Convert', description: 'Convert between PDF, Word, Excel, PowerPoint, images, and text with local precision.' },
  { id: 'edit', name: 'Edit & Annotate', description: 'Annotate, sign, fill forms, crop, stamp, watermark, and rotate pages.' },
  { id: 'organize', name: 'Organize', description: 'Merge, split, extract, compare, and reorder PDF pages with drag-and-drop ease.' },
  { id: 'optimize', name: 'Optimize', description: 'Compress file sizes and extract searchable text via client-side OCR.' },
  { id: 'secure', name: 'Security', description: 'Protect documents with passwords and manage encryption locally.' },
] as const;

export function getToolBySlug(slug: string): ToolMetadata | undefined {
  return TOOLS_REGISTRY.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: string): ToolMetadata[] {
  return TOOLS_REGISTRY.filter((t) => t.category === category);
}

export function getRelatedTools(tool: ToolMetadata | string): ToolMetadata[] {
  const slug = typeof tool === 'string' ? tool : tool.slug;
  const rel = getCuratedRelationship(slug);
  return rel.relatedTools
    .map((s) => getToolBySlug(s))
    .filter((t): t is ToolMetadata => Boolean(t));
}

export function getRelatedGuidesForTool(tool: ToolMetadata | string): string[] {
  const slug = typeof tool === 'string' ? tool : tool.slug;
  const rel = getCuratedRelationship(slug);
  return rel.relatedGuides;
}
