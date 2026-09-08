import React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { ShieldCheck, FileText } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12 text-slate-600 dark:text-slate-400">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <span>iLike<span className="text-indigo-600 dark:text-indigo-400">PDF</span></span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Simple PDF tools. Private by design. Fast, browser-based document utilities that work directly on your device without server uploads.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 max-w-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero-backend architecture: 100% client-side privacy guarantee.</span>
            </div>
          </div>

          {/* Column 1: Organize Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Organize
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/merge-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Merge PDF</Link></li>
              <li><Link href="/pdf-tools/split-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Split PDF</Link></li>
              <li><Link href="/pdf-tools/organize-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Organize PDF</Link></li>
              <li><Link href="/pdf-tools/rotate-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Rotate PDF</Link></li>
              <li><Link href="/pdf-tools/extract-pages" className="hover:text-indigo-600 dark:hover:text-indigo-400">Extract Pages</Link></li>
            </ul>
          </div>

          {/* Column 2: Convert & Enhance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Convert & Enhance
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pdf-tools/jpg-to-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">JPG to PDF</Link></li>
              <li><Link href="/pdf-tools/pdf-to-jpg" className="hover:text-indigo-600 dark:hover:text-indigo-400">PDF to JPG</Link></li>
              <li><Link href="/pdf-tools/pdf-to-text" className="hover:text-indigo-600 dark:hover:text-indigo-400">PDF to Text</Link></li>
              <li><Link href="/pdf-tools/add-page-numbers" className="hover:text-indigo-600 dark:hover:text-indigo-400">Add Page Numbers</Link></li>
              <li><Link href="/pdf-tools/watermark-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Watermark PDF</Link></li>
              <li><Link href="/pdf-tools/compress-pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400">Compress PDF</Link></li>
            </ul>
          </div>

          {/* Column 3: Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About iLikePDF</Link></li>
              <li><Link href="/guides" className="hover:text-indigo-600 dark:hover:text-indigo-400">Guides & Tutorials</Link></li>
              <li><Link href="/resources" className="hover:text-indigo-600 dark:hover:text-indigo-400">Resources</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact Us</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} iLikePDF.com. All rights reserved. Zero-backend client-side technology.</p>
          <div className="flex items-center gap-1">
            <span>Built with focus on</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Privacy & Performance</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
