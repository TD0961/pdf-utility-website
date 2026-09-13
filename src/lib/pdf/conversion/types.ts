/**
 * PDFSimplify — Conversion Architecture Foundation Types
 * Strictly zero-backend, client-side OpenXML document conversion data models.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FontDescriptor {
  name: string;
  size: number;
  isBold: boolean;
  isItalic: boolean;
  colorHex?: string;
}

export interface TextSpan {
  text: string;
  box: BoundingBox;
  font: FontDescriptor;
}

export interface TextLine {
  text: string;
  box: BoundingBox;
  spans: TextSpan[];
  dominantFontSize: number;
  isHeadingCandidate: boolean;
}

export type BlockType = 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'listItem';

export interface TextBlock {
  type: BlockType;
  box: BoundingBox;
  lines: TextLine[];
  text: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface ConversionPageLayout {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  blocks: TextBlock[];
  rawItemCount: number;
  hasSelectableText: boolean;
}

export interface ConversionDocumentLayout {
  fileName: string;
  fileSizeBytes: number;
  totalPages: number;
  pages: ConversionPageLayout[];
  medianBodyFontSize: number;
  title?: string;
}

export interface CancellationToken {
  isCancelled: boolean;
  cancel: () => void;
}

export type ConversionProgressStage =
  | 'initializing'
  | 'analyzing'
  | 'reconstructing'
  | 'packaging'
  | 'validating'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface ConversionProgress {
  stage: ConversionProgressStage;
  stageDescription: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
}

export type ConversionProgressCallback = (progress: ConversionProgress) => void;

export interface ConversionOptions {
  detectHeadings?: boolean;
  preserveFormatting?: boolean;
  includePageBreaks?: boolean;
  outputFileName?: string;
  onProgress?: ConversionProgressCallback;
  cancellationToken?: CancellationToken;
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  outputFileName?: string;
  outputBytes?: Uint8Array;
  bytes?: Uint8Array;
  uint8Array?: Uint8Array;
  totalPages: number;
  fileSizeBytes: number;
  durationMs: number;
  stats: {
    totalBlocks: number;
    totalHeadings: number;
    totalParagraphs: number;
    totalWords: number;
  };
}
