'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { extractImagesFromPdf, ImageExtractionResult } from '@/lib/pdf/extraction/image-extractor';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken, ConversionProgress } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Image as ImageIcon,
  Download,
  RotateCcw,
  AlertCircle,
  Archive,
  XCircle,
  FileCheck,
} from 'lucide-react';

export function ExtractImagesWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ImageExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (zipDownloadUrl) {
        memoryManager.revokeUrl(zipDownloadUrl);
      }
      if (result) {
        result.cleanup();
      }
    };
  }, [zipDownloadUrl, result]);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    setErrorMessage(null);

    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setProgress({
        stage: 'initializing',
        stageDescription: 'Scanning PDF for embedded images...',
        currentPage: 0,
        totalPages: 0,
        percentage: 10,
      });

      const extractionResult = await extractImagesFromPdf(file, {
        deduplicate: true,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      const zipUrl = memoryManager.createTrackedUrl(extractionResult.zipBlob);
      setZipDownloadUrl(zipUrl);
      setResult(extractionResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Image extraction was cancelled.');
      } else {
        console.error('Image extraction error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'extracting images from PDF'));
      }
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
  };

  const handleReset = () => {
    if (zipDownloadUrl) {
      memoryManager.revokeUrl(zipDownloadUrl);
      setZipDownloadUrl(null);
    }
    if (result) {
      result.cleanup();
    }
    setSourceFile(null);
    setResult(null);
    setIsProcessing(false);
    setProgress(null);
    setErrorMessage(null);
    cancelTokenRef.current = null;
  };

  return (
    <div className="space-y-8">
      {/* 1. File Selection / Dropzone */}
      {!sourceFile && (
        <div className="space-y-6">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to extract all embedded images"
            subtitle="Extracts JPEG and PNG graphics in original quality with zero server uploads."
          />
        </div>
      )}

      {/* 2. Progress State */}
      {isProcessing && progress && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
            <ImageIcon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Extracting Embedded Images...
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {progress.stageDescription}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>{progress.percentage}% completed</span>
            </div>
          </div>

          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Cancel Extraction
            </Button>
          </div>
        </div>
      )}

      {/* 3. Error Notice */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <Button size="sm" variant="outline" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* 4. Results & Image Gallery */}
      {result && zipDownloadUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Extraction Complete!
                </h3>
                <p className="text-xs text-slate-500">
                  Found {result.totalImages} embedded image(s) ({(result.totalBytes / (1024 * 1024)).toFixed(2)} MB total)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {result.totalImages > 0 && (
                <a
                  href={zipDownloadUrl}
                  download="extracted_images.zip"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-xs"
                >
                  <Archive className="w-4 h-4 mr-1.5" />
                  Download All as ZIP
                </a>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>

          {/* Image Cards Grid */}
          {result.totalImages > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
              {result.images.map((img) => (
                <div
                  key={img.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 group"
                >
                  <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden flex items-center justify-center relative">
                    {img.blobUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.blobUrl}
                        alt={img.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold uppercase">
                      {img.format}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {img.name}
                    </p>
                    <p>
                      {img.width} × {img.height} px · {(img.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  {img.blobUrl && (
                    <a
                      href={img.blobUrl}
                      download={img.name}
                      className="w-full py-1.5 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Save
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No embedded raster images found
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This document may contain pure vector paths or text rather than embedded JPEG/PNG image objects.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Image Extraction Information:
        </p>
        <p>
          Extracts embedded raster image objects directly in their native format without recompression.
          Vector illustrations, icons, and page backgrounds drawn as mathematical curves are not raster images.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
