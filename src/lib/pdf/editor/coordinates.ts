/**
 * Phase 3C.1: PDF Editor Engine — Coordinate System Transformations
 * Centralized, mathematically rigorous transformations between PDF space and Screen/Canvas space.
 *
 * Coordinate Systems:
 * - PDF Space: Origin (0, 0) at BOTTOM-LEFT of unrotated page. Units: PDF points (1/72 inch).
 * - Screen Space: Origin (0, 0) at TOP-LEFT of rendered viewport. Units: CSS pixels.
 *
 * Supports page rotations: 0°, 90°, 180°, 270° and arbitrary zoom scale factors.
 */

import { Point, Rect, EditorObject } from './types';

export interface PageDimensions {
  width: number;
  height: number;
}

/**
 * Normalizes an angle in degrees to one of {0, 90, 180, 270}.
 */
export function normalizeRotation(rotation: number): 0 | 90 | 180 | 270 {
  const norm = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  return norm as 0 | 90 | 180 | 270;
}

/**
 * Computes visible screen/canvas viewport dimensions based on unrotated page size, rotation, and zoom.
 */
export function getScreenDimensions(
  page: PageDimensions,
  rotation = 0,
  zoom = 1
): { width: number; height: number } {
  const rot = normalizeRotation(rotation);
  const scale = Math.max(0.01, zoom);

  if (rot === 90 || rot === 270) {
    return {
      width: Math.round(page.height * scale),
      height: Math.round(page.width * scale),
    };
  }

  return {
    width: Math.round(page.width * scale),
    height: Math.round(page.height * scale),
  };
}

/**
 * Converts a point from PDF point space (bottom-left origin) to Screen space (top-left origin).
 */
export function pdfPointToScreenPoint(
  point: Point,
  page: PageDimensions,
  rotation = 0,
  zoom = 1
): Point {
  const rot = normalizeRotation(rotation);
  const scale = Math.max(0.01, zoom);
  const { width: W, height: H } = page;

  switch (rot) {
    case 0:
      return {
        x: point.x * scale,
        y: (H - point.y) * scale,
      };
    case 90:
      return {
        x: point.y * scale,
        y: point.x * scale,
      };
    case 180:
      return {
        x: (W - point.x) * scale,
        y: point.y * scale,
      };
    case 270:
      return {
        x: (H - point.y) * scale,
        y: (W - point.x) * scale,
      };
  }
}

/**
 * Converts a point from Screen space (top-left origin) to PDF point space (bottom-left origin).
 */
export function screenPointToPdfPoint(
  point: Point,
  page: PageDimensions,
  rotation = 0,
  zoom = 1
): Point {
  const rot = normalizeRotation(rotation);
  const scale = Math.max(0.01, zoom);
  const { width: W, height: H } = page;

  switch (rot) {
    case 0:
      return {
        x: point.x / scale,
        y: H - point.y / scale,
      };
    case 90:
      return {
        x: point.y / scale,
        y: point.x / scale,
      };
    case 180:
      return {
        x: W - point.x / scale,
        y: point.y / scale,
      };
    case 270:
      return {
        x: W - point.y / scale,
        y: H - point.x / scale,
      };
  }
}

/**
 * Converts a bounding rectangle from PDF space to Screen space.
 */
export function pdfRectToScreenRect(
  rect: Rect,
  page: PageDimensions,
  rotation = 0,
  zoom = 1
): Rect {
  const p1 = pdfPointToScreenPoint({ x: rect.x, y: rect.y }, page, rotation, zoom);
  const p2 = pdfPointToScreenPoint({ x: rect.x + rect.width, y: rect.y }, page, rotation, zoom);
  const p3 = pdfPointToScreenPoint({ x: rect.x, y: rect.y + rect.height }, page, rotation, zoom);
  const p4 = pdfPointToScreenPoint(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    page,
    rotation,
    zoom
  );

  const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
  const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
  const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
  const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Converts a bounding rectangle from Screen space to PDF space.
 */
export function screenRectToPdfRect(
  rect: Rect,
  page: PageDimensions,
  rotation = 0,
  zoom = 1
): Rect {
  const s1 = screenPointToPdfPoint({ x: rect.x, y: rect.y }, page, rotation, zoom);
  const s2 = screenPointToPdfPoint({ x: rect.x + rect.width, y: rect.y }, page, rotation, zoom);
  const s3 = screenPointToPdfPoint({ x: rect.x, y: rect.y + rect.height }, page, rotation, zoom);
  const s4 = screenPointToPdfPoint(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    page,
    rotation,
    zoom
  );

  const minX = Math.min(s1.x, s2.x, s3.x, s4.x);
  const maxX = Math.max(s1.x, s2.x, s3.x, s4.x);
  const minY = Math.min(s1.y, s2.y, s3.y, s4.y);
  const maxY = Math.max(s1.y, s2.y, s3.y, s4.y);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes the axis-aligned bounding box of any EditorObject in PDF coordinate space.
 */
export function getObjectBoundingBox(obj: EditorObject): Rect {
  switch (obj.type) {
    case 'rectangle':
    case 'highlight':
    case 'image':
    case 'signature':
      return {
        x: obj.x,
        y: obj.y,
        width: Math.max(1, obj.width),
        height: Math.max(1, obj.height),
      };

    case 'ellipse':
      return {
        x: obj.x,
        y: obj.y,
        width: Math.max(1, obj.width),
        height: Math.max(1, obj.height),
      };

    case 'line':
    case 'arrow': {
      const minX = Math.min(obj.start.x, obj.end.x);
      const maxX = Math.max(obj.start.x, obj.end.x);
      const minY = Math.min(obj.start.y, obj.end.y);
      const maxY = Math.max(obj.start.y, obj.end.y);
      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }

    case 'drawing': {
      if (!obj.points || obj.points.length === 0) {
        return { x: 0, y: 0, width: 10, height: 10 };
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const pt of obj.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }

    case 'text': {
      const charWidth = obj.fontSize * 0.55;
      const textWidth = Math.max(12, (obj.text.length || 1) * charWidth);
      const textHeight = Math.max(12, obj.fontSize);
      let x = obj.x;
      if (obj.align === 'center') {
        x = obj.x - textWidth / 2;
      } else if (obj.align === 'right') {
        x = obj.x - textWidth;
      }
      return {
        x,
        y: obj.y,
        width: textWidth,
        height: textHeight,
      };
    }
  }
}

/**
 * Converts screen delta displacement (in points) to PDF space delta
 * accounting for page rotation (0°, 90°, 180°, 270°).
 *
 * Screen: +screenDx is RIGHT, -screenDx is LEFT, +screenDy is DOWN, -screenDy is UP.
 * PDF: +x is RIGHT, -x is LEFT, +y is UP, -y is DOWN.
 */
export function screenDeltaToPdfDelta(
  screenDx: number,
  screenDy: number,
  rotation = 0
): { dx: number; dy: number } {
  const rot = normalizeRotation(rotation);
  switch (rot) {
    case 0:
      return { dx: screenDx, dy: -screenDy };
    case 90:
      return { dx: -screenDy, dy: screenDx };
    case 180:
      return { dx: -screenDx, dy: screenDy };
    case 270:
      return { dx: screenDy, dy: -screenDx };
  }
}

