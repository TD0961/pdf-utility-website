import { GuideArticle } from '@/types/guide';

export const GUIDES_REGISTRY: GuideArticle[] = [
  {
    slug: 'how-browser-based-pdf-processing-works',
    title: 'How Browser-Based PDF Processing Works (And Why It Protects Your Privacy)',
    shortDescription: 'Understand how modern WebAssembly and Web Workers enable full PDF manipulation directly in your browser without uploading files.',
    metaDescription: 'Learn how client-side PDF processing works in modern web browsers. Understand the technology that protects your privacy without server uploads.',
    category: 'Privacy & Architecture',
    readTime: '5 min read',
    publishedDate: '2025-01-15',
    updatedDate: '2025-02-10',
    relatedToolSlug: 'merge-pdf',
    relatedGuides: ['how-to-merge-pdf-files', 'what-is-ocr'],
    content: {
      intro: 'Historically, online PDF tools required you to upload confidential files to third-party servers. Today, modern web standards allow browsers to manipulate PDF documents locally on your device.',
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
            'No network payload containing your document data ever leaves your device. Once you close the tab, the memory is cleared.',
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
      summary: 'Client-side processing represents the future of document utility software: zero data custody, zero server upload risks, and lightning-fast local performance.',
    },
  },
  {
    slug: 'how-to-merge-pdf-files',
    title: 'How to Merge PDF Files Offline in Your Browser',
    shortDescription: 'A step-by-step guide to combining multiple PDFs into one consolidated document quickly and privately.',
    metaDescription: 'Step-by-step guide to merging PDF files directly in your web browser. Free, fast, private, and simple.',
    category: 'Organize',
    readTime: '4 min read',
    publishedDate: '2025-01-20',
    updatedDate: '2025-02-12',
    relatedToolSlug: 'merge-pdf',
    relatedGuides: ['how-to-split-a-pdf', 'how-browser-based-pdf-processing-works'],
    content: {
      intro: 'Combining multiple PDF documents into a single cohesive report is one of the most common productivity tasks. Here is how to do it in seconds with complete privacy.',
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
      summary: 'Merging PDFs in your browser is fast, preserves original resolution, and keeps your private paperwork strictly on your device.',
    },
  },
  {
    slug: 'how-to-split-a-pdf',
    title: 'How to Split a PDF into Separate Pages or Custom Ranges',
    shortDescription: 'Learn how to pull apart large PDF documents into manageable chapters or individual pages.',
    metaDescription: 'Learn how to split PDF files into individual pages or custom ranges without uploading files to third-party servers.',
    category: 'Organize',
    readTime: '3 min read',
    publishedDate: '2025-01-22',
    updatedDate: '2025-02-14',
    relatedToolSlug: 'split-pdf',
    relatedGuides: ['how-to-merge-pdf-files', 'how-to-extract-pages-from-a-pdf'],
    content: {
      intro: 'Large multi-page PDF documents frequently contain extra boilerplate or sections you need to share separately. Splitting lets you isolate exactly what you need.',
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
      summary: 'Extracting chapters or isolated pages takes seconds and requires no subscription or software installation.',
    },
  },
  {
    slug: 'what-is-ocr',
    title: 'What Is OCR and How Does Optical Character Recognition Work?',
    shortDescription: 'Discover how OCR converts pictures of letters into searchable, selectable text streams.',
    metaDescription: 'A beginner-friendly guide to Optical Character Recognition (OCR) and how scanned PDFs become selectable text.',
    category: 'Technology',
    readTime: '5 min read',
    publishedDate: '2025-02-01',
    updatedDate: '2025-02-18',
    relatedToolSlug: 'ocr-pdf',
    relatedGuides: ['how-browser-based-pdf-processing-works'],
    content: {
      intro: 'If you have ever scanned a physical paper document with an office scanner or smartphone camera, you may have noticed you cannot highlight or copy the text. Here is why, and how OCR fixes it.',
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
      summary: 'OCR transforms static photos of paper into actionable, indexable, and accessible digital documents.',
    },
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDES_REGISTRY.find((g) => g.slug === slug);
}
