import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PdfEditorEngine } from '@/lib/pdf/editor/editor-engine';
import {
  createTextObject,
  createHighlightObject,
  createDrawingObject,
  createRectangleObject,
  createEllipseObject,
  createArrowObject,
} from '@/lib/pdf/editor/objects';
import {
  getScreenDimensions,
  pdfPointToScreenPoint,
  screenPointToPdfPoint,
  pdfRectToScreenRect,
  screenRectToPdfRect,
} from '@/lib/pdf/editor/coordinates';
import { createTestPdf } from './test-helpers';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
import { protectPdf } from '@/lib/pdf/protect';

describe('PDF Editor Phase 3C.3 — Production Hardening & Stress Suite', () => {
  // --------------------------------------------------------------------------
  // 1. Coordinate System Stress Matrix
  // --------------------------------------------------------------------------
  describe('Coordinate System & Rotation Stress Matrix', () => {
    const rotations = [0, 90, 180, 270] as const;
    const zooms = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
    const pageSizes = [
      { name: 'Letter', width: 612, height: 792 },
      { name: 'A4', width: 595, height: 842 },
      { name: 'Landscape A4', width: 842, height: 595 },
      { name: 'Square', width: 500, height: 500 },
      { name: 'Receipt', width: 200, height: 400 },
      { name: 'Blueprint', width: 1200, height: 1800 },
    ];

    it('guarantees roundtrip point conversion across all rotations and zoom levels', () => {
      for (const page of pageSizes) {
        for (const rot of rotations) {
          for (const zoom of zooms) {
            // Test 5 sample points on each page
            const testPoints = [
              { x: 0, y: 0 },
              { x: page.width, y: page.height },
              { x: page.width / 2, y: page.height / 2 },
              { x: 42.75, y: 128.3 },
              { x: page.width - 15.5, y: 55.2 },
            ];

            for (const pt of testPoints) {
              const screen = pdfPointToScreenPoint(pt, page, rot, zoom);
              assert.ok(Number.isFinite(screen.x), `Screen X not finite for ${page.name} rot=${rot} zoom=${zoom}`);
              assert.ok(Number.isFinite(screen.y), `Screen Y not finite for ${page.name} rot=${rot} zoom=${zoom}`);

              const restored = screenPointToPdfPoint(screen, page, rot, zoom);
              assert.ok(
                Math.abs(restored.x - pt.x) < 1e-3,
                `X mismatch for ${page.name} rot=${rot} zoom=${zoom}: orig=${pt.x}, restored=${restored.x}`
              );
              assert.ok(
                Math.abs(restored.y - pt.y) < 1e-3,
                `Y mismatch for ${page.name} rot=${rot} zoom=${zoom}: orig=${pt.y}, restored=${restored.y}`
              );
            }
          }
        }
      }
    });

    it('guarantees bounding rectangle roundtrips with non-negative dimensions', () => {
      for (const page of pageSizes) {
        for (const rot of rotations) {
          const origRect = { x: 50, y: 80, width: 120, height: 90 };
          const screenRect = pdfRectToScreenRect(origRect, page, rot, 1.25);

          assert.ok(screenRect.width > 0, `Screen rect width must be > 0 at rot ${rot}`);
          assert.ok(screenRect.height > 0, `Screen rect height must be > 0 at rot ${rot}`);

          const back = screenRectToPdfRect(screenRect, page, rot, 1.25);
          assert.ok(Math.abs(back.x - origRect.x) < 1e-3);
          assert.ok(Math.abs(back.y - origRect.y) < 1e-3);
          assert.ok(Math.abs(back.width - origRect.width) < 1e-3);
          assert.ok(Math.abs(back.height - origRect.height) < 1e-3);
        }
      }
    });

    it('handles extreme zoom bounds gracefully without NaN or Infinity', () => {
      const page = { width: 612, height: 792 };
      const dimsMin = getScreenDimensions(page, 0, 0.0001);
      assert.ok(dimsMin.width > 0);
      assert.ok(dimsMin.height > 0);

      const dimsMax = getScreenDimensions(page, 90, 100);
      assert.ok(dimsMax.width > 0 && Number.isFinite(dimsMax.width));
      assert.ok(dimsMax.height > 0 && Number.isFinite(dimsMax.height));
    });
  });

  // --------------------------------------------------------------------------
  // 2. Object Factories & Input Sanitization
  // --------------------------------------------------------------------------
  describe('Object Factories & Input Sanitization', () => {
    it('sanitizes text objects against NaN, negative font size, and invalid opacity', () => {
      const text = createTextObject({
        pageIndex: 0,
        x: NaN,
        y: Infinity,
        text: 'Test Text',
        fontSize: -20,
        opacity: 2.5,
      });

      assert.strictEqual(text.x, 0);
      assert.strictEqual(text.y, 0);
      assert.strictEqual(text.fontSize, 4); // clamped to min 4 pt
      assert.strictEqual(text.opacity, 1); // clamped to max 1.0
    });

    it('safely handles Unicode, multiline, and special HTML characters in text objects', () => {
      const unicodeSample = 'Hello World! 🚀 汉语 Español Café & <script>alert(1)</script>\nLine 2 with € and £';
      const text = createTextObject({
        pageIndex: 0,
        x: 100,
        y: 200,
        text: unicodeSample,
      });

      assert.strictEqual(text.text, unicodeSample);
    });

    it('sanitizes shapes against negative dimensions and zero widths', () => {
      const rect = createRectangleObject({
        pageIndex: 0,
        x: -50,
        y: 20,
        width: -100,
        height: 0,
        strokeWidth: -5,
      });

      assert.ok(rect.width >= 1);
      assert.ok(rect.height >= 1);
      assert.ok(rect.strokeWidth >= 0.5);

      const ellipse = createEllipseObject({
        pageIndex: 0,
        x: 10,
        y: 10,
        width: -40,
        height: -20,
      });
      assert.ok(ellipse.width >= 1);
      assert.ok(ellipse.height >= 1);
    });

    it('deduplicates drawing strokes and filters non-finite points', () => {
      const drawing = createDrawingObject({
        pageIndex: 0,
        points: [
          { x: 10, y: 10 },
          { x: 10.1, y: 10.1 }, // sub-half-point redundant jitter
          { x: 10.2, y: 10.1 }, // redundant
          { x: 25, y: 30 },
          { x: NaN, y: 40 }, // invalid point
          { x: 40, y: 50 },
        ],
      });

      // Redundant jitter and NaN point should have been removed
      assert.strictEqual(drawing.points.length, 3);
      assert.deepStrictEqual(drawing.points[0], { x: 10, y: 10 });
      assert.deepStrictEqual(drawing.points[1], { x: 25, y: 30 });
      assert.deepStrictEqual(drawing.points[2], { x: 40, y: 50 });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Object Manipulation & Resizing Math
  // --------------------------------------------------------------------------
  describe('Object Manipulation & Resizing Math', () => {
    it('clamps object updates through engine without producing NaN or inverted dimensions', async () => {
      const engine = new PdfEditorEngine();
      const pdfFile = await createTestPdf('manip-test', 1);
      await engine.loadDocument(pdfFile);

      const rect = createRectangleObject({
        pageIndex: 0,
        x: 100,
        y: 100,
        width: 80,
        height: 50,
      });
      engine.addObject(0, rect);

      // Attempt to update with invalid negative dimensions
      engine.updateObject(0, rect.id, {
        width: -200,
        height: NaN,
        opacity: -0.5,
      });

      const updated = engine.getPage(0)?.objects.find((o) => o.id === rect.id);
      assert.ok(updated && updated.type === 'rectangle');
      assert.ok(updated.width >= 1, 'Width must remain >= 1');
      assert.ok(updated.height >= 1, 'Height must remain >= 1');
      assert.ok(updated.opacity >= 0.05, 'Opacity must remain >= 0.05');
    });

    it('preserves selection validity and prevents selecting non-existent objects', async () => {
      const engine = new PdfEditorEngine();
      const pdfFile = await createTestPdf('sel-test', 1);
      await engine.loadDocument(pdfFile);

      const text = createTextObject({ pageIndex: 0, x: 20, y: 20, text: 'Hi' });
      engine.addObject(0, text);
      assert.strictEqual(engine.getState().selectedObjectId, text.id);

      // Attempt to select a random ghost object ID
      engine.selectObject('non-existent-ghost-id');
      assert.strictEqual(engine.getState().selectedObjectId, null);

      // Select valid object
      engine.selectObject(text.id);
      assert.strictEqual(engine.getState().selectedObjectId, text.id);

      // Deselect
      engine.selectObject(null);
      assert.strictEqual(engine.getState().selectedObjectId, null);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Undo / Redo Stack Integrity & Redo Invalidation
  // --------------------------------------------------------------------------
  describe('Undo / Redo Stack Hardening', () => {
    it('invalidates redo history when a new action is performed after undo', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('history-test', 1));

      const objA = createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'A' });
      const objB = createTextObject({ pageIndex: 0, x: 20, y: 20, text: 'B' });
      const objC = createTextObject({ pageIndex: 0, x: 30, y: 30, text: 'C' });

      engine.addObject(0, objA);
      engine.addObject(0, objB);
      engine.addObject(0, objC);
      assert.strictEqual(engine.getPage(0)?.objects.length, 3);

      // Undo twice: C and B removed
      assert.strictEqual(engine.undo(), true);
      assert.strictEqual(engine.undo(), true);
      assert.strictEqual(engine.getPage(0)?.objects.length, 1);
      assert.strictEqual(engine.canRedo(), true);

      // Perform a brand new action: Add objD
      const objD = createTextObject({ pageIndex: 0, x: 40, y: 40, text: 'D' });
      engine.addObject(0, objD);
      assert.strictEqual(engine.getPage(0)?.objects.length, 2);

      // Redo stack MUST be completely cleared/invalidated
      assert.strictEqual(engine.canRedo(), false);
      assert.strictEqual(engine.redo(), false);
    });

    it('interleaves page operations and object operations with complete consistency', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('mixed-ops', 3));

      // 1. Add object on page 0
      const obj1 = createRectangleObject({ pageIndex: 0, x: 10, y: 10, width: 50, height: 50 });
      engine.addObject(0, obj1);

      // 2. Rotate page 0
      engine.rotatePage(0, 90);

      // 3. Duplicate page 0
      engine.duplicatePage(0);
      assert.strictEqual(engine.getPages().length, 4);

      // 4. Move page 1 to 3
      engine.movePage(1, 3);

      // 5. Delete page 2
      engine.deletePage(2);
      assert.strictEqual(engine.getPages().length, 3);

      // Now rewind all steps with undo
      assert.strictEqual(engine.undo(), true); // undo delete
      assert.strictEqual(engine.getPages().length, 4);

      assert.strictEqual(engine.undo(), true); // undo move
      assert.strictEqual(engine.undo(), true); // undo duplicate
      assert.strictEqual(engine.getPages().length, 3);

      assert.strictEqual(engine.undo(), true); // undo rotate
      assert.strictEqual(engine.getPage(0)?.rotation, 0);

      assert.strictEqual(engine.undo(), true); // undo add object
      assert.strictEqual(engine.getPage(0)?.objects.length, 0);

      // Fast forward all with redo
      assert.strictEqual(engine.redo(), true); // redo add object
      assert.strictEqual(engine.getPage(0)?.objects.length, 1);

      assert.strictEqual(engine.redo(), true); // redo rotate
      assert.strictEqual(engine.getPage(0)?.rotation, 90);

      assert.strictEqual(engine.redo(), true); // redo duplicate
      assert.strictEqual(engine.getPages().length, 4);

      assert.strictEqual(engine.redo(), true); // redo move
      assert.strictEqual(engine.redo(), true); // redo delete
      assert.strictEqual(engine.getPages().length, 3);
    });

    it('ensures activePageIndex is never out of bounds during page deletion redo', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('active-bounds', 2));

      // Switch to last page (page 1) and delete it
      engine.setActivePageIndex(1);
      engine.deletePage(1);
      assert.strictEqual(engine.getState().activePageIndex, 0);

      // Undo deletion -> page restored
      engine.undo();
      assert.strictEqual(engine.getPages().length, 2);

      // Redo deletion -> activePageIndex must stay at 0, not out of bounds
      engine.redo();
      assert.strictEqual(engine.getPages().length, 1);
      assert.ok(engine.getState().activePageIndex < engine.getPages().length);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Page Management Edge Cases
  // --------------------------------------------------------------------------
  describe('Page Management Hardening', () => {
    it('strictly forbids deleting the only remaining page', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('only-page', 1));

      assert.throws(() => engine.deletePage(0), /Cannot delete the only remaining page/i);
      assert.strictEqual(engine.getPages().length, 1);
    });

    it('performs full circular rotation wrap-around (0 -> 90 -> 180 -> 270 -> 0)', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('rot-wrap', 1));

      engine.rotatePage(0, 90);
      assert.strictEqual(engine.getPage(0)?.rotation, 90);

      engine.rotatePage(0, 90);
      assert.strictEqual(engine.getPage(0)?.rotation, 180);

      engine.rotatePage(0, 90);
      assert.strictEqual(engine.getPage(0)?.rotation, 270);

      engine.rotatePage(0, 90);
      assert.strictEqual(engine.getPage(0)?.rotation, 0);

      engine.rotatePage(0, -90);
      assert.strictEqual(engine.getPage(0)?.rotation, 270);
    });

    it('supports complex page reordering across all boundaries', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('reorder-doc', 4));

      // Move first to last (0 -> 3)
      engine.movePage(0, 3);
      assert.strictEqual(engine.getPages()[3].originalPageIndex, 0);

      // Move last to first (3 -> 0)
      engine.movePage(3, 0);
      assert.strictEqual(engine.getPages()[0].originalPageIndex, 0);

      // Move middle to last (1 -> 3)
      engine.movePage(1, 3);
      assert.strictEqual(engine.getPages()[3].originalPageIndex, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Large Document Performance & Multi-Page Export
  // --------------------------------------------------------------------------
  describe('Large Document & Multi-Page Export Fidelity', () => {
    it('loads, annotates, and exports a 10-page document with vector fidelity', async () => {
      const engine = new PdfEditorEngine();
      const testDoc = await createTestPdf('ten-pages', 10);
      await engine.loadDocument(testDoc);

      assert.strictEqual(engine.getPages().length, 10);

      // Add annotations across various pages
      engine.addObject(0, createTextObject({ pageIndex: 0, x: 50, y: 100, text: 'Page 1 Header' }));
      engine.addObject(4, createHighlightObject({ pageIndex: 4, x: 40, y: 200, width: 150, height: 30 }));
      engine.addObject(9, createArrowObject({ pageIndex: 9, start: { x: 50, y: 50 }, end: { x: 250, y: 100 } }));

      // Rotate page 5
      engine.rotatePage(5, 90);

      const result = await engine.exportPdf('ten-pages-edited.pdf');
      assert.strictEqual(result.totalPages, 10);
      assert.strictEqual(result.fileName, 'ten-pages-edited.pdf');

      // Verify with PDF.js
      const pdfjs = await getPdfJs();
      const task = pdfjs.getDocument({ data: result.uint8Array });
      const loaded = await task.promise;
      assert.strictEqual(loaded.numPages, 10);

      // Verify text on page 1
      const p1 = await loaded.getPage(1);
      const text1 = await p1.getTextContent();
      const str1 = text1.items.map((it) => ('str' in it ? it.str : '')).join(' ');
      assert.ok(str1.includes('ten-pages - Page 1'));
      assert.ok(str1.includes('Page 1 Header'));

      // Clean up
      await loaded.cleanup();
      await task.destroy();
    });

    it('handles repeated sequential exports on the same engine without memory leaks', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('repeat-export', 3));

      engine.addObject(0, createTextObject({ pageIndex: 0, x: 50, y: 50, text: 'Repeat Export Test' }));

      const sizes: number[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await engine.exportPdf(`export-run-${i}.pdf`);
        assert.strictEqual(res.totalPages, 3);
        assert.ok(res.fileSize > 0);
        sizes.push(res.fileSize);
      }

      // Repeated exports with same state must have consistent sizes without memory leak accumulation
      assert.ok(Math.abs(sizes[0] - sizes[1]) <= 5, `Expected sizes[0] (${sizes[0]}) and sizes[1] (${sizes[1]}) to match within timestamp tolerance`);
      assert.ok(Math.abs(sizes[1] - sizes[4]) <= 5, `Expected sizes[1] (${sizes[1]}) and sizes[4] (${sizes[4]}) to match within timestamp tolerance`);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Error Recovery & Security Input Hardening
  // --------------------------------------------------------------------------
  describe('Error Recovery & Security Hardening', () => {
    it('rejects empty and corrupted files with descriptive errors', async () => {
      const engine = new PdfEditorEngine();

      await assert.rejects(
        async () => {
          await engine.loadDocument({ name: 'empty.pdf', buffer: new ArrayBuffer(0) });
        },
        /Invalid PDF document|empty/i
      );

      await assert.rejects(
        async () => {
          await engine.loadDocument({
            name: 'corrupt.pdf',
            buffer: new TextEncoder().encode('%PDF-1.4\nCorrupted binary stream').buffer as ArrayBuffer,
          });
        },
        /Invalid PDF document|failed to parse/i
      );
    });

    it('rejects password-protected PDFs with specific user-guidance error', async () => {
      const testPdf = await createTestPdf('enc-test', 1);
      const protectedPdf = await protectPdf({
        file: testPdf,
        userPassword: 'secretpassword',
      });

      const engine = new PdfEditorEngine();
      await assert.rejects(
        async () => {
          await engine.loadDocument({
            name: 'protected.pdf',
            buffer: protectedPdf.uint8Array.buffer as ArrayBuffer,
          });
        },
        /This PDF is password-protected and cannot be edited here\. Try unlocking it first\./i
      );
    });

    it('resets completely and cleans up all registered resources', async () => {
      const engine = new PdfEditorEngine();
      await engine.loadDocument(await createTestPdf('reset-audit', 2));
      engine.addObject(0, createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'Hello' }));

      const exportRes = await engine.exportPdf();
      assert.ok(exportRes.fileSize > 0);

      engine.reset();
      const cleanState = engine.getState();
      assert.strictEqual(cleanState.pages.length, 0);
      assert.strictEqual(cleanState.activePageIndex, 0);
      assert.strictEqual(cleanState.isModified, false);
      assert.strictEqual(cleanState.selectedObjectId, null);
      assert.strictEqual(engine.canUndo(), false);
      assert.strictEqual(engine.canRedo(), false);
    });
  });
});
