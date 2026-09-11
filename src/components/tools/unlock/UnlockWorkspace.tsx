'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PdfDropzone } from '@/components/pdf/PdfDropzone';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { formatBytes } from '@/lib/utils';
import { unlockPdf } from '@/lib/pdf/unlock';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { memoryManager } from '@/lib/pdf/memory-manager';
import { formatUserFacingPdfError } from '@/lib/validation/file-validator';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ShieldCheck,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export function UnlockWorkspace() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [isDocEncrypted, setIsDocEncrypted] = useState<boolean | null>(null);
  const [encAlgorithm, setEncAlgorithm] = useState<string | null>(null);

  // Security & Password States
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Processing & Results
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

  // Clean up object URLs
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
      setProgressStage('Checking encryption dictionary...');
      setProgressPct(20);

      const buffer = await file.arrayBuffer();
      const encInfo = await isEncrypted(new Uint8Array(buffer));

      setIsDocEncrypted(encInfo.encrypted);
      setEncAlgorithm(encInfo.algorithm || 'Standard');
      setIsProcessing(false);

      if (!encInfo.encrypted) {
        setErrorMessage('Notice: This PDF does not appear to be password-protected.');
      }
    } catch (err: unknown) {
      console.error('Error inspecting PDF:', err);
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
    setIsDocEncrypted(null);
    setEncAlgorithm(null);
    setPassword('');
    setShowPassword(false);
    setResultStats(null);
    setErrorMessage(null);
  };

  const handleUnlockPdf = async () => {
    if (!sourceFile || isProcessing || !password.trim()) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgressStage('Authenticating and decrypting document...');
      setProgressPct(20);

      const result = await unlockPdf({
        file: sourceFile,
        password,
        onProgress: (_curr, _total, stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });

      // Clear password from memory immediately
      setPassword('');

      const url = memoryManager.createTrackedUrl(result.blob);
      setDownloadUrl(url);
      setResultStats({
        totalPages: result.totalPages,
        fileSize: result.fileSize,
        fileName: result.fileName,
      });
      setIsProcessing(false);
    } catch (err: unknown) {
      console.error('Unlock error:', err);
      setIsProcessing(false);
      setErrorMessage(formatUserFacingPdfError(err, 'unlocking this PDF'));
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
            title="Select Password-Protected PDF"
            subtitle="Remove password protection from your PDF files. Requires knowing the document password. Processed locally in your browser."
          />
          <LocalProcessingNotice />
        </div>
      )}

      {/* 2. Unlock Configuration View */}
      {sourceFile && !downloadUrl && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate max-w-xs sm:max-w-md">
                  {sourceFile.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(sourceFile.size)} •{' '}
                  {isDocEncrypted
                    ? `Encrypted (${encAlgorithm})`
                    : isDocEncrypted === false
                    ? 'Unencrypted'
                    : 'Inspecting'}
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
                  Enter Document Password
                </h4>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    PDF Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && password.trim() && !isProcessing) {
                          handleUnlockPdf();
                        }
                      }}
                      placeholder="Enter the password to decrypt"
                      autoComplete="current-password"
                      className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-lg shadow-indigo-600/20"
                  onClick={handleUnlockPdf}
                  disabled={!password.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Decrypting Document...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Unlock className="w-5 h-5" />
                      Unlock PDF
                    </span>
                  )}
                </Button>

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Information Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Security Notice
                </h4>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 leading-relaxed">
                  <p>
                    <strong>Legitimate Decryption Only:</strong> This tool removes password restrictions when you supply the valid password. It does not crack or bypass unknown passwords.
                  </p>
                  <p>
                    <strong>100% Client-Side:</strong> Decryption is computed inside your browser RAM using Web Crypto. Your password and PDF are never sent over the internet.
                  </p>
                </div>
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
              PDF Unlocked Successfully!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Password security restrictions have been permanently removed from this copy.
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
                  {resultStats.totalPages} {resultStats.totalPages === 1 ? 'page' : 'pages'} • {formatBytes(resultStats.fileSize)} • Unlocked
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
              Download Unlocked PDF
            </a>
            <Button variant="outline" onClick={handleResetAll}>
              Unlock Another PDF
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Decrypted 100% locally in browser. Password was never transmitted.</span>
          </div>
        </div>
      )}
    </div>
  );
}
