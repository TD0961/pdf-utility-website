'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { inspectFormForFlattening, flattenPdf, FlattenInspectionResult, FlattenResult } from '@/lib/pdf/flatten';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Layers,
  Download,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Lock,
  XCircle,
} from 'lucide-react';

export function FlattenWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<FlattenInspectionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<FlattenResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    setErrorMessage(null);

    try {
      setIsProcessing(true);
      const buffer = await file.arrayBuffer();
      const inspectRes = await inspectFormForFlattening(buffer);
      setInspection(inspectRes);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      console.error('Flatten inspection error:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'inspecting PDF form fields'));
    }
  };

  const handleFlatten = async () => {
    if (!sourceFile) return;
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const buffer = await sourceFile.arrayBuffer();

      const flattenRes = await flattenPdf(buffer, {
        cancellationToken: cancelToken,
      });

      const blob = new Blob([flattenRes.flattenedBytes as BlobPart], { type: 'application/pdf' });
      const url = memoryManager.createTrackedUrl(blob);
      setDownloadUrl(url);
      setResult(flattenRes);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Flattening was cancelled.');
      } else {
        console.error('Flatten PDF error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'flattening PDF form fields'));
      }
    }
  };

  const handleCancel = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setInspection(null);
    setResult(null);
    setIsProcessing(false);
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
            title="Drop your PDF here to flatten interactive form fields"
            subtitle="Locks all form inputs and annotations permanently into page appearance."
          />
        </div>
      )}

      {/* 2. Inspection Preview & Configuration */}
      {sourceFile && inspection && !result && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {inspection.pageCount} page(s) · {(sourceFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change File
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-slate-600 dark:text-slate-400">Interactive Form Fields:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {inspection.totalFields} detected
              </span>
            </div>

            {inspection.totalFields > 0 && (
              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  Sample fields detected:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {inspection.fields.slice(0, 8).map((f, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-mono"
                    >
                      {f.name} ({f.type})
                    </span>
                  ))}
                  {inspection.fields.length > 8 && (
                    <span className="px-2 py-0.5 text-[11px] text-slate-400">
                      +{inspection.fields.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {inspection.totalFields === 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs">
                No interactive AcroForm fields were detected in this document. Flattening will re-save
                the document ensuring all static objects are unified.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleFlatten}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              {isProcessing ? 'Flattening Document...' : 'Flatten Form Fields'}
            </Button>
            {isProcessing && (
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-1.5 text-rose-500" />
                Cancel
              </Button>
            )}
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

      {/* 4. Result & Download */}
      {result && downloadUrl && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                PDF Flattened Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Locked {result.fieldCountBefore} form field(s) permanently across {result.pageCount} page(s) in{' '}
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Form fields before:</span>
              <span>{result.fieldCountBefore}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Interactive fields remaining:</span>
              <span className="font-bold text-emerald-600">0 (All flattened)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={sourceFile ? `flattened_${sourceFile.name}` : 'flattened.pdf'}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Flattened PDF
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Flatten Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Flattening Architecture & Notes:
        </p>
        <p>
          Flattening converts fillable AcroForm fields and text annotations directly into permanent visual
          page content. Once flattened, form fields can no longer be edited or modified by PDF viewers.
          Dynamic XML-based XFA forms are not supported.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
