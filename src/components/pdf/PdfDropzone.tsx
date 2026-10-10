'use client';

import React, { useRef, useState } from 'react';
import { FileUp, AlertCircle, HardDrive, ShieldCheck } from 'lucide-react';
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
  title = 'Select PDF document',
  subtitle = 'or drop your document here to load into local browser memory',
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
        setValidationError(basicValidation.error || 'Invalid file format.');
        return;
      }

      // If PDF type, validate header bytes
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const magicValidation = await validatePdfMagicBytes(file);
        if (!magicValidation.valid) {
          setValidationError(magicValidation.error || 'Invalid PDF header structure.');
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
          'paper-sheet relative rounded-3xl p-8 sm:p-14 text-center transition-all duration-300 cursor-pointer select-none flex flex-col items-center justify-center min-h-[300px] overflow-hidden bg-white dark:bg-stone-900',
          isDragOver
            ? 'border-stone-900 dark:border-stone-100 bg-stone-50 dark:bg-stone-850 shadow-2xl scale-[1.008]'
            : 'border-stone-300/80 dark:border-stone-800 hover:border-stone-500 dark:hover:border-stone-600',
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

        {/* Tactile Paper Folio Icon Target */}
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-800 dark:text-stone-200 flex items-center justify-center mb-5 shadow-xs">
          <FileUp className="w-7 h-7" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 mb-1.5 font-sans">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mb-6 leading-relaxed">
          {subtitle}
        </p>

        <Button
          type="button"
          size="md"
          className="px-6 py-3 rounded-xl shadow-md font-semibold text-sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {acceptsMultiple ? 'Choose PDF Files' : 'Choose PDF Document'}
        </Button>

        {/* Archival Security Readout */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-stone-400 dark:text-stone-500 mt-6 pt-5 border-t border-stone-100 dark:border-stone-800/80">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            Allocated in RAM
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Zero Server Uploads
          </span>
        </div>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3.5 rounded-xl border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
