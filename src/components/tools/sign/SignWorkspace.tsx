'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { SignatureModal } from '@/components/tools/editor/SignatureModal';
import { applyVisualSignature, SignaturePlacement } from '@/lib/pdf/sign';
import { getPdfDocument } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  PenTool,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Move,
  FileCheck,
} from 'lucide-react';

export function SignWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 50,
    y: 50,
    width: 160,
    height: 60,
  });

  const [isDragging, setIsDragging] = useState(false);
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

  // Load PDF when file is dropped
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
      console.error('Error loading PDF for signing:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'loading PDF'));
    }
  };

  // Render current page canvas
  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const containerWidth = previewContainerRef.current?.clientWidth || 600;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(1.5, Math.max(0.6, (containerWidth - 32) / unscaledViewport.width));
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
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  }, [currentPage]);

  useEffect(() => {
    if (pdfBytes && numPages > 0) {
      renderPage();
    }
  }, [pdfBytes, currentPage, numPages, renderPage]);

  // Handle signature confirmation from modal
  const handleSignatureConfirm = (dataUrl: string, width: number, height: number) => {
    setSignatureDataUrl(dataUrl);
    setIsModalOpen(false);

    // Initial position on canvas
    const canvas = canvasRef.current;
    const cWidth = canvas ? canvas.width : 500;
    const cHeight = canvas ? canvas.height : 700;

    const targetWidth = Math.min(180, cWidth * 0.4);
    const aspect = width / (height || 1);
    const targetHeight = targetWidth / aspect;

    setSigPosition({
      x: Math.max(20, cWidth - targetWidth - 40),
      y: Math.max(20, cHeight - targetHeight - 50),
      width: targetWidth,
      height: targetHeight,
    });
  };

  // Dragging handlers for placed signature
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - sigPosition.x,
      y: e.clientY - sigPosition.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const newX = Math.max(0, Math.min(canvas.width - sigPosition.width, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(canvas.height - sigPosition.height, e.clientY - dragOffset.y));
    setSigPosition((prev) => ({ ...prev, x: newX, y: newY }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Burn signature into PDF using native PDF points
  const handleApplySignature = async () => {
    if (!pdfBytes || !signatureDataUrl || !viewportRef.current) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const viewport = viewportRef.current;
      // Convert screen canvas coordinates back to PDF points
      // Screen origin is top-left, PDF origin is bottom-left
      const scale = viewport.scale;
      const pdfX = sigPosition.x / scale;
      const pdfWidth = sigPosition.width / scale;
      const pdfHeight = sigPosition.height / scale;
      // Flip Y coordinate: PDF y = viewport.height/scale - (screenY + screenHeight)/scale
      const pdfY = (viewport.height - (sigPosition.y + sigPosition.height)) / scale;

      const placement: SignaturePlacement = {
        pageIndex: currentPage - 1,
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
      };

      const signed = await applyVisualSignature(pdfBytes, {
        signatureDataUrl,
        placement,
      });

      const url = memoryManager.createTrackedUrl(signed.blob);
      setDownloadUrl(url);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error applying signature:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'signing PDF document'));
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
    setSignatureDataUrl(null);
    setErrorMessage(null);
    pdfDocRef.current = null;
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Mandatory legal distinction notice */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">Visual Signature Notice</p>
          <p className="leading-relaxed">
            This tool adds a visual signature to your PDF document. It is not a cryptographic digital certificate / PKI signature. All drawing and placement happens 100% locally on your device.
          </p>
        </div>
      </div>

      {/* Dropzone */}
      {!sourceFile && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to sign"
          subtitle="Draw or upload your signature and place it anywhere on your document"
        />
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Signing Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Signing Workspace with Page Viewer */}
      {sourceFile && !downloadUrl && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <PenTool className="w-4 h-4 mr-1.5" />
                {signatureDataUrl ? 'Change Signature' : 'Create Signature'}
              </Button>

              {signatureDataUrl && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Signature Ready (Drag to position)
                </span>
              )}
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
                disabled={!signatureDataUrl || isProcessing}
                onClick={handleApplySignature}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4 mr-1.5" />
                {isProcessing ? 'Signing...' : 'Sign & Save PDF'}
              </Button>
            </div>
          </div>

          {/* Interactive Document Preview Container */}
          <div
            ref={previewContainerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 overflow-auto flex justify-center shadow-inner min-h-[500px]"
          >
            <div className="relative shadow-md rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} className="block select-none" />

              {/* Placed signature draggable element */}
              {signatureDataUrl && (
                <div
                  onPointerDown={handlePointerDown}
                  style={{
                    position: 'absolute',
                    left: `${sigPosition.x}px`,
                    top: `${sigPosition.y}px`,
                    width: `${sigPosition.width}px`,
                    height: `${sigPosition.height}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  className="border-2 border-primary-500 bg-primary-50/20 rounded shadow-md group touch-none select-none flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatureDataUrl}
                    alt="Placed Signature"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <div className="absolute -top-6 left-0 bg-primary-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <Move className="w-2.5 h-2.5" />
                    <span>Drag me</span>
                  </div>
                </div>
              )}
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
                  {sourceFile.name.replace(/\.pdf$/i, '_signed.pdf')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visual signature burned onto page {currentPage} with verified PDF integrity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1 sm:flex-none justify-center">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Sign Another
              </Button>
              <a
                href={downloadUrl}
                download={sourceFile.name.replace(/\.pdf$/i, '_signed.pdf')}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Signed PDF
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSignatureConfirm}
      />
    </div>
  );
}
