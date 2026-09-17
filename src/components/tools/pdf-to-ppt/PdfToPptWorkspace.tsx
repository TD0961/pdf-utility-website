'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { convertPdfToPpt, createCancellationToken } from '@/lib/pdf/conversion/converter';
import { ConversionResult, ConversionProgress, CancellationToken } from '@/lib/pdf/conversion/types';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Presentation,
  Download,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
  Layers,
  FileText,
  XCircle,
  Copy,
  Check,
  Settings2,
  Sparkles,
  LayoutTemplate,
  Palette,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export function PdfToPptWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [presentationMode, setPresentationMode] = useState<'smart' | 'exact'>('smart');
  const [theme, setTheme] = useState<'modern' | 'dark'>('modern');
  const [copied, setCopied] = useState(false);

  const cancelTokenRef = useRef<CancellationToken | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const executeConversion = async (
    file: File,
    mode: 'smart' | 'exact',
    selectedTheme: 'modern' | 'dark'
  ) => {
    setErrorMessage(null);
    const cancelToken = createCancellationToken();
    cancelTokenRef.current = cancelToken;

    try {
      setIsProcessing(true);
      setProgress({
        stage: 'initializing',
        stageDescription: 'Preparing in-browser PresentationML engine...',
        currentPage: 0,
        totalPages: 0,
        percentage: 5,
      });

      const convResult = await convertPdfToPpt(file, {
        presentationMode: mode,
        theme: selectedTheme,
        cancellationToken: cancelToken,
        onProgress: (p) => setProgress(p),
      });

      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }

      const url = memoryManager.createTrackedUrl(convResult.blob);
      setDownloadUrl(url);
      setResult(convResult);
      setIsProcessing(false);
    } catch (err: unknown) {
      setIsProcessing(false);
      if (cancelToken.isCancelled) {
        setErrorMessage('Conversion was cancelled.');
      } else {
        console.error('PDF to PowerPoint conversion error:', err);
        setErrorMessage(formatUserFacingPdfError(err, 'converting PDF to PowerPoint'));
      }
    }
  };

  const handleFileSelected = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const file = selectedFiles[0];
    setSourceFile(file);
    await executeConversion(file, presentationMode, theme);
  };

  const handleModeChange = async (newMode: 'smart' | 'exact') => {
    setPresentationMode(newMode);
    if (sourceFile && !isProcessing) {
      await executeConversion(sourceFile, newMode, theme);
    }
  };

  const handleThemeChange = async (newTheme: 'modern' | 'dark') => {
    setTheme(newTheme);
    if (sourceFile && !isProcessing) {
      await executeConversion(sourceFile, presentationMode, newTheme);
    }
  };

  const handleCopyText = async () => {
    if (!result?.extractedText) return;
    try {
      await navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
    setResult(null);
    setIsProcessing(false);
    setProgress(null);
    setErrorMessage(null);
    setCopied(false);
    cancelTokenRef.current = null;
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Notice on Slide Reconstruction */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900 dark:text-indigo-100">
            Intelligent 16:9 Presentation Reconstruction
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Reconstructs professional widescreen presentation slides with dedicated title boxes, structured bullet points, and container cards. Dense content is cleanly chunked to prevent overloaded slides.
          </p>
        </div>
      </div>

      {/* Presentation Options Bar */}
      {!isProcessing && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Settings2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Presentation Design & Layout Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleModeChange('smart')}
              className={`p-3 rounded-xl text-left border transition-all text-xs space-y-1 ${
                presentationMode === 'smart'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Smart Presentation (Recommended)</span>
                </span>
                {presentationMode === 'smart' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Auto-chunks content, creates bold slide titles, structured bullet points, and card containers. Never overloads slides.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('exact')}
              className={`p-3 rounded-xl text-left border transition-all text-xs space-y-1 ${
                presentationMode === 'exact'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                  <span>Exact Slide Match</span>
                </span>
                {presentationMode === 'exact' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Maps text boxes directly according to PDF coordinate boundaries. Ideal for PDFs originally created in Keynote or PowerPoint.
              </p>
            </button>
          </div>

          {/* Theme Selector Strip */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Slide Theme:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('modern')}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  theme === 'modern'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Modern Clean
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Corporate Dark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-semibold">Conversion Notice</p>
            <p className="text-xs sm:text-sm">{errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}

      {/* Stage 1: Upload / Dropzone */}
      {!sourceFile && !isProcessing && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF here to convert to PowerPoint"
          subtitle="Reconstruct editable .pptx slides with vector text shapes locally in your browser"
        />
      )}

      {/* Stage 2: Processing with Progress Bar & Cancel */}
      {isProcessing && (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Converting to PowerPoint (.pptx)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {progress?.stageDescription || 'Reconstructing presentation slides...'}
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress?.percentage || 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{progress?.currentPage ? `Slide ${progress.currentPage} of ${progress.totalPages}` : 'Positioning...'}</span>
              <span>{progress?.percentage || 10}%</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleCancel} leftIcon={<XCircle className="w-4 h-4" />}>
            Cancel Conversion
          </Button>
        </div>
      )}

      {/* Stage 3: Conversion Result Ready */}
      {result && downloadUrl && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    PowerPoint Presentation Ready
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {result.fileName} • {(result.fileSizeBytes / 1024).toFixed(1)} KB • {result.totalPages} slides • {presentationMode === 'smart' ? 'Smart Presentation' : 'Exact Match'} • {theme === 'modern' ? 'Light Theme' : 'Dark Theme'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <a
                  href={downloadUrl}
                  download={result.fileName}
                  className="flex-1 sm:flex-initial"
                >
                  <Button
                    size="lg"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="w-full shadow-md shadow-indigo-500/20"
                  >
                    Download .pptx
                  </Button>
                </a>
                {result.extractedText && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleCopyText}
                    leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  >
                    {copied ? 'Copied' : 'Copy Text'}
                  </Button>
                )}
                <Button variant="outline" size="lg" onClick={handleReset} aria-label="Convert another file">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 text-left">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Total Slides</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.totalPages}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Presentation className="w-3.5 h-3.5" />
                  <span>Text Elements</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalBlocks}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Words</span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {result.stats.totalWords.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Slide Deck Preview */}
          {result.slidesSummary && result.slidesSummary.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Presentation Slide Deck Overview</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {result.slidesSummary.length} structured slides generated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {result.slidesSummary.map((slide, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        Slide {sIdx + 1}
                      </span>
                      {slide.bulletCount > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {slide.bulletCount} points
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {slide.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {slide.previewText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

