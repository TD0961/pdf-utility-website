import React from 'react';
import { ToolMetadata } from '@/types/tool';
import {
  ShieldCheck,
  Cpu,
  Lock,
  FileCheck2,
  Briefcase,
  Scale,
  GraduationCap,
  UserCheck,
  Info,
  Layers,
} from 'lucide-react';

interface ToolEducationalContentProps {
  tool: ToolMetadata;
}

interface ToolDeepDive {
  title: string;
  engine: string;
  aspects: Array<{
    heading: string;
    description: string;
  }>;
  considerations: Array<string>;
}

const TOOL_DEEP_DIVES: Record<string, ToolDeepDive> = {
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

// Fallback technical profile for other tools
const DEFAULT_DEEP_DIVE: ToolDeepDive = {
  title: 'Technical Implementation & Processing Details',
  engine: 'Client-Side WebAssembly & JavaScript Document Pipeline',
  aspects: [
    {
      heading: 'In-Memory Stream Processing',
      description:
        'When you select a document, its raw bytes are parsed into a structured TypedArray in your device’s volatile memory. The application reads and modifies the PDF object tree directly on your CPU.',
    },
    {
      heading: 'Vector & Layout Preservation',
      description:
        'Operations are applied to document dictionaries and streams without lossy rasterization. Text characters, vector curves, and color spaces remain true to the original file.',
    },
    {
      heading: 'Ephemeral Memory Lifecycle',
      description:
        'Once processing completes and you download the result, resetting the tool or closing the browser tab revokes all object URLs and releases the allocated memory.',
    },
  ],
  considerations: [
    'Processing occurs locally within your web browser sandbox.',
    'Files are handled in device memory rather than uploaded to PDFSimplify servers.',
    'Works seamlessly across modern desktop and mobile browsers.',
  ],
};

export function ToolEducationalContent({ tool }: ToolEducationalContentProps) {
  const isOrganize = tool.category === 'organize';
  const isSecurity = tool.category === 'secure';
  const isConvert = tool.category === 'create-convert';
  const isOptimize = tool.category === 'optimize';

  const deepDive = TOOL_DEEP_DIVES[tool.slug] || DEFAULT_DEEP_DIVE;

  return (
    <div className="space-y-12 pt-4">
      {/* 1. Real-World Practical Use Cases */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Practical Use Cases for {tool.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            How professionals, academics, and individuals leverage {tool.name} for secure, high-efficiency document workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Business & Enterprise</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isOrganize
                ? 'Consolidate monthly financial reviews, pitch decks, client proposals, and invoices into unified executive reports.'
                : isSecurity
                ? 'Enforce access controls on corporate roadmaps, customer agreements, and internal financial audits.'
                : isConvert
                ? 'Transform legacy scans and image receipts into structured, professional documents for accounting archival.'
                : isOptimize
                ? 'Reduce file sizes of quarterly presentations for email delivery to stakeholders without hitting attachment limits.'
                : 'Prepare polished corporate presentations, marketing collateral, and standardized client documentation.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Legal & Compliance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isSecurity
                ? 'Apply standard encryption and access passwords to non-disclosure agreements and judicial depositions.'
                : isOrganize
                ? 'Assemble court exhibits, deposition transcripts, and statutory filings in strict sequential evidentiary order.'
                : 'Maintain document integrity for contractual annexes, client retainers, and regulatory filings.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic & Research</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Organize multi-chapter dissertations, scholarly journal submissions, reading packets, and curriculum vitae while preserving original typography and citation footnotes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Personal Administration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Organize medical summaries, apartment lease applications, tax filings, travel itineraries, and government forms without transmitting personal identity records to external servers.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Tool-Specific Technical Deep Dive */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>{deepDive.engine}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {deepDive.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Key architectural details, file structure considerations, and technical mechanics behind this utility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {deepDive.aspects.map((aspect, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
            >
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{aspect.heading}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {aspect.description}
              </p>
            </div>
          ))}
        </div>

        {/* Practical Considerations */}
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Practical Considerations & Best Practices</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-indigo-950/80 dark:text-indigo-200/80">
            {deepDive.considerations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold text-indigo-600">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Technical Standards & Engine Overview */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Document Standards & Processing Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>PDF Specifications</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Processes documents formatted according to standard PDF specifications (ISO 32000 family) using client-side JavaScript and WebAssembly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vector & Font Preservation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Preserves vector paths, TrueType and OpenType font descriptors, and page content streams without unnecessary rasterization.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-violet-600" />
              <span>Session Memory Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              File data resides in browser memory buffers during your active session and is released upon page reset or navigation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
