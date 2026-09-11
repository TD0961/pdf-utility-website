'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { inspectInteractiveForm, fillPdfForm, InteractiveFormField } from '@/lib/pdf/fill-form';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileText,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

export function FillWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [fields, setFields] = useState<InteractiveFormField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = useState(false);
  const [hasNoFields, setHasNoFields] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        memoryManager.revokeUrl(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSourceFile(file);
    setErrorMessage(null);
    setHasNoFields(false);
    setIsInspecting(true);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);

      const inspection = await inspectInteractiveForm(bytes);
      setIsInspecting(false);

      if (!inspection.hasAcroForm || inspection.totalFields === 0) {
        setHasNoFields(true);
      } else {
        setFields(inspection.fields);
        const initialVals: Record<string, string | boolean> = {};
        for (const f of inspection.fields) {
          initialVals[f.name] = f.value;
        }
        setFormValues(initialVals);
      }
    } catch (err) {
      setIsInspecting(false);
      console.error('Error inspecting form:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'reading PDF form fields'));
    }
  };

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveForm = async () => {
    if (!pdfBytes) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const filled = await fillPdfForm(pdfBytes, {
        values: formValues,
        flatten,
      });

      const url = memoryManager.createTrackedUrl(filled.blob);
      setDownloadUrl(url);
      setIsProcessing(false);
    } catch (err) {
      setIsProcessing(false);
      console.error('Error saving filled form:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'saving filled PDF'));
    }
  };

  const handleReset = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setPdfBytes(null);
    setFields([]);
    setFormValues({});
    setHasNoFields(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Dropzone */}
      {!sourceFile && (
        <PdfDropzone
          onFilesSelected={handleFileSelected}
          acceptsMultiple={false}
          title="Drop your PDF form here to fill"
          subtitle="Detects interactive text fields, checkboxes, and dropdowns directly on your device"
        />
      )}

      {/* Inspecting state */}
      {isInspecting && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-600 dark:text-primary-400 animate-spin">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Inspecting PDF AcroForm Structures...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reading field catalogs, text boxes, and checkbox states locally.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Form Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Flat Document / No Fields Detected Notice */}
      {hasNoFields && sourceFile && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 shadow-sm max-w-xl mx-auto">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl inline-flex">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Interactive Form Fields Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This document is a flat or scanned PDF without native AcroForm digital fields. To fill it, you can open it in the PDF Editor and place text annotations freely over the lines.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Choose Another File
            </Button>
            <Link href="/pdf-tools/pdf-editor">
              <Button variant="primary" size="sm" className="bg-primary-600 hover:bg-primary-700">
                <Edit3 className="w-4 h-4 mr-1.5" />
                Open in PDF Editor
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Form Fields Editor */}
      {fields.length > 0 && sourceFile && !downloadUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Interactive Form ({fields.length} {fields.length === 1 ? 'Field' : 'Fields'} Detected)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Edit form fields directly. All updates are applied in your browser memory.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flatten}
                  onChange={(e) => setFlatten(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-700"
                />
                <span>Flatten output (make non-editable)</span>
              </label>

              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>

          {/* Form Fields List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div
                key={field.name}
                className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                    {field.name}
                  </label>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {field.type}
                  </span>
                </div>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={String(formValues[field.name] ?? '')}
                    disabled={field.readOnly}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(formValues[field.name])}
                      disabled={field.readOnly}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {Boolean(formValues[field.name]) ? 'Checked' : 'Unchecked'}
                    </span>
                  </label>
                )}

                {field.type === 'dropdown' && field.options && (
                  <select
                    value={String(formValues[field.name] ?? '')}
                    disabled={field.readOnly}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select option --</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && field.options && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {field.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value={opt}
                          checked={formValues[field.name] === opt}
                          disabled={field.readOnly}
                          onChange={() => handleFieldChange(field.name, opt)}
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              disabled={isProcessing}
              onClick={handleSaveForm}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isProcessing ? 'Saving Form...' : 'Save & Download Filled PDF'}
            </Button>
          </div>
        </div>
      )}

      {/* Success & Download State */}
      {downloadUrl && sourceFile && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {sourceFile.name.replace(/\.pdf$/i, '_filled.pdf')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Form successfully filled and verified locally.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1 sm:flex-none justify-center">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Fill Another
              </Button>
              <a
                href={downloadUrl}
                download={sourceFile.name.replace(/\.pdf$/i, '_filled.pdf')}
                className="flex-1 sm:flex-none"
              >
                <Button variant="primary" size="sm" className="w-full justify-center bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Filled PDF
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
