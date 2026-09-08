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
  return {
    ...obj,
    color: { ...obj.color },
  };
}
