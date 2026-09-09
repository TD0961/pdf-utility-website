'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, Check, Upload, Pen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile } from '@/lib/pdf/editor/objects';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataUrl: string, width: number, height: number) => void;
}

export function SignatureModal({ isOpen, onClose, onConfirm }: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [strokeColor, setStrokeColor] = useState<'#000000' | '#1D4ED8'>('#000000');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [uploadedDims, setUploadedDims] = useState<{ width: number; height: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(initCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, initCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Drawing event handlers with Pointer Events for cross-device support (mouse, touch, pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic or non-capturable pointer ID
    }
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    lastPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPointRef.current = currentPoint;
    setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    try {
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Handle uploaded file
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const file = files[0];
    const validation = await validateImageFile(file);
    if (!validation.valid || !validation.dataUrl) {
      setUploadError(validation.error || 'Invalid signature file');
      return;
    }
    setUploadedDataUrl(validation.dataUrl);
    setUploadedDims({
      width: validation.width || 180,
      height: validation.height || 70,
    });
  };

  const handleConfirm = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const dataUrl = canvas.toDataURL('image/png');
      onConfirm(dataUrl, 180, 70);
      onClose();
    } else {
      if (!uploadedDataUrl) return;
      const targetWidth = 180;
      const aspect = (uploadedDims?.height || 70) / (uploadedDims?.width || 180);
      const targetHeight = Math.round(targetWidth * aspect);
      onConfirm(uploadedDataUrl, targetWidth, targetHeight);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="signature-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Add Signature
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual signature placement tool. Sign directly or upload an image.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={cn(
              'pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors',
              activeTab === 'draw'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Pen className="w-3.5 h-3.5" />
            Draw Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors',
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Image
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {activeTab === 'draw' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Draw with mouse, finger, or stylus
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ink:</span>
                  <button
                    type="button"
                    onClick={() => setStrokeColor('#000000')}
                    className={cn(
                      'w-5 h-5 rounded-full bg-black border border-slate-300',
                      strokeColor === '#000000' && 'ring-2 ring-indigo-500 ring-offset-1'
                    )}
                    title="Black ink"
                  />
                  <button
                    type="button"
                    onClick={() => setStrokeColor('#1D4ED8')}
                    className={cn(
                      'w-5 h-5 rounded-full bg-blue-700 border border-slate-300',
                      strokeColor === '#1D4ED8' && 'ring-2 ring-indigo-500 ring-offset-1'
                    )}
                    title="Blue ink"
                  />
                </div>
              </div>

              {/* Signature Canvas */}
              <div className="relative border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 touch-none">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-full h-44 cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400 dark:text-slate-500 select-none">
                    Sign here
                  </div>
                )}
                {/* Signature baseline guide */}
                <div className="absolute bottom-8 left-8 right-8 border-b border-dashed border-slate-300 dark:border-slate-600 pointer-events-none" />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  disabled={!hasDrawn}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {uploadedDataUrl ? (
                <div className="space-y-2">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded Signature Preview"
                      className="max-h-36 object-contain"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setUploadedDataUrl(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Choose Different Image
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to select PNG or JPG signature image
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Transparent PNG recommended for best visual fidelity
                  </p>
                </button>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={activeTab === 'draw' ? !hasDrawn : !uploadedDataUrl}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Add Signature
          </button>
        </div>
      </div>
    </div>
  );
}
