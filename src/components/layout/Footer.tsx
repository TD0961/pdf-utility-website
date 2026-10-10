import React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ShieldCheck, Coffee } from 'lucide-react';
import { BuyMeACoffee } from '@/components/support/BuyMeACoffee';
import { BUY_ME_A_COFFEE_URL } from '@/config/site';

export function Footer() {
  return (
    <footer className="w-full border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-950/90 py-14 text-stone-600 dark:text-stone-400 transition-colors">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand & Mission Statement */}
          <div className="col-span-2 space-y-4">
            <BrandLogo linkHref="/" variant="full" markSize={36} />
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              Your documents. Simplified. High-performance, client-side PDF utilities executed locally in your browser’s memory using WebAssembly.
            </p>
            <div className="flex items-center gap-2.5 text-xs font-mono text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-stone-900/80 p-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 max-w-sm shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Air-gapped memory sandbox. Zero server uploads.</span>
            </div>
            <div className="pt-1">
              <BuyMeACoffee variant="button" />
            </div>
          </div>

          {/* Column 1: Organize */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>01</span>
              <span>/</span>
              <span>Organize</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="/pdf-tools/merge-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Merge PDF</Link></li>
              <li><Link href="/pdf-tools/split-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Split PDF</Link></li>
              <li><Link href="/pdf-tools/organize-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Organize PDF</Link></li>
              <li><Link href="/pdf-tools/extract-pages" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Extract Pages</Link></li>
              <li><Link href="/pdf-tools/rotate-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Rotate PDF</Link></li>
            </ul>
          </div>

          {/* Column 2: Edit & Annotate */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>02</span>
              <span>/</span>
              <span>Edit</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="/pdf-tools/pdf-editor" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">PDF Editor</Link></li>
              <li><Link href="/pdf-tools/add-page-numbers" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Add Page Numbers</Link></li>
              <li><Link href="/pdf-tools/watermark-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Watermark PDF</Link></li>
              <li><Link href="/pdf-tools/header-footer" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Header & Footer</Link></li>
              <li><Link href="/pdf-tools/flatten-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Flatten PDF</Link></li>
            </ul>
          </div>

          {/* Column 3: Convert & Optimize */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>03</span>
              <span>/</span>
              <span>Convert</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="/pdf-tools/compress-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Compress PDF</Link></li>
              <li><Link href="/pdf-tools/pdf-to-word" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">PDF to Word</Link></li>
              <li><Link href="/pdf-tools/pdf-to-jpg" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">PDF to JPG</Link></li>
              <li><Link href="/pdf-tools/jpg-to-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">JPG to PDF</Link></li>
              <li><Link href="/pdf-tools/pdf-to-excel" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">PDF to Excel</Link></li>
              <li><Link href="/pdf-tools/pdf-to-text" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">PDF to Text</Link></li>
            </ul>
          </div>

          {/* Column 4: Security & Legal */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>04</span>
              <span>/</span>
              <span>Security</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="/pdf-tools/protect-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Protect PDF</Link></li>
              <li><Link href="/pdf-tools/unlock-pdf" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Unlock PDF</Link></li>
              <li><Link href="/security" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Security & Architecture</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-stone-950 dark:hover:text-stone-100 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Editorial Sub-Footer */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} PDFSimplify • In-Browser Document Space</p>
          <div className="flex items-center gap-5 flex-wrap justify-center sm:justify-end text-xs">
            <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">About</Link>
            <Link href="/guides" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Guides</Link>
            <Link href="/resources" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Resources</Link>
            <Link href="/contact" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Contact</Link>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
