'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { protectPdf } from '@/lib/pdf/protect';
import { getPdfPageCount } from '@/lib/pdf/pdf-renderer';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Printer,
  Copy,
  FileEdit,
} from 'lucide-react';

export function ProtectWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  // Security & Password States
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Granular PDF Permissions
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowModifying, setAllowModifying] = useState(false);
  const [allowAnnotating, setAllowAnnotating] = useState(false);

  // Processing & Results
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [resultStats, setResultStats] = useState<{
    totalPages: number;
    fileSize: number;
    fileName: string;
    algorithm: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security lifecycle cleanup: Revoke object URLs
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
      setProgressStage('Inspecting PDF page count & security header...');
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
      setErrorMessage(formatUserFacingPdfError(err, 'inspecting this PDF'));
    }
  };

  const handleResetAll = () => {
    if (downloadUrl) {
      memoryManager.revokeUrl(downloadUrl);
      setDownloadUrl(null);
    }
    setSourceFile(null);
    setTotalPages(0);
    setUserPassword('');
    setConfirmPassword('');
    setShowUserPassword(false);
    setShowConfirmPassword(false);
    setAllowPrinting(true);
    setAllowCopying(true);
    setAllowModifying(false);
    setAllowAnnotating(false);
    setResultStats(null);
    setErrorMessage(null);
  };

  // Validation
  const passwordsMatch = userPassword === confirmPassword;
  const isPasswordValid = userPassword.length >= 1;
  const canProtect = isPasswordValid && passwordsMatch && !isProcessing;

  const handleProtectPdf = async () => {
    if (!sourceFile || !canProtect) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressStage('Initializing Web Crypto AES-256 cipher...');
      setProgressPct(15);

      const result = await protectPdf({
        file: sourceFile,
        userPassword,
        allowPrinting,
        allowCopying,
        allowModifying,
        allowAnnotating,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      // Clear plain passwords from component state immediately after encryption
      setUserPassword('');
      setConfirmPassword('');

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setResultStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
        algorithm: result.algorithm,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Protect error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'protecting this PDF'));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Upload View */}
      {!sourceFile && (
        <div className="space-y-6">
          <PdfDropzone
            onFilesSelected={handleFileSelected}
            acceptsMultiple={false}
            acceptedTypes={['.pdf', 'application/pdf']}
            title="Select PDF to Password-Protect"
            subtitle="Encrypt your document with AES-256 password protection. Processed locally in your browser with zero server uploads."
          />
          <LocalProcessingNotice />
        </div>
      )}

      {/* 2. Protect Configuration View */}
      {sourceFile && !downloadUrl && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <Lock className="w-5 h-5" />
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={isProcessing}
            >
              Change File
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Password Credentials Box */}
            <div className="md:col-span-7 space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-5">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Set Document Password
                </h4>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                    >
                      {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* Security Advisory */}
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    Keep your password safe
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Because PDFSimplify processes documents locally without accounts or servers, forgotten passwords cannot be recovered.
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions & Security Summary Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Document Permissions
                </h4>

                <div className="space-y-3 pt-1">
                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-slate-400" />
                      Allow Printing
                    </span>
                    <input
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <Copy className="w-4 h-4 text-slate-400" />
                      Allow Copying Text & Images
                    </span>
                    <input
                      type="checkbox"
                      checked={allowCopying}
                      onChange={(e) => setAllowCopying(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-2">
                      <FileEdit className="w-4 h-4 text-slate-400" />
                      Allow Content Modifications
                    </span>
                    <input
                      type="checkbox"
                      checked={allowModifying}
                      onChange={(e) => setAllowModifying(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p>• Standard: AES-256 Encryption (Revision 6)</p>
                  <p>• Zero server involvement: local Web Crypto</p>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-indigo-600/20"
                  onClick={handleProtectPdf}
                  disabled={!canProtect}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Encrypting PDF...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Protect PDF
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
              PDF Successfully Protected!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your document is encrypted with standard AES-256 password protection.
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
                  {resultStats.totalPages} {resultStats.totalPages === 1 ? 'page' : 'pages'} • {formatBytes(resultStats.fileSize)} • {resultStats.algorithm}
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
              Download Protected PDF
            </a>
            <Button variant="outline" onClick={handleResetAll}>
              Protect Another PDF
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted 100% locally in browser. Password was never transmitted.</span>
          </div>
        </div>
      )}
    </div>
  );
}
