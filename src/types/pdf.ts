export interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  thumbnailUrl?: string;
  rotation?: number; // 0, 90, 180, 270
}

export interface PdfPageItem {
  id: string;
  fileId: string;
  fileName: string;
  pageIndex: number; // 0-based index
  pageNumber: number; // 1-based index
  thumbnailUrl?: string;
  rotation: number;
  selected: boolean;
}

export type ProcessingStatus = 'idle' | 'loading' | 'loaded' | 'processing' | 'success' | 'error';

export interface ProcessingProgress {
  percentage: number;
  stage: string;
  detail?: string;
}

export interface ProcessResult {
  blob: Blob;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  summary?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
