'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { PdfThumbnail } from '@/components/pdf/PdfThumbnail';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { extractPdfPages } from '@/lib/pdf/extract';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { parsePageRanges } from '@/lib/pdf/range-parser';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
  FileSpreadsheet,
} from 'lucide-react';

interface ExtractPageState {
  id: string;
  pageNumber: number; // 1-based
  selected: boolean;
}

export function ExtractWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pages, setPages] = useState<ExtractPageState[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [rangeInput, setRangeInput] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);
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
      setProgressStage('Inspecting PDF page structure...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      setTotalPages(count);

      const initialPages: ExtractPageState[] = [];
      for (let i = 1; i <= count; i++) {
        initialPages.push({
          id: `extract-page-${i}-${Date.now()}`,
          pageNumber: i,
          selected: false,
        });
      }

      setPages(initialPages);
      setRangeInput('');
      setRangeError(null);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  // Helper to convert selected pages array to range string
  const updateRangeInputFromSelection = (selectedPageNums: number[]) => {
    if (selectedPageNums.length === 0) {
      setRangeInput('');
      return;
    }
    setRangeInput(selectedPageNums.join(', '));
  };

  const togglePageSelection = (index: number) => {
    setPages((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p));
      const selectedNums = next.filter((p) => p.selected).map((p) => p.pageNumber);
      updateRangeInputFromSelection(selectedNums);
      return next;
    });
    setRangeError(null);
  };

  const handleSelectAll = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
    setRangeInput(`1-${totalPages}`);
    setRangeError(null);
  };

  const handleClearSelection = () => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
    setRangeInput('');
    setRangeError(null);
  };

  // Synchronize manual text input with visual grid
  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);

    if (!val.trim()) {
      setRangeError(null);
      setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
      return;
    }

    const parseResult = parsePageRanges(val, totalPages);
    if (!parseResult.valid) {
      setRangeError(parseResult.error || 'Invalid range format.');
      return;
    }

    setRangeError(null);
    const selectedIndices = new Set(parseResult.allPageIndices);
    setPages((prev) =>
      prev.map((p, i) => ({
        ...p,
        selected: selectedIndices.has(i),
      }))
    );
  };

  const handleResetAll = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setPages([]);
    setTotalPages(0);
    setRangeInput('');
    setRangeError(null);
    setResultStats(null);
    setErrorMessage(null);
  };

  const selectedPages = pages.filter((p) => p.selected);
  const selectedCount = selectedPages.length;

  const handleExtract = async () => {
    if (!sourceFile || selectedCount === 0 || isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressStage('Extracting selected pages...');
      setProgressPct(15);

      // If user typed custom range, preserve the parsed indices
      let target0BasedIndices: number[] = [];
      if (rangeInput.trim()) {
        const parseResult = parsePageRanges(rangeInput, totalPages);
        if (parseResult.valid) {
          target0BasedIndices = parseResult.allPageIndices;
        } else {
          target0BasedIndices = selectedPages.map((p) => p.pageNumber - 1);
        }
      } else {
        target0BasedIndices = selectedPages.map((p) => p.pageNumber - 1);
      }

      const result = await extractPdfPages({
        file: sourceFile,
        pageIndices: target0BasedIndices,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const trackedUrl = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(trackedUrl);
      setResultStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Extraction failed:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'extracting pages'));
    }
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Error message banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dropzone view */}
      {!sourceFile && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
          />
        </div>
      )}

      {/* Workspace view */}
      {sourceFile && !resultStats && (
        <div className="space-y-6">
          {/* Controls Bar: Range input and selection shortcuts */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-xl space-y-1.5">
                <label
                  htmlFor="extract-range-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Page Range or Numbers
                </label>
                <input
                  id="extract-range-input"
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  placeholder={`e.g. 1-3, 5, 8-10 (1 to ${totalPages})`}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {rangeError && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {rangeError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  <CheckSquare className="w-4 h-4 mr-1 text-indigo-600" />
                  Select All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  <Square className="w-4 h-4 mr-1 text-slate-400" />
                  Clear
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAll}
                  disabled={isProcessing}
                  className="text-xs text-slate-500"
                >
                  Change File
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Selected: {selectedCount} of {totalPages} pages
              </span>
              <span>Click thumbnails below or type page numbers above.</span>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => togglePageSelection(index)}
                className={`relative group bg-white dark:bg-slate-900 rounded-2xl p-3 border cursor-pointer transition-all ${
                  page.selected
                    ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header bar: Checkbox & badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={page.selected}
                      onChange={() => {}}
                      aria-label={`Select page ${page.pageNumber}`}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Page {page.pageNumber}
                    </span>
                  </div>

                  {page.selected && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                      Selected
                    </span>
                  )}
                </div>

                {/* Page Preview Thumbnail */}
                <div className="w-full aspect-[3/4] overflow-hidden flex items-center justify-center relative bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <PdfThumbnail file={sourceFile} pageNumber={page.pageNumber} />
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar if processing */}
          {isProcessing && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  {progressStage || 'Extracting pages...'}
                </span>
                <span className="font-mono text-slate-500 font-bold">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Bar */}
          {!isProcessing && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedCount > 0
                      ? `Ready to Extract ${selectedCount} ${selectedCount === 1 ? 'Page' : 'Pages'}`
                      : 'Select Pages to Extract'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedCount > 0
                      ? 'Creates a fresh standalone PDF preserving original vector quality.'
                      : 'Choose at least one page from the grid or range input.'}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleExtract}
                disabled={selectedCount === 0 || isProcessing}
                className="w-full sm:w-auto shadow-md"
              >
                <Download className="w-4 h-4 mr-2" />
                Extract Selected Pages
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {resultStats && downloadUrl && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {resultStats.totalPages} {resultStats.totalPages === 1 ? 'Page' : 'Pages'} Extracted!
            </h2>
            <p className="text-sm text-slate-500">
              Your extracted document has been cleanly isolated with original graphics, text, and vector content.
            </p>
          </div>

          {/* Stats Box */}
          <div className="inline-flex items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>{resultStats.totalPages} Pages</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div>{formatBytes(resultStats.fileSize)}</div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="font-mono text-slate-400">{resultStats.fileName}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={downloadUrl}
              download={resultStats.fileName}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Extracted PDF
            </a>

            <Button variant="outline" size="lg" onClick={handleResetAll}>
              Extract Other Pages
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Processed 100% locally. Original document remains untouched.</span>
          </div>
        </div>
      )}
    </div>
  );
}
