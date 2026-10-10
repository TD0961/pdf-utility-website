import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'About Us — Simple PDF Tools, Private by Design',
  description:
    'Learn about the engineering mission, open-source technology stack, and privacy architecture behind PDFSimplify. In-browser document tools built without cloud custody.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'About' }]} />

        {/* Minimalist Editorial Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">
            ABOUT • PLATFORM MANIFESTO
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Documents without cloud custody.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            PDFSimplify was built around a singular conviction: you should never have to upload confidential documents to an external server just to merge two sheets, compress a file, or sign a contract.
          </p>
        </header>

        {/* 01 / Architectural Philosophy */}
        <section className="space-y-4 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>01</span>
            <span>/</span>
            <span>Architectural Philosophy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Local Execution over Remote Queues
          </h2>
          <p>
            Traditional online PDF converters were conceived when web browsers had minimal computational bandwidth. The legacy paradigm required transferring private files over HTTP to multi-tenant servers, storing them on remote disks, and returning converted assets minutes later.
          </p>
          <p>
            Modern devices possess immense local computing capability. Through <strong>WebAssembly (WASM)</strong>, HTML5 Canvas, and multi-threaded Web Workers, complex vector parsing, image decompression, and cryptographic hashing run instantaneously on your physical device.
          </p>
          <p>
            PDFSimplify was engineered as a <strong>100% client-side platform</strong>. Our servers host only static, pre-rendered application assets. Once loaded in your browser, every document transformation occurs entirely within local, sandboxed memory.
          </p>
        </section>

        {/* 02 / Open-Source Foundation */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>02</span>
            <span>/</span>
            <span>Technology Foundation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Open Standards & Trusted Engines
          </h2>
          <p>
            We build exclusively on battle-tested open standards and transparent open-source libraries:
          </p>
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Mozilla PDF.js & pdf-lib
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                Vector parsing, page tree reorganizations, font embedding, and cross-reference stream generation executed directly in browser memory.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Tesseract WebAssembly OCR
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                Optical Character Recognition compiled to WebAssembly, converting scanned documents into searchable text without transmitting a single byte over the wire.
              </p>
            </div>
          </div>
        </section>

        {/* 03 / Core Commitments */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>03</span>
            <span>/</span>
            <span>Commitments</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Four Engineering Principles
          </h2>
          <ul className="space-y-3 pt-1 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 dark:text-stone-500 font-bold shrink-0">01.</span>
              <span><strong className="text-stone-900 dark:text-stone-100">Privacy by Architecture:</strong> We don&apos;t promise to delete files after 2 hours because we never receive them in the first place.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 dark:text-stone-500 font-bold shrink-0">02.</span>
              <span><strong className="text-stone-900 dark:text-stone-100">Zero Upload Latency:</strong> Document processing begins immediately in your device RAM without waiting for large uploads over slow networks.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 dark:text-stone-500 font-bold shrink-0">03.</span>
              <span><strong className="text-stone-900 dark:text-stone-100">Zero Paywalls or Mandatory Accounts:</strong> All utilities remain freely accessible without forced account creation or credit card walls.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 dark:text-stone-500 font-bold shrink-0">04.</span>
              <span><strong className="text-stone-900 dark:text-stone-100">Engineering Transparency:</strong> Standards-compliant ISO 32000 PDF outputs with deterministic cross-browser compatibility.</span>
            </li>
          </ul>
        </section>

        {/* 04 / Publisher & Editorial Standards */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>04</span>
            <span>/</span>
            <span>Editorial & Publisher Disclosure</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Independent Technical Publishing
          </h2>
          <p>
            PDFSimplify is an independently operated educational and functional document platform. All educational guides, technical whitepapers, and step-by-step tutorials are authored and maintained by our engineering team.
          </p>
          <p>
            Platform hosting and continuous open-source maintenance are sustained through non-intrusive contextual advertising, allowing tools to remain free without user data collection.
          </p>
        </section>

        {/* Minimalist Outro Navigation */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <Link
            href="/pdf-tools"
            className="font-bold text-stone-900 dark:text-stone-100 hover:underline flex items-center gap-1.5"
          >
            <span>Explore all 30 PDF tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/contact"
            className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Contact Engineering &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
