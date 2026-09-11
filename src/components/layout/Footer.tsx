import React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12 text-slate-600 dark:text-slate-400">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-4">
            <BrandLogo linkHref="/" variant="full" markSize={36} />
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Simple PDF tools. Private by design. Fast, browser-based document utilities that work directly on your device without server uploads.
            </p>
            <div className="flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 max-w-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero-backend architecture: documents are processed locally in your browser.</span>
            </div>
          </div>

          {/* Column 1: Organize */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Organize
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/merge-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Merge PDF</Link></li>
              <li><Link href="/pdf-tools/split-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Split PDF</Link></li>
              <li><Link href="/pdf-tools/organize-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Organize PDF</Link></li>
              <li><Link href="/pdf-tools/extract-pages" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Extract Pages</Link></li>
            </ul>
          </div>

          {/* Column 2: Edit & Annotate */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Edit & Annotate
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/pdf-editor" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">PDF Editor</Link></li>
              <li><Link href="/pdf-tools/rotate-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Rotate PDF</Link></li>
              <li><Link href="/pdf-tools/add-page-numbers" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Add Page Numbers</Link></li>
              <li><Link href="/pdf-tools/watermark-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Watermark PDF</Link></li>
            </ul>
          </div>

          {/* Column 3: Convert & Optimize */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Convert & Optimize
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/jpg-to-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">JPG to PDF</Link></li>
              <li><Link href="/pdf-tools/pdf-to-jpg" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">PDF to JPG</Link></li>
              <li><Link href="/pdf-tools/pdf-to-text" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">PDF to Text</Link></li>
              <li><Link href="/pdf-tools/compress-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Compress PDF</Link></li>
              <li><Link href="/pdf-tools/ocr-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">OCR PDF</Link></li>
            </ul>
          </div>

          {/* Column 4: Security & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Security & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/protect-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Protect PDF</Link></li>
              <li><Link href="/pdf-tools/unlock-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Unlock PDF</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} iLikePDF. Simple PDF tools. Private by design.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/guides" className="hover:underline">Guides</Link>
            <Link href="/resources" className="hover:underline">Resources</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
