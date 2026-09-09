/**
 * Phase 3C.6: Professional PDF Workflow & Productivity
 * Automated Test Suite
 *
 * Validates:
 * 1. Document Dirty-State Tracking & Transitions (clean -> dirty -> saving -> saved)
 * 2. Undo-to-Clean Reversion (undoing all operations restores clean state)
 * 3. Multi-Page Batch Operations (deletePages, rotatePages, duplicatePages)
 * 4. Batch Operations Atomic Undo & Redo
 * 5. Minimum 1-Page Invariant during batch deletion
 * 6. Deterministic Export Filename Generation & Sanitization
 * 7. Export Progress Reporting (stages: prepare, render-pages, embed-objects, serialize, complete)
 * 8. Exported PDF Integrity & Post-Export Stats
 * 9. Keyboard Productivity Engine Support (selectAllObjects, nudgeSelectedObjects)
 * 10. Memory & Session Safety (reset clearing all state, clipboard isolation)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import { PdfEditorEngine } from '../src/lib/pdf/editor/editor-engine';
import { getDeterministicExportFilename } from '../src/lib/pdf/editor/export';
import { parsePageRanges } from '../src/lib/pdf/range-parser';
import {
  createTextObject,
  createRectangleObject,
  createHighlightObject,
} from '../src/lib/pdf/editor/objects';
import { TextObject } from '../src/lib/pdf/editor/types';

// Helper to create synthetic multi-page PDF in memory
async function createSyntheticPdf(pages = 3, width = 600, height = 800): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([width, height]);
    page.drawText(`Synthetic Page ${i + 1}`, {
      x: 50,
      y: height - 100,
      size: 24,
      color: rgb(0, 0, 0),
    });
  }
  return doc.save();
}

describe('Phase 3C.6: Document Dirty-State Tracking & Lifecycle', () => {
  test('initial document load starts in clean state', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(2);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'invoice.pdf', { type: 'application/pdf' });

    const state = await engine.loadDocument(file);
    assert.equal(state.saveState, 'clean');
    assert.equal(state.isModified, false);
    assert.equal(state.pages.length, 2);
  });

  test('adding an object transitions saveState to dirty and marks isModified', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(2);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'invoice.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    const textObj = createTextObject({
      pageIndex: 0,
      x: 100,
      y: 100,
      text: 'Approved for payment',
      fontSize: 16,
    });

    engine.addObject(0, textObj);

    const state = engine.getState();
    assert.equal(state.saveState, 'dirty');
    assert.equal(state.isModified, true);
  });

  test('undoing all modifications returns saveState to clean', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(2);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'invoice.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    const rectObj = createRectangleObject({
      pageIndex: 0,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
    });

    engine.addObject(0, rectObj);
    assert.equal(engine.getState().saveState, 'dirty');

    const didUndo = engine.undo();
    assert.equal(didUndo, true);

    const state = engine.getState();
    assert.equal(state.saveState, 'clean');
    assert.equal(state.isModified, false);
  });

  test('redoing modifications transitions saveState back to dirty', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(2);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'invoice.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    const rectObj = createRectangleObject({
      pageIndex: 0,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
    });

    engine.addObject(0, rectObj);
    engine.undo();
    assert.equal(engine.getState().saveState, 'clean');

    const didRedo = engine.redo();
    assert.equal(didRedo, true);
    assert.equal(engine.getState().saveState, 'dirty');
    assert.equal(engine.getState().isModified, true);
  });

  test('exporting the document transitions saveState to saved', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(1);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'contract.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    engine.addObject(
      0,
      createTextObject({
        pageIndex: 0,
        x: 60,
        y: 60,
        text: 'Signed',
        fontSize: 14,
      })
    );
    assert.equal(engine.getState().saveState, 'dirty');

    await engine.exportPdf();
    assert.equal(engine.getState().saveState, 'saved');

    // Any subsequent modification sets it back to dirty
    engine.addObject(
      0,
      createHighlightObject({
        pageIndex: 0,
        x: 100,
        y: 100,
        width: 150,
        height: 20,
      })
    );
    assert.equal(engine.getState().saveState, 'dirty');
  });
});

describe('Phase 3C.6: Multi-Page Batch Operations', () => {
  test('batch rotating multiple pages applies delta and records in history', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(4);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'multi.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    // Rotate pages 0 and 2 by 90 degrees
    engine.rotatePages([0, 2], 90);

    const pages = engine.getState().pages;
    assert.equal(pages[0].rotation, 90);
    assert.equal(pages[1].rotation, 0); // unchanged
    assert.equal(pages[2].rotation, 90);
    assert.equal(pages[3].rotation, 0); // unchanged
    assert.equal(engine.getState().saveState, 'dirty');

    // Undo restores original rotation atomically
    engine.undo();
    const restoredPages = engine.getState().pages;
    assert.equal(restoredPages[0].rotation, 0);
    assert.equal(restoredPages[2].rotation, 0);
    assert.equal(engine.getState().saveState, 'clean');
  });

  test('batch duplicating pages duplicates them in sorted order', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(3);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'multi.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    // Duplicate pages 0 and 1
    engine.duplicatePages([0, 1]);

    const pages = engine.getState().pages;
    assert.equal(pages.length, 5); // 3 + 2 = 5
    assert.equal(engine.getState().saveState, 'dirty');

    // Atomic undo restores original 3 pages
    engine.undo();
    assert.equal(engine.getState().pages.length, 3);
    assert.equal(engine.getState().saveState, 'clean');
  });

  test('batch deleting pages removes target pages and clamps activePageIndex', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(4);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'multi.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    engine.setActivePageIndex(3);
    // Delete pages 1 and 3
    engine.deletePages([1, 3]);

    const state = engine.getState();
    assert.equal(state.pages.length, 2);
    // Active page index clamped within [0, 1]
    assert.ok(state.activePageIndex <= 1);
    assert.equal(state.saveState, 'dirty');

    // Atomic undo restores 4 pages
    engine.undo();
    assert.equal(engine.getState().pages.length, 4);
    assert.equal(engine.getState().saveState, 'clean');
  });

  test('batch delete prevents deleting all pages (1-page invariant)', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(3);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'multi.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    // Attempting to delete all 3 pages must be rejected
    assert.throws(() => engine.deletePages([0, 1, 2]), /Cannot delete all pages/);

    assert.equal(engine.getState().pages.length, 3);
    assert.equal(engine.getState().saveState, 'clean');
  });
});

describe('Phase 3C.6: Deterministic Export & Range Selection', () => {
  test('getDeterministicExportFilename appends -edited.pdf cleanly', () => {
    assert.equal(getDeterministicExportFilename('invoice.pdf'), 'invoice-edited.pdf');
    assert.equal(getDeterministicExportFilename('INVOICE.PDF'), 'INVOICE-edited.pdf');
    assert.equal(getDeterministicExportFilename('document-edited.pdf'), 'document-edited.pdf');
    assert.equal(getDeterministicExportFilename('my/unsafe\\name:test.pdf'), 'my_unsafe_nametest-edited.pdf');
    assert.equal(getDeterministicExportFilename(''), 'document-edited.pdf');
  });

  test('parsePageRanges correctly parses range strings into zero-based indices', () => {
    const result1 = parsePageRanges('1-3, 5', 6);
    assert.deepEqual(result1.allPageIndices, [0, 1, 2, 4]);

    const result2 = parsePageRanges('1-4', 4);
    assert.deepEqual(result2.allPageIndices, [0, 1, 2, 3]);

    const result3 = parsePageRanges('2, 4', 5);
    assert.deepEqual(result3.allPageIndices, [1, 3]);
  });

  test('exportPdf reports deterministic stages and produces valid PDF bytes', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(2);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'report.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    const stagesReported: string[] = [];
    const result = await engine.exportPdf({
      outputFileName: 'custom-export.pdf',
      onProgress: (stage, percent) => {
        stagesReported.push(stage);
        assert.ok(percent >= 0 && percent <= 100);
      },
    });

    assert.equal(result.fileName, 'custom-export.pdf');
    assert.equal(result.totalPages, 2);
    assert.ok(result.fileSize > 0);
    assert.ok(result.uint8Array.byteLength > 0);
    assert.ok(stagesReported.includes('Preparing document...'));
    assert.ok(stagesReported.includes('Processing pages & annotations...'));
    assert.ok(stagesReported.includes('Finalizing PDF...'));
    assert.ok(stagesReported.includes('Ready'));

    // Validate generated PDF structure with pdf-lib
    const parsedDoc = await PDFDocument.load(result.uint8Array);
    assert.equal(parsedDoc.getPageCount(), 2);
  });
});

describe('Phase 3C.6: Keyboard Productivity Support', () => {
  test('selectAllObjects selects all objects on the active page', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(1);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'test.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    engine.addObject(0, createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'A' }));
    engine.addObject(0, createTextObject({ pageIndex: 0, x: 20, y: 20, text: 'B' }));
    engine.addObject(0, createTextObject({ pageIndex: 0, x: 30, y: 30, text: 'C' }));

    assert.equal(engine.getState().selectedObjectIds.length, 1);

    engine.selectAllObjects();
    assert.equal(engine.getState().selectedObjectIds.length, 3);
  });

  test('nudgeSelectedObjects moves objects and records history', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(1);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'test.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    const textObj = createTextObject({ pageIndex: 0, x: 50, y: 50, text: 'Movable' });
    engine.addObject(0, textObj);
    engine.selectObject(textObj.id);

    // Screen dy = -10 (up on screen) translates to PDF +10 (up towards top)
    engine.nudgeSelectedObjects(15, -10, true);
    const updated = engine.getSelectedObjects()[0] as TextObject;
    assert.equal(updated.x, 65);
    assert.equal(updated.y, 60);

    // Undo restores position
    engine.undo();
    const reverted = engine.getSelectedObjects()[0] as TextObject;
    assert.equal(reverted.x, 50);
    assert.equal(reverted.y, 50);
  });
});

describe('Phase 3C.6: Engine Reset & Memory Isolation', () => {
  test('reset clears document state, dirty flags, and selection', async () => {
    const engine = new PdfEditorEngine();
    const pdfBytes = await createSyntheticPdf(1);
    const file = new File([pdfBytes.buffer as ArrayBuffer], 'test.pdf', { type: 'application/pdf' });
    await engine.loadDocument(file);

    engine.addObject(0, createTextObject({ pageIndex: 0, x: 10, y: 10, text: 'Dirty' }));
    assert.equal(engine.getState().saveState, 'dirty');

    engine.reset();
    assert.equal(engine.getState().pages.length, 0);
    assert.equal(engine.getState().saveState, 'clean');
    assert.equal(engine.getState().isModified, false);
    assert.equal(engine.getState().selectedObjectId, null);
    assert.equal(engine.canUndo(), false);
    assert.equal(engine.canRedo(), false);
  });
});
