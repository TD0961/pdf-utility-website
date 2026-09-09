/**
 * Phase 3C.1: PDF Editor Engine — Object Factories & Utilities
 * Type-safe creation, cloning, and serialization of editor annotations and vector shapes.
 */

import {
  ColorRgb,
  EditorObject,
  TextObject,
  HighlightObject,
  DrawingObject,
  RectangleObject,
  EllipseObject,
  LineObject,
  ArrowObject,
  ImageObject,
  SignatureObject,
  Point,
  SupportedFontFamily,
} from './types';

export const COLORS = {
  BLACK: { r: 0, g: 0, b: 0 } as ColorRgb,
  WHITE: { r: 1, g: 1, b: 1 } as ColorRgb,
  RED: { r: 0.9, g: 0.1, b: 0.1 } as ColorRgb,
  BLUE: { r: 0.1, g: 0.4, b: 0.9 } as ColorRgb,
  GREEN: { r: 0.1, g: 0.7, b: 0.2 } as ColorRgb,
  YELLOW_HIGHLIGHT: { r: 1, g: 0.9, b: 0.2 } as ColorRgb,
  GRAY: { r: 0.5, g: 0.5, b: 0.5 } as ColorRgb,
};

export function generateObjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `obj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function hexToRgb(hex: string): ColorRgb {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length !== 6) {
    return COLORS.BLACK;
  }
  const num = parseInt(cleaned, 16);
  return {
    r: Math.min(1, Math.max(0, ((num >> 16) & 255) / 255)),
    g: Math.min(1, Math.max(0, ((num >> 8) & 255) / 255)),
    b: Math.min(1, Math.max(0, (num & 255) / 255)),
  };
}

export function rgbToHex(color: ColorRgb): string {
  const r = Math.round(color.r * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(color.g * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(color.b * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${r}${g}${b}`;
}

function safeNumber(
  val: number | undefined,
  fallback: number,
  min?: number,
  max?: number
): number {
  if (val === undefined || !Number.isFinite(val)) return fallback;
  let res = val;
  if (min !== undefined) res = Math.max(min, res);
  if (max !== undefined) res = Math.min(max, res);
  return res;
}

export function createTextObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: SupportedFontFamily;
  color?: ColorRgb;
  opacity?: number;
  rotation?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  id?: string;
}): TextObject {
  return {
    type: 'text',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    text: typeof params.text === 'string' ? params.text : '',
    fontSize: safeNumber(params.fontSize, 14, 4, 288),
    fontFamily: params.fontFamily ?? 'Helvetica',
    color: params.color ?? COLORS.BLACK,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
    rotation: safeNumber(params.rotation, 0),
    bold: params.bold ?? false,
    italic: params.italic ?? false,
    underline: params.underline ?? false,
    align: params.align ?? 'left',
  };
}

export function createHighlightObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: ColorRgb;
  opacity?: number;
  id?: string;
}): HighlightObject {
  return {
    type: 'highlight',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    width: safeNumber(params.width, 10, 1),
    height: safeNumber(params.height, 10, 1),
    color: params.color ?? COLORS.YELLOW_HIGHLIGHT,
    opacity: safeNumber(params.opacity, 0.35, 0.05, 1),
  };
}

export function createDrawingObject(params: {
  pageIndex: number;
  points: Point[];
  strokeWidth?: number;
  color?: ColorRgb;
  opacity?: number;
  id?: string;
}): DrawingObject {
  // Deduplicate redundant micro-jitter points and enforce finite bounds
  const validPoints: Point[] = [];
  for (const pt of params.points || []) {
    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;
    if (validPoints.length > 0) {
      const last = validPoints[validPoints.length - 1];
      const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
      if (dist < 0.5) continue; // skip redundant sub-point jitter
    }
    validPoints.push({ x: pt.x, y: pt.y });
  }

  return {
    type: 'drawing',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    points: validPoints,
    strokeWidth: safeNumber(params.strokeWidth, 2, 0.5, 72),
    color: params.color ?? COLORS.BLACK,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
  };
}

export function createRectangleObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: ColorRgb;
  fillColor?: ColorRgb;
  opacity?: number;
  id?: string;
}): RectangleObject {
  return {
    type: 'rectangle',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    width: safeNumber(params.width, 10, 1),
    height: safeNumber(params.height, 10, 1),
    strokeWidth: safeNumber(params.strokeWidth, 2, 0.5, 72),
    strokeColor: params.strokeColor ?? COLORS.BLACK,
    fillColor: params.fillColor,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
  };
}

export function createEllipseObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: ColorRgb;
  fillColor?: ColorRgb;
  opacity?: number;
  id?: string;
}): EllipseObject {
  return {
    type: 'ellipse',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    width: safeNumber(params.width, 10, 1),
    height: safeNumber(params.height, 10, 1),
    strokeWidth: safeNumber(params.strokeWidth, 2, 0.5, 72),
    strokeColor: params.strokeColor ?? COLORS.BLACK,
    fillColor: params.fillColor,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
  };
}

