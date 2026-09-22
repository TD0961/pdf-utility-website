'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PdfEditorEngine } from '@/lib/pdf/editor/editor-engine';
import {
  EditorDocumentState,
  EditorObject,
  PdfSearchResult,
} from '@/lib/pdf/editor/types';
import { COLORS, cloneEditorObject } from '@/lib/pdf/editor/objects';
import { ToolPalette, EditorTool } from './ToolPalette';
import { EditorToolbar } from './EditorToolbar';
import { EditorCanvas } from './EditorCanvas';
import { EditorPropertiesPanel, ToolDefaults } from './EditorPropertiesPanel';
import { EditorPageThumbnails } from './EditorPageThumbnails';
import { SignatureModal } from './SignatureModal';
import { EditorSearchBar } from './EditorSearchBar';
import { EditorObjectManager } from './EditorObjectManager';
import { EditorMetadataModal } from './EditorMetadataModal';
import { EditorShortcutsModal } from './EditorShortcutsModal';
import { EditorExportModal } from './EditorExportModal';
import { EditorMobileBottomBar, MobileTab } from './EditorMobileBottomBar';
import { EditorMobilePageDrawer } from './EditorMobilePageDrawer';
import { EditorMobilePropertiesSheet } from './EditorMobilePropertiesSheet';
import { getDeterministicExportFilename } from '@/lib/pdf/editor/export';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import { formatBytes } from '@/lib/utils';
import {
  createImageObject,
  createSignatureObject,
  validateImageFile,
} from '@/lib/pdf/editor/objects';
import Link from 'next/link';
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

  // Modals & File inputs
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Sidebars & Floating Panels visibility
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showObjectManager, setShowObjectManager] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PdfSearchResult>({
    query: '',
    totalMatches: 0,
    matches: [],
    activeMatchIndex: -1,
    isSearching: false,
    hasExtractedText: true,
  });

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
      if (docState?.saveState === 'dirty' || docState?.isModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [docState?.saveState, docState?.isModified]);

  // Handle file drop & load
  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    if (docState?.saveState === 'dirty' || docState?.isModified) {
      if (!window.confirm('You have unsaved changes in your document. Discard them and load a new file?')) {
        return;
      }
    }
    const file = files[0];
    setSourceFile(file);
    setErrorMessage(null);
    setExportStats(null);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResult({
      query: '',
      totalMatches: 0,
      matches: [],
      activeMatchIndex: -1,
      isSearching: false,
      hasExtractedText: true,
    });
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }

    try {
      const state = await engine.loadDocument(file);
      if (typeof window !== 'undefined' && window.innerWidth < 768 && state.pages[0]) {
        const page0 = state.pages[0];
        const isRot = page0.rotation === 90 || page0.rotation === 270;
        const pWidth = isRot ? page0.height : page0.width;
        if (pWidth > 0) {
          const fitZoom = Math.min(1.0, Math.max(0.25, Number(((window.innerWidth - 20) / pWidth).toFixed(2))));
          engine.setZoom(fitZoom);
        }
      }
      setDocState(engine.getState());
      setCanUndo(false);
      setCanRedo(false);

      // Asynchronously extract and index text in the background for search
      engine
        .getSearchEngine()
        .extractText(state.sourceBytes, state.pages.length, state.documentGeneration)
        .catch((e) => console.warn('Background search extraction failed:', e));
    } catch (err: unknown) {
      console.error('Error loading PDF in editor:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'opening this PDF in the editor'));
      setSourceFile(null);
      setDocState(null);
    }
  };

  // --- Search Handlers ---
  const handleSearchQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!docState) return;

      const pageMapping = docState.pages.map((p) => ({
        pageIndex: p.pageIndex,
        originalPageIndex: p.originalPageIndex,
      }));
      const res = engine.getSearchEngine().search(query, pageMapping);
      setSearchResult(res);

      if (res.matches.length > 0) {
        const first = res.matches[0];
        if (first.pageIndex !== docState.activePageIndex) {
          engine.setActivePageIndex(first.pageIndex);
          syncState();
        }
      }
    },
    [docState, engine, syncState]
  );

  const handleNextMatch = useCallback(() => {
    if (searchResult.totalMatches === 0) return;
    const nextIdx = (searchResult.activeMatchIndex + 1) % searchResult.totalMatches;
    setSearchResult((prev) => ({ ...prev, activeMatchIndex: nextIdx }));
    const match = searchResult.matches[nextIdx];
    if (match && docState && match.pageIndex !== docState.activePageIndex) {
      engine.setActivePageIndex(match.pageIndex);
      syncState();
    }
  }, [searchResult, docState, engine, syncState]);

  const handlePrevMatch = useCallback(() => {
    if (searchResult.totalMatches === 0) return;
    const prevIdx =
      (searchResult.activeMatchIndex - 1 + searchResult.totalMatches) % searchResult.totalMatches;
    setSearchResult((prev) => ({ ...prev, activeMatchIndex: prevIdx }));
    const match = searchResult.matches[prevIdx];
    if (match && docState && match.pageIndex !== docState.activePageIndex) {
      engine.setActivePageIndex(match.pageIndex);
      syncState();
    }
  }, [searchResult, docState, engine, syncState]);

  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResult({
      query: '',
      totalMatches: 0,
      matches: [],
      activeMatchIndex: -1,
      isSearching: false,
      hasExtractedText: true,
    });
  }, []);



  // --- Toolbar Handlers ---
  const handleUndo = useCallback(() => {
    if (engine.undo()) {
      syncState();
    }
  }, [engine, syncState]);

  const handleRedo = useCallback(() => {
    if (engine.redo()) {
      syncState();
    }
  }, [engine, syncState]);

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

  const handleZoomFitWidth = useCallback(() => {
    if (!docState) return;
    const page = docState.pages[docState.activePageIndex];
    if (!page) return;
    const isRot = page.rotation === 90 || page.rotation === 270;
    const pageWidth = isRot ? page.height : page.width;
    if (pageWidth <= 0) return;

    let availableWidth = 800;
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        availableWidth = window.innerWidth - 20;
      } else {
        const sidebarsWidth = (showThumbnails ? 180 : 0) + (showObjectManager ? 220 : 0) + 96;
        availableWidth = Math.max(320, window.innerWidth - sidebarsWidth);
      }
    }
    const fitZoom = Math.min(2.5, Math.max(0.25, Number((availableWidth / pageWidth).toFixed(2))));
    engine.setZoom(fitZoom);
    syncState();
  }, [docState, engine, showThumbnails, showObjectManager, syncState]);

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
    setShowSearch(false);
    setSearchQuery('');
    setSearchResult({
      query: '',
      totalMatches: 0,
      matches: [],
      activeMatchIndex: -1,
      isSearching: false,
      hasExtractedText: true,
    });
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
  };

  // --- Tool & Asset Handlers ---
  const handleToolSelect = (tool: EditorTool) => {
    if (tool === 'image') {
      imageInputRef.current?.click();
      return;
    }
    if (tool === 'signature') {
      setShowSignatureModal(true);
      return;
    }
    setActiveTool(tool);
    if (tool !== 'select') {
      engine.selectObject(null);
      syncState();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docState) return;
    const activePage = engine.getActivePage();
    if (!activePage) return;

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file format.');
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          let targetWidth = img.naturalWidth || 200;
          let targetHeight = img.naturalHeight || 200;

          // Scale down to fit nicely in PDF coordinate space (max 300x300)
          const maxDim = 300;
          if (targetWidth > maxDim || targetHeight > maxDim) {
            const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          const x = Math.max(10, Math.round((activePage.width - targetWidth) / 2));
          const y = Math.max(10, Math.round((activePage.height - targetHeight) / 2));

          const sourceType: 'jpeg' | 'png' | 'webp' = file.type.includes('png')
            ? 'png'
            : file.type.includes('webp')
            ? 'webp'
            : 'jpeg';

          const imageObj = createImageObject({
            pageIndex: activePage.pageIndex,
            x,
            y,
            width: targetWidth,
            height: targetHeight,
            dataUrl,
            sourceType,
          });

          engine.addObject(activePage.pageIndex, imageObj);
          setActiveTool('select');
          syncState();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      console.error('Error inserting image:', err);
      setErrorMessage('Failed to read image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSignatureConfirm = (dataUrl: string, width: number, height: number) => {
    if (!docState) return;
    const activePage = engine.getActivePage();
    if (!activePage) return;

    const targetWidth = Math.min(240, Math.max(80, width));
    const targetHeight = Math.round(targetWidth * (height / Math.max(1, width)));

    const x = Math.max(10, Math.round((activePage.width - targetWidth) / 2));
    const y = Math.max(10, Math.round((activePage.height - targetHeight) / 2));

    const sigObj = createSignatureObject({
      pageIndex: activePage.pageIndex,
      x,
      y,
      width: targetWidth,
      height: targetHeight,
      dataUrl,
    });

    engine.addObject(activePage.pageIndex, sigObj);
    setShowSignatureModal(false);
    setActiveTool('select');
    syncState();
  };

  // Global keyboard shortcuts (Copy, Cut, Paste, Undo, Redo, Delete, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        engine.copySelected();
        syncState();
      } else if (modKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        engine.cutSelected();
        syncState();
      } else if (modKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        engine.paste();
        syncState();
      } else if (modKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        modKey &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedIds = docState?.selectedObjectIds || [];
        if (selectedIds.length > 0 || docState?.selectedObjectId) {
          e.preventDefault();
          engine.deleteSelectedObjects();
          syncState();
        }
      } else if (e.key === 'Escape') {
        engine.selectObject(null);
        setActiveTool('select');
        syncState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, docState, syncState, handleUndo, handleRedo]);

  // --- Object Operations ---
  const handleSelectObject = (id: string | null, multi?: boolean) => {
    engine.selectObject(id, multi);
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

  const handleDeleteSelected = () => {
    engine.deleteSelectedObjects();
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

  const handleDuplicateSelected = () => {
    engine.duplicateSelectedObjects();
    syncState();
  };

  const handleAlignSelected = (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ) => {
    engine.alignObjects(alignment);
    syncState();
  };

  const handleDistributeSelected = (direction: 'horizontal' | 'vertical') => {
    engine.distributeObjects(direction);
    syncState();
  };

  const handleBringForward = () => {
    if (docState?.selectedObjectId) {
      engine.bringForward(docState.selectedObjectId);
      syncState();
    }
  };

  const handleSendBackward = () => {
    if (docState?.selectedObjectId) {
      engine.sendBackward(docState.selectedObjectId);
      syncState();
    }
  };

  const handleBringToFront = () => {
    if (docState?.selectedObjectId) {
      engine.bringToFront(docState.selectedObjectId);
      syncState();
    }
  };

  const handleSendToBack = () => {
    if (docState?.selectedObjectId) {
      engine.sendToBack(docState.selectedObjectId);
      syncState();
    }
  };

  // --- Page Operations ---
  const handleRotatePage = (pageIndex: number, delta: 90 | -90) => {
    engine.rotatePage(pageIndex, delta);
    syncState();
  };

  const handleRotatePages = useCallback(
    (indices: number[], delta: 90 | -90 | 180) => {
      engine.rotatePages(indices, delta);
      syncState();
    },
    [engine, syncState]
  );

  const handleDuplicatePage = (pageIndex: number) => {
    engine.duplicatePage(pageIndex);
    syncState();
  };

  const handleDuplicatePages = useCallback(
    (indices: number[]) => {
      engine.duplicatePages(indices);
      syncState();
    },
    [engine, syncState]
  );

  const handleDeletePage = (pageIndex: number) => {
    if (!docState || docState.pages.length <= 1) return;
    engine.deletePage(pageIndex);
    syncState();
  };

  const handleDeletePages = useCallback(
    (indices: number[]) => {
      engine.deletePages(indices);
      syncState();
    },
    [engine, syncState]
  );

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (!docState) return;
    if (toIndex < 0 || toIndex >= docState.pages.length) return;
    engine.movePage(fromIndex, toIndex);
    syncState();
  };

  // --- Print & Export PDF Workflows ---
  const handlePrint = useCallback(async () => {
    if (!docState || isExporting) return;
    try {
      setIsExporting(true);
      const result = await engine.exportPdf();
      const url = memoryManager.register(result.blob);

      if (!printIframeRef.current) {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        printIframeRef.current = iframe;
      }

      const iframe = printIframeRef.current;
      iframe.src = url;
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Direct print failed, opening in new window:', e);
          window.open(url, '_blank');
        }
      };
      setIsExporting(false);
    } catch (err) {
      console.error('Failed to print document:', err);
      setIsExporting(false);
      setErrorMessage(formatUserFacingPdfError(err, 'preparing the document for printing'));
    }
  }, [docState, isExporting, engine]);

  const handleConfirmExport = useCallback(
    async (customFileName: string) => {
      if (!docState) return;

      try {
        setIsExporting(true);
        setErrorMessage(null);

        const outName = customFileName.trim().toLowerCase().endsWith('.pdf')
          ? customFileName.trim()
          : `${customFileName.trim()}.pdf`;

        const result = await engine.exportPdf({
          outputFileName: outName,
          onProgress: () => {
            syncState();
          },
        });
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
        syncState();
      } catch (err: unknown) {
        console.error('Error exporting PDF:', err);
        setIsExporting(false);
        setErrorMessage(formatUserFacingPdfError(err, 'exporting the edited PDF'));
        syncState();
      }
    },
    [docState, engine, syncState]
  );

  const handleExport = () => {
    setShowExportModal(true);
  };

  // Comprehensive keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement)?.isContentEditable;

      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // Escape key
      if (e.key === 'Escape') {
        if (showExportModal) {
          setShowExportModal(false);
          return;
        }
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          return;
        }
        if (showMetadataModal) {
          setShowMetadataModal(false);
          return;
        }
        if (showSignatureModal) {
          setShowSignatureModal(false);
          return;
        }
        if (showSearch) {
          handleCloseSearch();
          return;
        }
        if (docState?.selectedObjectId || (docState?.selectedObjectIds && docState.selectedObjectIds.length > 0)) {
          engine.selectObject(null);
          syncState();
          return;
        }
      }

      // If user is typing in an input or textarea, do not hijack typing keys
      if (isInput) return;

      // Open Keyboard Shortcuts: ? or Shift + /
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Save / Export: Ctrl/Cmd + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowExportModal(true);
        return;
      }

      // Print: Ctrl/Cmd + P
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
        return;
      }

      // Find: Ctrl/Cmd + F
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      // Undo: Ctrl/Cmd + Z (without Shift)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if (
        (isCmdOrCtrl && e.key.toLowerCase() === 'y') ||
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        if (docState?.selectedObjectIds && docState.selectedObjectIds.length > 0) {
          e.preventDefault();
          engine.copySelected();
        }
        return;
      }

      // Cut: Ctrl/Cmd + X
      if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        if (docState?.selectedObjectIds && docState.selectedObjectIds.length > 0) {
          e.preventDefault();
          engine.cutSelected();
          syncState();
        }
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        engine.paste();
        syncState();
        return;
      }

      // Select All Objects on Active Page: Ctrl/Cmd + A
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        const active = engine.getActivePage();
        if (active && active.objects.length > 0) {
          e.preventDefault();
          engine.selectAllObjects();
          syncState();
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (docState?.selectedObjectIds && docState.selectedObjectIds.length > 0) {
          e.preventDefault();
          engine.deleteSelectedObjects();
          syncState();
        }
        return;
      }

      // Arrow keys (Nudge selected objects)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (docState?.selectedObjectIds && docState.selectedObjectIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;

          engine.nudgeSelectedObjects(dx, dy, false);
          syncState();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showSearch,
    showExportModal,
    showShortcutsModal,
    showMetadataModal,
    showSignatureModal,
    handleCloseSearch,
    handlePrint,
    handleUndo,
    handleRedo,
    docState,
    engine,
    syncState,
  ]);

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
              {errorMessage.toLowerCase().includes('unlock') && (
                <Link
                  href="/pdf-tools/unlock-pdf"
                  className="inline-block mt-2 text-xs font-semibold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                >
                  Go to Unlock PDF →
                </Link>
              )}
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
  const totalObjectCount = docState.pages.reduce((acc, p) => acc + p.objects.length, 0);

  return (
    <div className="w-full flex flex-col bg-slate-100 dark:bg-slate-950 rounded-xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden h-[86dvh] sm:h-[86vh] min-h-[500px] sm:min-h-[640px]">
      {/* 1. Top Toolbar */}
      <EditorToolbar
        fileName={docState.fileName}
        currentPage={docState.activePageIndex + 1}
        totalPages={docState.pages.length}
        zoom={docState.zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        isExporting={isExporting}
        saveState={docState.saveState}
        showThumbnails={showThumbnails}
        showProperties={showProperties}
        showSearch={showSearch}
        showObjectManager={showObjectManager}
        objectCount={totalObjectCount}
        onToggleThumbnails={() => setShowThumbnails((prev) => !prev)}
        onToggleProperties={() => setShowProperties((prev) => !prev)}
        onToggleSearch={() => {
          if (showSearch) {
            handleCloseSearch();
          } else {
            setShowSearch(true);
          }
        }}
        onToggleObjectManager={() => setShowObjectManager((prev) => !prev)}
        onOpenMetadata={() => setShowMetadataModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onPrint={handlePrint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onFirstPage={() => {
          engine.setActivePageIndex(0);
          syncState();
        }}
        onLastPage={() => {
          engine.setActivePageIndex(docState.pages.length - 1);
          syncState();
        }}
        onSetPage={handleSetPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitWidth={handleZoomFitWidth}
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
          <div className="hidden md:block shrink-0 h-full">
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
              onRotatePages={handleRotatePages}
              onDuplicatePages={handleDuplicatePages}
              onDeletePages={handleDeletePages}
            />
          </div>
        )}

        {/* Floating Tool Palette (Centered Left) */}
        <div className="absolute left-4 top-4 z-30 hidden sm:block">
          <ToolPalette
            activeTool={activeTool}
            onSelectTool={handleToolSelect}
          />
        </div>

        {/* Hidden Image File Input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* Signature Placement Modal */}
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setActiveTool('select');
          }}
          onConfirm={handleSignatureConfirm}
        />

        {/* Center: Scrollable Canvas Container */}
        <main
          role="main"
          className="flex-1 overflow-auto flex flex-col relative bg-slate-200/50 dark:bg-slate-950 pb-20 sm:pb-0 touch-pan-x touch-pan-y"
        >
          {/* Floating Search Bar (Top Right) */}
          {showSearch && (
            <div className="absolute top-4 right-4 z-40">
              <EditorSearchBar
                searchResult={searchResult}
                query={searchQuery}
                onQueryChange={handleSearchQueryChange}
                onNextMatch={handleNextMatch}
                onPrevMatch={handlePrevMatch}
                onClose={handleCloseSearch}
              />
            </div>
          )}

          {activePage ? (
            <EditorCanvas
              activePage={activePage}
              sourceBytes={docState.sourceBytes}
              zoom={docState.zoom}
              activeTool={activeTool}
              selectedObjectId={docState.selectedObjectId}
              selectedObjectIds={docState.selectedObjectIds}
              searchMatches={showSearch ? searchResult.matches : undefined}
              activeSearchMatch={
                showSearch && searchResult.activeMatchIndex >= 0
                  ? searchResult.matches[searchResult.activeMatchIndex]
                  : null
              }
              toolDefaults={toolDefaults}
              onSelectObject={handleSelectObject}
              onAddObject={handleAddObject}
              onUpdateObject={handleUpdateObject}
              onDeleteObject={handleDeleteObject}
              onDeleteSelected={handleDeleteSelected}
              onSwitchTool={(t) => setActiveTool(t)}
              onZoomFitWidth={handleZoomFitWidth}
              onZoomChange={(newZoom) => {
                engine.setZoom(newZoom);
                syncState();
              }}
            />
          ) : null}
        </main>

        {/* Right: Object Manager Panel */}
        {showObjectManager && (
          <div className="hidden md:block shrink-0 h-full">
            <EditorObjectManager
              pages={docState.pages}
              activePageIndex={docState.activePageIndex}
              selectedObjectId={docState.selectedObjectId}
              selectedObjectIds={docState.selectedObjectIds}
              onSelectObject={(id, pageIndex) => {
                if (pageIndex !== docState.activePageIndex) {
                  engine.setActivePageIndex(pageIndex);
                }
                engine.selectObject(id);
                syncState();
              }}
              onDeleteObject={(id, pageIndex) => {
                if (pageIndex === docState.activePageIndex) {
                  handleDeleteObject(id);
                } else {
                  const page = docState.pages[pageIndex];
                  const obj = page?.objects.find((o) => o.id === id);
                  if (obj) {
                    engine.deleteObject(pageIndex, id);
                    syncState();
                  }
                }
              }}
              onDuplicateObject={handleDuplicateObject}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onClose={() => setShowObjectManager(false)}
            />
          </div>
        )}

        {/* Right: Contextual Properties Panel */}
        {showProperties && (
          <div className="hidden md:block shrink-0 h-full">
            <EditorPropertiesPanel
              selectedObject={selectedObject}
              selectedObjects={engine.getSelectedObjects()}
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
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onAlignSelected={handleAlignSelected}
              onDistributeSelected={handleDistributeSelected}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onUpdateToolDefaults={(updates) => {
                setToolDefaults((prev) => ({ ...prev, ...updates }));
              }}
            />
          </div>
        )}
      </div>

      {/* Document Information & Intelligence Modal */}
      {showMetadataModal && (
        <EditorMetadataModal
          isOpen={showMetadataModal}
          metadata={docState.metadata}
          formSummary={docState.formSummary}
          fileName={docState.fileName}
          pageCount={docState.pages.length}
          fileSize={docState.sourceBytes.byteLength}
          onClose={() => setShowMetadataModal(false)}
          onSave={(updated) => {
            engine.updateMetadata(updated);
            syncState();
          }}
        />
      )}

      {/* Export & Download Modal */}
      {showExportModal && (
        <EditorExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          defaultFileName={getDeterministicExportFilename(docState.fileName)}
          isExporting={isExporting}
          exportProgress={docState.exportProgress}
          errorMessage={errorMessage}
          exportResult={
            downloadUrl && exportStats
              ? {
                  url: downloadUrl,
                  fileName: exportStats.fileName,
                  fileSize: exportStats.fileSize,
                  totalPages: exportStats.totalPages,
                }
              : null
          }
          onConfirmExport={handleConfirmExport}
          onPrint={handlePrint}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <EditorShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
        />
      )}

      {/* Mobile Bottom Navigation Bar (iLovePDF capability) */}
      <EditorMobileBottomBar
        activeTool={activeTool}
        onSelectTool={handleToolSelect}
        currentPage={docState.activePageIndex + 1}
        totalPages={docState.pages.length}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        activeTab={mobileTab}
        onSelectTab={setMobileTab}
        hasSelectedObject={Boolean(selectedObject)}
        onDeleteSelected={selectedObject ? () => handleDeleteObject(selectedObject.id) : undefined}
        onDuplicateSelected={selectedObject ? () => handleDuplicateObject() : undefined}
        zoom={docState.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onZoomFitWidth={handleZoomFitWidth}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        isExporting={isExporting}
        objectCount={totalObjectCount}
      />

      {/* Mobile Page Thumbnails Slide-Up Drawer */}
      <EditorMobilePageDrawer
        isOpen={mobileTab === 'pages'}
        pages={docState.pages}
        activePageIndex={docState.activePageIndex}
        sourceBytes={docState.sourceBytes}
        onSelectPage={(index) => {
          engine.setActivePageIndex(index);
          syncState();
          setMobileTab(null);
        }}
        onRotatePage={handleRotatePage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onClose={() => setMobileTab(null)}
      />

      {/* Mobile Contextual Properties Sheet */}
      <EditorMobilePropertiesSheet
        isOpen={mobileTab === 'properties'}
        selectedObject={selectedObject}
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
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onUpdateToolDefaults={(updates) => {
          setToolDefaults((prev) => ({ ...prev, ...updates }));
        }}
        onClose={() => setMobileTab(null)}
      />
    </div>
  );
}
