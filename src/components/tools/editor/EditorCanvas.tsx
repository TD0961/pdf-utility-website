'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  EditorObject,
  EditorPage,
  PdfSearchMatch,
  Point,
  Rect,
} from '@/lib/pdf/editor/types';
import {
  getScreenDimensions,
  pdfPointToScreenPoint,
  screenPointToPdfPoint,
  pdfRectToScreenRect,
  screenRectToPdfRect,
} from '@/lib/pdf/editor/coordinates';
import {
  createArrowObject,
  createDrawingObject,
  createEllipseObject,
  createHighlightObject,
  createLineObject,
  createRectangleObject,
  createTextObject,
  rgbToHex,
} from '@/lib/pdf/editor/objects';
import { EditorTool } from './ToolPalette';
import { ToolDefaults } from './EditorPropertiesPanel';
import { getPdfJs } from '@/lib/pdf/pdf-renderer';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorCanvasProps {
  activePage: EditorPage;
  sourceBytes: Uint8Array;
  zoom: number;
  activeTool: EditorTool;
  selectedObjectId: string | null;
  selectedObjectIds?: string[];
  searchMatches?: PdfSearchMatch[];
  activeSearchMatch?: PdfSearchMatch | null;
  toolDefaults: ToolDefaults;
  onSelectObject: (id: string | null, multi?: boolean) => void;
  onAddObject: (object: EditorObject) => void;
  onUpdateObject: (objectId: string, updates: Partial<EditorObject>) => void;
  onDeleteObject: (objectId: string) => void;
  onDeleteSelected?: () => void;
  onSwitchTool: (tool: EditorTool) => void;
  className?: string;
}

type DragMode =
  | 'none'
  | 'draw'
  | 'create-shape'
  | 'move-object'
  | 'resize-handle';

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface HandleInfo {
  position: HandlePosition;
  x: number;
  y: number;
  cursor: string;
}

