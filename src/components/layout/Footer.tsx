import React from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Coffee } from 'lucide-react';
import { BUY_ME_A_COFFEE_URL } from '@/config/site';

export function Footer() {
  return (
    <footer className="w-full border-t border-stone-200/60 dark:border-stone-800/60 py-8 sm:py-10 text-stone-500 dark:text-stone-400">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-stone-200/40 dark:border-stone-800/40">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <BrandLogo linkHref="/" variant="full" markSize={30} />
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">|</span>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Private in-browser PDF utilities powered by WebAssembly.
            </p>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-center text-xs font-medium">
            <Link href="/pdf-tools" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Tools
            </Link>
            <Link href="/guides" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Guides
            </Link>
            <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              About
            </Link>
            <Link href="/privacy-policy" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Contact
            </Link>
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-900 transition-all shadow-xs"
            >
              <Coffee className="w-3.5 h-3.5 fill-amber-900/20" />
              <span>Buy me a coffee</span>
            </a>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-400 dark:text-stone-500 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} PDFSimplify • All processing happens on your device.</p>
          <p>No document bytes are ever uploaded or transmitted.</p>
        </div>
      </Container>
    </footer>
  );
}
