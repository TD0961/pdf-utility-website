'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { PdfThumbnail } from '@/components/pdf/PdfThumbnail';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { splitPdfDocument, SplitMode } from '@/lib/pdf/split';
import { parsePageRanges } from '@/lib/pdf/range-parser';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import {
  Scissors,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  CheckSquare,
  Square,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';

export function SplitWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<SplitMode>('extract');
  const [selectedPages, setSelectedPages] = useState<boolean[]>([]);
  const [rangeInput, setRangeInput] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [splitResultStats, setSplitResultStats] = useState<{
    fileCount: number;
    fileName: string;
    isZip: boolean;
    fileSize: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived range validation state
  const parsedRangeResult =
    mode === 'ranges' && totalPages > 0 ? parsePageRanges(rangeInput, totalPages) : null;
  const rangeError =
    parsedRangeResult && !parsedRangeResult.valid
      ? parsedRangeResult.error || 'Invalid range syntax.'
      : null;

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
      setProgressStage('Analyzing PDF document structure...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      setTotalPages(count);
      setSelectedPages(new Array(count).fill(false));
      setRangeInput(count > 1 ? `1-${Math.min(count, 2)}` : '1');
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  const togglePageSelection = (index: number) => {
    setSelectedPages((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const selectAllPages = () => {
    const all = selectedPages.every(Boolean);
    setSelectedPages(new Array(totalPages).fill(!all));
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setTotalPages(0);
    setSelectedPages([]);
    setSplitResultStats(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const handleSplit = async () => {
    if (isProcessing) return;
    if (!sourceFile || totalPages === 0) return;

    // Mode-specific pre-checks
    if (mode === 'extract') {
      const selectedIndices = selectedPages
        .map((selected, idx) => (selected ? idx : -1))
        .filter((idx) => idx !== -1);

      if (selectedIndices.length === 0) {
        setErrorMessage('Please select at least one page to extract.');
        return;
      }
    }

    if (mode === 'ranges' && rangeError) {
      setErrorMessage(rangeError);
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressPct(10);
      setProgressStage('Starting client-side split operation...');

      const selectedZeroIndices = selectedPages
        .map((selected, idx) => (selected ? idx : -1))
        .filter((idx) => idx !== -1);

      const result = await splitPdfDocument({
        file: sourceFile,
        mode,
        selectedPages: selectedZeroIndices,
        rangeExpression: rangeInput,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setSplitResultStats({
        fileCount: result.fileCount,
        fileName: result.fileName,
        isZip: result.isZip,
        fileSize: result.blob.size,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Split error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'splitting document'));
    }
  };

  const selectedCount = selectedPages.filter(Boolean).length;

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* STATE 1: INITIAL UPLOAD */}
      {!sourceFile && !splitResultStats && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Select a PDF to split"
          subtitle="or drag and drop a PDF here to extract pages, split every page, or define custom ranges"
        />
      )}

      {/* STATE 2: ACTIVE SPLIT WORKSPACE */}
      {sourceFile && totalPages > 0 && !splitResultStats && (
        <div className="space-y-6">
          {/* Top File Summary & Mode Switcher */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-sm">
                  {sourceFile.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-slate-500">
                Change file
              </Button>
            </div>

            {/* Split Mode Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMode('extract')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'extract'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <p className="font-bold text-sm">Mode A: Extract Pages</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select specific pages to save as one new PDF.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('every-page')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'every-page'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <p className="font-bold text-sm">Mode B: Split Every Page</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save all {totalPages} pages as separate files in a ZIP.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('ranges')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'ranges'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <p className="font-bold text-sm">Mode C: Split by Ranges</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify page groups like 1-5, 8, 11-14.
                </p>
              </button>
            </div>
          </div>

          {/* MODE A: VISUAL PAGE SELECTION */}
          {mode === 'extract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click pages to select for extraction ({selectedCount} of {totalPages} selected)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPages}
                  leftIcon={selectedPages.every(Boolean) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                >
                  {selectedPages.every(Boolean) ? 'Deselect all' : 'Select all'}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {selectedPages.map((isSelected, index) => (
                  <div
                    key={index}
                    onClick={() => togglePageSelection(index)}
                    className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-2.5 shadow-xs transition-all cursor-pointer select-none group ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox badge */}
                    <div className="absolute top-2 left-2 z-10 p-1 rounded-md bg-white/90 dark:bg-slate-900/90 shadow-xs">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </div>

                    <div className="mb-2 mt-5">
                      <PdfThumbnail file={sourceFile} pageNumber={index + 1} />
                    </div>

                    <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Page {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE B: SPLIT EVERY PAGE INFO */}
          {mode === 'every-page' && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 text-center space-y-3">
              <Archive className="w-10 h-10 text-indigo-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Split Every Page into Individual Files
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Each of the {totalPages} pages will be created as a standalone PDF document (<code className="font-mono text-indigo-600">page-1.pdf</code> through <code className="font-mono text-indigo-600">page-{totalPages}.pdf</code>) and bundled into a single ZIP file.
              </p>
            </div>
          )}

          {/* MODE C: SPLIT BY RANGES INPUT */}
          {mode === 'ranges' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <label
                  htmlFor="range-input"
                  className="block text-sm font-bold text-slate-900 dark:text-white mb-1"
                >
                  Page Range Expression
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Enter ranges separated by commas (e.g. <code className="font-mono text-indigo-600">1-5, 8, 11-14</code>). Valid page numbers: 1 to {totalPages}.
                </p>
                <input
                  id="range-input"
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder={`e.g. 1-${Math.min(totalPages, 3)}`}
                  className={`w-full max-w-lg px-4 py-2.5 rounded-xl border font-mono text-sm focus:outline-none focus:ring-2 ${
                    rangeError
                      ? 'border-red-500 focus:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-indigo-500 bg-white dark:bg-slate-950'
                  }`}
                />
              </div>

              {/* Range error notice */}
              {rangeError && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rangeError}</span>
                </div>
              )}

              {/* Valid preview groups */}
              {!rangeError && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Files to be generated:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {parsePageRanges(rangeInput, totalPages).groups.map((group, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs border border-indigo-200 dark:border-indigo-800"
                      >
                        {group.label}.pdf ({group.pageIndices.length} {group.pageIndices.length === 1 ? 'page' : 'pages'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
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
                <span>Processing in browser memory</span>
                <span>{progressPct}%</span>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          {!isProcessing && (
            <div className="sticky bottom-4 z-30 w-full max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span>
                  {mode === 'extract' && `${selectedCount} pages selected for extraction`}
                  {mode === 'every-page' && `Burst into ${totalPages} separate PDFs`}
                  {mode === 'ranges' && `Split into ${parsePageRanges(rangeInput, totalPages).groups.length} files`}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={
                    isProcessing ||
                    (mode === 'extract' && selectedCount === 0) ||
                    (mode === 'ranges' && Boolean(rangeError))
                  }
                  onClick={handleSplit}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-semibold"
                >
                  Split PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 3: RESULT & DOWNLOAD */}
      {splitResultStats && downloadUrl && (
        <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {splitResultStats.isZip ? 'PDFs split & packaged' : 'Page extraction complete'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {splitResultStats.isZip
                ? `Created ${splitResultStats.fileCount} PDF documents packaged in a single ZIP file.`
                : 'Your extracted PDF document is ready to download.'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-slate-500">Output files</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {splitResultStats.fileCount} {splitResultStats.fileCount === 1 ? 'file' : 'files'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total size</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formatBytes(splitResultStats.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={downloadUrl}
              download={splitResultStats.fileName}
              className="w-full sm:w-auto"
            >
              <Button
                variant="success"
                size="lg"
                leftIcon={splitResultStats.isZip ? <Archive className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                className="w-full"
              >
                {splitResultStats.isZip ? 'Download ZIP archive' : 'Download extracted PDF'}
              </Button>
            </a>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Split another PDF
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Processed locally in browser RAM with zero server upload.</span>
          </div>
        </div>
      )}

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs sm:text-sm text-red-800 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
