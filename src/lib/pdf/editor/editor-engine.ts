/**
 * Phase 3C.1: PDF Editor Engine — Controller & Document Lifecycle
 * Orchestrates document state, page operations, annotations, undo/redo history,
 * and high-fidelity client-side PDF export.
 */

import { PDFDocument } from 'pdf-lib';
import {
  DocumentSaveState,
  EditorDocumentState,
  EditorExportResult,
  EditorObject,
  EditorPage,
  PdfMetadata,
  PdfFormSummary,
  Point,
} from './types';
import { EditorHistoryManager } from './history';
import { cloneEditorObject } from './objects';
import { deletePage, duplicatePage, movePage, rotatePage } from './page-operations';
import { exportEditedPdf, EditorExportOptions } from './export';
import { validatePdfMagicBytes } from '@/lib/validation/file-validator';
import { MemoryRegistry } from '../memory-manager';
import { normalizeRotation, getObjectBoundingBox, screenDeltaToPdfDelta } from './coordinates';
import { detectPdfForms, getEmptyFormSummary } from './forms';
import { PdfSearchEngine } from './search';

export class PdfEditorEngine {
  private state: EditorDocumentState;
  private history: EditorHistoryManager;
  private memoryRegistry: MemoryRegistry;
  private clipboard: EditorObject[] = [];
  private searchEngine: PdfSearchEngine;
  private documentGeneration = 0;
  private isExporting = false;

  constructor(maxHistory = 50, pdfjsOverride?: unknown) {
    this.history = new EditorHistoryManager(maxHistory);
    this.memoryRegistry = new MemoryRegistry();
    this.searchEngine = new PdfSearchEngine(pdfjsOverride);
    this.state = {
      sourceBytes: new Uint8Array(0),
      fileName: 'document.pdf',
      pages: [],
      activePageIndex: 0,
      selectedObjectId: null,
      selectedObjectIds: [],
      zoom: 1,
      isModified: false,
      saveState: 'clean',
      lastSavedAt: undefined,
      exportProgress: null,
      metadata: {},
      formSummary: getEmptyFormSummary(),
      documentGeneration: 0,
    };
  }


  /**
   * Loads a PDF file into the editor, analyzing page counts, dimensions, and pre-existing rotations.
   */
  public async loadDocument(
    file: File | { name: string; buffer: ArrayBuffer }
  ): Promise<EditorDocumentState> {
    let arrayBuffer: ArrayBuffer;
    let fileName = 'document.pdf';

    if (file instanceof File) {
      fileName = file.name;
      const validation = await validatePdfMagicBytes(file);
      if (!validation.valid) {
        throw new Error(`Invalid PDF document: ${validation.error || 'Magic header mismatch'}`);
      }
      arrayBuffer = await file.arrayBuffer();
    } else {
      fileName = file.name;
      const validation = await validatePdfMagicBytes(file.buffer);
      if (!validation.valid) {
        throw new Error(`Invalid PDF document: ${validation.error || 'Magic header mismatch'}`);
      }
      arrayBuffer = file.buffer;
    }

    const sourceBytes = new Uint8Array(arrayBuffer.slice(0));
    let pdfDoc: PDFDocument;
    let pageCount = 0;
    try {
      pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      if (pdfDoc.isEncrypted) {
        throw new Error(
          'This PDF is password-protected and cannot be edited here. Try unlocking it first.'
        );
      }
      pageCount = pdfDoc.getPageCount();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('encrypt') ||
        msg.toLowerCase().includes('password') ||
        msg.toLowerCase().includes('decrypt')
      ) {
        throw new Error(
          'This PDF is password-protected and cannot be edited here. Try unlocking it first.'
        );
      }
      throw new Error(`Invalid PDF document: failed to parse document structure (${msg})`);
    }

    if (pageCount === 0) {
      throw new Error('PDF document contains no pages.');
    }

    const pages: EditorPage[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const width = Math.round(page.getWidth());
      const height = Math.round(page.getHeight());
      const rotation = normalizeRotation(page.getRotation().angle);

      pages.push({
        pageIndex: i,
        originalPageIndex: i,
        width,
        height,
        rotation,
        objects: [],
      });
    }

    this.documentGeneration++;
    this.searchEngine.reset();
    this.searchEngine.setGeneration(this.documentGeneration);

    // Extract metadata
    const metadata: PdfMetadata = {
      title: pdfDoc.getTitle() || undefined,
      author: pdfDoc.getAuthor() || undefined,
      subject: pdfDoc.getSubject() || undefined,
      keywords: pdfDoc.getKeywords()
        ? pdfDoc.getKeywords()?.split(';').map((s) => s.trim()).filter(Boolean)
        : undefined,
      creator: pdfDoc.getCreator() || undefined,
      producer: pdfDoc.getProducer() || undefined,
      creationDate: pdfDoc.getCreationDate() || undefined,
      modificationDate: pdfDoc.getModificationDate() || undefined,
    };

    // Detect form fields
    const formSummary = await detectPdfForms(pdfDoc);

