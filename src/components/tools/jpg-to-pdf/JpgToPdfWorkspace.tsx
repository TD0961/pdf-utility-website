'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import {
  convertJpgToPdf,
  PageSizeOption,
  OrientationOption,
  MarginOption,
  ImageFitOption,
} from '@/lib/pdf/jpg-to-pdf';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileImage,
  ArrowRight,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Settings2,
} from 'lucide-react';

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
}

export function JpgToPdfWorkspace() {
  const [images, setImages] = useState<SelectedImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [orientation, setOrientation] = useState<OrientationOption>('auto');
  const [margin, setMargin] = useState<MarginOption>('none');
  const [fit, setFit] = useState<ImageFitOption>('fit');

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{
    totalPages: number;
    fileSize: number;
    fileName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleImagesAdded = (newFiles: File[]) => {
    setErrorMessage(null);
    const addedItems: SelectedImageItem[] = newFiles.map((file) => {
      const url = memoryManager.createTrackedUrl(file);
      return {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        file,
        previewUrl: url,
      };
    });

    setImages((prev) => [...prev, ...addedItems]);

    // Inspect image dimensions asynchronously
    for (const item of addedItems) {
      const img = new Image();
      img.onload = () => {
        setImages((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, width: img.naturalWidth, height: img.naturalHeight } : it
          )
        );
      };
      img.src = item.previewUrl;
    }
  };

  const handleRemove = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        memoryManager.revokeUrl(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    // Revoke all preview URLs
    for (const img of images) {
      memoryManager.revokeUrl(img.previewUrl);
    }
    setImages([]);
    setResultStats(null);
    setIsProcessing(false);
    setProgressPct(0);
    setProgressStage('');
    setErrorMessage(null);
  };

  const handleConvert = async () => {
    if (isProcessing) return;
    if (images.length === 0) {
      setErrorMessage('Please select at least one image to convert.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPct(5);
      setProgressStage('Initializing image converter...');

      const result = await convertJpgToPdf({
        images: images.map((item) => item.file),
        pageSize,
        orientation,
        margin,
        fit,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setResultStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('JPG to PDF error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'converting images to PDF'));
    }
  };

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* Hidden file input for "Add more images" */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImagesAdded(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        aria-hidden="true"
      />

      {/* STATE 1: INITIAL UPLOAD */}
      {images.length === 0 && !resultStats && (
        <PdfDropzone
          onFilesSelected={handleImagesAdded}
          acceptsMultiple={true}
          acceptedTypes={['.jpg', '.jpeg', '.png', '.webp', 'image/*']}
          title="Select JPG or PNG images"
          subtitle="or drag and drop images here to combine them into a single PDF document"
        />
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-800 dark:text-rose-300 animate-in fade-in-50 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold">Conversion issue: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE IMAGE WORKSPACE */}
      {images.length > 0 && !resultStats && (
        <div className="space-y-6">
          {/* Options Panel */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">PDF Page Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Page Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Size
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="a4">A4 (Standard)</option>
                  <option value="letter">US Letter</option>
                  <option value="legal">US Legal</option>
                  <option value="auto">Fit to Image Size</option>
                </select>
              </div>

              {/* Orientation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">Auto (Match Image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              {/* Margin */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Margins
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as MarginOption)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">No Margin</option>
                  <option value="small">Small (20pt)</option>
                  <option value="medium">Medium (40pt)</option>
                </select>
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Image Fitting
                </label>
                <select
                  value={fit}
                  onChange={(e) => setFit(e.target.value as ImageFitOption)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="fit">Fit Page (Preserve Ratio)</option>
                  <option value="fill">Fill Page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Index Badge */}
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-xs">
                  {index + 1}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Thumbnail Preview */}
                <div className="w-full h-36 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Info & Ordering controls */}
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {formatBytes(item.file.size)}
                    {item.width && item.height ? ` • ${item.width}x${item.height}` : ''}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === 0 || isProcessing}
                      onClick={() => handleMoveUp(index)}
                      className="p-1 h-6 text-xs"
                      aria-label="Move Earlier"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <span className="text-[10px] text-slate-400">Page {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={index === images.length - 1 || isProcessing}
                      onClick={() => handleMoveDown(index)}
                      className="p-1 h-6 text-xs"
                      aria-label="Move Later"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add More Tile */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[220px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex flex-col items-center justify-center p-4 text-slate-500 hover:text-indigo-600 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">Add more images</span>
            </button>
          </div>

          {/* Processing Progress Feedback */}
          {isProcessing && (
            <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md text-center space-y-4">
              <div className="flex items-center justify-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {progressStage}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Generating PDF in local RAM</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          {!isProcessing && (
            <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileImage className="w-4 h-4 text-indigo-600" />
                <span>
                  <strong>{images.length}</strong> {images.length === 1 ? 'image' : 'images'} ready to convert
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={images.length === 0 || isProcessing}
                  onClick={handleConvert}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-semibold"
                >
                  Convert to PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: RESULT & DOWNLOAD */}
      {resultStats && downloadUrl && (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              PDF Created Successfully!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your images have been compiled into a high-quality PDF document locally in your browser.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800 text-left text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Total Pages</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {resultStats.totalPages} {resultStats.totalPages === 1 ? 'page' : 'pages'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Output File Size</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatBytes(resultStats.fileSize)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Convert more images
            </Button>
            <a
              href={downloadUrl}
              download={resultStats.fileName}
              className="w-full sm:w-auto inline-block"
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full sm:w-auto font-semibold shadow-md hover:shadow-lg"
              >
                Download PDF
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
