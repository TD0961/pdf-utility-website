import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PdfEditorEngine } from '@/lib/pdf/editor/editor-engine';
import {
  createTextObject,
  createHighlightObject,
  createDrawingObject,
  createRectangleObject,
  createEllipseObject,
  createLineObject,
  createArrowObject,
} from '@/lib/pdf/editor/objects';
import { createTestPdf } from './test-helpers';
import { PDFDocument } from 'pdf-lib';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';

describe('PDF Editor — Engine & Document Lifecycle', () => {
  it('loads a PDF and creates a structured document state', async () => {
    const engine = new PdfEditorEngine();
    const pdfFile = await createTestPdf('doc-editor', 3);

    const state = await engine.loadDocument(pdfFile);

    assert.strictEqual(state.pages.length, 3);
    assert.strictEqual(state.activePageIndex, 0);
    assert.strictEqual(state.isModified, false);
    assert.strictEqual(state.pages[0].width, 400);
    assert.strictEqual(state.pages[0].height, 400);
    assert.strictEqual(state.pages[0].rotation, 0);
    assert.strictEqual(state.pages[0].objects.length, 0);
  });

  it('rejects loading non-PDF corrupted files gracefully', async () => {
    const engine = new PdfEditorEngine();
    const corrupted = {
      name: 'fake.pdf',
      buffer: new TextEncoder().encode('Not a valid PDF document').buffer as ArrayBuffer,
    };

    await assert.rejects(
      async () => {
        await engine.loadDocument(corrupted);
      },
      /Invalid PDF document/i
    );
  });

  it('adds, updates, and deletes all supported editor object types', async () => {
    const engine = new PdfEditorEngine();
    const pdfFile = await createTestPdf('objects-test', 2);
    await engine.loadDocument(pdfFile);

    // 1. Text object
    const textObj = createTextObject({
      pageIndex: 0,
      x: 50,
      y: 350,
      text: 'Annotated Note',
      fontSize: 18,
    });
    engine.addObject(0, textObj);
    assert.strictEqual(engine.getPage(0)?.objects.length, 1);
    assert.strictEqual(engine.canUndo(), true);

    // 2. Highlight object
    const highlightObj = createHighlightObject({
      pageIndex: 0,
      x: 40,
      y: 340,
      width: 150,
      height: 25,
    });
    engine.addObject(0, highlightObj);

    // 3. Drawing object (freehand stroke)
    const drawObj = createDrawingObject({
      pageIndex: 0,
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 30 },
        { x: 40, y: 25 },
      ],
      strokeWidth: 3,
    });
    engine.addObject(0, drawObj);

    // 4. Rectangle object
    const rectObj = createRectangleObject({
      pageIndex: 0,
      x: 100,
      y: 200,
      width: 80,
      height: 50,
    });
    engine.addObject(0, rectObj);

    // 5. Ellipse object
    const ellipseObj = createEllipseObject({
      pageIndex: 0,
      x: 200,
      y: 200,
      width: 60,
      height: 40,
    });
    engine.addObject(0, ellipseObj);

    // 6. Line object
    const lineObj = createLineObject({
      pageIndex: 0,
      start: { x: 50, y: 100 },
      end: { x: 150, y: 120 },
    });
    engine.addObject(0, lineObj);

    // 7. Arrow object
    const arrowObj = createArrowObject({
      pageIndex: 0,
      start: { x: 50, y: 50 },
      end: { x: 250, y: 80 },
    });
    engine.addObject(0, arrowObj);

    assert.strictEqual(engine.getPage(0)?.objects.length, 7);

    // Update text object
    engine.updateObject(0, textObj.id, { text: 'Updated Text Label' });
    const updated = engine.getPage(0)?.objects.find((o) => o.id === textObj.id);
    assert.strictEqual((updated as { text: string }).text, 'Updated Text Label');

    // Delete arrow object
    engine.deleteObject(0, arrowObj.id);
    assert.strictEqual(engine.getPage(0)?.objects.length, 6);
  });

  it('handles page operations (rotate, duplicate, move, delete) and undo/redo', async () => {
    const engine = new PdfEditorEngine();
    const pdfFile = await createTestPdf('page-ops', 3);
    await engine.loadDocument(pdfFile);

    // Rotate page 0 by +90
    engine.rotatePage(0, 90);
    assert.strictEqual(engine.getPage(0)?.rotation, 90);

    // Undo rotation
    assert.strictEqual(engine.undo(), true);
    assert.strictEqual(engine.getPage(0)?.rotation, 0);

    // Redo rotation
    assert.strictEqual(engine.redo(), true);
    assert.strictEqual(engine.getPage(0)?.rotation, 90);

    // Duplicate page 1
    engine.duplicatePage(1);
    assert.strictEqual(engine.getPages().length, 4);

    // Undo duplicate
    engine.undo();
    assert.strictEqual(engine.getPages().length, 3);

    // Move page 0 to index 2
    engine.movePage(0, 2);
    assert.strictEqual(engine.getPage(2)?.rotation, 90);

    // Delete a page
    engine.deletePage(1);
    assert.strictEqual(engine.getPages().length, 2);

    // Undo delete
    engine.undo();
    assert.strictEqual(engine.getPages().length, 3);

    // Prevent deleting all pages
    const singlePageEngine = new PdfEditorEngine();
    await singlePageEngine.loadDocument(await createTestPdf('single', 1));
    assert.throws(
      () => singlePageEngine.deletePage(0),
      /Cannot delete the only remaining page/i
    );
  });

  it('exports edited PDF without rasterization and validates content fidelity', async () => {
    const engine = new PdfEditorEngine();
    const pdfFile = await createTestPdf('export-fidelity', 2);
    await engine.loadDocument(pdfFile);

    // Add annotations to page 0
    engine.addObject(
      0,
      createTextObject({
        pageIndex: 0,
        x: 50,
        y: 200,
        text: 'Native Vector Text 2026',
        fontSize: 16,
      })
    );

    engine.addObject(
      0,
      createHighlightObject({
        pageIndex: 0,
        x: 45,
        y: 195,
        width: 200,
        height: 25,
      })
    );

    engine.addObject(
      0,
      createRectangleObject({
        pageIndex: 0,
        x: 30,
        y: 100,
        width: 100,
        height: 60,
      })
    );

    engine.addObject(
      0,
      createArrowObject({
        pageIndex: 0,
        start: { x: 50, y: 50 },
        end: { x: 200, y: 80 },
      })
    );

    // Rotate page 1 by 90
    engine.rotatePage(1, 90);

    // Export PDF
    const result = await engine.exportPdf('custom-edited-output.pdf');

    assert.strictEqual(result.totalPages, 2);
    assert.strictEqual(result.fileName, 'custom-edited-output.pdf');
    assert.ok(result.uint8Array.byteLength > 0);

    // 1. Verify with pdf-lib directly: not encrypted, geometry intact, rotation preserved
    const loadedDoc = await PDFDocument.load(result.uint8Array);
    assert.strictEqual(loadedDoc.getPageCount(), 2);
    assert.strictEqual(loadedDoc.getPage(1).getRotation().angle, 90);

    // 2. Verify with PDF.js that original content and new text are selectable (vector preserved!)
    const pdfjs = await getPdfJs();
    const jsDoc = await pdfjs.getDocument({ data: new Uint8Array(result.uint8Array) }).promise;
    assert.strictEqual(jsDoc.numPages, 2);

    const page1 = await jsDoc.getPage(1);
    const textContent = await page1.getTextContent();
    const fullText = textContent.items.map((it) => ('str' in it ? it.str : '')).join(' ');

    // Must preserve original page text
    assert.ok(fullText.includes('export-fidelity - Page 1'), 'Original text must be preserved');
    // Must contain newly inserted text
    assert.ok(fullText.includes('Native Vector Text 2026'), 'Inserted text must be present as vector text');
  });

  it('reset() cleans editor state and history completely', async () => {
    const engine = new PdfEditorEngine();
    const pdfFile = await createTestPdf('reset-test', 2);
    await engine.loadDocument(pdfFile);

    engine.addObject(0, createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'Test' }));
    assert.strictEqual(engine.canUndo(), true);

    engine.reset();
    assert.strictEqual(engine.getPages().length, 0);
    assert.strictEqual(engine.canUndo(), false);
    assert.strictEqual(engine.getState().isModified, false);
  });
});
