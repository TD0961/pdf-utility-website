'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { extractTextFromPdfDocument, PdfToTextResult } from '@/lib/pdf/pdf-to-text';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertCircle,
  Loader2,
  Info,
  Type,
  Hash,
  Layers,
} from 'lucide-react';

export function PdfToTextWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [textResult, setTextResult] = useState<PdfToTextResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    setCopied(false);

    try {
      setIsProcessing(true);
      setProgressStage('Extracting text content streams...');
      setProgressPct(10);

      const result = await extractTextFromPdfDocument({
        file,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setTextResult(result);
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('PDF to Text error:', err);
      setIsProcessing(false);
      setSourceFile(null);
      setErrorMessage(formatUserFacingPdfError(err, 'extracting text from PDF'));
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setTextResult(null);
    setIsProcessing(false);
    setProgressPct(0);
    setProgressStage('');
    setErrorMessage(null);
    setCopied(false);
  };

  const handleCopyText = async () => {
    if (!textResult?.fullText) return;
    try {
      await navigator.clipboard.writeText(textResult.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = textResult.fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* STATE 1: INITIAL UPLOAD */}
      {!sourceFile && !textResult && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          acceptedTypes={['.pdf', 'application/pdf']}
          title="Select a PDF to extract text"
          subtitle="or drag and drop your PDF here to parse selectable text into a plain text document"
        />
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-800 dark:text-rose-300 animate-in fade-in-50 duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold">Extraction notice: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* STATE 2: PROCESSING PROGRESS */}
      {isProcessing && (
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md text-center space-y-4">
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
            <span>Parsing text glyphs in local RAM</span>
            <span>{progressPct}%</span>
          </div>
        </div>
      )}

      {/* STATE 3: EXTRACTED TEXT VIEWER & RESULT */}
      {textResult && !isProcessing && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* File & Metrics Summary Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {sourceFile?.name || 'Document'}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {textResult.totalPages} {textResult.totalPages === 1 ? 'page' : 'pages'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Type className="w-3.5 h-3.5" />
                    {textResult.totalWords.toLocaleString()} words
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {textResult.totalCharacters.toLocaleString()} characters
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                className="font-semibold"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </Button>

              {downloadUrl && (
                <a href={downloadUrl} download={textResult.fileName}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="font-semibold shadow-xs"
                  >
                    Download .txt
                  </Button>
                </a>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="text-slate-500"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Scanned Document Warning if applicable */}
          {textResult.isScanned && textResult.scannedWarning && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-sm text-amber-800 dark:text-amber-300">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <span className="font-semibold">Notice: Scanned / Image-Only Document</span>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300/90 leading-relaxed">
                  {textResult.scannedWarning}
                </p>
              </div>
            </div>
          )}

          {/* Textarea Live Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Plain Text Preview (UTF-8)</span>
              <span>{textResult.fullText.length} bytes</span>
            </div>
            <textarea
              readOnly
              value={textResult.fullText}
              rows={18}
              className="w-full p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent border-0 resize-y focus:outline-hidden"
              placeholder="Extracted text will appear here..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