export function createLineObject(params: {
  pageIndex: number;
  start: Point;
  end: Point;
  strokeWidth?: number;
  strokeColor?: ColorRgb;
  opacity?: number;
  id?: string;
}): LineObject {
  return {
    type: 'line',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    start: {
      x: safeNumber(params.start?.x, 0),
      y: safeNumber(params.start?.y, 0),
    },
    end: {
      x: safeNumber(params.end?.x, 0),
      y: safeNumber(params.end?.y, 0),
    },
    strokeWidth: safeNumber(params.strokeWidth, 2, 0.5, 72),
    strokeColor: params.strokeColor ?? COLORS.BLACK,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
  };
}

export function createArrowObject(params: {
  pageIndex: number;
  start: Point;
  end: Point;
  strokeWidth?: number;
  strokeColor?: ColorRgb;
  headLength?: number;
  opacity?: number;
  id?: string;
}): ArrowObject {
  return {
    type: 'arrow',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    start: {
      x: safeNumber(params.start?.x, 0),
      y: safeNumber(params.start?.y, 0),
    },
    end: {
      x: safeNumber(params.end?.x, 0),
      y: safeNumber(params.end?.y, 0),
    },
    strokeWidth: safeNumber(params.strokeWidth, 2, 0.5, 72),
    strokeColor: params.strokeColor ?? COLORS.BLACK,
    headLength: safeNumber(params.headLength, 12, 4, 100),
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
  };
}

export function createImageObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceType: 'jpeg' | 'png' | 'webp';
  dataUrl: string;
  rotation?: number;
  opacity?: number;
  lockAspectRatio?: boolean;
  id?: string;
}): ImageObject {
  return {
    type: 'image',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    width: safeNumber(params.width, 100, 10),
    height: safeNumber(params.height, 100, 10),
    rotation: safeNumber(params.rotation, 0),
    sourceType: params.sourceType,
    dataUrl: params.dataUrl,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
    lockAspectRatio: params.lockAspectRatio ?? true,
  };
}

export function createSignatureObject(params: {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  sourceType?: 'png' | 'jpeg';
  rotation?: number;
  opacity?: number;
  lockAspectRatio?: boolean;
  id?: string;
}): SignatureObject {
  return {
    type: 'signature',
    id: params.id || generateObjectId(),
    pageIndex: safeNumber(params.pageIndex, 0, 0),
    x: safeNumber(params.x, 0),
    y: safeNumber(params.y, 0),
    width: safeNumber(params.width, 150, 10),
    height: safeNumber(params.height, 60, 10),
    rotation: safeNumber(params.rotation, 0),
    sourceType: params.sourceType ?? 'png',
    dataUrl: params.dataUrl,
    opacity: safeNumber(params.opacity, 1, 0.05, 1),
    lockAspectRatio: params.lockAspectRatio ?? true,
  };
}

export function cloneEditorObject(obj: EditorObject): EditorObject {
  if (obj.type === 'drawing') {
    return {
      ...obj,
      points: obj.points.map((p) => ({ ...p })),
      color: { ...obj.color },
    };
  }
  if (obj.type === 'line' || obj.type === 'arrow') {
    return {
      ...obj,
      start: { ...obj.start },
      end: { ...obj.end },
      strokeColor: { ...obj.strokeColor },
    };
  }
  if (obj.type === 'rectangle' || obj.type === 'ellipse') {
    return {
      ...obj,
      strokeColor: { ...obj.strokeColor },
      fillColor: obj.fillColor ? { ...obj.fillColor } : undefined,
    };
  }
  if (obj.type === 'text') {
    return {
      ...obj,
      color: { ...obj.color },
    };
  }
  if (obj.type === 'image' || obj.type === 'signature') {
    return {
      ...obj,
    };
  }
  return {
    ...obj,
    color: { ...(obj as HighlightObject).color },
  };
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  sourceType?: 'jpeg' | 'png' | 'webp';
  dataUrl?: string;
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'Image file size exceeds 15MB limit.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'Image file is empty (0 bytes).' };
  }

  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  let sourceType: 'jpeg' | 'png' | 'webp';
  if (mime === 'image/jpeg' || mime === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    sourceType = 'jpeg';
  } else if (mime === 'image/png' || name.endsWith('.png')) {
    sourceType = 'png';
  } else if (mime === 'image/webp' || name.endsWith('.webp')) {
    sourceType = 'webp';
  } else {
    return {
      valid: false,
      error: 'Unsupported image format. Please select a JPG, PNG, or WebP image.',
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve({ valid: false, error: 'Failed to read image file.' });
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (typeof window === 'undefined') {
        resolve({ valid: true, width: 200, height: 200, sourceType, dataUrl });
        return;
      }
      const img = new Image();
      img.onerror = () => resolve({ valid: false, error: 'Invalid or corrupted image file.' });
      img.onload = () => {
        if (!Number.isFinite(img.naturalWidth) || !Number.isFinite(img.naturalHeight) || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
          resolve({ valid: false, error: 'Image contains invalid or zero dimensions.' });
          return;
        }
        if (img.naturalWidth > 8192 || img.naturalHeight > 8192) {
          resolve({ valid: false, error: 'Image dimensions exceed maximum supported 8192x8192 limit.' });
          return;
        }
        resolve({
          valid: true,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sourceType,
          dataUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