    this.history.clear();
    this.clipboard = [];
    this.state = {
      sourceBytes,
      fileName,
      pages,
      activePageIndex: 0,
      selectedObjectId: null,
      selectedObjectIds: [],
      zoom: 1,
      isModified: false,
      saveState: 'clean',
      lastSavedAt: undefined,
      exportProgress: null,
      metadata,
      formSummary,
      documentGeneration: this.documentGeneration,
    };

    return this.getState();
  }

  public getState(): EditorDocumentState {
    return {
      ...this.state,
      metadata: { ...this.state.metadata },
      formSummary: this.state.formSummary,
      selectedObjectIds: [...this.state.selectedObjectIds],
      pages: this.state.pages.map((p) => ({
        ...p,
        objects: p.objects.map(cloneEditorObject),
      })),
    };
  }

  public markDirty(): void {
    this.state.isModified = true;
    this.state.saveState = 'dirty';
  }

  public isDirty(): boolean {
    return this.state.saveState === 'dirty';
  }

  public getSaveState(): DocumentSaveState {
    return this.state.saveState;
  }

  public setSaveState(saveState: DocumentSaveState): void {
    this.state.saveState = saveState;
    if (saveState === 'clean' || saveState === 'saved') {
      this.state.isModified = false;
    } else if (saveState === 'dirty') {
      this.state.isModified = true;
    }
  }

  public getMetadata(): PdfMetadata {
    return { ...this.state.metadata };
  }

  public updateMetadata(updates: Partial<PdfMetadata>): void {
    const previous = { ...this.state.metadata };
    const updated: PdfMetadata = {
      ...previous,
      ...updates,
    };
    this.state.metadata = updated;
    this.history.push({
      type: 'UPDATE_METADATA',
      previous,
      updated,
    });
    this.markDirty();
  }

  public getFormSummary(): PdfFormSummary {
    return this.state.formSummary;
  }


  public getSearchEngine(): PdfSearchEngine {
    return this.searchEngine;
  }

  public getDocumentGeneration(): number {
    return this.documentGeneration;
  }

  public getPages(): EditorPage[] {
    return this.state.pages;
  }

  public getPage(pageIndex: number): EditorPage | undefined {
    return this.state.pages[pageIndex];
  }

  public getActivePage(): EditorPage | undefined {
    return this.state.pages[this.state.activePageIndex];
  }

  public setActivePageIndex(index: number): void {
    if (index >= 0 && index < this.state.pages.length) {
      this.state.activePageIndex = index;
      this.state.selectedObjectId = null;
      this.state.selectedObjectIds = [];
    }
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(5, zoom));
  }

  public selectObject(id: string | null, multi = false): void {
    if (id === null) {
      this.state.selectedObjectId = null;
      this.state.selectedObjectIds = [];
      return;
    }
    const active = this.getActivePage();
    const exists = active?.objects.some((o) => o.id === id);
    if (!exists) {
      this.state.selectedObjectId = null;
      this.state.selectedObjectIds = [];
      return;
    }

    if (multi) {
      if (this.state.selectedObjectIds.includes(id)) {
        this.state.selectedObjectIds = this.state.selectedObjectIds.filter((x) => x !== id);
        this.state.selectedObjectId =
          this.state.selectedObjectIds.length > 0
            ? this.state.selectedObjectIds[this.state.selectedObjectIds.length - 1]
            : null;
      } else {
        this.state.selectedObjectIds = [...this.state.selectedObjectIds, id];
        this.state.selectedObjectId = id;
      }
    } else {
      this.state.selectedObjectId = id;
      this.state.selectedObjectIds = [id];
    }
  }

  public selectObjects(ids: string[]): void {
    const active = this.getActivePage();
    if (!active) {
      this.state.selectedObjectId = null;
      this.state.selectedObjectIds = [];
      return;
    }
    const validIds = ids.filter((id) => active.objects.some((o) => o.id === id));
    this.state.selectedObjectIds = validIds;
    this.state.selectedObjectId = validIds.length > 0 ? validIds[validIds.length - 1] : null;
  }

  public selectAllObjects(): void {
    const active = this.getActivePage();
    if (!active || active.objects.length === 0) {
      this.state.selectedObjectId = null;
      this.state.selectedObjectIds = [];
      return;
    }
    this.state.selectedObjectIds = active.objects.map((o) => o.id);
    this.state.selectedObjectId = active.objects[active.objects.length - 1].id;
  }

  public getSelectedObjects(): EditorObject[] {
    const active = this.getActivePage();
    if (!active) return [];
    return active.objects.filter((o) => this.state.selectedObjectIds.includes(o.id));
  }

  // --- Object Operations ---

  public addObject(pageIndex: number, object: EditorObject): void {
    const page = this.state.pages[pageIndex];
    if (!page) throw new Error(`Page index ${pageIndex} does not exist.`);

    const cloned = cloneEditorObject(object);
    cloned.pageIndex = pageIndex;
    page.objects.push(cloned);

    this.history.push({
      type: 'ADD_OBJECT',
      pageIndex,
      object: cloneEditorObject(cloned),
    });

    this.state.selectedObjectId = cloned.id;
    this.state.selectedObjectIds = [cloned.id];
    this.markDirty();
  }

  public updateObject(
    pageIndex: number,
    objectId: string,
    updates: Partial<EditorObject>
  ): void {
    const page = this.state.pages[pageIndex];
    if (!page) throw new Error(`Page index ${pageIndex} does not exist.`);

    const objIndex = page.objects.findIndex((o) => o.id === objectId);
    if (objIndex === -1) throw new Error(`Object ID ${objectId} not found on page ${pageIndex}.`);

    // Sanitize updates
    const sanitizedUpdates = { ...updates };
    if ('width' in sanitizedUpdates && sanitizedUpdates.width !== undefined) {
      sanitizedUpdates.width = Math.max(
        1,
        Number.isFinite(sanitizedUpdates.width) ? sanitizedUpdates.width : 10
      );
    }
    if ('height' in sanitizedUpdates && sanitizedUpdates.height !== undefined) {
      sanitizedUpdates.height = Math.max(
        1,
        Number.isFinite(sanitizedUpdates.height) ? sanitizedUpdates.height : 10
      );
    }
    if ('fontSize' in sanitizedUpdates && sanitizedUpdates.fontSize !== undefined) {
      sanitizedUpdates.fontSize = Math.max(
        4,
        Math.min(288, Number.isFinite(sanitizedUpdates.fontSize) ? sanitizedUpdates.fontSize : 14)
      );
    }
    if ('opacity' in sanitizedUpdates && sanitizedUpdates.opacity !== undefined) {
      sanitizedUpdates.opacity = Math.max(
        0.05,
        Math.min(1, Number.isFinite(sanitizedUpdates.opacity) ? sanitizedUpdates.opacity : 1)
      );
    }
    if ('strokeWidth' in sanitizedUpdates && sanitizedUpdates.strokeWidth !== undefined) {
      sanitizedUpdates.strokeWidth = Math.max(
        0.5,
        Math.min(72, Number.isFinite(sanitizedUpdates.strokeWidth) ? sanitizedUpdates.strokeWidth : 2)
      );
    }

    const previous = cloneEditorObject(page.objects[objIndex]);
    const updated = {
      ...previous,
      ...sanitizedUpdates,
      id: previous.id,
      type: previous.type,
      pageIndex: previous.pageIndex,
    } as EditorObject;

    page.objects[objIndex] = updated;

    this.history.push({
      type: 'UPDATE_OBJECT',
      pageIndex,
      objectId,
      previous,
      updated: cloneEditorObject(updated),
    });

    this.markDirty();
  }

  public deleteObject(pageIndex: number, objectId: string): void {
    const page = this.state.pages[pageIndex];
    if (!page) throw new Error(`Page index ${pageIndex} does not exist.`);

    const objIndex = page.objects.findIndex((o) => o.id === objectId);
    if (objIndex === -1) throw new Error(`Object ID ${objectId} not found on page ${pageIndex}.`);

    const removed = page.objects.splice(objIndex, 1)[0];

    this.history.push({
      type: 'DELETE_OBJECT',
      pageIndex,
      object: cloneEditorObject(removed),
    });

    if (this.state.selectedObjectId === objectId) {
      this.state.selectedObjectId = null;
    }
    this.state.selectedObjectIds = this.state.selectedObjectIds.filter((id) => id !== objectId);
    this.markDirty();
  }

  // --- Clipboard Operations ---

  public copySelected(): void {
    const selected = this.getSelectedObjects();
    if (selected.length === 0) return;
    this.clipboard = selected.map(cloneEditorObject);
  }

  public cutSelected(): void {
    const selected = this.getSelectedObjects();
    if (selected.length === 0) return;
    this.clipboard = selected.map(cloneEditorObject);
    this.deleteSelectedObjects();
  }

  public paste(offset: Point = { x: 20, y: -20 }): string[] {
    if (this.clipboard.length === 0) return [];
    const active = this.getActivePage();
    if (!active) return [];

    const previous = active.objects.map(cloneEditorObject);
    const newIds: string[] = [];

    for (const item of this.clipboard) {
      const cloned = cloneEditorObject(item);
      cloned.id = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      cloned.pageIndex = active.pageIndex;

      if ('x' in cloned && 'y' in cloned) {
        cloned.x = Math.max(0, Math.min(active.width - 20, cloned.x + offset.x));
        cloned.y = Math.max(0, Math.min(active.height - 20, cloned.y + offset.y));
      } else if ('start' in cloned && 'end' in cloned) {
        cloned.start.x += offset.x;
        cloned.start.y += offset.y;
        cloned.end.x += offset.x;
        cloned.end.y += offset.y;
      } else if ('points' in cloned) {
        cloned.points = cloned.points.map((p) => ({ x: p.x + offset.x, y: p.y + offset.y }));
      }

      active.objects.push(cloned);
      newIds.push(cloned.id);
    }

    const current = active.objects.map(cloneEditorObject);
    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: 'Paste objects',
      previous,
      current,
    });

    this.state.selectedObjectIds = newIds;
    this.state.selectedObjectId = newIds[newIds.length - 1] ?? null;
    this.markDirty();
    return newIds;
  }

  // --- Multi-Object Batch Operations ---

  public moveObjects(objectIds: string[], dx: number, dy: number): void {
    const active = this.getActivePage();
    if (!active || objectIds.length === 0 || (dx === 0 && dy === 0)) return;

    const previous = active.objects.map(cloneEditorObject);
    let changed = false;

    for (const id of objectIds) {
      const obj = active.objects.find((o) => o.id === id);
      if (!obj) continue;
      changed = true;
      if ('x' in obj && 'y' in obj) {
        obj.x += dx;
        obj.y += dy;
      } else if ('start' in obj && 'end' in obj) {
        obj.start.x += dx;
        obj.start.y += dy;
        obj.end.x += dx;
        obj.end.y += dy;
      } else if ('points' in obj) {
        obj.points = obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
    }

    if (changed) {
      const current = active.objects.map(cloneEditorObject);
      this.history.push({
        type: 'BATCH_OBJECT_OP',
        pageIndex: active.pageIndex,
        description: 'Move objects',
        selectedObjectIds: [...this.state.selectedObjectIds],
        previous,
        current,
      });
      this.markDirty();
    }
  }

  /**
   * Nudges selected objects by screen pixel delta (rotation-aware).
   * @param screenDx Screen X delta (+right, -left)
   * @param screenDy Screen Y delta (+down, -up)
   * @param commitHistory If true, records a history transaction immediately.
   */
  public nudgeSelectedObjects(
    screenDx: number,
    screenDy: number,
    commitHistory = true
  ): void {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length === 0 || (screenDx === 0 && screenDy === 0)) {
      return;
    }

    const { dx, dy } = screenDeltaToPdfDelta(screenDx, screenDy, active.rotation);
    const selected = this.getSelectedObjects();
    const previous = active.objects.map(cloneEditorObject);

    for (const obj of selected) {
      if ('x' in obj && 'y' in obj) {
        obj.x += dx;
        obj.y += dy;
      } else if ('start' in obj && 'end' in obj) {
        obj.start.x += dx;
        obj.start.y += dy;
        obj.end.x += dx;
        obj.end.y += dy;
      } else if ('points' in obj) {
        obj.points = obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
    }

    if (commitHistory) {
      const current = active.objects.map(cloneEditorObject);
      this.history.push({
        type: 'BATCH_OBJECT_OP',
        pageIndex: active.pageIndex,
        description: `Nudge objects (${screenDx}, ${screenDy})`,
        selectedObjectIds: [...this.state.selectedObjectIds],
        previous,
        current,
      });
    }

    this.markDirty();
  }

  /**
   * Commits a continuous nudge session to history atomically.
   */
  public commitNudgeHistory(previousObjects: EditorObject[]): void {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length === 0) return;

    const current = active.objects.map(cloneEditorObject);
    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: 'Nudge objects',
      selectedObjectIds: [...this.state.selectedObjectIds],
      previous: previousObjects.map(cloneEditorObject),
      current,
    });
    this.markDirty();
  }


  public deleteSelectedObjects(): void {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length === 0) return;

    const previous = active.objects.map(cloneEditorObject);
    active.objects = active.objects.filter((o) => !this.state.selectedObjectIds.includes(o.id));
    const current = active.objects.map(cloneEditorObject);

    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: 'Delete selected objects',
      previous,
      current,
    });

    this.state.selectedObjectId = null;
    this.state.selectedObjectIds = [];
    this.markDirty();
  }

  public duplicateSelectedObjects(): string[] {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length === 0) return [];

    const selected = this.getSelectedObjects();
    const previous = active.objects.map(cloneEditorObject);
    const newIds: string[] = [];

    for (const item of selected) {
      const cloned = cloneEditorObject(item);
      cloned.id = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      if ('x' in cloned && 'y' in cloned) {
        cloned.x += 20;
        cloned.y -= 20;
      } else if ('start' in cloned && 'end' in cloned) {
        cloned.start.x += 20;
        cloned.start.y -= 20;
        cloned.end.x += 20;
        cloned.end.y -= 20;
      } else if ('points' in cloned) {
        cloned.points = cloned.points.map((p) => ({ x: p.x + 20, y: p.y - 20 }));
      }
      active.objects.push(cloned);
      newIds.push(cloned.id);
    }

    const current = active.objects.map(cloneEditorObject);
    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: 'Duplicate selected objects',
      previous,
      current,
    });

    this.state.selectedObjectIds = newIds;
    this.state.selectedObjectId = newIds[newIds.length - 1] ?? null;
    this.markDirty();
    return newIds;
  }

  // --- Alignment & Distribution ---

  public alignObjects(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length < 2) return;

    const selected = this.getSelectedObjects();
    const boxes = selected.map((o) => ({ obj: o, box: getObjectBoundingBox(o) }));

    const minX = Math.min(...boxes.map((b) => b.box.x));
    const maxX = Math.max(...boxes.map((b) => b.box.x + b.box.width));
    const minY = Math.min(...boxes.map((b) => b.box.y));
    const maxY = Math.max(...boxes.map((b) => b.box.y + b.box.height));

    const previous = active.objects.map(cloneEditorObject);

    for (const { obj, box } of boxes) {
      let targetX = box.x;
      let targetY = box.y;

      switch (alignment) {
        case 'left':
          targetX = minX;
          break;
        case 'center':
          targetX = minX + (maxX - minX) / 2 - box.width / 2;
          break;
        case 'right':
          targetX = maxX - box.width;
          break;
        case 'top':
          targetY = maxY - box.height;
          break;
        case 'middle':
          targetY = minY + (maxY - minY) / 2 - box.height / 2;
          break;
        case 'bottom':
          targetY = minY;
          break;
      }

      const dx = targetX - box.x;
      const dy = targetY - box.y;

      if ('x' in obj && 'y' in obj) {
        obj.x += dx;
        obj.y += dy;
      } else if ('start' in obj && 'end' in obj) {
        obj.start.x += dx;
        obj.start.y += dy;
        obj.end.x += dx;
        obj.end.y += dy;
      } else if ('points' in obj) {
        obj.points = obj.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
    }

    const current = active.objects.map(cloneEditorObject);
    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: `Align objects ${alignment}`,
      selectedObjectIds: [...this.state.selectedObjectIds],
      previous,
      current,
    });
    this.markDirty();
  }

  public distributeObjects(direction: 'horizontal' | 'vertical'): void {
    const active = this.getActivePage();
    if (!active || this.state.selectedObjectIds.length < 3) return;

    const selected = this.getSelectedObjects();
    const boxes = selected.map((o) => ({ obj: o, box: getObjectBoundingBox(o) }));
    const previous = active.objects.map(cloneEditorObject);

    if (direction === 'horizontal') {
      boxes.sort((a, b) => a.box.x - b.box.x);
      const firstX = boxes[0].box.x;
      const lastX = boxes[boxes.length - 1].box.x;
      const totalDist = lastX - firstX;
      const step = totalDist / (boxes.length - 1);

      for (let i = 1; i < boxes.length - 1; i++) {
        const { obj, box } = boxes[i];
        const targetX = firstX + step * i;
        const dx = targetX - box.x;
        if ('x' in obj) obj.x += dx;
        else if ('start' in obj) { obj.start.x += dx; obj.end.x += dx; }
        else if ('points' in obj) { obj.points = obj.points.map((p) => ({ ...p, x: p.x + dx })); }
      }
    } else {
      boxes.sort((a, b) => a.box.y - b.box.y);
      const firstY = boxes[0].box.y;
      const lastY = boxes[boxes.length - 1].box.y;
      const totalDist = lastY - firstY;
      const step = totalDist / (boxes.length - 1);

      for (let i = 1; i < boxes.length - 1; i++) {
        const { obj, box } = boxes[i];
        const targetY = firstY + step * i;
        const dy = targetY - box.y;
        if ('y' in obj) obj.y += dy;
        else if ('start' in obj) { obj.start.y += dy; obj.end.y += dy; }
        else if ('points' in obj) { obj.points = obj.points.map((p) => ({ ...p, y: p.y + dy })); }
      }
    }

    const current = active.objects.map(cloneEditorObject);
    this.history.push({
      type: 'BATCH_OBJECT_OP',
      pageIndex: active.pageIndex,
      description: `Distribute objects ${direction}`,
      selectedObjectIds: [...this.state.selectedObjectIds],
      previous,
      current,
    });
    this.markDirty();
  }

  // --- Z-Order Stacking ---

  public bringForward(objectId: string): void {
    const active = this.getActivePage();
    if (!active) return;
    const idx = active.objects.findIndex((o) => o.id === objectId);
    if (idx === -1 || idx === active.objects.length - 1) return;

    const previousOrder = active.objects.map((o) => o.id);
    const temp = active.objects[idx];
    active.objects[idx] = active.objects[idx + 1];
    active.objects[idx + 1] = temp;
    const newOrder = active.objects.map((o) => o.id);

    this.history.push({
      type: 'REORDER_OBJECTS',
      pageIndex: active.pageIndex,
      previousOrder,
      newOrder,
    });
    this.markDirty();
  }

  public sendBackward(objectId: string): void {
    const active = this.getActivePage();
    if (!active) return;
    const idx = active.objects.findIndex((o) => o.id === objectId);
    if (idx <= 0) return;

    const previousOrder = active.objects.map((o) => o.id);
    const temp = active.objects[idx];
    active.objects[idx] = active.objects[idx - 1];
    active.objects[idx - 1] = temp;
    const newOrder = active.objects.map((o) => o.id);

    this.history.push({
      type: 'REORDER_OBJECTS',
      pageIndex: active.pageIndex,
      previousOrder,
      newOrder,
    });
    this.markDirty();
  }

  public bringToFront(objectId: string): void {
    const active = this.getActivePage();
    if (!active) return;
    const idx = active.objects.findIndex((o) => o.id === objectId);
    if (idx === -1 || idx === active.objects.length - 1) return;

    const previousOrder = active.objects.map((o) => o.id);
    const [obj] = active.objects.splice(idx, 1);
    active.objects.push(obj);
    const newOrder = active.objects.map((o) => o.id);

    this.history.push({
      type: 'REORDER_OBJECTS',
      pageIndex: active.pageIndex,
      previousOrder,
      newOrder,
    });
    this.markDirty();
  }

  public sendToBack(objectId: string): void {
    const active = this.getActivePage();
    if (!active) return;
    const idx = active.objects.findIndex((o) => o.id === objectId);
    if (idx <= 0) return;

    const previousOrder = active.objects.map((o) => o.id);
    const [obj] = active.objects.splice(idx, 1);
    active.objects.unshift(obj);
    const newOrder = active.objects.map((o) => o.id);

    this.history.push({
      type: 'REORDER_OBJECTS',
      pageIndex: active.pageIndex,
      previousOrder,
      newOrder,
    });
    this.markDirty();
  }

  // --- Page Operations ---

  public deletePage(pageIndex: number): void {
    const targetPage = this.state.pages[pageIndex];
    if (!targetPage) throw new Error(`Page index ${pageIndex} does not exist.`);

    const clonedPage: EditorPage = {
      ...targetPage,
      objects: targetPage.objects.map(cloneEditorObject),
    };

    this.state.pages = deletePage(this.state.pages, pageIndex);

    if (this.state.activePageIndex >= this.state.pages.length) {
      this.state.activePageIndex = Math.max(0, this.state.pages.length - 1);
    }
    this.state.selectedObjectId = null;
    this.markDirty();

    this.history.push({
      type: 'DELETE_PAGE',
      pageIndex,
      page: clonedPage,
    });
  }

  public duplicatePage(pageIndex: number): void {
    this.state.pages = duplicatePage(this.state.pages, pageIndex);
    this.state.activePageIndex = pageIndex + 1;
    this.state.selectedObjectId = null;
    this.markDirty();

    this.history.push({
      type: 'DUPLICATE_PAGE',
      pageIndex,
      newPageIndex: pageIndex + 1,
    });
  }

  public rotatePage(pageIndex: number, delta: 90 | -90 | 180): void {
    const page = this.state.pages[pageIndex];
    if (!page) throw new Error(`Page index ${pageIndex} does not exist.`);

    const previousRotation = page.rotation;
    this.state.pages = rotatePage(this.state.pages, pageIndex, delta);
    const newRotation = this.state.pages[pageIndex].rotation;

    this.markDirty();
    this.history.push({
      type: 'ROTATE_PAGE',
      pageIndex,
      previousRotation,
      newRotation,
    });
  }

  public movePage(fromIndex: number, toIndex: number): void {
    this.state.pages = movePage(this.state.pages, fromIndex, toIndex);
    this.state.activePageIndex = toIndex;
    this.markDirty();

    this.history.push({
      type: 'MOVE_PAGE',
      fromIndex,
      toIndex,
    });
  }

  /**
   * Deletes multiple pages atomically in a single undoable transaction.
   * Prevents deleting all pages.
   */
  public deletePages(indices: number[]): void {
    const validIndices = Array.from(new Set(indices))
      .filter((idx) => idx >= 0 && idx < this.state.pages.length)
      .sort((a, b) => a - b);

    if (validIndices.length === 0) return;
    if (validIndices.length >= this.state.pages.length) {
      throw new Error('Cannot delete all pages from the document.');
    }

    const previousPages = this.state.pages.map((p) => ({
      ...p,
      objects: p.objects.map(cloneEditorObject),
    }));
    const previousActiveIndex = this.state.activePageIndex;

    const toDeleteSet = new Set(validIndices);
    const newPages: EditorPage[] = [];
    let nextIdx = 0;

    for (let i = 0; i < this.state.pages.length; i++) {
      if (!toDeleteSet.has(i)) {
        const page = this.state.pages[i];
        newPages.push({
          ...page,
          pageIndex: nextIdx,
          objects: page.objects.map((obj) => ({ ...cloneEditorObject(obj), pageIndex: nextIdx })),
        });
        nextIdx++;
      }
    }

    this.state.pages = newPages;
    let newActiveIndex = previousActiveIndex;
    while (newActiveIndex >= newPages.length && newActiveIndex > 0) {
      newActiveIndex--;
    }
    this.state.activePageIndex = newActiveIndex;
    this.state.selectedObjectId = null;
    this.state.selectedObjectIds = [];
    this.markDirty();

    this.history.push({
      type: 'BATCH_PAGE_OP',
      description: `Delete ${validIndices.length} pages`,
      previousPages,
      currentPages: this.state.pages.map((p) => ({
        ...p,
        objects: p.objects.map(cloneEditorObject),
      })),
      previousActiveIndex,
      currentActiveIndex: this.state.activePageIndex,
    });
  }

  /**
   * Rotates multiple pages atomically in a single undoable transaction.
   */
  public rotatePages(indices: number[], delta: 90 | -90 | 180): void {
    const validIndices = Array.from(new Set(indices)).filter(
      (idx) => idx >= 0 && idx < this.state.pages.length
    );
    if (validIndices.length === 0) return;

    const previousPages = this.state.pages.map((p) => ({
      ...p,
      objects: p.objects.map(cloneEditorObject),
    }));
    const previousActiveIndex = this.state.activePageIndex;

    for (const idx of validIndices) {
      this.state.pages = rotatePage(this.state.pages, idx, delta);
    }

    this.markDirty();

    this.history.push({
      type: 'BATCH_PAGE_OP',
      description: `Rotate ${validIndices.length} pages`,
      previousPages,
      currentPages: this.state.pages.map((p) => ({
        ...p,
        objects: p.objects.map(cloneEditorObject),
      })),
      previousActiveIndex,
      currentActiveIndex: this.state.activePageIndex,
    });
  }

  /**
   * Duplicates multiple pages atomically in a single undoable transaction.
   */
  public duplicatePages(indices: number[]): void {
    const validIndices = Array.from(new Set(indices))
      .filter((idx) => idx >= 0 && idx < this.state.pages.length)
      .sort((a, b) => b - a); // Duplicate from right to left so original indices don't shift

    if (validIndices.length === 0) return;

    const previousPages = this.state.pages.map((p) => ({
      ...p,
      objects: p.objects.map(cloneEditorObject),
    }));
    const previousActiveIndex = this.state.activePageIndex;

    for (const idx of validIndices) {
      this.state.pages = duplicatePage(this.state.pages, idx);
    }

    this.markDirty();

    this.history.push({
      type: 'BATCH_PAGE_OP',
      description: `Duplicate ${validIndices.length} pages`,
      previousPages,
      currentPages: this.state.pages.map((p) => ({
        ...p,
        objects: p.objects.map(cloneEditorObject),
      })),
      previousActiveIndex,
      currentActiveIndex: this.state.activePageIndex,
    });
  }

  // --- History (Undo / Redo) ---

  public undo(): boolean {
    const action = this.history.undo();
    if (!action) return false;

    switch (action.type) {
      case 'ADD_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects = page.objects.filter((o) => o.id !== action.object.id);
        }
        if (this.state.selectedObjectId === action.object.id) {
          this.state.selectedObjectId = null;
        }
        break;
      }

      case 'UPDATE_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          const idx = page.objects.findIndex((o) => o.id === action.objectId);
          if (idx !== -1) {
            page.objects[idx] = cloneEditorObject(action.previous);
          }
        }
        break;
      }

      case 'DELETE_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects.push(cloneEditorObject(action.object));
        }
        break;
      }

      case 'BATCH_OBJECT_OP': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects = action.previous.map(cloneEditorObject);
        }
        if (action.selectedObjectIds && action.selectedObjectIds.length > 0) {
          this.state.selectedObjectIds = [...action.selectedObjectIds];
          this.state.selectedObjectId =
            this.state.selectedObjectIds[this.state.selectedObjectIds.length - 1] ?? null;
        } else {
          this.state.selectedObjectId = null;
          this.state.selectedObjectIds = [];
        }
        break;
      }

      case 'REORDER_OBJECTS': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          const map = new Map(page.objects.map((o) => [o.id, o]));
          page.objects = action.previousOrder
            .map((id) => map.get(id))
            .filter((o): o is EditorObject => !!o);
        }
        break;
      }

      case 'DELETE_PAGE': {
        // Re-insert the deleted page at its original index
        const next = [...this.state.pages];
        next.splice(action.pageIndex, 0, {
          ...action.page,
          objects: action.page.objects.map(cloneEditorObject),
        });
        this.state.pages = next.map((p, i) => ({
          ...p,
          pageIndex: i,
          objects: p.objects.map((obj) => ({ ...obj, pageIndex: i })),
        }));
        this.state.activePageIndex = action.pageIndex;
        break;
      }

      case 'DUPLICATE_PAGE': {
        // Undo duplicate = remove the newly created duplicate page
        this.state.pages = deletePage(this.state.pages, action.newPageIndex);
        this.state.activePageIndex = action.pageIndex;
        break;
      }

      case 'ROTATE_PAGE': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.rotation = action.previousRotation;
        }
        break;
      }

      case 'MOVE_PAGE': {
        // Undo move = move back from toIndex to fromIndex
        this.state.pages = movePage(this.state.pages, action.toIndex, action.fromIndex);
        this.state.activePageIndex = action.fromIndex;
        break;
      }

      case 'BATCH_PAGE_OP': {
        this.state.pages = action.previousPages.map((p) => ({
          ...p,
          objects: p.objects.map(cloneEditorObject),
        }));
        this.state.activePageIndex = action.previousActiveIndex;
        this.state.selectedObjectId = null;
        this.state.selectedObjectIds = [];
        break;
      }

      case 'UPDATE_METADATA': {
        this.state.metadata = { ...action.previous };
        break;
      }
    }

    if (!this.history.canUndo()) {
      this.state.saveState = 'clean';
      this.state.isModified = false;
    } else {
      this.markDirty();
    }
    return true;
  }

  public redo(): boolean {
    const action = this.history.redo();
    if (!action) return false;

    switch (action.type) {
      case 'ADD_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects.push(cloneEditorObject(action.object));
        }
        break;
      }

      case 'UPDATE_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          const idx = page.objects.findIndex((o) => o.id === action.objectId);
          if (idx !== -1) {
            page.objects[idx] = cloneEditorObject(action.updated);
          }
        }
        break;
      }

      case 'DELETE_OBJECT': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects = page.objects.filter((o) => o.id !== action.object.id);
        }
        break;
      }

      case 'BATCH_OBJECT_OP': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.objects = action.current.map(cloneEditorObject);
        }
        if (action.selectedObjectIds && action.selectedObjectIds.length > 0) {
          this.state.selectedObjectIds = [...action.selectedObjectIds];
          this.state.selectedObjectId =
            this.state.selectedObjectIds[this.state.selectedObjectIds.length - 1] ?? null;
        } else {
          this.state.selectedObjectId = null;
          this.state.selectedObjectIds = [];
        }
        break;
      }

      case 'REORDER_OBJECTS': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          const map = new Map(page.objects.map((o) => [o.id, o]));
          page.objects = action.newOrder
            .map((id) => map.get(id))
            .filter((o): o is EditorObject => !!o);
        }
        break;
      }

      case 'DELETE_PAGE': {
        this.state.pages = deletePage(this.state.pages, action.pageIndex);
        if (this.state.activePageIndex >= this.state.pages.length) {
          this.state.activePageIndex = Math.max(0, this.state.pages.length - 1);
        }
        this.state.selectedObjectId = null;
        break;
      }

      case 'DUPLICATE_PAGE': {
        this.state.pages = duplicatePage(this.state.pages, action.pageIndex);
        this.state.activePageIndex = Math.min(action.newPageIndex, this.state.pages.length - 1);
        this.state.selectedObjectId = null;
        break;
      }

      case 'ROTATE_PAGE': {
        const page = this.state.pages[action.pageIndex];
        if (page) {
          page.rotation = action.newRotation;
        }
        break;
      }

      case 'MOVE_PAGE': {
        this.state.pages = movePage(this.state.pages, action.fromIndex, action.toIndex);
        this.state.activePageIndex = action.toIndex;
        break;
      }

      case 'BATCH_PAGE_OP': {
        this.state.pages = action.currentPages.map((p) => ({
          ...p,
          objects: p.objects.map(cloneEditorObject),
        }));
        this.state.activePageIndex = action.currentActiveIndex;
        this.state.selectedObjectId = null;
        this.state.selectedObjectIds = [];
        break;
      }

      case 'UPDATE_METADATA': {
        this.state.metadata = { ...action.updated };
        break;
      }
    }

    this.markDirty();
    return true;
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  // --- Export & Lifecycle ---

  public async exportPdf(options?: EditorExportOptions | string): Promise<EditorExportResult> {
    if (this.isExporting) {
      throw new Error('Export is already in progress.');
    }

    const opts: EditorExportOptions | undefined =
      typeof options === 'string' ? { outputFileName: options } : options;

    this.isExporting = true;
    this.state.saveState = 'saving';

    try {
      const result = await exportEditedPdf(this.state, {
        ...opts,
        onProgress: (stage, percent) => {
          this.state.exportProgress = { stage, percent };
          opts?.onProgress?.(stage, percent);
        },
      });

      this.memoryRegistry.register(result.blob);
      this.state.saveState = 'saved';
      this.state.isModified = false;
      this.state.lastSavedAt = Date.now();
      this.state.exportProgress = null;
      return result;
    } catch (err) {
      this.state.saveState = 'error';
      this.state.exportProgress = null;
      throw err;
    } finally {
      this.isExporting = false;
    }
  }

  public reset(): void {
    this.documentGeneration++;
    this.searchEngine.reset();
    this.memoryRegistry.revokeAll();
    this.history.clear();
    this.clipboard = [];
    this.isExporting = false;
    this.state = {
      sourceBytes: new Uint8Array(0),
      fileName: 'document.pdf',
      pages: [],
      activePageIndex: 0,
      selectedObjectId: null,
      selectedObjectIds: [],
      zoom: 1,
      isModified: false,
      saveState: 'clean',
      lastSavedAt: undefined,
      exportProgress: null,
      metadata: {},
      formSummary: getEmptyFormSummary(),
      documentGeneration: this.documentGeneration,
    };
  }

  public destroy(): void {
    this.reset();
  }
}

