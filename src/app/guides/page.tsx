import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AdSlot } from '@/components/ads/AdSlot';
import { GUIDES_REGISTRY } from '@/data/guides';
import { constructMetadata } from '@/lib/seo/metadata';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'PDF Guides, Tutorials & Privacy Architecture — PDFSimplify',
  description:
    'Comprehensive guides on how to work with PDF documents, how client-side PDF processing protects privacy, and document conversion tips.',
  path: '/guides',
});

export default function GuidesIndexPage() {
  return (
    <Container className="py-8 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Guides' }]} />

        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
            <BookOpen className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
            <span>Guides & Tutorials</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            PDF Guides & Tutorials
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Step-by-step guides, technical explainers, and best practices for working with PDF documents securely and privately.
          </p>
        </div>
      </div>

      {/* Guides Grid: Paper Sheet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GUIDES_REGISTRY.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block h-full">
            <div className="paper-sheet rounded-2xl p-6 bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {guide.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors leading-snug">
                  {guide.title}
                </h2>

                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                  {guide.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-mono font-semibold text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                <span>Read guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="py-4">
        <AdSlot slotId="guides-index-bottom" pageType="guide" placement="in-content" />
      </div>
    </Container>
  );
}
