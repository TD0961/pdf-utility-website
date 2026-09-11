'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { inspectPdfMetadata, removePdfMetadata, PdfMetadataInfo, MetadataRemovalResult } from '@/lib/pdf/metadata';
import { createCancellationToken } from '@/lib/pdf/conversion/converter';
import { CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileCode2,
  Download,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Trash2,
  XCircle,
} from 'lucide-react';

export function RemoveMetadataWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<PdfMetadataInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<MetadataRemovalResult | null>(null);
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
      const meta = await inspectPdfMetadata(buffer);
      setMetadata(meta);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      console.error('Metadata inspection error:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'inspecting PDF metadata'));
    }
  };

  const handleRemove = async () => {
    if (!sourceFile) return;
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const buffer = await sourceFile.arrayBuffer();

      const res = await removePdfMetadata(buffer, {
        cancellationToken: cancelToken,
      });

      const blob = new Blob([res.cleanedBytes as BlobPart], { type: 'application/pdf' });
      const url = memoryManager.createTrackedUrl(blob);
      setDownloadUrl(url);
      setResult(res);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Metadata removal was cancelled.');
      } else {
        console.error('Metadata removal error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'removing PDF metadata'));
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
    setMetadata(null);
    setResult(null);
    setIsProcessing(false);
    setErrorMessage(null);
    cancelTokenRef.current = null;
  };

  const hasAnyMetadata = metadata && Object.values(metadata).some((v) => Boolean(v));

  return (
    <div className="space-y-8">
      {/* 1. File Selection / Dropzone */}
      {!sourceFile && (
        <div className="space-y-6">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            title="Drop your PDF here to inspect & remove hidden metadata"
            subtitle="Strips author names, creation software, timestamps, and title tags locally."
          />
        </div>
      )}

      {/* 2. Metadata Inspection Card */}
      {sourceFile && metadata && !result && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {(sourceFile.size / 1024).toFixed(1)} KB · Inspecting embedded tags
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Change File
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Detected Document Metadata
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Title:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.title || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Author / Owner:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.author || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Subject:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.subject || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Keywords:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.keywords || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Creator Software:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.creator || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-0.5 font-medium">Producer Engine:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {metadata.producer || <em className="text-slate-400">Not set</em>}
                </span>
              </div>
            </div>

            {!hasAnyMetadata && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs">
                This document contains zero standard metadata tags. It is already clean!
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRemove}
              disabled={isProcessing}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Removing Metadata...' : 'Strip All Document Metadata'}
            </Button>
            {isProcessing && (
              <Button variant="outline" onClick={handleCancel}>
                <XCircle className="w-4 h-4 mr-1.5" />
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
                Metadata Stripped Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Cleared {result.clearedFieldsCount} metadata property stream(s) across {result.pageCount} page(s)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={downloadUrl}
              download={sourceFile ? `cleaned_${sourceFile.name}` : 'cleaned.pdf'}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Cleaned PDF
            </a>
            <Button variant="outline" onClick={handleReset} className="sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clean Another PDF
            </Button>
          </div>
        </div>
      )}

      {/* Honest Limitation Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Privacy & Metadata Information:
        </p>
        <p>
          Removes standard PDF document metadata fields including Title, Author, Subject, Keywords, Creator,
          Producer, and structural XML metadata catalogs. This does not claim to remove low-level forensic
          hardware traces or pixel-level watermarks embedded in images.
        </p>
      </div>

      <LocalProcessingNotice />
    </div>
  );
}
