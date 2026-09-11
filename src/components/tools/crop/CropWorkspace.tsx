'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { cropPdfDocument, CropScope, CropBoxPoints } from '@/lib/pdf/crop';
import { getPdfDocument } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Crop,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Move,
} from 'lucide-react';

export function CropWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scope, setScope] = useState<CropScope>('all');

  // Crop box in screen canvas pixels
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 40,
    y: 40,
    width: 320,
    height: 440,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<Awaited<ReturnType<typeof getPdfDocument>> | null>(null);
  const viewportRef = useRef<{ scale: number; height: number; width: number } | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSourceFile(file);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);

      const doc = await getPdfDocument(bytes);
      pdfDocRef.current = doc;
      setNumPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading PDF for cropping:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'loading PDF'));
    }
  };

  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const containerWidth = previewContainerRef.current?.clientWidth || 600;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(1.5, Math.max(0.5, (containerWidth - 48) / unscaledViewport.width));
      const viewport = page.getViewport({ scale });
      viewportRef.current = viewport;

      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      }).promise;

      // Adjust default crop box to 80% of canvas
      setCropBox({
        x: Math.round(viewport.width * 0.1),
        y: Math.round(viewport.height * 0.1),
        width: Math.round(viewport.width * 0.8),
        height: Math.round(viewport.height * 0.8),
      });
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [currentPage]);

  useEffect(() => {
    if (pdfBytes && numPages > 0) {
      renderPage();
    }
  }, [pdfBytes, currentPage, numPages, renderPage]);

  // Pointer drag event handlers
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - cropBox.x,
      y: e.clientY - cropBox.y,
    });
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    if (isDragging) {
      const newX = Math.max(0, Math.min(canvas.width - cropBox.width, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(canvas.height - cropBox.height, e.clientY - dragOffset.y));
      setCropBox((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const newWidth = Math.max(40, Math.min(canvas.width - cropBox.x, currentX - cropBox.x));
      const newHeight = Math.max(40, Math.min(canvas.height - cropBox.y, currentY - cropBox.y));
      setCropBox((prev) => ({ ...prev, width: newWidth, height: newHeight }));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleApplyCrop = async () => {
    if (!pdfBytes || !viewportRef.current) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const viewport = viewportRef.current;
      const scale = viewport.scale;

      // Convert screen px to PDF points
      const pdfPoints: CropBoxPoints = {
        x: cropBox.x / scale,
        width: cropBox.width / scale,
        height: cropBox.height / scale,
        // Invert Y baseline from top-left to bottom-left
        y: (viewport.height - (cropBox.y + cropBox.height)) / scale,
      };

      const cropped = await cropPdfDocument(pdfBytes, {
        cropBox: pdfPoints,
        scope,
        currentPageIndex: currentPage - 1,
      });

      const url = memoryManager.createTrackedUrl(cropped.blob);
      setDownloadUrl(url);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error cropping PDF:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'cropping PDF'));
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setPdfBytes(null);
    setNumPages(0);
    setCurrentPage(1);
    setErrorMessage(null);
    pdfDocRef.current = null;
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Dropzone */}
      {!sourceFile && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to crop"
          subtitle="Visually crop page margins and bounds directly in your browser"
        />
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cropping Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Visual Crop Workspace */}
      {sourceFile && !downloadUrl && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            {/* Scope Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Apply to:</span>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    scope === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Pages
                </button>
                <button
                  type="button"
                  onClick={() => setScope('current')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    scope === 'current'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Page {currentPage} Only
                </button>
              </div>
            </div>

            {/* Page navigation */}
            {numPages > 1 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-mono">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= numPages}
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  className="p-1.5 h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isProcessing}
                onClick={handleApplyCrop}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Crop className="w-4 h-4 mr-1.5" />
                {isProcessing ? 'Cropping...' : 'Crop & Save PDF'}
              </Button>
            </div>
          </div>

          {/* Interactive Document Preview Container with Crop Box */}
          <div
            ref={previewContainerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 overflow-auto flex justify-center shadow-inner min-h-[500px]"
          >
            <div className="relative shadow-md rounded-lg overflow-hidden bg-white select-none">
              <canvas ref={canvasRef} className="block" />

              {/* Dimmed Overlay outside crop box */}
              <div
                style={{
                  position: 'absolute',
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                }}
                className="border-2 border-dashed border-primary-500 rounded-sm touch-none pointer-events-auto cursor-move flex items-center justify-center group"
                onPointerDown={handleDragStart}
              >
                {/* Drag handle helper */}
                <div className="bg-primary-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow opacity-75 group-hover:opacity-100 flex items-center gap-1 select-none pointer-events-none">
                  <Move className="w-3 h-3" />
                  <span>Drag Box</span>
                </div>

                {/* Resize corner handle */}
                <div
                  onPointerDown={handleResizeStart}
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary-600 rounded-full border-2 border-white shadow cursor-se-resize touch-none flex items-center justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success & Download State */}
      {downloadUrl && sourceFile && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {sourceFile.name.replace(/\.pdf$/i, '_cropped.pdf')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  PDF successfully cropped with valid bounding boxes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1 sm:flex-none justify-center">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Crop Another
              </Button>
              <a
                href={downloadUrl}
                download={sourceFile.name.replace(/\.pdf$/i, '_cropped.pdf')}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Cropped PDF
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
