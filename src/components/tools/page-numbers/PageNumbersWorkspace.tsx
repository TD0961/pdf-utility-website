'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import {
  addPageNumbersToPdf,
  PageNumberPosition,
  PageNumberFormat,
  PageNumberMargin,
  PageNumberFontSize,
  PageNumberColor,
} from '@/lib/pdf/page-numbers';
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
  Hash,
  Sliders,
} from 'lucide-react';

export function PageNumbersWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('numeric');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [margin, setMargin] = useState<PageNumberMargin>('medium');
  const [fontSize, setFontSize] = useState<PageNumberFontSize>('medium');
  const [color, setColor] = useState<PageNumberColor>('black');

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
      setProgressStage('Inspecting PDF page count...');
      setProgressPct(20);

      const count = await getPdfPageCount(file);
      if (count === 0) {
        throw new Error('This PDF file contains zero pages.');
      }

      setTotalPages(count);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Error loading PDF:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'reading this PDF'));
    }
  };

  const handleCustomRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomRange(val);

    if (!val.trim()) {
      setRangeError(null);
      return;
    }

    const parseResult = parsePageRanges(val, totalPages);
    if (!parseResult.valid) {
      setRangeError(parseResult.error || 'Invalid page range.');
    } else {
      setRangeError(null);
    }
  };

  const handleResetAll = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setTotalPages(0);
    setPosition('bottom-center');
    setFormat('numeric');
    setStartNumber(1);
    setPageRangeMode('all');
    setCustomRange('');
    setRangeError(null);
    setResultStats(null);
    setErrorMessage(null);
  };

  const handleApplyPageNumbers = async () => {
    if (!sourceFile || isProcessing) return;

    if (pageRangeMode === 'custom' && customRange.trim()) {
      const validation = parsePageRanges(customRange, totalPages);
      if (!validation.valid) {
        setRangeError(validation.error || 'Invalid range syntax.');
        return;
      }
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressStage('Adding page number layers...');
      setProgressPct(15);

      const result = await addPageNumbersToPdf({
        file: sourceFile,
        position,
        format,
        startNumber,
        pages: pageRangeMode === 'all' ? 'all' : customRange,
        margin,
        fontSize,
        color,
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
      console.error('Page numbering failed:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'adding page numbers'));
    }
  };

  // Preview format sample
  const sampleNumberText = () => {
    switch (format) {
      case 'prefixed':
        return `Page ${startNumber}`;
      case 'total':
        return `${startNumber} / ${totalPages || 10}`;
      case 'prefixed-total':
        return `Page ${startNumber} of ${totalPages || 10}`;
      case 'numeric':
      default:
        return `${startNumber}`;
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

      {/* Configuration workspace view */}
      {sourceFile && !resultStats && (
        <div className="space-y-6">
          {/* Main Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Page Number Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {sourceFile.name} ({totalPages} pages)
                  </p>
                </div>
              </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Position Grid & Preview */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Position on Page
                </label>

                {/* 3x3 Position Grid Selector */}
                <div className="relative aspect-[3/4] max-w-[260px] mx-auto p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col justify-between">
                  {/* Top row */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPosition('top-left')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'top-left'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Top Left"
                    >
                      TL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('top-center')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'top-center'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Top Center"
                    >
                      TC
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('top-right')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'top-right'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Top Right"
                    >
                      TR
                    </button>
                  </div>

                  {/* Middle row */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPosition('middle-left')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'middle-left'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Middle Left"
                    >
                      ML
                    </button>
                    <div className="text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Sample</div>
                      <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {sampleNumberText()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPosition('middle-right')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'middle-right'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Middle Right"
                    >
                      MR
                    </button>
                  </div>

                  {/* Bottom row */}
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setPosition('bottom-left')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'bottom-left'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Bottom Left"
                    >
                      BL
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('bottom-center')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'bottom-center'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Bottom Center (Standard)"
                    >
                      BC
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosition('bottom-right')}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                        position === 'bottom-right'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title="Bottom Right"
                    >
                      BR
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-slate-400">
                  Active position:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {position.replace('-', ' ').toUpperCase()}
                  </span>
                </p>
              </div>

              {/* Right Column: Configuration Options */}
              <div className="space-y-5">
                {/* Format selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Number Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'numeric', label: '1, 2, 3...', sub: 'Numbers only' },
                      { id: 'prefixed', label: 'Page 1, Page 2...', sub: 'Standard prefix' },
                      { id: 'total', label: `1 / ${totalPages || 'N'}`, sub: 'Fraction' },
                      { id: 'prefixed-total', label: `Page 1 of ${totalPages || 'N'}`, sub: 'Formal' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id as PageNumberFormat)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          format === f.id
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs font-mono">{f.label}</div>
                        <div className="text-[10px] text-slate-400">{f.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Starting Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Starting Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={999999}
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  {/* Font Size Preset */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value as PageNumberFontSize)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="small">Small (9 pt)</option>
                      <option value="medium">Medium (12 pt)</option>
                      <option value="large">Large (15 pt)</option>
                    </select>
                  </div>
                </div>

                {/* Margin Offset & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Edge Margin
                    </label>
                    <select
                      value={margin}
                      onChange={(e) => setMargin(e.target.value as PageNumberMargin)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="small">Small (15 pt)</option>
                      <option value="medium">Medium (30 pt)</option>
                      <option value="large">Large (45 pt)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Text Color
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value as PageNumberColor)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="black">Black (Default)</option>
                      <option value="gray">Gray (Subtle)</option>
                      <option value="white">White (For dark PDFs)</option>
                    </select>
                  </div>
                </div>

                {/* Page Range Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Target Pages
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="pageRangeMode"
                        checked={pageRangeMode === 'all'}
                        onChange={() => setPageRangeMode('all')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>All Pages ({totalPages})</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="pageRangeMode"
                        checked={pageRangeMode === 'custom'}
                        onChange={() => setPageRangeMode('custom')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Specific Range</span>
                    </label>
                  </div>

                  {pageRangeMode === 'custom' && (
                    <div className="space-y-1 pt-1">
                      <input
                        type="text"
                        value={customRange}
                        onChange={handleCustomRangeChange}
                        placeholder={`e.g. 2-${totalPages} (omit cover)`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                      {rangeError && (
                        <p className="text-xs text-red-500 font-medium">{rangeError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar if processing */}
          {isProcessing && (
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  {progressStage || 'Stamping page numbers...'}
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
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Ready to Stamp Page Numbers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Placement: {position.replace('-', ' ')} • Format: {sampleNumberText()}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleApplyPageNumbers}
                disabled={isProcessing || (pageRangeMode === 'custom' && Boolean(rangeError))}
                className="w-full sm:w-auto shadow-md"
              >
                <Hash className="w-4 h-4 mr-2" />
                Add Page Numbers
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
              Page Numbers Added!
            </h2>
            <p className="text-sm text-slate-500">
              Clean, vector-rendered page numbers have been applied with original content intact.
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
              Download Numbered PDF
            </a>

            <Button variant="outline" size="lg" onClick={handleResetAll}>
              Number Another PDF
            </Button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Processed 100% locally. Zero documents uploaded to any server.</span>
          </div>
        </div>
      )}
    </div>
  );
}
