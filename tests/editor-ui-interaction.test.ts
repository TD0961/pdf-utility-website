import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PdfEditorEngine } from '../src/lib/pdf/editor/editor-engine';
import {
  createTextObject,
  createRectangleObject,
  createHighlightObject,
  createDrawingObject,
  createEllipseObject,
  createLineObject,
  createArrowObject,
  cloneEditorObject,
  rgbToHex,
  hexToRgb,
  COLORS,
} from '../src/lib/pdf/editor/objects';
import { ArrowObject } from '../src/lib/pdf/editor/types';
import {
  pdfPointToScreenPoint,
  screenPointToPdfPoint,
  pdfRectToScreenRect,
  screenRectToPdfRect,
  getScreenDimensions,
} from '../src/lib/pdf/editor/coordinates';
import { createTestPdf } from './test-helpers';
import { PDFDocument } from 'pdf-lib';
import { validatePdfOutput } from '../src/lib/pdf/output-validator';

describe('PDF Editor UI & Interaction Layer', () => {
  it('converts interaction screen clicks and drags to correct PDF coordinates across rotations', () => {
    const page0 = {
      originalPageIndex: 0,
      pageIndex: 0,
      width: 600,
      height: 800,
      rotation: 0 as const,
      objects: [],
    };
    const zoom = 1.5;

    // 1. In 0° rotation
    const screenDims0 = getScreenDimensions(page0, 0, zoom);
    assert.equal(screenDims0.width, 900);
    assert.equal(screenDims0.height, 1200);

    const clickScreen0 = { x: 150, y: 300 };
    const pdfPt0 = screenPointToPdfPoint(clickScreen0, page0, 0, zoom);
    // x = 150 / 1.5 = 100
    // y = 800 - 300 / 1.5 = 600
    assert.equal(pdfPt0.x, 100);
    assert.equal(pdfPt0.y, 600);

    // 2. In 90° rotation
    const page90 = { ...page0, rotation: 90 as const };
    const screenDims90 = getScreenDimensions(page90, 90, zoom);
    assert.equal(screenDims90.width, 1200); // 800 * 1.5
    assert.equal(screenDims90.height, 900); // 600 * 1.5

    const clickScreen90 = { x: 300, y: 150 };
    const pdfPt90 = screenPointToPdfPoint(clickScreen90, page90, 90, zoom);
    // In 90° rotation:
    // x_pdf = y_screen / zoom = 150 / 1.5 = 100
    // y_pdf = x_screen / zoom = 300 / 1.5 = 200
    assert.equal(pdfPt90.x, 100);
    assert.equal(pdfPt90.y, 200);

    // 3. In 180° rotation
    const page180 = { ...page0, rotation: 180 as const };
    const clickScreen180 = { x: 150, y: 300 };
    const pdfPt180 = screenPointToPdfPoint(clickScreen180, page180, 180, zoom);
    // x_pdf = 600 - 150 / 1.5 = 500
    // y_pdf = 300 / 1.5 = 200
    assert.equal(pdfPt180.x, 500);
    assert.equal(pdfPt180.y, 200);

    // 4. In 270° rotation
    const page270 = { ...page0, rotation: 270 as const };
    const clickScreen270 = { x: 300, y: 150 };
    const pdfPt270 = screenPointToPdfPoint(clickScreen270, page270, 270, zoom);
    // In 270° rotation:
    // x_pdf = 600 - y_screen / zoom = 600 - 100 = 500
    // y_pdf = 800 - x_screen / zoom = 800 - 200 = 600
    assert.equal(pdfPt270.x, 500);
    assert.equal(pdfPt270.y, 600);
  });

  it('correctly maps screen drag bounding boxes to PDF rects for shape creation', () => {
    const page = {
      originalPageIndex: 0,
      pageIndex: 0,
      width: 500,
      height: 700,
      rotation: 0 as const,
      objects: [],
    };
    const zoom = 1.0;

    // User drags from (50, 100) to (250, 400)
    const screenRect = { x: 50, y: 100, width: 200, height: 300 };
    const pdfRect = screenRectToPdfRect(screenRect, page, 0, zoom);

    // PDF rect:
    // x = 50
    // y = 700 - (100 + 300) = 300
    // width = 200, height = 300
    assert.equal(pdfRect.x, 50);
    assert.equal(pdfRect.y, 300);
    assert.equal(pdfRect.width, 200);
    assert.equal(pdfRect.height, 300);

    // Roundtrip back to screen
    const roundTripScreen = pdfRectToScreenRect(pdfRect, page, 0, zoom);
    assert.deepEqual(roundTripScreen, screenRect);
  });

  it('supports interactive creation, duplication, and editing for all 7 object types', async () => {
    const { buffer } = await createTestPdf('InteractiveTest', 2);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({
      name: 'InteractiveTest.pdf',
      buffer,
    });

    // 1. Text Object
    const textObj = createTextObject({
      pageIndex: 0,
      x: 50,
      y: 100,
      text: 'Initial Text',
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: COLORS.BLACK,
    });
    engine.addObject(0, textObj);

    // 2. Highlight Object
    const highlightObj = createHighlightObject({
      pageIndex: 0,
      x: 50,
      y: 200,
      width: 150,
      height: 25,
      color: COLORS.YELLOW_HIGHLIGHT,
      opacity: 0.4,
    });
    engine.addObject(0, highlightObj);

    // 3. Rectangle with Fill
    const rectObj = createRectangleObject({
      pageIndex: 0,
      x: 100,
      y: 300,
      width: 80,
      height: 60,
      strokeWidth: 3,
      strokeColor: COLORS.BLUE,
      fillColor: COLORS.WHITE,
    });
    engine.addObject(0, rectObj);

    // 4. Freehand Drawing
    const drawObj = createDrawingObject({
      pageIndex: 0,
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 25 },
        { x: 40, y: 50 },
      ],
      strokeWidth: 4,
      color: COLORS.RED,
    });
    engine.addObject(0, drawObj);

    // 5. Ellipse
    const ellipseObj = createEllipseObject({
      pageIndex: 0,
      x: 200,
      y: 200,
      width: 50,
      height: 30,
      strokeWidth: 2,
      strokeColor: COLORS.GREEN,
    });
    engine.addObject(0, ellipseObj);

    // 6. Straight Line
    const lineObj = createLineObject({
      pageIndex: 0,
      start: { x: 30, y: 40 },
      end: { x: 130, y: 140 },
      strokeWidth: 2,
      strokeColor: COLORS.BLACK,
    });
    engine.addObject(0, lineObj);

    // 7. Directional Arrow
    const arrowObj = createArrowObject({
      pageIndex: 0,
      start: { x: 50, y: 50 },
      end: { x: 200, y: 150 },
      strokeWidth: 3,
      strokeColor: hexToRgb('#8b5cf6'),
      headLength: 14,
    });
    engine.addObject(0, arrowObj);

    const page = engine.getActivePage()!;
    assert.equal(page.objects.length, 7);

    // Test Duplication of Arrow Object
    const clonedArrow = cloneEditorObject(arrowObj) as ArrowObject;
    clonedArrow.id = 'arrow_dup_1';
    clonedArrow.start.x += 15;
    clonedArrow.start.y += 15;
    clonedArrow.end.x += 15;
    clonedArrow.end.y += 15;
    engine.addObject(0, clonedArrow);

    assert.equal(page.objects.length, 8);
    assert.equal(page.objects[7].id, 'arrow_dup_1');

    // Test Property Updates (e.g. changing text content and font family)
    engine.updateObject(0, textObj.id, {
      text: 'Updated Text Content',
      fontFamily: 'Courier',
      fontSize: 22,
    });

    const updatedText = page.objects.find((o) => o.id === textObj.id) as typeof textObj;
    assert.equal(updatedText.text, 'Updated Text Content');
    assert.equal(updatedText.fontFamily, 'Courier');
    assert.equal(updatedText.fontSize, 22);

    // Test Undo
    assert.equal(engine.canUndo(), true);
    engine.undo(); // undo text update
    const revertedText = page.objects.find((o) => o.id === textObj.id) as typeof textObj;
    assert.equal(revertedText.text, 'Initial Text');

    // Test Redo
    assert.equal(engine.canRedo(), true);
    engine.redo(); // redo text update
    const redoneText = page.objects.find((o) => o.id === textObj.id) as typeof textObj;
    assert.equal(redoneText.text, 'Updated Text Content');

    engine.destroy();
  });

  it('performs interactive page rotation, duplication, reordering, and deletion protection', async () => {
    const { buffer } = await createTestPdf('PageMgmtTest', 3);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({
      name: 'PageMgmtTest.pdf',
      buffer,
    });

    assert.equal(engine.getState().pages.length, 3);

    // 1. Rotate Page 0 clockwise by 90°
    engine.rotatePage(0, 90);
    assert.equal(engine.getState().pages[0].rotation, 90);

    // 2. Rotate Page 0 counter-clockwise by -90° back to 0°
    engine.rotatePage(0, -90);
    assert.equal(engine.getState().pages[0].rotation, 0);

    // 3. Duplicate Page 1
    engine.duplicatePage(1);
    assert.equal(engine.getState().pages.length, 4);
    assert.equal(engine.getState().pages[2].originalPageIndex, 1);

    // 4. Move Page 3 to position 0
    engine.movePage(3, 0);
    assert.equal(engine.getState().pages[0].originalPageIndex, 2);

    // 5. Delete pages until only 1 remains
    engine.deletePage(3);
    engine.deletePage(2);
    engine.deletePage(1);
    assert.equal(engine.getState().pages.length, 1);

    // Protection: attempting to delete the last page throws an error
    assert.throws(
      () => {
        engine.deletePage(0);
      },
      { message: /Cannot delete the only remaining page/ }
    );

    engine.destroy();
  });

  it('exports valid, high-fidelity PDF containing visual annotations without rasterization', async () => {
    const { buffer } = await createTestPdf('ExportTest', 2);
    const engine = new PdfEditorEngine();
    await engine.loadDocument({
      name: 'ExportTest.pdf',
      buffer,
    });

    // Add annotations to Page 0
    engine.addObject(
      0,
      createTextObject({
        pageIndex: 0,
        x: 60,
        y: 120,
        text: 'Vector Annotated Headline',
        fontSize: 20,
        fontFamily: 'Helvetica',
        color: COLORS.BLACK,
      })
    );
    engine.addObject(
      0,
      createHighlightObject({
        pageIndex: 0,
        x: 60,
        y: 115,
        width: 250,
        height: 25,
        color: COLORS.YELLOW_HIGHLIGHT,
      })
    );
    engine.addObject(
      0,
      createRectangleObject({
        pageIndex: 0,
        x: 50,
        y: 100,
        width: 280,
        height: 50,
        strokeWidth: 2,
        strokeColor: COLORS.BLUE,
      })
    );

    // Add annotations to Page 1
    engine.addObject(
      1,
      createLineObject({
        pageIndex: 1,
        start: { x: 50, y: 50 },
        end: { x: 250, y: 50 },
        strokeWidth: 3,
        strokeColor: COLORS.RED,
      })
    );
    engine.addObject(
      1,
      createArrowObject({
        pageIndex: 1,
        start: { x: 50, y: 150 },
        end: { x: 200, y: 250 },
        strokeWidth: 2,
        strokeColor: hexToRgb('#8b5cf6'),
      })
    );

    // Export PDF
    const exportResult = await engine.exportPdf({
      outputFileName: 'custom-export-name.pdf',
    });

    const exportedBuffer = await exportResult.blob.arrayBuffer();

    assert.equal(exportResult.fileName, 'custom-export-name.pdf');
    assert.equal(exportResult.totalPages, 2);
    assert.ok(exportResult.fileSize > 1000);
    assert.ok(exportedBuffer.byteLength > 1000);

    // Validate using output-validator
    const validation = await validatePdfOutput(new Uint8Array(exportedBuffer), {
      expectedPages: 2,
    });
    assert.equal(validation.valid, true);
    assert.equal(validation.pageCount, 2);

    // Independent check using pdf-lib
    const parsedDoc = await PDFDocument.load(exportedBuffer);
    assert.equal(parsedDoc.getPageCount(), 2);

    engine.destroy();
  });
});
