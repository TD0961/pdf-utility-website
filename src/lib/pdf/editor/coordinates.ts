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

import { Point, Rect } from './types';

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
