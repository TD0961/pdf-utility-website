/**
 * Phase 3C.1: PDF Editor Engine & Data Model — Type Definitions
 * 100% in-browser, client-side, zero-backend document editing definitions.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorRgb {
  /** Red component in [0, 1] range */
  r: number;
  /** Green component in [0, 1] range */
  g: number;
  /** Blue component in [0, 1] range */
  b: number;
}

export type SupportedFontFamily = 'Helvetica' | 'TimesRoman' | 'Courier';

export interface BaseEditorObject {
  id: string;
  pageIndex: number;
  opacity: number;
}

export interface TextObject extends BaseEditorObject {
  type: 'text';
  /** PDF X coordinate (origin: bottom-left) */
  x: number;
  /** PDF Y coordinate (origin: bottom-left) */
  y: number;
  text: string;
  fontSize: number;
  fontFamily: SupportedFontFamily;
  color: ColorRgb;
  rotation?: number; // degrees
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface HighlightObject extends BaseEditorObject {
  type: 'highlight';
  /** PDF X coordinate (origin: bottom-left) */
  x: number;
  /** PDF Y coordinate (origin: bottom-left) */
  y: number;
  width: number;
  height: number;
  color: ColorRgb;
}

export interface DrawingObject extends BaseEditorObject {
  type: 'drawing';
  /** Array of stroke points in PDF space */
  points: Point[];
  strokeWidth: number;
  color: ColorRgb;
}

export interface RectangleObject extends BaseEditorObject {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: ColorRgb;
  fillColor?: ColorRgb;
}

export interface EllipseObject extends BaseEditorObject {
  type: 'ellipse';
  /** Center X in PDF space */
  x: number;
  /** Center Y in PDF space */
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor: ColorRgb;
  fillColor?: ColorRgb;
}

export interface LineObject extends BaseEditorObject {
  type: 'line';
  start: Point;
  end: Point;
  strokeWidth: number;
  strokeColor: ColorRgb;
}

export interface ArrowObject extends BaseEditorObject {
  type: 'arrow';
  start: Point;
  end: Point;
  strokeWidth: number;
  strokeColor: ColorRgb;
  headLength?: number;
}

export interface ImageObject extends BaseEditorObject {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // 0, 90, 180, 270
  sourceType: 'jpeg' | 'png' | 'webp';
  /** In-memory data URL or object URL */
  dataUrl: string;
  lockAspectRatio?: boolean;
}

export interface SignatureObject extends BaseEditorObject {
  type: 'signature';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  sourceType: 'png' | 'jpeg';
  dataUrl: string;
  lockAspectRatio?: boolean;
}

export type EditorObject =
  | TextObject
  | HighlightObject
  | DrawingObject
  | RectangleObject
  | EllipseObject
  | LineObject
  | ArrowObject
  | ImageObject
  | SignatureObject;

export interface EditorPage {
  /** 0-based visual index of the page in the current document */
  pageIndex: number;
  /** 0-based index of the original page in the source PDF */
  originalPageIndex: number;
  /** Width in unrotated PDF points (1/72 inch) */
  width: number;
  /** Height in unrotated PDF points (1/72 inch) */
  height: number;
  /** Visual rotation of the page in degrees (0, 90, 180, 270) */
  rotation: number;
  /** Editing objects associated with this page */
  objects: EditorObject[];
}

export interface PdfSearchMatch {
  pageIndex: number;
  itemIndex?: number;
  matchStart?: number;
  matchEnd?: number;
  rect: Rect;
  text: string;
}

export interface PdfSearchResult {
  query: string;
  totalMatches: number;
  matches: PdfSearchMatch[];
  activeMatchIndex: number;
  isSearching: boolean;
  hasExtractedText: boolean;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export type PdfFormFieldType =
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'optionList'
  | 'signature'
  | 'other';

export interface PdfFormFieldInfo {
  name: string;
  type: PdfFormFieldType;
  pageIndex?: number;
  readOnly?: boolean;
  value?: string | boolean | string[];
}

export interface PdfFormSummary {
  hasAcroForm: boolean;
  totalFields: number;
  counts: {
    text: number;
    checkbox: number;
    radio: number;
    dropdown: number;
    optionList: number;
    signature: number;
    other: number;
  };
  fields: PdfFormFieldInfo[];
}

export type DocumentSaveState = 'clean' | 'dirty' | 'saving' | 'saved' | 'error';

export interface EditorExportProgress {
  stage: string;
  percent: number;
}

export interface EditorDocumentState {
  sourceBytes: Uint8Array;
  fileName: string;
  pages: EditorPage[];
  activePageIndex: number;
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  zoom: number;
  isModified: boolean;
  saveState: DocumentSaveState;
  lastSavedAt?: number;
  exportProgress?: EditorExportProgress | null;
  metadata: PdfMetadata;
  formSummary: PdfFormSummary;
  documentGeneration: number;
}

export type EditorAction =
  | { type: 'ADD_OBJECT'; pageIndex: number; object: EditorObject }
  | { type: 'UPDATE_OBJECT'; pageIndex: number; objectId: string; previous: EditorObject; updated: EditorObject }
  | { type: 'DELETE_OBJECT'; pageIndex: number; object: EditorObject }
  | { type: 'BATCH_OBJECT_OP'; pageIndex: number; description?: string; selectedObjectIds?: string[]; previous: EditorObject[]; current: EditorObject[] }
  | { type: 'REORDER_OBJECTS'; pageIndex: number; previousOrder: string[]; newOrder: string[] }
  | { type: 'DELETE_PAGE'; pageIndex: number; page: EditorPage }
  | { type: 'DUPLICATE_PAGE'; pageIndex: number; newPageIndex: number }
  | { type: 'ROTATE_PAGE'; pageIndex: number; previousRotation: number; newRotation: number }
  | { type: 'MOVE_PAGE'; fromIndex: number; toIndex: number }
  | { type: 'BATCH_PAGE_OP'; description: string; previousPages: EditorPage[]; currentPages: EditorPage[]; previousActiveIndex: number; currentActiveIndex: number }
  | { type: 'UPDATE_METADATA'; previous: PdfMetadata; updated: PdfMetadata };

export interface EditorExportResult {
  blob: Blob;
  uint8Array: Uint8Array;
  totalPages: number;
  fileSize: number;
  fileName: string;
}

