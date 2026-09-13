import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { constructMetadata } from '@/lib/seo/metadata';
import { ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'About Us — Simple PDF Tools, Private by Design',
  description:
    'Learn about the mission, values, and technology behind PDFSimplify. Discover why our zero-backend architecture protects your privacy.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container size="md" className="py-8 space-y-10">
      <Breadcrumbs items={[{ label: 'About' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          About PDFSimplify
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          We built PDFSimplify around a simple conviction: you should never have to upload your confidential files to an unknown server just to merge two pages.
        </p>
      </header>

      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Our Architectural Philosophy
        </h2>
        <p>
          Most online PDF converters were designed over a decade ago when web browsers had limited processing capability. The traditional model was simple: users uploaded files over HTTP to cloud servers, remote worker queues processed them, and the resulting documents were sent back down.
        </p>
        <p>
          Today, personal computers and smartphones have extraordinary computing power. Modern browser technologies like WebAssembly, HTML5 Canvas, and Web Workers allow complex document parsing and vector manipulation to run directly on the user’s device.
        </p>
        <p>
          PDFSimplify was engineered from the ground up as a <strong>100% client-side platform</strong>. When you use our utilities, our servers only deliver the static web application code. Once loaded, every single document operation executes completely within your browser’s local sandbox.
        </p>
      </section>

      {/* Core Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Privacy by Architecture</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            We do not promise to delete your files after 2 hours because we never receive them in the first place.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Zero Upload Latency</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            No uploading or downloading across remote servers. Document tasks start instantly in memory.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 space-y-3 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Experience the Difference
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          Explore our suite of client-side PDF utilities and take full control over your document workflow.
        </p>
        <div className="pt-2">
          <Link href="/pdf-tools">
            <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Tools
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
