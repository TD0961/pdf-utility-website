'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PdfEditorEngine } from '@/lib/pdf/editor/editor-engine';
import {
  EditorDocumentState,
  EditorObject,
} from '@/lib/pdf/editor/types';
import { COLORS, cloneEditorObject } from '@/lib/pdf/editor/objects';
import { ToolPalette, EditorTool } from './ToolPalette';
import { EditorToolbar } from './EditorToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorPropertiesPanel, ToolDefaults } from './EditorPropertiesPanel';
import { EditorPageThumbnails } from './EditorPageThumbnails';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import { formatBytes } from '@/lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  Download,
  Edit3,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export function PdfEditorWorkspace() {
  const [engine] = useState(() => new PdfEditorEngine());

  // React state mirror of editor engine
  const [docState, setDocState] = useState<EditorDocumentState | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportStats, setExportStats] = useState<{
    fileName: string;
    fileSize: number;
    totalPages: number;
  } | null>(null);

  // Sidebars visibility (for tablet/mobile responsiveness)
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  // Active tool defaults
  const [toolDefaults, setToolDefaults] = useState<ToolDefaults>({
    strokeColor: COLORS.BLACK,
    fillColor: undefined,
    hasFill: false,
    strokeWidth: 2,
    textColor: COLORS.BLACK,
    fontSize: 14,
    fontFamily: 'Helvetica',
    highlightColor: COLORS.YELLOW_HIGHLIGHT,
    opacity: 1,
  });

  // Undo / Redo tracking
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Keep state sync helper
  const syncState = useCallback(() => {
    setDocState(engine.getState());
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());
  }, [engine]);

  const downloadUrlRef = useRef<string | null>(null);
  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  // Clean up only on true component unmount
  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        memoryManager.revokeUrl(downloadUrlRef.current);
      }
      engine.destroy();
    };
  }, [engine]);

  // Prevent accidental navigation when modified
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (docState?.isModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [docState?.isModified]);

  // Handle file drop & load
  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSourceFile(file);
    setErrorMessage(null);
    setExportStats(null);
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const state = await engine.loadDocument(file);
      setDocState(state);
      setCanUndo(false);
      setCanRedo(false);
    } catch (err: unknown) {
      console.error('Error loading PDF in editor:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'opening this PDF in the editor'));
      setSourceFile(null);
      setDocState(null);
    }
  };

  // --- Toolbar Handlers ---
  const handleUndo = () => {
    if (engine.undo()) {
      syncState();
    }
  };

  const handleRedo = () => {
    if (engine.redo()) {
      syncState();
    }
  };

  const handlePrevPage = () => {
    if (!docState) return;
    engine.setActivePageIndex(Math.max(0, docState.activePageIndex - 1));
    syncState();
  };

  const handleNextPage = () => {
    if (!docState) return;
    engine.setActivePageIndex(Math.min(docState.pages.length - 1, docState.activePageIndex + 1));
    syncState();
  };

  const handleSetPage = (page1Based: number) => {
    if (!docState) return;
    engine.setActivePageIndex(Math.max(0, Math.min(docState.pages.length - 1, page1Based - 1)));
    syncState();
  };

  const handleZoomIn = () => {
    if (!docState) return;
    engine.setZoom(Math.min(3.0, Number((docState.zoom + 0.2).toFixed(1))));
    syncState();
  };

  const handleZoomOut = () => {
    if (!docState) return;
    engine.setZoom(Math.max(0.3, Number((docState.zoom - 0.2).toFixed(1))));
    syncState();
  };

  const handleZoomReset = () => {
    engine.setZoom(1.0);
    syncState();
  };

  const handleResetDocument = () => {
    if (docState?.isModified) {
      if (!window.confirm('You have unsaved changes. Discard and open a different document?')) {
        return;
      }
    }
    engine.reset();
    setDocState(null);
    setSourceFile(null);
    setExportStats(null);
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
  };

  // --- Object Operations ---
  const handleSelectObject = (id: string | null) => {
    engine.selectObject(id);
    syncState();
  };

  const handleAddObject = (obj: EditorObject) => {
    if (!docState) return;
    engine.addObject(docState.activePageIndex, obj);
    syncState();
  };

  const handleUpdateObject = (objectId: string, updates: Partial<EditorObject>) => {
    if (!docState) return;
    engine.updateObject(docState.activePageIndex, objectId, updates);
    syncState();
  };

  const handleDeleteObject = (objectId: string) => {
    if (!docState) return;
    engine.deleteObject(docState.activePageIndex, objectId);
    syncState();
  };

  const handleDuplicateObject = () => {
    if (!docState || !docState.selectedObjectId) return;
    const page = engine.getActivePage();
    if (!page) return;
    const obj = page.objects.find((o) => o.id === docState.selectedObjectId);
    if (!obj) return;

    const cloned = cloneEditorObject(obj);
    cloned.id = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Offset slightly so user sees the duplicate
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

    engine.addObject(docState.activePageIndex, cloned);
    engine.selectObject(cloned.id);
    syncState();
  };

  // --- Page Operations ---
  const handleRotatePage = (pageIndex: number, delta: 90 | -90) => {
    engine.rotatePage(pageIndex, delta);
    syncState();
  };

  const handleDuplicatePage = (pageIndex: number) => {
    engine.duplicatePage(pageIndex);
    syncState();
  };

  const handleDeletePage = (pageIndex: number) => {
    if (!docState || docState.pages.length <= 1) return;
    engine.deletePage(pageIndex);
    syncState();
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (!docState) return;
    if (toIndex < 0 || toIndex >= docState.pages.length) return;
    engine.movePage(fromIndex, toIndex);
    syncState();
  };

  // --- Export PDF ---
  const handleExport = async () => {
    if (!docState) return;

    try {
      setIsExporting(true);
      setErrorMessage(null);

      const baseName = docState.fileName.replace(/\.pdf$/i, '');
      const outName = `${baseName}-edited.pdf`;

      const result = await engine.exportPdf({ outputFileName: outName });
      const url = memoryManager.register(result.blob);

      setDownloadUrl(url);
      setExportStats({
        fileName: result.fileName,
        fileSize: result.fileSize,
        totalPages: result.totalPages,
      });

      // Trigger instant automatic download
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
    } catch (err: unknown) {
      console.error('Error exporting PDF:', err);
      setIsExporting(false);
      setErrorMessage(formatUserFacingPdfError(err, 'exporting the edited PDF'));
    }
  };

  // Initial Dropzone View
  if (!docState || !sourceFile) {
    return (
      <div className="space-y-8">
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to open the visual editor"
          subtitle="Add text annotations, draw shapes, highlight, reorder pages, and export"
        />

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Document</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <LocalProcessingNotice />

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Vector Annotations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add text, highlighters, geometric shapes, lines, and freehand drawings with zero rasterization.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Full Page Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Rotate, duplicate, delete, and reorder pages seamlessly alongside visual canvas editing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              100% Client-Side Privacy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Documents are processed directly in browser memory. Zero cloud transmission or server storage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activePage = docState.pages[docState.activePageIndex];
  const selectedObject = activePage?.objects.find((o) => o.id === docState.selectedObjectId) || null;

  return (
    <div className="w-full flex flex-col bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden h-[86vh] min-h-[640px]">
      {/* 1. Top Toolbar */}
      <EditorToolbar
        fileName={docState.fileName}
        currentPage={docState.activePageIndex + 1}
        totalPages={docState.pages.length}
        zoom={docState.zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        isExporting={isExporting}
        showThumbnails={showThumbnails}
        showProperties={showProperties}
        onToggleThumbnails={() => setShowThumbnails((prev) => !prev)}
        onToggleProperties={() => setShowProperties((prev) => !prev)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onSetPage={handleSetPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onExport={handleExport}
        onResetDocument={handleResetDocument}
      />

      {/* Export Success Notification Banner */}
      {exportStats && downloadUrl && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800/60 px-4 py-2 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Successfully exported <strong>{exportStats.fileName}</strong> (
              {formatBytes(exportStats.fileSize)}, {exportStats.totalPages} pages).
            </span>
          </div>
          <a
            href={downloadUrl}
            download={exportStats.fileName}
            className="font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-100 inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Download Again
          </a>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-800/60 px-4 py-2 flex items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main Middle Workspace */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Page Thumbnails Sidebar */}
        {showThumbnails && (
          <EditorPageThumbnails
            pages={docState.pages}
            activePageIndex={docState.activePageIndex}
            sourceBytes={docState.sourceBytes}
            onSelectPage={(index) => {
              engine.setActivePageIndex(index);
              syncState();
            }}
            onRotatePage={handleRotatePage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onMovePage={handleMovePage}
          />
        )}

        {/* Floating Tool Palette (Centered Left) */}
        <div className="absolute left-4 top-4 z-30 hidden sm:block">
          <ToolPalette
            activeTool={activeTool}
            onSelectTool={(tool) => {
              setActiveTool(tool);
              if (tool !== 'select') {
                engine.selectObject(null);
                syncState();
              }
            }}
          />
        </div>

        {/* Center: Scrollable Canvas Container */}
        <main
          role="main"
          className="flex-1 overflow-auto flex flex-col relative bg-slate-200/50 dark:bg-slate-950"
        >
          {activePage ? (
            <EditorCanvas
              activePage={activePage}
              sourceBytes={docState.sourceBytes}
              zoom={docState.zoom}
              activeTool={activeTool}
              selectedObjectId={docState.selectedObjectId}
              toolDefaults={toolDefaults}
              onSelectObject={handleSelectObject}
              onAddObject={handleAddObject}
              onUpdateObject={handleUpdateObject}
              onDeleteObject={handleDeleteObject}
              onSwitchTool={(t) => setActiveTool(t)}
            />
          ) : null}

          {/* Mobile Floating Bottom Tool Palette */}
          <div className="sm:hidden sticky bottom-3 mx-auto z-30">
            <ToolPalette
              orientation="horizontal"
              activeTool={activeTool}
              onSelectTool={(tool) => {
                setActiveTool(tool);
                if (tool !== 'select') {
                  engine.selectObject(null);
                  syncState();
                }
              }}
            />
          </div>
        </main>

        {/* Right: Contextual Properties Panel */}
        {showProperties && (
          <EditorPropertiesPanel
            selectedObject={selectedObject}
            activePage={activePage}
            activeTool={activeTool}
            toolDefaults={toolDefaults}
            onUpdateObject={(updates) => {
              if (selectedObject) {
                handleUpdateObject(selectedObject.id, updates);
              }
            }}
            onDeleteObject={() => {
              if (selectedObject) {
                handleDeleteObject(selectedObject.id);
              }
            }}
            onDuplicateObject={handleDuplicateObject}
            onUpdateToolDefaults={(updates) => {
              setToolDefaults((prev) => ({ ...prev, ...updates }));
            }}
          />
        )}
      </div>
    </div>
  );
}
