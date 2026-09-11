'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import {
  watermarkPdf,
  WatermarkPosition,
  WatermarkColorPreset,
} from '@/lib/pdf/watermark';
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
  Stamp,
  Sliders,
  Grid,
} from 'lucide-react';

const QUICK_PRESETS = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'COPY', 'TOP SECRET'];

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': 'Top Left',
  'top-center': 'Top Center',
  'top-right': 'Top Right',
  'middle-left': 'Middle Left',
  center: 'Center',
  'middle-right': 'Middle Right',
  'bottom-left': 'Bottom Left',
  'bottom-center': 'Bottom Center',
  'bottom-right': 'Bottom Right',
  tiled: 'Tiled Pattern',
};

const COLOR_OPTIONS: Array<{ id: WatermarkColorPreset; label: string; hex: string; bgClass: string }> = [
  { id: 'gray', label: 'Gray', hex: '#808080', bgClass: 'bg-gray-500' },
  { id: 'red', label: 'Red', hex: '#DC2626', bgClass: 'bg-red-600' },
  { id: 'blue', label: 'Blue', hex: '#2563EB', bgClass: 'bg-blue-600' },
  { id: 'black', label: 'Black', hex: '#000000', bgClass: 'bg-black' },
  { id: 'green', label: 'Green', hex: '#16A34A', bgClass: 'bg-green-600' },
  { id: 'orange', label: 'Orange', hex: '#EA580C', bgClass: 'bg-orange-600' },
];

