/**
 * Phase 3C.1: PDF Editor Engine — Controller & Document Lifecycle
 * Orchestrates document state, page operations, annotations, undo/redo history,
 * and high-fidelity client-side PDF export.
 */

import { PDFDocument } from 'pdf-lib';
import {
  EditorDocumentState,
  EditorExportResult,
  EditorObject,
  EditorPage,
} from './types';
import { EditorHistoryManager } from './history';
import { cloneEditorObject } from './objects';
import { deletePage, duplicatePage, movePage, rotatePage } from './page-operations';
import { exportEditedPdf, EditorExportOptions } from './export';
import { validatePdfMagicBytes } from '@/lib/validation/file-validator';
import { MemoryRegistry } from '../memory-manager';
import { normalizeRotation } from './coordinates';

export class PdfEditorEngine {
  private state: EditorDocumentState;
  private history: EditorHistoryManager;
  private memoryRegistry: MemoryRegistry;

  constructor(maxHistory = 50) {
    this.history = new EditorHistoryManager(maxHistory);
    this.memoryRegistry = new MemoryRegistry();
    this.state = {
      sourceBytes: new Uint8Array(0),
      fileName: 'document.pdf',
      pages: [],
      activePageIndex: 0,
      selectedObjectId: null,
      zoom: 1,
      isModified: false,
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

    this.history.clear();
    this.state = {
      sourceBytes,
      fileName,
      pages,
      activePageIndex: 0,
      selectedObjectId: null,
      zoom: 1,
      isModified: false,
    };

    return this.getState();
  }

  public getState(): EditorDocumentState {
    return {
      ...this.state,
      pages: this.state.pages.map((p) => ({
        ...p,
        objects: p.objects.map(cloneEditorObject),
      })),
    };
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
    }
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(5, zoom));
  }

  public selectObject(id: string | null): void {
    if (id === null) {
      this.state.selectedObjectId = null;
      return;
    }
    const active = this.getActivePage();
    const exists = active?.objects.some((o) => o.id === id);
    this.state.selectedObjectId = exists ? id : null;
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
    this.state.isModified = true;
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

    this.state.isModified = true;
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
    this.state.isModified = true;
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
    this.state.isModified = true;

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
    this.state.isModified = true;

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

    this.state.isModified = true;
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
    this.state.isModified = true;

    this.history.push({
      type: 'MOVE_PAGE',
      fromIndex,
      toIndex,
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
    }

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
    const opts: EditorExportOptions | undefined =
      typeof options === 'string' ? { outputFileName: options } : options;
    const result = await exportEditedPdf(this.state, opts);
    this.memoryRegistry.register(result.blob);
    return result;
  }

  public reset(): void {
    this.memoryRegistry.revokeAll();
    this.history.clear();
    this.state = {
      sourceBytes: new Uint8Array(0),
      fileName: 'document.pdf',
      pages: [],
      activePageIndex: 0,
      selectedObjectId: null,
      zoom: 1,
      isModified: false,
    };
  }

  public destroy(): void {
    this.reset();
  }
}
