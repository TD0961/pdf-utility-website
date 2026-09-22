import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { constructMetadata } from '@/lib/seo/metadata';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Code2,
  Lock,
  Cpu,
  Users,
  Terminal,
} from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'About Us — Simple PDF Tools, Private by Design',
  description:
    'Learn about the engineering mission, open-source technology stack, and privacy architecture behind PDFSimplify. In-browser document tools built without cloud custody.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container size="md" className="py-8 space-y-12">
      <Breadcrumbs items={[{ label: 'About' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>The Open-Web Document Initiative</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About PDFSimplify
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          We built PDFSimplify around a simple conviction: you should never have to upload your confidential files to an unknown server just to merge two pages, compress a contract, or sign an agreement.
        </p>
      </header>

      {/* 1. Architectural Philosophy */}
      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Our Architectural Philosophy
        </h2>
        <p>
          Most online PDF converters were designed over a decade ago when web browsers had limited processing capability. The legacy model was simple: users uploaded private files over HTTP to cloud servers, remote worker queues processed them, and the resulting documents were downloaded back.
        </p>
        <p>
          Today, personal computers, tablets, and smartphones have extraordinary computing power. Modern browser capabilities—specifically <strong>WebAssembly (WASM)</strong>, <strong>HTML5 Canvas</strong>, and multi-threaded <strong>Web Workers</strong>—enable complex vector parsing, image decompression, and cryptographic hashing directly on the user’s local hardware.
        </p>
        <p>
          PDFSimplify was engineered from day one as a <strong>100% client-side platform</strong>. When you use our utilities, our web servers only serve static application assets (HTML, CSS, and compiled WebAssembly binaries). Once loaded, every single document operation executes completely within your browser’s local sandboxed memory.
        </p>
      </section>

      {/* 2. Open Source Technologies */}
      <section className="space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-600" />
          <span>Open-Source Standards & Technology Stack</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          PDFSimplify stands on the shoulders of battle-tested open-source projects and open web standards. We believe in transparency and reproducibility:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Mozilla PDF.js & pdf-lib</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We leverage Mozilla’s PDF.js rendering pipeline alongside pdf-lib for deterministic vector manipulation, page tree reorganizations, and cross-reference stream generation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Tesseract OCR in WebAssembly</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Optical Character Recognition runs locally inside your browser using Tesseract compiled to WebAssembly, converting scanned documents into searchable text without remote transmission.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Principles */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Our Four Core Commitments
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Privacy by Architecture</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We do not promise to delete your files after 2 hours because we never receive them in the first place. Zero document custody is the ultimate privacy safeguard.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Zero Upload Latency</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              No waiting for 100MB files to upload over slow connections. Document processing begins instantaneously in your local computer RAM.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No Paywalls or Accounts</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Every tool is accessible without forced registrations, credit cards, or daily quotas. We support platform maintenance with unobtrusive, compliant advertising.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Engineering Transparency</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Our code and architectural decisions prioritize document fidelity, memory management, and browser compatibility across Chrome, Safari, Firefox, and Edge.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Call to Action */}
      <div className="p-8 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 space-y-4 text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Experience Private In-Browser Document Processing
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          Explore our complete suite of 30+ client-side utilities and take full control over your documents without cloud exposure.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link href="/pdf-tools">
            <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore All Tools
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="md">
              Contact Engineering
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
