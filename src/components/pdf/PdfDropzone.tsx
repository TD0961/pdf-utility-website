'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { validateFileBasics, validatePdfMagicBytes } from '@/lib/validation/file-validator';

export interface PdfDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptsMultiple?: boolean;
  acceptedTypes?: string[];
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  className?: string;
}

export function PdfDropzone({
  onFilesSelected,
  acceptsMultiple = false,
  acceptedTypes = ['.pdf', 'application/pdf'],
  title = 'Select PDF files',
  subtitle = 'or drag and drop them here to process locally in your browser',
  disabled = false,
  className,
}: PdfDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);

    const filesArray = Array.from(fileList);
    const selectedFiles = acceptsMultiple ? filesArray : [filesArray[0]];

    // Run client validation
    for (const file of selectedFiles) {
      const basicValidation = validateFileBasics(file);
      if (!basicValidation.valid) {
        setValidationError(basicValidation.error || 'Invalid file.');
        return;
      }

      // If PDF type, validate header bytes
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const magicValidation = await validatePdfMagicBytes(file);
        if (!magicValidation.valid) {
          setValidationError(magicValidation.error || 'Invalid PDF file.');
          return;
        }
      }
    }

    onFilesSelected(selectedFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload files area"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          'relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer select-none flex flex-col items-center justify-center min-h-[260px]',
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 hover:bg-slate-50/70 dark:hover:bg-slate-900',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={acceptsMultiple}
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          aria-hidden="true"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {subtitle}
        </p>

        <Button
          type="button"
          size="md"
          variant="primary"
          leftIcon={<FileUp className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {acceptsMultiple ? 'Choose PDF Files' : 'Choose PDF File'}
        </Button>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 block">
          No file size limit imposed by server • Processed locally in your browser
        </span>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
