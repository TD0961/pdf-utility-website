import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeRotation,
  getScreenDimensions,
  pdfPointToScreenPoint,
  screenPointToPdfPoint,
  pdfRectToScreenRect,
  screenRectToPdfRect,
} from '@/lib/pdf/editor/coordinates';

describe('PDF Editor — Coordinates Transformation Engine', () => {
  const pageA4 = { width: 595, height: 842 };

  it('normalizes arbitrary rotation angles to standard quadrants', () => {
    assert.strictEqual(normalizeRotation(0), 0);
    assert.strictEqual(normalizeRotation(90), 90);
    assert.strictEqual(normalizeRotation(180), 180);
    assert.strictEqual(normalizeRotation(270), 270);
    assert.strictEqual(normalizeRotation(360), 0);
    assert.strictEqual(normalizeRotation(-90), 270);
    assert.strictEqual(normalizeRotation(450), 90);
  });

  it('computes screen dimensions across rotations and zoom factors', () => {
    // 0 degrees, 1x zoom
    const d0 = getScreenDimensions(pageA4, 0, 1);
    assert.strictEqual(d0.width, 595);
    assert.strictEqual(d0.height, 842);

    // 90 degrees, 1x zoom (width & height swap)
    const d90 = getScreenDimensions(pageA4, 90, 1);
    assert.strictEqual(d90.width, 842);
    assert.strictEqual(d90.height, 595);

    // 180 degrees, 2x zoom
    const d180 = getScreenDimensions(pageA4, 180, 2);
    assert.strictEqual(d180.width, 1190);
    assert.strictEqual(d180.height, 1684);

    // 270 degrees, 0.5x zoom
    const d270 = getScreenDimensions(pageA4, 270, 0.5);
    assert.strictEqual(d270.width, Math.round(842 * 0.5));
    assert.strictEqual(d270.height, Math.round(595 * 0.5));
  });

  it('transforms points with 100% roundtrip fidelity at 0 degrees', () => {
    const originalPdfPoint = { x: 120.5, y: 340.25 };
    const zoom = 1.5;

    const screenPoint = pdfPointToScreenPoint(originalPdfPoint, pageA4, 0, zoom);
    assert.strictEqual(Math.round(screenPoint.x), Math.round(120.5 * 1.5));
    assert.strictEqual(Math.round(screenPoint.y), Math.round((842 - 340.25) * 1.5));

    const restoredPdfPoint = screenPointToPdfPoint(screenPoint, pageA4, 0, zoom);
    assert.ok(Math.abs(restoredPdfPoint.x - originalPdfPoint.x) < 1e-4);
    assert.ok(Math.abs(restoredPdfPoint.y - originalPdfPoint.y) < 1e-4);
  });

  it('transforms points with 100% roundtrip fidelity at 90 degrees clockwise', () => {
    const originalPdfPoint = { x: 50, y: 100 };
    const zoom = 1.0;

    const screenPoint = pdfPointToScreenPoint(originalPdfPoint, pageA4, 90, zoom);
    const restoredPdfPoint = screenPointToPdfPoint(screenPoint, pageA4, 90, zoom);

    assert.ok(Math.abs(restoredPdfPoint.x - originalPdfPoint.x) < 1e-4);
    assert.ok(Math.abs(restoredPdfPoint.y - originalPdfPoint.y) < 1e-4);
  });

  it('transforms points with 100% roundtrip fidelity at 180 degrees', () => {
    const originalPdfPoint = { x: 200, y: 450 };
    const zoom = 1.25;

    const screenPoint = pdfPointToScreenPoint(originalPdfPoint, pageA4, 180, zoom);
    const restoredPdfPoint = screenPointToPdfPoint(screenPoint, pageA4, 180, zoom);

    assert.ok(Math.abs(restoredPdfPoint.x - originalPdfPoint.x) < 1e-4);
    assert.ok(Math.abs(restoredPdfPoint.y - originalPdfPoint.y) < 1e-4);
  });

  it('transforms points with 100% roundtrip fidelity at 270 degrees', () => {
    const originalPdfPoint = { x: 80, y: 520 };
    const zoom = 2.0;

    const screenPoint = pdfPointToScreenPoint(originalPdfPoint, pageA4, 270, zoom);
    const restoredPdfPoint = screenPointToPdfPoint(screenPoint, pageA4, 270, zoom);

    assert.ok(Math.abs(restoredPdfPoint.x - originalPdfPoint.x) < 1e-4);
    assert.ok(Math.abs(restoredPdfPoint.y - originalPdfPoint.y) < 1e-4);
  });

  it('converts bounding rectangles bidirectionally preserving area and bounds', () => {
    const originalRect = { x: 50, y: 150, width: 100, height: 60 };

    for (const rot of [0, 90, 180, 270]) {
      const screenRect = pdfRectToScreenRect(originalRect, pageA4, rot, 1.5);
      assert.ok(screenRect.width > 0);
      assert.ok(screenRect.height > 0);

      const backRect = screenRectToPdfRect(screenRect, pageA4, rot, 1.5);
      assert.ok(Math.abs(backRect.x - originalRect.x) < 1e-4, `X mismatch at rot ${rot}`);
      assert.ok(Math.abs(backRect.y - originalRect.y) < 1e-4, `Y mismatch at rot ${rot}`);
      assert.ok(Math.abs(backRect.width - originalRect.width) < 1e-4, `Width mismatch at rot ${rot}`);
      assert.ok(Math.abs(backRect.height - originalRect.height) < 1e-4, `Height mismatch at rot ${rot}`);
    }
  });
});
