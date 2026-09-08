'use client';

import React, { useState, useEffect } from 'react';
import { PdfDropzone } from './PdfDropzone';
import { PdfFileList } from './PdfFileList';
import { PdfToolbar } from './PdfToolbar';
import { PdfProgress } from './PdfProgress';
import { PdfResult } from './PdfResult';
import { LocalProcessingNotice } from './LocalProcessingNotice';
import { ProcessingStatus, ProcessResult } from '@/types/pdf';
import { ToolMetadata } from '@/types/tool';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PdfWorkspaceProps {
  tool: ToolMetadata;
  onProcess: (files: File[], onProgress: (pct: number, stage: string) => void) => Promise<ProcessResult>;
  customControls?: React.ReactNode;
}

export function PdfWorkspace({ tool, onProcess, customControls }: PdfWorkspaceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      memoryManager.clearAll();
    };
  }, []);

  const handleFilesSelected = (newFiles: File[]) => {
    if (tool.acceptsMultiple) {
      setFiles((prev) => [...prev, ...newFiles]);
    } else {
      setFiles([newFiles[0]]);
    }
    setStatus('loaded');
    setErrorMessage(null);
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, idx) => idx !== index);
    setFiles(updated);
    if (updated.length === 0) {
      setStatus('idle');
    }
  };

  const handleReorder = (startIndex: number, endIndex: number) => {
    const reordered = [...files];
    const [moved] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, moved);
    setFiles(reordered);
  };

  const handleReset = () => {
    memoryManager.clearAll();
    setFiles([]);
    setResult(null);
    setStatus('idle');
    setProgress(0);
    setProgressStage('');
    setErrorMessage(null);
  };

  const handleExecute = async () => {
    if (files.length === 0) return;

    try {
      setStatus('processing');
      setProgress(0);
      setProgressStage('Reading document in browser memory...');
      setErrorMessage(null);

      const res = await onProcess(files, (pct, stage) => {
        setProgress(pct);
        setProgressStage(stage);
      });

      setResult(res);
      setStatus('success');
    } catch (err: unknown) {
      console.error('PDF processing error:', err);
      setStatus('error');
      const errMessage = err instanceof Error ? err.message : String(err);
      // Friendly message per Section 29
      const message =
        errMessage.includes('password') || errMessage.includes('encrypt')
          ? 'This PDF appears to be password-protected. Please unlock it first.'
          : "We couldn't process this PDF. It may be corrupted, password-protected, or use a format this browser tool doesn't support.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="w-full space-y-6">
      <LocalProcessingNotice />

      {/* State: IDLE */}
      {status === 'idle' && (
        <PdfDropzone
          onFilesSelected={handleFilesSelected}
          acceptsMultiple={tool.acceptsMultiple}
          acceptedTypes={tool.acceptedFileTypes}
          title={tool.acceptsMultiple ? 'Select PDF files' : 'Select PDF file'}
        />
      )}

      {/* State: LOADED (Files picked, ready to configure / process) */}
      {status === 'loaded' && (
        <div className="space-y-6">
          <PdfFileList
            files={files}
            onRemove={handleRemoveFile}
            onReorder={handleReorder}
            onAddMore={tool.acceptsMultiple ? () => document.querySelector<HTMLInputElement>('input[type="file"]')?.click() : undefined}
            acceptsMultiple={tool.acceptsMultiple}
          />

          <PdfToolbar
            actionLabel={tool.name}
            fileCount={files.length}
            isProcessing={false}
            onExecute={handleExecute}
            onReset={handleReset}
          >
            {customControls}
          </PdfToolbar>
        </div>
      )}

      {/* State: PROCESSING */}
      {status === 'processing' && (
        <PdfProgress progress={progress} stage={progressStage} />
      )}

      {/* State: SUCCESS */}
      {status === 'success' && result && (
        <PdfResult result={result} onReset={handleReset} />
      )}

      {/* State: ERROR */}
      {status === 'error' && (
        <div className="w-full max-w-xl mx-auto bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-red-950 dark:text-red-200">
            Processing could not be completed
          </h4>
          <p className="text-sm text-red-800 dark:text-red-300">
            {errorMessage}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Try another file
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