export function WatermarkWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [rotation, setRotation] = useState<number>(45);
  const [opacity, setOpacity] = useState<number>(30); // percentage 10-100
  const [fontSize, setFontSize] = useState<number>(48);
  const [color, setColor] = useState<WatermarkColorPreset>('gray');
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
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
    setWatermarkText('CONFIDENTIAL');
    setPosition('center');
    setRotation(45);
    setOpacity(30);
    setFontSize(48);
    setColor('gray');
    setPageRangeMode('all');
    setCustomRange('');
    setRangeError(null);
    setResultStats(null);
    setErrorMessage(null);
  };

  const handleApplyWatermark = async () => {
    if (!sourceFile || isProcessing) return;

    if (!watermarkText.trim()) {
      setErrorMessage('Please enter watermark text.');
      return;
    }

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
      setProgressStage('Applying vector watermark overlay...');
      setProgressPct(15);

      const result = await watermarkPdf({
        file: sourceFile,
        text: watermarkText,
        position,
        rotation,
        opacity: opacity / 100,
        fontSize,
        color,
        pages: pageRangeMode === 'custom' ? customRange : 'all',
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
      console.error('Watermark error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'applying watermark'));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Upload View */}
      {!sourceFile && (
        <div className="space-y-6">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            acceptedTypes={['.pdf', 'application/pdf']}
            title="Select PDF to Watermark"
            subtitle="Stamp custom text watermarks onto any PDF document. Processed locally in your browser."
          />
          <LocalProcessingNotice />
        </div>
      )}

      {/* 2. Watermark Configuration & Preview View */}
      {sourceFile && !downloadUrl && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <Stamp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {formatBytes(sourceFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAll}
                disabled={isProcessing}
              >
                Change File
              </Button>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Settings Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Text Input & Quick Presets */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Watermark Text
                </h4>

                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT"
                  maxLength={60}
                  className="w-full px-4 py-2.5 text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs font-semibold text-slate-400 mr-1">Presets:</span>
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWatermarkText(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        watermarkText === preset
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Placement & Position Grid */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Position ({POSITION_LABELS[position]})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPosition(position === 'tiled' ? 'center' : 'tiled')}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      position === 'tiled'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Tiled / Repeating Grid
                  </button>
                </div>

                {position !== 'tiled' && (
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      'top-left',
                      'top-center',
                      'top-right',
                      'middle-left',
                      'center',
                      'middle-right',
                      'bottom-left',
                      'bottom-center',
                      'bottom-right',
                    ].map((posKey) => {
                      const isSelected = position === posKey;
                      return (
                        <button
                          key={posKey}
                          type="button"
                          onClick={() => setPosition(posKey as WatermarkPosition)}
                          className={`h-12 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                          title={POSITION_LABELS[posKey as WatermarkPosition]}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Style Controls: Rotation, Opacity, Font Size, Color */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Styling & Appearance
                </h4>

                {/* Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Rotation Angle</span>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    step={15}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex gap-1.5 justify-between">
                    {[0, 30, 45, 60, 90].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotation(deg)}
                        className={`text-xs px-2 py-0.5 rounded border ${
                          rotation === deg
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-600 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Opacity</span>
                    <span>{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Font Size</span>
                    <span>{fontSize} pt</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={96}
                    step={2}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Color Chooser */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Watermark Color
                  </span>
                  <div className="flex items-center gap-3">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setColor(c.id)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                          color === c.id
                            ? 'border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900 scale-110'
                            : 'border-white dark:border-slate-800'
                        } ${c.bgClass}`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Range Mode */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Pages
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPageRangeMode('all')}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      pageRangeMode === 'all'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    All Pages ({totalPages})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageRangeMode('custom')}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      pageRangeMode === 'custom'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {pageRangeMode === 'custom' && (
                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      value={customRange}
                      onChange={handleCustomRangeChange}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className={`w-full px-4 py-2 text-sm rounded-xl border font-mono ${
                        rangeError
                          ? 'border-red-400 bg-red-50 text-red-900'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    />
                    {rangeError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {rangeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Live Representation
                  </h4>
                  <span className="text-xs text-slate-400">Visual estimate</span>
                </div>

                {/* Simulated Document Page */}
                <div className="relative w-full aspect-[1/1.35] bg-white border border-slate-300 dark:border-slate-700 rounded-xl shadow-inner overflow-hidden flex items-center justify-center p-6">
                  {/* Subtle placeholder document text lines */}
                  <div className="w-full space-y-2 opacity-15 pointer-events-none select-none">
                    <div className="h-4 bg-slate-400 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-300 rounded w-full" />
                    <div className="h-2.5 bg-slate-300 rounded w-5/6" />
                    <div className="h-2.5 bg-slate-300 rounded w-full" />
                    <div className="h-2.5 bg-slate-300 rounded w-4/5" />
                    <div className="h-2.5 bg-slate-300 rounded w-full" />
                    <div className="h-2.5 bg-slate-300 rounded w-3/4" />
                    <div className="h-4 bg-slate-400 rounded w-1/2 mt-4" />
                    <div className="h-2.5 bg-slate-300 rounded w-full" />
                    <div className="h-2.5 bg-slate-300 rounded w-5/6" />
                  </div>

                  {/* Watermark Overlay in Preview */}
                  {position === 'tiled' ? (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 gap-4 p-4 items-center justify-center pointer-events-none">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-center">
                          <span
                            style={{
                              transform: `rotate(${rotation}deg)`,
                              opacity: opacity / 100,
                              fontSize: `${Math.max(10, Math.round(fontSize / 3.5))}px`,
                              color: COLOR_OPTIONS.find((c) => c.id === color)?.hex || '#808080',
                            }}
                            className="font-bold tracking-wider select-none text-center truncate uppercase"
                          >
                            {watermarkText || 'CONFIDENTIAL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`absolute inset-0 p-6 flex pointer-events-none select-none ${
                        position.includes('top')
                          ? 'items-start'
                          : position.includes('bottom')
                          ? 'items-end'
                          : 'items-center'
                      } ${
                        position.includes('left')
                          ? 'justify-start'
                          : position.includes('right')
                          ? 'justify-end'
                          : 'justify-center'
                      }`}
                    >
                      <span
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          opacity: opacity / 100,
                          fontSize: `${Math.max(12, Math.round(fontSize / 2.2))}px`,
                          color: COLOR_OPTIONS.find((c) => c.id === color)?.hex || '#808080',
                        }}
                        className="font-bold tracking-wider uppercase text-center max-w-[90%] truncate"
                      >
                        {watermarkText || 'CONFIDENTIAL'}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Preview is an approximate visual simulation. Final placement is calculated natively from PDF coordinate geometry.
                </p>
              </div>

              {/* Action Button */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-indigo-600/20"
                  onClick={handleApplyWatermark}
                  disabled={isProcessing || !watermarkText.trim() || Boolean(rangeError)}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Watermark...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Stamp className="w-5 h-5" />
                      Apply Watermark ({pageRangeMode === 'all' ? totalPages : 'Custom'} Pages)
                    </span>
                  )}
                </Button>

                {errorMessage && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-md space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {progressStage}
                </span>
                <span className="text-slate-500">{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Download & Success View */}
      {downloadUrl && resultStats && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center space-y-6 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Watermark Applied Successfully!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your document has been stamped and validated client-side.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="truncate max-w-[220px] sm:max-w-xs">
                <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                  {resultStats.fileName}
                </p>
                <p className="text-xs text-slate-500">
                  {resultStats.totalPages} {resultStats.totalPages === 1 ? 'page' : 'pages'} • {formatBytes(resultStats.fileSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={downloadUrl}
              download={resultStats.fileName}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Download Watermarked PDF
            </a>
            <Button variant="outline" onClick={handleResetAll}>
              Watermark Another PDF
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Processed 100% locally in browser. No file was uploaded.</span>
          </div>
        </div>
      )}
    </div>
  );
}
