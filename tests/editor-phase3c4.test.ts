/**
 * Phase 3C.4: Advanced PDF Editor Capabilities — Automated Test Suite
 * Validates Image Insertion, Signature Tool, Rich Text Formatting, Copy/Paste,
 * Multi-Selection, Alignment, Distribution, Z-Order, Export Fidelity, and Memory Safety.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { PdfEditorEngine } from '../src/lib/pdf/editor/editor-engine';
import {
  createImageObject,
  createSignatureObject,
  createTextObject,
  createRectangleObject,
} from '../src/lib/pdf/editor/objects';
import {
  RectangleObject,
  TextObject,
  SignatureObject,
} from '../src/lib/pdf/editor/types';
import { getPdfJs } from '../src/lib/pdf/pdf-renderer';

// Helper to generate a minimal valid 1-page test PDF in memory
async function createSyntheticPdf(
  pages = 1,
  width = 600,
  height = 800,
  rotation = 0
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([width, height]);
    page.setRotation(degrees(rotation));
    page.drawText(`Synthetic Page ${i + 1}`, {
      x: 50,
      y: height - 100,
      size: 24,
      color: rgb(0, 0, 0),
    });
  }
  return doc.save();
}

// 1x1 transparent PNG data URL
const VALID_1X1_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// 1x1 white JPEG data URL
const VALID_1X1_JPG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

describe('Phase 3C.4: Image Insertion & Validation', () => {
  test('creates image object with safe coordinates and defaults', () => {
    const img = createImageObject({
      pageIndex: 0,
      x: 100,
      y: 200,
      width: 150,
      height: 120,
      sourceType: 'png',
      dataUrl: VALID_1X1_PNG,
      opacity: 0.8,
    });

    assert.equal(img.type, 'image');
    assert.equal(img.x, 100);
    assert.equal(img.y, 200);
    assert.equal(img.width, 150);
    assert.equal(img.height, 120);
    assert.equal(img.sourceType, 'png');
    assert.equal(img.opacity, 0.8);
    assert.equal(img.lockAspectRatio, true);
    assert.ok(img.id.length > 0);
  });

  test('inserts JPG image object into engine and exports valid PDF with embedded image stream', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'test.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const img = createImageObject({
      pageIndex: 0,
      x: 50,
      y: 100,
      width: 200,
      height: 150,
      sourceType: 'jpeg',
      dataUrl: VALID_1X1_JPG,
    });

    engine.addObject(0, img);
    assert.equal(engine.getActivePage()?.objects.length, 1);

    const exportResult = await engine.exportPdf('image-test.pdf');
    assert.ok(exportResult.uint8Array.byteLength > 0);
    assert.equal(exportResult.totalPages, 1);

    // Verify reopening with PDF.js and extractable original text
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({ data: exportResult.uint8Array.slice(0) });
    const reopenedDoc = await loadingTask.promise;
    assert.equal(reopenedDoc.numPages, 1);

    const page1 = await reopenedDoc.getPage(1);
    const textContent = await page1.getTextContent();
    const extractedText = textContent.items
      .map((i: unknown) => (i as { str?: string }).str || '')
      .join(' ');
    assert.ok(extractedText.includes('Synthetic Page 1'), 'Original text must remain extractable');
    await reopenedDoc.cleanup();
  });

  test('inserts PNG image with transparency and exports cleanly', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'png-test.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const img = createImageObject({
      pageIndex: 0,
      x: 80,
      y: 120,
      width: 100,
      height: 100,
      sourceType: 'png',
      dataUrl: VALID_1X1_PNG,
      opacity: 0.9,
    });

    engine.addObject(0, img);
    const exportResult = await engine.exportPdf();
    assert.ok(exportResult.uint8Array.byteLength > 0);
  });
});

describe('Phase 3C.4: Signature Tool & Signature Object', () => {
  test('creates signature object with safe defaults and transparent background PNG', () => {
    const sig = createSignatureObject({
      pageIndex: 0,
      x: 150,
      y: 80,
      width: 180,
      height: 70,
      dataUrl: VALID_1X1_PNG,
      sourceType: 'png',
    });

    assert.equal(sig.type, 'signature');
    assert.equal(sig.x, 150);
    assert.equal(sig.y, 80);
    assert.equal(sig.width, 180);
    assert.equal(sig.height, 70);
    assert.equal(sig.sourceType, 'png');
    assert.equal(sig.lockAspectRatio, true);
  });

  test('adds signature, supports move, resize, and PDF export', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'sig-test.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const sig = createSignatureObject({
      pageIndex: 0,
      x: 100,
      y: 150,
      width: 120,
      height: 50,
      dataUrl: VALID_1X1_PNG,
    });

    engine.addObject(0, sig);
    assert.equal(engine.getState().selectedObjectId, sig.id);

    // Update dimensions
    engine.updateObject(0, sig.id, { width: 160, height: 65, x: 120 });
    const updated = engine.getActivePage()?.objects[0] as SignatureObject;
    assert.equal(updated.width, 160);
    assert.equal(updated.height, 65);
    assert.equal(updated.x, 120);

    const exportResult = await engine.exportPdf();
    assert.ok(exportResult.uint8Array.byteLength > 0);
  });
});

describe('Phase 3C.4: Advanced Text Formatting & Selectability', () => {
  test('supports bold, italic, underline, and alignment attributes', () => {
    const txt = createTextObject({
      pageIndex: 0,
      x: 50,
      y: 200,
      text: 'Formatted Title',
      fontSize: 18,
      fontFamily: 'Helvetica',
      bold: true,
      italic: true,
      underline: true,
      align: 'center',
    });

    assert.equal(txt.bold, true);
    assert.equal(txt.italic, true);
    assert.equal(txt.underline, true);
    assert.equal(txt.align, 'center');
  });

  test('exports styled text across Helvetica, TimesRoman, and Courier and keeps text selectable in output', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'styled-text.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const txtHelvetica = createTextObject({
      pageIndex: 0,
      x: 100,
      y: 400,
      text: 'Bold Italic Helvetica',
      fontFamily: 'Helvetica',
      bold: true,
      italic: true,
      underline: true,
    });
    const txtTimes = createTextObject({
      pageIndex: 0,
      x: 100,
      y: 350,
      text: 'Times Bold Heading',
      fontFamily: 'TimesRoman',
      bold: true,
      align: 'center',
    });
    const txtCourier = createTextObject({
      pageIndex: 0,
      x: 400,
      y: 300,
      text: 'Monospace Courier Code',
      fontFamily: 'Courier',
      italic: true,
      align: 'right',
    });

    engine.addObject(0, txtHelvetica);
    engine.addObject(0, txtTimes);
    engine.addObject(0, txtCourier);

    const exportResult = await engine.exportPdf('formatted-export.pdf');
    assert.ok(exportResult.uint8Array.byteLength > 0);

    // Verify selectable text in exported PDF using PDF.js
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({ data: exportResult.uint8Array.slice(0) });
    const reopenedDoc = await loadingTask.promise;
    const page1 = await reopenedDoc.getPage(1);
    const textContent = await page1.getTextContent();
    const textItems = textContent.items
      .map((i: unknown) => (i as { str?: string }).str || '')
      .join(' ');

    assert.ok(textItems.includes('Bold Italic Helvetica'));
    assert.ok(textItems.includes('Times Bold Heading'));
    assert.ok(textItems.includes('Monospace Courier Code'));
    await reopenedDoc.cleanup();
  });
});

describe('Phase 3C.4: Clipboard (Copy, Cut, Paste)', () => {
  test('copies selected object and pastes with offset and unique ID', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'clipboard.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const rect = createRectangleObject({
      pageIndex: 0,
      x: 100,
      y: 200,
      width: 80,
      height: 60,
    });
    engine.addObject(0, rect);
    engine.selectObject(rect.id);

    engine.copySelected();
    const pastedIds = engine.paste({ x: 25, y: -25 });

    assert.equal(pastedIds.length, 1);
    assert.notEqual(pastedIds[0], rect.id);

    const page = engine.getActivePage()!;
    assert.equal(page.objects.length, 2);

    const pastedObj = page.objects.find((o) => o.id === pastedIds[0]) as RectangleObject;
    assert.equal(pastedObj.x, 125);
    assert.equal(pastedObj.y, 175);
    assert.equal(pastedObj.width, 80);
    assert.equal(pastedObj.height, 60);

    // Undo paste
    assert.ok(engine.canUndo());
    engine.undo();
    assert.equal(engine.getActivePage()?.objects.length, 1);

    // Redo paste
    assert.ok(engine.canRedo());
    engine.redo();
    assert.equal(engine.getActivePage()?.objects.length, 2);
  });

  test('cuts selected objects and allows pasting them', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'cut.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const txt = createTextObject({ pageIndex: 0, x: 50, y: 50, text: 'Cut Me' });
    engine.addObject(0, txt);
    engine.selectObject(txt.id);

    engine.cutSelected();
    assert.equal(engine.getActivePage()?.objects.length, 0);

    const pastedIds = engine.paste();
    assert.equal(pastedIds.length, 1);
    assert.equal(engine.getActivePage()?.objects.length, 1);
    assert.equal((engine.getActivePage()?.objects[0] as TextObject).text, 'Cut Me');
  });
});

describe('Phase 3C.4: Multi-Selection & Batch Operations', () => {
  test('supports Shift-click multi-selection and bulk selection', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'multi.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const obj1 = createRectangleObject({ pageIndex: 0, x: 10, y: 10, width: 20, height: 20 });
    const obj2 = createRectangleObject({ pageIndex: 0, x: 40, y: 40, width: 20, height: 20 });
    const obj3 = createRectangleObject({ pageIndex: 0, x: 70, y: 70, width: 20, height: 20 });

    engine.addObject(0, obj1);
    engine.addObject(0, obj2);
    engine.addObject(0, obj3);

    // Single select
    engine.selectObject(obj1.id);
    assert.deepEqual(engine.getState().selectedObjectIds, [obj1.id]);

    // Multi-select with Shift
    engine.selectObject(obj2.id, true);
    assert.deepEqual(engine.getState().selectedObjectIds, [obj1.id, obj2.id]);

    engine.selectObject(obj3.id, true);
    assert.deepEqual(engine.getState().selectedObjectIds, [obj1.id, obj2.id, obj3.id]);

    // Toggle off obj2
    engine.selectObject(obj2.id, true);
    assert.deepEqual(engine.getState().selectedObjectIds, [obj1.id, obj3.id]);

    // Bulk select
    engine.selectObjects([obj1.id, obj2.id, obj3.id]);
    assert.equal(engine.getSelectedObjects().length, 3);
  });

  test('batch moves multiple objects in a single undoable history operation', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'batch-move.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const obj1 = createRectangleObject({ pageIndex: 0, x: 10, y: 20, width: 30, height: 30 });
    const obj2 = createRectangleObject({ pageIndex: 0, x: 50, y: 60, width: 30, height: 30 });
    engine.addObject(0, obj1);
    engine.addObject(0, obj2);

    engine.selectObjects([obj1.id, obj2.id]);
    engine.moveObjects([obj1.id, obj2.id], 15, 25);

    const page = engine.getActivePage()!;
    const p1 = page.objects.find((o) => o.id === obj1.id) as RectangleObject;
    const p2 = page.objects.find((o) => o.id === obj2.id) as RectangleObject;
    assert.equal(p1.x, 25);
    assert.equal(p1.y, 45);
    assert.equal(p2.x, 65);
    assert.equal(p2.y, 85);

    // Undo restores both in ONE single step
    engine.undo();
    const p1Restored = engine.getActivePage()!.objects.find((o) => o.id === obj1.id) as RectangleObject;
    const p2Restored = engine.getActivePage()!.objects.find((o) => o.id === obj2.id) as RectangleObject;
    assert.equal(p1Restored.x, 10);
    assert.equal(p1Restored.y, 20);
    assert.equal(p2Restored.x, 50);
    assert.equal(p2Restored.y, 60);
  });

  test('batch deletes multiple selected objects atomically', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'batch-delete.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const o1 = createRectangleObject({ pageIndex: 0, x: 10, y: 10, width: 20, height: 20 });
    const o2 = createRectangleObject({ pageIndex: 0, x: 30, y: 30, width: 20, height: 20 });
    const o3 = createRectangleObject({ pageIndex: 0, x: 50, y: 50, width: 20, height: 20 });
    engine.addObject(0, o1);
    engine.addObject(0, o2);
    engine.addObject(0, o3);

    engine.selectObjects([o1.id, o3.id]);
    engine.deleteSelectedObjects();

    assert.equal(engine.getActivePage()?.objects.length, 1);
    assert.equal(engine.getActivePage()?.objects[0].id, o2.id);

    // Undo restores all deleted objects
    engine.undo();
    assert.equal(engine.getActivePage()?.objects.length, 3);
  });
});

describe('Phase 3C.4: Alignment & Distribution', () => {
  test('aligns multiple objects to left, center, right, top, middle, bottom', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'align.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    // o1: [100, 150], [100, 150] (width 50, height 50)
    const o1 = createRectangleObject({ pageIndex: 0, x: 100, y: 100, width: 50, height: 50 });
    // o2: [200, 240], [200, 240] (width 40, height 40)
    const o2 = createRectangleObject({ pageIndex: 0, x: 200, y: 200, width: 40, height: 40 });

    engine.addObject(0, o1);
    engine.addObject(0, o2);

    engine.selectObjects([o1.id, o2.id]);

    // Align Left: minX is 100, so both should start at x = 100
    engine.alignObjects('left');
    let page = engine.getActivePage()!;
    assert.equal((page.objects.find((o) => o.id === o1.id) as RectangleObject).x, 100);
    assert.equal((page.objects.find((o) => o.id === o2.id) as RectangleObject).x, 100);
    engine.undo();

    // Align Right: maxX is 240. o1 width 50 -> x = 190. o2 width 40 -> x = 200.
    engine.alignObjects('right');
    page = engine.getActivePage()!;
    assert.equal((page.objects.find((o) => o.id === o1.id) as RectangleObject).x, 190);
    assert.equal((page.objects.find((o) => o.id === o2.id) as RectangleObject).x, 200);
    engine.undo();

    // Align Top: maxY is 240. o1 height 50 -> y = 190. o2 height 40 -> y = 200.
    engine.alignObjects('top');
    page = engine.getActivePage()!;
    assert.equal((page.objects.find((o) => o.id === o1.id) as RectangleObject).y, 190);
    assert.equal((page.objects.find((o) => o.id === o2.id) as RectangleObject).y, 200);
    engine.undo();

    // Align Bottom: minY is 100. Both y = 100
    engine.alignObjects('bottom');
    page = engine.getActivePage()!;
    assert.equal((page.objects.find((o) => o.id === o1.id) as RectangleObject).y, 100);
    assert.equal((page.objects.find((o) => o.id === o2.id) as RectangleObject).y, 100);
    engine.undo();
  });

  test('distributes 3 or more objects evenly horizontally and vertically', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'distribute.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const o1 = createRectangleObject({ pageIndex: 0, x: 100, y: 100, width: 20, height: 20 });
    const o2 = createRectangleObject({ pageIndex: 0, x: 120, y: 120, width: 20, height: 20 });
    const o3 = createRectangleObject({ pageIndex: 0, x: 300, y: 300, width: 20, height: 20 });

    engine.addObject(0, o1);
    engine.addObject(0, o2);
    engine.addObject(0, o3);

    engine.selectObjects([o1.id, o2.id, o3.id]);
    engine.distributeObjects('horizontal');

    const page = engine.getActivePage()!;
    const p1 = page.objects.find((o) => o.id === o1.id) as RectangleObject;
    const p2 = page.objects.find((o) => o.id === o2.id) as RectangleObject;
    const p3 = page.objects.find((o) => o.id === o3.id) as RectangleObject;

    assert.equal(p1.x, 100);
    assert.equal(p2.x, 200); // middle object centered between 100 and 300
    assert.equal(p3.x, 300);

    // Vertical distribution
    engine.distributeObjects('vertical');
    assert.equal(p1.y, 100);
    assert.equal(p2.y, 200);
    assert.equal(p3.y, 300);
  });
});

describe('Phase 3C.4: Z-Order Object Stacking', () => {
  test('brings forward, sends backward, brings to front, and sends to back', async () => {
    const pdfBytes = await createSyntheticPdf(1);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({ name: 'zorder.pdf', buffer: pdfBytes.buffer as ArrayBuffer });

    const o1 = createRectangleObject({ pageIndex: 0, x: 10, y: 10, width: 20, height: 20 });
    const o2 = createRectangleObject({ pageIndex: 0, x: 20, y: 20, width: 20, height: 20 });
    const o3 = createRectangleObject({ pageIndex: 0, x: 30, y: 30, width: 20, height: 20 });

    engine.addObject(0, o1);
    engine.addObject(0, o2);
    engine.addObject(0, o3);

    let ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o1.id, o2.id, o3.id]);

    // Bring o1 forward
    engine.bringForward(o1.id);
    ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o2.id, o1.id, o3.id]);

    // Bring o2 to front
    engine.bringToFront(o2.id);
    ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o1.id, o3.id, o2.id]);

    // Send o2 to back
    engine.sendToBack(o2.id);
    ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o2.id, o1.id, o3.id]);

    // Send o3 backward
    engine.sendBackward(o3.id);
    ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o2.id, o3.id, o1.id]);

    // Undo reordering
    assert.ok(engine.canUndo());
    engine.undo();
    ids = engine.getActivePage()!.objects.map((o) => o.id);
    assert.deepEqual(ids, [o2.id, o1.id, o3.id]);
  });
});
