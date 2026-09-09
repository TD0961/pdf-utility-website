'use client';

import React, { useState } from 'react';
import {
  PdfMetadata,
  PdfFormSummary,
} from '@/lib/pdf/editor/types';
import {
  Info,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';

interface EditorMetadataModalProps {
  isOpen: boolean;
  metadata: PdfMetadata;
  formSummary: PdfFormSummary;
  fileName: string;
  pageCount: number;
  fileSize: number;
  onClose: () => void;
  onSave: (updated: Partial<PdfMetadata>) => void;
}

export function EditorMetadataModal({
  isOpen,
  metadata,
  formSummary,
  fileName,
  pageCount,
  fileSize,
  onClose,
  onSave,
}: EditorMetadataModalProps) {
  if (!isOpen) return null;

  return (
    <EditorMetadataDialog
      metadata={metadata}
      formSummary={formSummary}
      fileName={fileName}
      pageCount={pageCount}
      fileSize={fileSize}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditorMetadataDialog({
  metadata,
  formSummary,
  fileName,
  pageCount,
  fileSize,
  onClose,
  onSave,
}: Omit<EditorMetadataModalProps, 'isOpen'>) {
  const [title, setTitle] = useState(metadata.title || '');
  const [author, setAuthor] = useState(metadata.author || '');
  const [subject, setSubject] = useState(metadata.subject || '');
  const [keywords, setKeywords] = useState(metadata.keywords ? metadata.keywords.join(', ') : '');
  const [activeTab, setActiveTab] = useState<'info' | 'structure'>('info');

  const handleSave = () => {
    const kwArray = keywords
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    onSave({
      title: title.trim() || undefined,
      author: author.trim() || undefined,
      subject: subject.trim() || undefined,
      keywords: kwArray.length > 0 ? kwArray : undefined,
    });
    onClose();
  };

  const formatDate = (d?: Date) => {
    if (!d) return 'Unknown';
    try {
      return new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500" />
            <h2
              id="document-info-title"
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              Document Intelligence & Information
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Metadata & Properties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'structure'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Document Structure & Forms
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'info' ? (
            <>
              {/* Editable Fields */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Editable Metadata
                </h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document Title"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Document Subject"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="invoice, financial, report"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Technical Read-Only Properties */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Technical Specifications
                </h3>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">File Name</span>
                    <span className="font-medium truncate block" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">File Size</span>
                    <span className="font-medium">{formatBytes(fileSize)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">Pages</span>
                    <span className="font-medium">{pageCount}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">Application Creator</span>
                    <span className="font-medium truncate block">
                      {metadata.creator || 'None'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">PDF Producer</span>
                    <span className="font-medium truncate block">
                      {metadata.producer || 'None'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-[10px] block text-slate-400">Created Date</span>
                    <span className="font-medium">{formatDate(metadata.creationDate)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Form Awareness Summary */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Interactive PDF Forms (AcroForm)
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      formSummary.hasAcroForm
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {formSummary.hasAcroForm ? 'Detected' : 'None Detected'}
                  </span>
                </div>

                {formSummary.hasAcroForm ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Text Fields</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formSummary.counts.text}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Checkboxes</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formSummary.counts.checkbox}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Radio Buttons</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formSummary.counts.radio}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Dropdowns</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formSummary.counts.dropdown}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Digital Signatures</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formSummary.counts.signature}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">Total Fields</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {formSummary.totalFields}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This document does not declare an interactive AcroForm catalog. Standard page text and static vector paths will be processed normally.
                  </p>
                )}

                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Note: Advanced AcroForm/XFA editing is not currently supported. Existing form fields and values are preserved on export.
                </div>
              </div>

              {/* Redaction Security Clarification */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Redaction Transparency</span>
                </div>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  Drawing black rectangles or visual overlays does not erase underlying PDF text operators or vector streams. Secure true redaction requires deep content-stream rewriting (documented in our technical specification).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'info' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Metadata
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