export function EditorCanvas({
  activePage,
  sourceBytes,
  zoom,
  activeTool,
  selectedObjectId,
  selectedObjectIds,
  searchMatches,
  activeSearchMatch,
  toolDefaults,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onDeleteObject,
  onDeleteSelected,
  onSwitchTool,
  className,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Interaction State
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [dragStartScreen, setDragStartScreen] = useState<Point | null>(null);
  const [dragCurrentScreen, setDragCurrentScreen] = useState<Point | null>(null);
  const [liveDrawingPoints, setLiveDrawingPoints] = useState<Point[]>([]);
  const [initialObjectState, setInitialObjectState] = useState<EditorObject | null>(null);
  const [initialObjectsState, setInitialObjectsState] = useState<EditorObject[]>([]);
  const [initialScreenBox, setInitialScreenBox] = useState<Rect | null>(null);

  const { width: screenWidth, height: screenHeight } = getScreenDimensions(
    activePage,
    activePage.rotation,
    zoom
  );

  // 1. PDF.js Background Rendering with cancellation support
  useEffect(() => {
    let isCancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    let docToCleanup: { cleanup: () => Promise<void> } | null = null;
    let loadingTaskToDestroy: { destroy: () => Promise<void> } | null = null;

    async function renderPage() {
      if (!canvasRef.current || sourceBytes.byteLength === 0) return;

      try {
        setPageLoading(true);
        const pdfjs = await getPdfJs();
        const loadingTask = pdfjs.getDocument({ data: sourceBytes.slice(0) });
        loadingTaskToDestroy = loadingTask;
        const doc = await loadingTask.promise;
        docToCleanup = doc;

        if (isCancelled) {
          await doc.cleanup();
          await loadingTask.destroy();
          return;
        }

        const pdfPage = await doc.getPage(activePage.originalPageIndex + 1);
        const canvas = canvasRef.current;
        if (!canvas) {
          await doc.cleanup();
          await loadingTask.destroy();
          return;
        }

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.round(screenWidth * dpr);
        canvas.height = Math.round(screenHeight * dpr);
        canvas.style.width = `${screenWidth}px`;
        canvas.style.height = `${screenHeight}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          await doc.cleanup();
          await loadingTask.destroy();
          return;
        }

        const viewport = pdfPage.getViewport({
          scale: zoom * dpr,
          rotation: activePage.rotation,
        });

        renderTask = pdfPage.render({
          canvasContext: ctx,
          viewport,
          canvas,
        });

        await renderTask.promise;

        await doc.cleanup();
        await loadingTask.destroy();

        if (!isCancelled) {
          setPageLoading(false);
        }
      } catch (err: unknown) {
        const errName = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
        if (errName !== 'RenderingCancelledException' && !isCancelled) {
          console.error('Error rendering PDF page in editor canvas:', err);
          setPageLoading(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancellation
        }
      }
      if (docToCleanup) {
        docToCleanup.cleanup().catch(() => {});
      }
      if (loadingTaskToDestroy) {
        loadingTaskToDestroy.destroy().catch(() => {});
      }
    };
  }, [
    sourceBytes,
    activePage.originalPageIndex,
    activePage.rotation,
    zoom,
    screenWidth,
    screenHeight,
  ]);

  // Selected object helper
  const selectedObject = activePage.objects.find((o) => o.id === selectedObjectId) || null;

  // Compute screen bounding box for any object
  const getObjectScreenBox = useCallback(
    (obj: EditorObject): Rect | null => {
      switch (obj.type) {
        case 'rectangle':
        case 'highlight':
        case 'image':
        case 'signature': {
          return pdfRectToScreenRect(
            {
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
            },
            activePage,
            activePage.rotation,
            zoom
          );
        }
        case 'ellipse': {
          const center = pdfPointToScreenPoint(
            { x: obj.x, y: obj.y },
            activePage,
            activePage.rotation,
            zoom
          );
          const isRotated = activePage.rotation === 90 || activePage.rotation === 270;
          const rx = ((isRotated ? obj.height : obj.width) / 2) * zoom;
          const ry = ((isRotated ? obj.width : obj.height) / 2) * zoom;
          return {
            x: center.x - rx,
            y: center.y - ry,
            width: rx * 2,
            height: ry * 2,
          };
        }
        case 'text': {
          const baseline = pdfPointToScreenPoint(
            { x: obj.x, y: obj.y },
            activePage,
            activePage.rotation,
            zoom
          );
          const approxWidth = Math.max(
            40,
            obj.text.length * obj.fontSize * 0.6 * zoom
          );
          const approxHeight = obj.fontSize * 1.3 * zoom;
          let boxX = baseline.x;
          if (obj.align === 'center') {
            boxX = baseline.x - approxWidth / 2;
          } else if (obj.align === 'right') {
            boxX = baseline.x - approxWidth;
          }
          return {
            x: boxX,
            y: baseline.y - approxHeight,
            width: approxWidth,
            height: approxHeight,
          };
        }
        case 'line':
        case 'arrow': {
          const p1 = pdfPointToScreenPoint(obj.start, activePage, activePage.rotation, zoom);
          const p2 = pdfPointToScreenPoint(obj.end, activePage, activePage.rotation, zoom);
          const minX = Math.min(p1.x, p2.x);
          const maxX = Math.max(p1.x, p2.x);
          const minY = Math.min(p1.y, p2.y);
          const maxY = Math.max(p1.y, p2.y);
          return {
            x: minX - 4,
            y: minY - 4,
            width: Math.max(12, maxX - minX + 8),
            height: Math.max(12, maxY - minY + 8),
          };
        }
        case 'drawing': {
          if (obj.points.length === 0) return null;
          const screenPts = obj.points.map((p) =>
            pdfPointToScreenPoint(p, activePage, activePage.rotation, zoom)
          );
          const xs = screenPts.map((p) => p.x);
          const ys = screenPts.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          return {
            x: minX - 4,
            y: minY - 4,
            width: Math.max(12, maxX - minX + 8),
            height: Math.max(12, maxY - minY + 8),
          };
        }
        default:
          return null;
      }
    },
    [activePage, zoom]
  );

  const selectedBox = selectedObject ? getObjectScreenBox(selectedObject) : null;

  // Resize handles around selected box (8 directions: NW, N, NE, E, SE, S, SW, W)
  const getHandles = (): HandleInfo[] => {
    if (!selectedBox) return [];
    const { x, y, width: w, height: h } = selectedBox;
    return [
      { position: 'nw', x, y, cursor: 'nwse-resize' },
      { position: 'n', x: x + w / 2, y, cursor: 'ns-resize' },
      { position: 'ne', x: x + w, y, cursor: 'nesw-resize' },
      { position: 'e', x: x + w, y: y + h / 2, cursor: 'ew-resize' },
      { position: 'se', x: x + w, y: y + h, cursor: 'nwse-resize' },
      { position: 's', x: x + w / 2, y: y + h, cursor: 'ns-resize' },
      { position: 'sw', x, y: y + h, cursor: 'nesw-resize' },
      { position: 'w', x, y: y + h / 2, cursor: 'ew-resize' },
    ];
  };

  // Keyboard shortcut listener (Del, Backspace, Esc)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectIds && selectedObjectIds.length > 0 && onDeleteSelected) {
          e.preventDefault();
          onDeleteSelected();
        } else if (selectedObjectId) {
          e.preventDefault();
          onDeleteObject(selectedObjectId);
        }
      } else if (e.key === 'Escape') {
        onSelectObject(null, false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, selectedObjectIds, onDeleteObject, onDeleteSelected, onSelectObject]);

  // Pointer coordinate calculation relative to canvas
  const getPointerPos = (e: React.PointerEvent): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(screenWidth, e.clientX - rect.left)),
      y: Math.max(0, Math.min(screenHeight, e.clientY - rect.top)),
    };
  };

  // --- Pointer Down ---
  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getPointerPos(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    // 1. If 'select' mode: check handles, check objects, or background deselect
    if (activeTool === 'select') {
      // Check if clicking on a resize handle
      const handles = getHandles();
      const clickedHandle = handles.find(
        (h) => Math.hypot(h.x - pos.x, h.y - pos.y) <= 8
      );

      if (clickedHandle && selectedObject) {
        setDragMode('resize-handle');
        setActiveHandle(clickedHandle.position);
        setDragStartScreen(pos);
        setDragCurrentScreen(pos);
        setInitialObjectState(JSON.parse(JSON.stringify(selectedObject)));
        setInitialScreenBox(selectedBox ? { ...selectedBox } : null);
        return;
      }

      // Check if clicked directly on an object on the page (hit testing reverse order)
      let hitId: string | null = null;
      for (let i = activePage.objects.length - 1; i >= 0; i--) {
        const obj = activePage.objects[i];
        const box = getObjectScreenBox(obj);
        if (
          box &&
          pos.x >= box.x &&
          pos.x <= box.x + box.width &&
          pos.y >= box.y &&
          pos.y <= box.y + box.height
        ) {
          hitId = obj.id;
          break;
        }
      }

      if (hitId) {
        const isAlreadySelected = selectedObjectIds?.includes(hitId);
        if (e.shiftKey) {
          onSelectObject(hitId, true);
        } else if (!isAlreadySelected) {
          onSelectObject(hitId, false);
        }

        const obj = activePage.objects.find((o) => o.id === hitId)!;
        const targetIds =
          isAlreadySelected && !e.shiftKey && (selectedObjectIds?.length ?? 0) > 1
            ? selectedObjectIds!
            : [hitId];
        const targetObjects = activePage.objects.filter((o) => targetIds.includes(o.id));

        setDragMode('move-object');
        setDragStartScreen(pos);
        setDragCurrentScreen(pos);
        setInitialObjectState(JSON.parse(JSON.stringify(obj)));
        setInitialObjectsState(JSON.parse(JSON.stringify(targetObjects)));
      } else {
        // Check if clicking inside current selectedBox when dragging
        if (
          selectedBox &&
          pos.x >= selectedBox.x &&
          pos.x <= selectedBox.x + selectedBox.width &&
          pos.y >= selectedBox.y &&
          pos.y <= selectedBox.y + selectedBox.height &&
          selectedObject
        ) {
          setDragMode('move-object');
          setDragStartScreen(pos);
          setDragCurrentScreen(pos);
          setInitialObjectState(JSON.parse(JSON.stringify(selectedObject)));
          const targetIds = selectedObjectIds?.length ? selectedObjectIds : [selectedObject.id];
          const targetObjects = activePage.objects.filter((o) => targetIds.includes(o.id));
          setInitialObjectsState(JSON.parse(JSON.stringify(targetObjects)));
        } else {
          onSelectObject(null, false);
        }
      }
      return;
    }

    // 2. If 'draw' mode: start freehand path
    if (activeTool === 'draw') {
      setDragMode('draw');
      setDragStartScreen(pos);
      setLiveDrawingPoints([pos]);
      return;
    }

    // 3. If 'text' mode: click to add new text object immediately
    if (activeTool === 'text') {
      const pdfPt = screenPointToPdfPoint(pos, activePage, activePage.rotation, zoom);
      const newText = createTextObject({
        pageIndex: activePage.pageIndex,
        x: Math.round(pdfPt.x),
        y: Math.round(pdfPt.y),
        text: 'Sample Text',
        fontSize: toolDefaults.fontSize,
        fontFamily: toolDefaults.fontFamily,
        color: toolDefaults.textColor,
      });
      onAddObject(newText);
      onSelectObject(newText.id, false);
      onSwitchTool('select');
      return;
    }

    // 4. Shape modes (rectangle, ellipse, highlight, line, arrow)
    setDragMode('create-shape');
    setDragStartScreen(pos);
    setDragCurrentScreen(pos);
  };

  // --- Pointer Move ---
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return;
    const pos = getPointerPos(e);
    setDragCurrentScreen(pos);

    if (dragMode === 'draw') {
      setLiveDrawingPoints((prev) => [...prev, pos]);
      return;
    }

    if (
      dragMode === 'resize-handle' &&
      dragStartScreen &&
      initialObjectState &&
      initialScreenBox &&
      activeHandle
    ) {
      const dx = pos.x - dragStartScreen.x;
      const dy = pos.y - dragStartScreen.y;
      const minSize = 16;

      let newX = initialScreenBox.x;
      let newY = initialScreenBox.y;
      let newW = initialScreenBox.width;
      let newH = initialScreenBox.height;

      if (activeHandle.includes('e')) {
        newW = Math.max(minSize, initialScreenBox.width + dx);
      } else if (activeHandle.includes('w')) {
        const maxDx = initialScreenBox.width - minSize;
        const clampedDx = Math.min(maxDx, dx);
        newX = initialScreenBox.x + clampedDx;
        newW = initialScreenBox.width - clampedDx;
      }

      if (activeHandle.includes('s')) {
        newH = Math.max(minSize, initialScreenBox.height + dy);
      } else if (activeHandle.includes('n')) {
        const maxDy = initialScreenBox.height - minSize;
        const clampedDy = Math.min(maxDy, dy);
        newY = initialScreenBox.y + clampedDy;
        newH = initialScreenBox.height - clampedDy;
      }

      const updatedScreenBox: Rect = {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      };

      if (initialObjectState.type === 'rectangle' || initialObjectState.type === 'highlight') {
        const pdfRect = screenRectToPdfRect(updatedScreenBox, activePage, activePage.rotation, zoom);
        onUpdateObject(initialObjectState.id, {
          x: Math.round(pdfRect.x),
          y: Math.round(pdfRect.y),
          width: Math.max(10, Math.round(pdfRect.width)),
          height: Math.max(10, Math.round(pdfRect.height)),
        });
      } else if (initialObjectState.type === 'image' || initialObjectState.type === 'signature') {
        const finalScreenBox = { ...updatedScreenBox };
        const lockAspect = 'lockAspectRatio' in initialObjectState ? initialObjectState.lockAspectRatio : true;
        const shouldLock = e.shiftKey ? !lockAspect : lockAspect;

        if (shouldLock && initialScreenBox.width > 0 && initialScreenBox.height > 0) {
          const origAspect = initialScreenBox.width / initialScreenBox.height;
          if (activeHandle === 'e' || activeHandle === 'w') {
            finalScreenBox.height = finalScreenBox.width / origAspect;
          } else if (activeHandle === 'n' || activeHandle === 's') {
            finalScreenBox.width = finalScreenBox.height * origAspect;
          } else {
            const currentAspect = finalScreenBox.width / Math.max(1, finalScreenBox.height);
            if (currentAspect > origAspect) {
              finalScreenBox.width = finalScreenBox.height * origAspect;
            } else {
              finalScreenBox.height = finalScreenBox.width / origAspect;
            }
            if (activeHandle.includes('w')) {
              finalScreenBox.x = initialScreenBox.x + (initialScreenBox.width - finalScreenBox.width);
            }
            if (activeHandle.includes('n')) {
              finalScreenBox.y = initialScreenBox.y + (initialScreenBox.height - finalScreenBox.height);
            }
          }
        }

        const pdfRect = screenRectToPdfRect(finalScreenBox, activePage, activePage.rotation, zoom);
        onUpdateObject(initialObjectState.id, {
          x: Math.round(pdfRect.x),
          y: Math.round(pdfRect.y),
          width: Math.max(10, Math.round(pdfRect.width)),
          height: Math.max(10, Math.round(pdfRect.height)),
        });
      } else if (initialObjectState.type === 'ellipse') {
        const pdfRect = screenRectToPdfRect(updatedScreenBox, activePage, activePage.rotation, zoom);
        const isRot = activePage.rotation === 90 || activePage.rotation === 270;
        const pdfW = isRot ? pdfRect.height : pdfRect.width;
        const pdfH = isRot ? pdfRect.width : pdfRect.height;
        onUpdateObject(initialObjectState.id, {
          x: Math.round(pdfRect.x + pdfRect.width / 2),
          y: Math.round(pdfRect.y + pdfRect.height / 2),
          width: Math.max(10, Math.round(pdfW)),
          height: Math.max(10, Math.round(pdfH)),
        });
      } else if (initialObjectState.type === 'text') {
        const scaleFactor = updatedScreenBox.height / Math.max(1, initialScreenBox.height);
        const currentFontSize =
          'fontSize' in initialObjectState ? initialObjectState.fontSize : 14;
        const newFontSize = Math.max(8, Math.min(120, Math.round(currentFontSize * scaleFactor)));
        const baselinePdf = screenPointToPdfPoint(
          { x: updatedScreenBox.x, y: updatedScreenBox.y + updatedScreenBox.height },
          activePage,
          activePage.rotation,
          zoom
        );
        onUpdateObject(initialObjectState.id, {
          fontSize: newFontSize,
          x: Math.round(baselinePdf.x),
          y: Math.round(baselinePdf.y),
        });
      } else if (initialObjectState.type === 'line' || initialObjectState.type === 'arrow') {
        if (activeHandle === 'nw' || activeHandle === 'w' || activeHandle === 'n') {
          const newStartPdf = screenPointToPdfPoint(pos, activePage, activePage.rotation, zoom);
          onUpdateObject(initialObjectState.id, {
            start: { x: Math.round(newStartPdf.x), y: Math.round(newStartPdf.y) },
          });
        } else {
          const newEndPdf = screenPointToPdfPoint(pos, activePage, activePage.rotation, zoom);
          onUpdateObject(initialObjectState.id, {
            end: { x: Math.round(newEndPdf.x), y: Math.round(newEndPdf.y) },
          });
        }
      }
      return;
    }

    if (dragMode === 'move-object' && dragStartScreen && initialObjectsState.length > 0) {
      // Calculate delta in screen pixels
      const deltaScreen = {
        x: pos.x - dragStartScreen.x,
        y: pos.y - dragStartScreen.y,
      };

      // Convert delta to PDF space based on rotation
      const scale = Math.max(0.01, zoom);
      const rot = activePage.rotation;
      let dxPdf = 0;
      let dyPdf = 0;

      switch (rot) {
        case 0:
          dxPdf = deltaScreen.x / scale;
          dyPdf = -deltaScreen.y / scale;
          break;
        case 90:
          dxPdf = deltaScreen.y / scale;
          dyPdf = deltaScreen.x / scale;
          break;
        case 180:
          dxPdf = -deltaScreen.x / scale;
          dyPdf = deltaScreen.y / scale;
          break;
        case 270:
          dxPdf = -deltaScreen.y / scale;
          dyPdf = -deltaScreen.x / scale;
          break;
      }

      // Live update all dragged objects
      initialObjectsState.forEach((initObj) => {
        if (
          initObj.type === 'rectangle' ||
          initObj.type === 'highlight' ||
          initObj.type === 'ellipse' ||
          initObj.type === 'text' ||
          initObj.type === 'image' ||
          initObj.type === 'signature'
        ) {
          onUpdateObject(initObj.id, {
            x: Math.round(initObj.x + dxPdf),
            y: Math.round(initObj.y + dyPdf),
          });
        } else if (initObj.type === 'line' || initObj.type === 'arrow') {
          onUpdateObject(initObj.id, {
            start: {
              x: Math.round(initObj.start.x + dxPdf),
              y: Math.round(initObj.start.y + dyPdf),
            },
            end: {
              x: Math.round(initObj.end.x + dxPdf),
              y: Math.round(initObj.end.y + dyPdf),
            },
          });
        } else if (initObj.type === 'drawing') {
          onUpdateObject(initObj.id, {
            points: initObj.points.map((p) => ({
              x: Math.round(p.x + dxPdf),
              y: Math.round(p.y + dyPdf),
            })),
          });
        }
      });
    }
  };

  // --- Pointer Up ---
  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (dragMode === 'draw' && liveDrawingPoints.length > 1) {
      // Convert points to PDF space
      const pdfPoints = liveDrawingPoints.map((p) =>
        screenPointToPdfPoint(p, activePage, activePage.rotation, zoom)
      );
      const newDrawing = createDrawingObject({
        pageIndex: activePage.pageIndex,
        points: pdfPoints,
        strokeWidth: toolDefaults.strokeWidth,
        color: toolDefaults.strokeColor,
        opacity: toolDefaults.opacity,
      });
      onAddObject(newDrawing);
      onSelectObject(newDrawing.id, false);
    } else if (dragMode === 'create-shape' && dragStartScreen && dragCurrentScreen) {
      const minX = Math.min(dragStartScreen.x, dragCurrentScreen.x);
      const maxX = Math.max(dragStartScreen.x, dragCurrentScreen.x);
      const minY = Math.min(dragStartScreen.y, dragCurrentScreen.y);
      const maxY = Math.max(dragStartScreen.y, dragCurrentScreen.y);
      const w = maxX - minX;
      const h = maxY - minY;

      if (w >= 4 || h >= 4) {
        if (activeTool === 'rectangle') {
          const pdfRect = screenRectToPdfRect(
            { x: minX, y: minY, width: w, height: h },
            activePage,
            activePage.rotation,
            zoom
          );
          const newRect = createRectangleObject({
            pageIndex: activePage.pageIndex,
            x: Math.round(pdfRect.x),
            y: Math.round(pdfRect.y),
            width: Math.round(pdfRect.width),
            height: Math.round(pdfRect.height),
            strokeWidth: toolDefaults.strokeWidth,
            strokeColor: toolDefaults.strokeColor,
            fillColor: toolDefaults.hasFill ? toolDefaults.fillColor : undefined,
          });
          onAddObject(newRect);
          onSelectObject(newRect.id, false);
        } else if (activeTool === 'highlight') {
          const pdfRect = screenRectToPdfRect(
            { x: minX, y: minY, width: w, height: h },
            activePage,
            activePage.rotation,
            zoom
          );
          const newHighlight = createHighlightObject({
            pageIndex: activePage.pageIndex,
            x: Math.round(pdfRect.x),
            y: Math.round(pdfRect.y),
            width: Math.round(pdfRect.width),
            height: Math.round(pdfRect.height),
            color: toolDefaults.highlightColor,
            opacity: 0.35,
          });
          onAddObject(newHighlight);
          onSelectObject(newHighlight.id, false);
        } else if (activeTool === 'ellipse') {
          const centerScreen = { x: minX + w / 2, y: minY + h / 2 };
          const centerPdf = screenPointToPdfPoint(centerScreen, activePage, activePage.rotation, zoom);
          const isRot = activePage.rotation === 90 || activePage.rotation === 270;
          const pdfW = (isRot ? h : w) / zoom;
          const pdfH = (isRot ? w : h) / zoom;
          const newEllipse = createEllipseObject({
            pageIndex: activePage.pageIndex,
            x: Math.round(centerPdf.x),
            y: Math.round(centerPdf.y),
            width: Math.round(pdfW),
            height: Math.round(pdfH),
            strokeWidth: toolDefaults.strokeWidth,
            strokeColor: toolDefaults.strokeColor,
            fillColor: toolDefaults.hasFill ? toolDefaults.fillColor : undefined,
          });
          onAddObject(newEllipse);
          onSelectObject(newEllipse.id, false);
        } else if (activeTool === 'line') {
          const startPdf = screenPointToPdfPoint(dragStartScreen, activePage, activePage.rotation, zoom);
          const endPdf = screenPointToPdfPoint(dragCurrentScreen, activePage, activePage.rotation, zoom);
          const newLine = createLineObject({
            pageIndex: activePage.pageIndex,
            start: { x: Math.round(startPdf.x), y: Math.round(startPdf.y) },
            end: { x: Math.round(endPdf.x), y: Math.round(endPdf.y) },
            strokeWidth: toolDefaults.strokeWidth,
            strokeColor: toolDefaults.strokeColor,
          });
          onAddObject(newLine);
          onSelectObject(newLine.id, false);
        } else if (activeTool === 'arrow') {
          const startPdf = screenPointToPdfPoint(dragStartScreen, activePage, activePage.rotation, zoom);
          const endPdf = screenPointToPdfPoint(dragCurrentScreen, activePage, activePage.rotation, zoom);
          const newArrow = createArrowObject({
            pageIndex: activePage.pageIndex,
            start: { x: Math.round(startPdf.x), y: Math.round(startPdf.y) },
            end: { x: Math.round(endPdf.x), y: Math.round(endPdf.y) },
            strokeWidth: toolDefaults.strokeWidth,
            strokeColor: toolDefaults.strokeColor,
          });
          onAddObject(newArrow);
          onSelectObject(newArrow.id, false);
        }

        onSwitchTool('select');
      }
    }

    // Reset interaction states
    setDragMode('none');
    setActiveHandle(null);
    setDragStartScreen(null);
    setDragCurrentScreen(null);
    setLiveDrawingPoints([]);
    setInitialObjectState(null);
    setInitialObjectsState([]);
    setInitialScreenBox(null);
  };

  // Cursor style
  const getCursorClass = () => {
    if (dragMode === 'move-object') return 'cursor-move';
    if (dragMode === 'resize-handle' && activeHandle) {
      if (activeHandle === 'n' || activeHandle === 's') return 'cursor-ns-resize';
      if (activeHandle === 'e' || activeHandle === 'w') return 'cursor-ew-resize';
      if (activeHandle === 'nw' || activeHandle === 'se') return 'cursor-nwse-resize';
      if (activeHandle === 'ne' || activeHandle === 'sw') return 'cursor-nesw-resize';
    }
    if (activeTool === 'select') return 'cursor-default';
    if (activeTool === 'draw') return 'cursor-crosshair';
    if (activeTool === 'text') return 'cursor-text';
    return 'cursor-crosshair';
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center p-8 min-h-full overflow-auto bg-slate-100/70 dark:bg-slate-950 select-none',
        className
      )}
    >
      <div
        ref={containerRef}
        style={{
          width: screenWidth,
          height: screenHeight,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={cn(
          'relative shadow-2xl rounded-sm bg-white overflow-hidden transition-shadow',
          getCursorClass()
        )}
      >
        {/* Loading Spinner */}
        {pageLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* 1. PDF.js Background Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none block"
        />

        {/* 2. Interactive SVG Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        >
          {/* Temporary Search Result Highlights (Phase 3C.5) */}
          {searchMatches && searchMatches.length > 0 && (
            <g className="search-highlights-layer" aria-label="Search highlights">
              {searchMatches.map((match, idx) => {
                if (match.pageIndex !== activePage.pageIndex) return null;
                const sRect = pdfRectToScreenRect(
                  match.rect,
                  activePage,
                  activePage.rotation,
                  zoom
                );
                const isActive =
                  activeSearchMatch &&
                  activeSearchMatch.pageIndex === match.pageIndex &&
                  Math.abs(activeSearchMatch.rect.x - match.rect.x) < 0.1 &&
                  Math.abs(activeSearchMatch.rect.y - match.rect.y) < 0.1;

                return (
                  <rect
                    key={`search-match-${match.pageIndex}-${idx}`}
                    x={sRect.x - 2}
                    y={sRect.y - 1}
                    width={sRect.width + 4}
                    height={sRect.height + 2}
                    rx={2}
                    fill={isActive ? 'rgba(249, 115, 22, 0.45)' : 'rgba(250, 204, 21, 0.35)'}
                    stroke={isActive ? '#ea580c' : '#ca8a04'}
                    strokeWidth={isActive ? 2 : 1}
                    className="pointer-events-none transition-all"
                  />
                );
              })}
            </g>
          )}

          {/* Render Committed Objects */}
          {activePage.objects.map((obj) => {
            switch (obj.type) {
              case 'text': {
                const pos = pdfPointToScreenPoint(
                  { x: obj.x, y: obj.y },
                  activePage,
                  activePage.rotation,
                  zoom
                );
                const textAnchor =
                  obj.align === 'center' ? 'middle' : obj.align === 'right' ? 'end' : 'start';
                return (
                  <text
                    key={obj.id}
                    x={pos.x}
                    y={pos.y}
                    fontFamily={obj.fontFamily}
                    fontSize={obj.fontSize * zoom}
                    fontWeight={obj.bold ? 'bold' : 'normal'}
                    fontStyle={obj.italic ? 'italic' : 'normal'}
                    textDecoration={obj.underline ? 'underline' : undefined}
                    textAnchor={textAnchor}
                    fill={rgbToHex(obj.color)}
                    fillOpacity={obj.opacity}
                    className="select-none"
                    style={{
                      transformOrigin: `${pos.x}px ${pos.y}px`,
                      transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
                    }}
                  >
                    {obj.text}
                  </text>
                );
              }

              case 'image':
              case 'signature': {
                const rect = pdfRectToScreenRect(
                  { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
                  activePage,
                  activePage.rotation,
                  zoom
                );
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                return (
                  <image
                    key={obj.id}
                    href={obj.dataUrl}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    preserveAspectRatio={obj.lockAspectRatio ? 'xMidYMid meet' : 'none'}
                    opacity={obj.opacity}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
                    }}
                  />
                );
              }

              case 'highlight': {
                const rect = pdfRectToScreenRect(
                  { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
                  activePage,
                  activePage.rotation,
                  zoom
                );
                return (
                  <rect
                    key={obj.id}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={rgbToHex(obj.color)}
                    fillOpacity={obj.opacity}
                  />
                );
              }

              case 'drawing': {
                if (obj.points.length < 2) return null;
                const pts = obj.points.map((p) =>
                  pdfPointToScreenPoint(p, activePage, activePage.rotation, zoom)
                );
                return (
                  <polyline
                    key={obj.id}
                    points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={rgbToHex(obj.color)}
                    strokeWidth={obj.strokeWidth * zoom}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={obj.opacity}
                  />
                );
              }

              case 'rectangle': {
                const rect = pdfRectToScreenRect(
                  { x: obj.x, y: obj.y, width: obj.width, height: obj.height },
                  activePage,
                  activePage.rotation,
                  zoom
                );
                return (
                  <rect
                    key={obj.id}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    stroke={rgbToHex(obj.strokeColor)}
                    strokeWidth={obj.strokeWidth * zoom}
                    fill={obj.fillColor ? rgbToHex(obj.fillColor) : 'none'}
                    opacity={obj.opacity}
                  />
                );
              }

              case 'ellipse': {
                const center = pdfPointToScreenPoint(
                  { x: obj.x, y: obj.y },
                  activePage,
                  activePage.rotation,
                  zoom
                );
                const isRot = activePage.rotation === 90 || activePage.rotation === 270;
                const rx = ((isRot ? obj.height : obj.width) / 2) * zoom;
                const ry = ((isRot ? obj.width : obj.height) / 2) * zoom;
                return (
                  <ellipse
                    key={obj.id}
                    cx={center.x}
                    cy={center.y}
                    rx={rx}
                    ry={ry}
                    stroke={rgbToHex(obj.strokeColor)}
                    strokeWidth={obj.strokeWidth * zoom}
                    fill={obj.fillColor ? rgbToHex(obj.fillColor) : 'none'}
                    opacity={obj.opacity}
                  />
                );
              }

              case 'line': {
                const p1 = pdfPointToScreenPoint(obj.start, activePage, activePage.rotation, zoom);
                const p2 = pdfPointToScreenPoint(obj.end, activePage, activePage.rotation, zoom);
                return (
                  <line
                    key={obj.id}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={rgbToHex(obj.strokeColor)}
                    strokeWidth={obj.strokeWidth * zoom}
                    strokeLinecap="round"
                    opacity={obj.opacity}
                  />
                );
              }

              case 'arrow': {
                const p1 = pdfPointToScreenPoint(obj.start, activePage, activePage.rotation, zoom);
                const p2 = pdfPointToScreenPoint(obj.end, activePage, activePage.rotation, zoom);
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const headLen = (obj.headLength ?? 12) * zoom;
                const arrowHead1 = {
                  x: p2.x - headLen * Math.cos(angle - Math.PI / 6),
                  y: p2.y - headLen * Math.sin(angle - Math.PI / 6),
                };
                const arrowHead2 = {
                  x: p2.x - headLen * Math.cos(angle + Math.PI / 6),
                  y: p2.y - headLen * Math.sin(angle + Math.PI / 6),
                };

                return (
                  <g key={obj.id} opacity={obj.opacity}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={rgbToHex(obj.strokeColor)}
                      strokeWidth={obj.strokeWidth * zoom}
                      strokeLinecap="round"
                    />
                    <polygon
                      points={`${p2.x},${p2.y} ${arrowHead1.x},${arrowHead1.y} ${arrowHead2.x},${arrowHead2.y}`}
                      fill={rgbToHex(obj.strokeColor)}
                    />
                  </g>
                );
              }

              default:
                return null;
            }
          })}

          {/* Live Drawing Stroke Preview */}
          {dragMode === 'draw' && liveDrawingPoints.length > 1 && (
            <polyline
              points={liveDrawingPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={rgbToHex(toolDefaults.strokeColor)}
              strokeWidth={toolDefaults.strokeWidth * zoom}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={toolDefaults.opacity}
            />
          )}

          {/* Live Shape Drag Creation Preview */}
          {dragMode === 'create-shape' && dragStartScreen && dragCurrentScreen && (
            <>
              {activeTool === 'rectangle' && (
                <rect
                  x={Math.min(dragStartScreen.x, dragCurrentScreen.x)}
                  y={Math.min(dragStartScreen.y, dragCurrentScreen.y)}
                  width={Math.abs(dragCurrentScreen.x - dragStartScreen.x)}
                  height={Math.abs(dragCurrentScreen.y - dragStartScreen.y)}
                  stroke={rgbToHex(toolDefaults.strokeColor)}
                  strokeWidth={toolDefaults.strokeWidth * zoom}
                  strokeDasharray="4 4"
                  fill={toolDefaults.hasFill ? rgbToHex(toolDefaults.fillColor!) : 'none'}
                  opacity={0.8}
                />
              )}
              {activeTool === 'highlight' && (
                <rect
                  x={Math.min(dragStartScreen.x, dragCurrentScreen.x)}
                  y={Math.min(dragStartScreen.y, dragCurrentScreen.y)}
                  width={Math.abs(dragCurrentScreen.x - dragStartScreen.x)}
                  height={Math.abs(dragCurrentScreen.y - dragStartScreen.y)}
                  fill={rgbToHex(toolDefaults.highlightColor)}
                  fillOpacity={0.35}
                />
              )}
              {activeTool === 'ellipse' && (
                <ellipse
                  cx={(dragStartScreen.x + dragCurrentScreen.x) / 2}
                  cy={(dragStartScreen.y + dragCurrentScreen.y) / 2}
                  rx={Math.abs(dragCurrentScreen.x - dragStartScreen.x) / 2}
                  ry={Math.abs(dragCurrentScreen.y - dragStartScreen.y) / 2}
                  stroke={rgbToHex(toolDefaults.strokeColor)}
                  strokeWidth={toolDefaults.strokeWidth * zoom}
                  strokeDasharray="4 4"
                  fill={toolDefaults.hasFill ? rgbToHex(toolDefaults.fillColor!) : 'none'}
                  opacity={0.8}
                />
              )}
              {activeTool === 'line' && (
                <line
                  x1={dragStartScreen.x}
                  y1={dragStartScreen.y}
                  x2={dragCurrentScreen.x}
                  y2={dragCurrentScreen.y}
                  stroke={rgbToHex(toolDefaults.strokeColor)}
                  strokeWidth={toolDefaults.strokeWidth * zoom}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              )}
              {activeTool === 'arrow' && (
                <line
                  x1={dragStartScreen.x}
                  y1={dragStartScreen.y}
                  x2={dragCurrentScreen.x}
                  y2={dragCurrentScreen.y}
                  stroke={rgbToHex(toolDefaults.strokeColor)}
                  strokeWidth={toolDefaults.strokeWidth * zoom}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              )}
            </>
          )}

          {/* Multi-selection outlines when more than 1 object is selected */}
          {activeTool === 'select' && selectedObjectIds && selectedObjectIds.length > 1 && (
            <g className="multi-selection-group">
              {selectedObjectIds.map((id) => {
                const obj = activePage.objects.find((o) => o.id === id);
                if (!obj) return null;
                const b = getObjectScreenBox(obj);
                if (!b) return null;
                return (
                  <rect
                    key={`multi-outline-${id}`}
                    x={b.x}
                    y={b.y}
                    width={b.width}
                    height={b.height}
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    className="pointer-events-none"
                  />
                );
              })}
            </g>
          )}

          {/* Primary Selection Box & Resize Handles */}
          {selectedBox && activeTool === 'select' && (
            <g className="selection-overlay">
              {/* Bounding box outline */}
              <rect
                x={selectedBox.x}
                y={selectedBox.y}
                width={selectedBox.width}
                height={selectedBox.height}
                fill="none"
                stroke="#4F46E5"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                className="pointer-events-none"
              />

              {/* Handles at corners & edges */}
              {getHandles().map((handle) => (
                <circle
                  key={handle.position}
                  cx={handle.x}
                  cy={handle.y}
                  r={4.5}
                  fill="#FFFFFF"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  style={{ cursor: handle.cursor }}
                  className="pointer-events-auto hover:scale-125 transition-transform"
                />
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
