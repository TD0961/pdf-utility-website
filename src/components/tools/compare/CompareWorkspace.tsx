'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { comparePdfDocuments, DocumentComparisonResult } from '@/lib/pdf/compare';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  FileDiff,
  Upload,
  RotateCcw,
  AlertCircle,
  FileText,
  Info,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

export function CompareWorkspace() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<DocumentComparisonResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileA(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleFileBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileB(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleRunComparison = async () => {
    if (!fileA || !fileB) return;

    try {
      setIsComparing(true);
      setErrorMessage(null);

      const compResult = await comparePdfDocuments(fileA, fileB);
      setResult(compResult);
      setIsComparing(false);
    } catch (err) {
      setIsComparing(false);
      console.error('Comparison error:', err);
      setErrorMessage(formatUserFacingPdfError(err, 'comparing documents'));
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setResult(null);
    setIsComparing(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <LocalProcessingNotice />

      {/* Honest comparison notice */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">Client-Side Document Comparison</p>
          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            Compares page counts, extracted word vocabularies, and textual differences between two PDF files locally in your browser. Both documents remain strictly on your device.
          </p>
        </div>
      </div>

      {/* File Upload Grid */}
      {!result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document A */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Document (A)</span>
              <div className="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl inline-flex">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {fileA ? fileA.name : 'Select first PDF'}
              </h4>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileAChange}
                  className="hidden"
                />
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-1.5" />
                  {fileA ? 'Change Document A' : 'Choose Document A'}
                </Button>
              </label>
            </div>

            {/* Document B */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Modified Document (B)</span>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl inline-flex">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {fileB ? fileB.name : 'Select second PDF'}
              </h4>
              <label className="inline-flex">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileBChange}
                  className="hidden"
                />
                <Button variant="secondary" size="sm" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-1.5" />
                  {fileB ? 'Change Document B' : 'Choose Document B'}
                </Button>
              </label>
            </div>
          </div>

          {/* Compare Action Button */}
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              disabled={!fileA || !fileB || isComparing}
              onClick={handleRunComparison}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-8"
            >
              <FileDiff className="w-5 h-5 mr-2" />
              {isComparing ? 'Comparing Documents...' : 'Compare Two Documents'}
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && !isComparing && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Comparison Failed</p>
              <p>{errorMessage}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Comparison Results */}
      {result && !isComparing && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Comparison Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {result.docAName} vs. {result.docBName} (completed in {(result.durationMs / 1000).toFixed(1)}s)
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Compare Other Documents
            </Button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Similarity</span>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {result.overallSimilarityScore}%
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Pages (A vs B)</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {result.pageCountA} / {result.pageCountB}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center justify-center gap-1">
                <PlusCircle className="w-3 h-3 text-emerald-500" />
                <span>Added Words</span>
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                +{result.totalAddedWordsCount}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1 flex items-center justify-center gap-1">
                <MinusCircle className="w-3 h-3 text-rose-500" />
                <span>Removed Words</span>
              </span>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                -{result.totalRemovedWordsCount}
              </p>
            </div>
          </div>

          {/* Page-by-Page Comparison Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Page Breakdown
            </h4>

            <div className="space-y-2">
              {result.pageDiffs.map((diff) => (
                <div
                  key={diff.pageNumber}
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Page {diff.pageNumber}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Doc A: {diff.wordsA} words • Doc B: {diff.wordsB} words
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {diff.addedWords.length > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-medium">
                        +{diff.addedWords.length} new
                      </span>
                    )}
                    {diff.removedWords.length > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded font-medium">
                        -{diff.removedWords.length} removed
                      </span>
                    )}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {diff.similarityScore}% match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
