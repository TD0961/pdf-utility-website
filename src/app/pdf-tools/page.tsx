import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AdSlot } from '@/components/ads/AdSlot';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/data/tools';
import { constructMetadata } from '@/lib/seo/metadata';
import { ArrowRight, Layers, Minimize2, RefreshCw, ShieldCheck, SlidersHorizontal, Lock } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'All PDF Tools — Private In-Browser Document Utilities',
  description:
    'Browse all privacy-focused PDF tools. Merge, split, convert, compress, rotate, watermark, and protect your PDF documents directly on your device with zero cloud uploads.',
  path: '/pdf-tools',
});

function getCategoryIcon(catId: string) {
  switch (catId) {
    case 'organize':
      return <Layers className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
    case 'optimize':
      return <Minimize2 className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
    case 'create-convert':
    case 'convert':
      return <RefreshCw className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
    case 'edit':
      return <SlidersHorizontal className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
    case 'secure':
    case 'protect':
      return <Lock className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
    default:
      return <ShieldCheck className="w-4 h-4 text-stone-700 dark:text-stone-300" />;
  }
}

export default function PdfToolsPage() {
  return (
    <Container className="py-8 space-y-12">
      {/* Breadcrumbs & Editorial Header */}
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'PDF Tools' }]} />

        <div className="space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-stone-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span>30 In-Browser PDF Tools</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            All PDF Tools
          </h1>

          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Every utility executes locally in your browser memory via WebAssembly.
            Your documents never leave your device. Select a tool below to get started.
          </p>
        </div>

        {/* Quick Category Jump Navigation */}
        <div className="pt-2 flex flex-wrap gap-2">
          {TOOL_CATEGORIES.map((cat, idx) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-xs font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-stone-600 transition-all shadow-2xs"
            >
              <span className="text-[10px] text-stone-400 dark:text-stone-500">0{idx + 1}</span>
              <span>{cat.name}</span>
            </a>
          ))}
        </div>

        <LocalProcessingNotice compact />
      </div>

      {/* Tools Grouped By Category (Adopting Main Page Cards) */}
      <div className="space-y-14">
        {TOOL_CATEGORIES.map((cat, catIdx) => {
          const tools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);

          return (
            <section key={cat.id} id={cat.id} className="space-y-6 scroll-mt-24">
              <div className="border-b border-stone-200/80 dark:border-stone-800/80 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500">
                      Category 0{catIdx + 1}
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {tools.length} tools
                    </span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
                    {cat.name}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md">
                  {cat.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tools.map((tool) => (
                  <Link key={tool.slug} href={`/pdf-tools/${tool.slug}`} className="group block h-full">
                    <div className="paper-sheet rounded-2xl p-5 bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                            {getCategoryIcon(tool.category)}
                          </div>
                          {tool.badge && (
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                              {tool.badge}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {tool.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-mono font-semibold text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                        <span>Open tool</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="py-4">
        <AdSlot slotId="tools-directory-bottom" pageType="tool" placement="in-content" />
      </div>
    </Container>
  );
}
