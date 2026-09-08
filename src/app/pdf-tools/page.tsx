import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdSlot } from '@/components/ads/AdSlot';
import { LocalProcessingNotice } from '@/components/pdf/LocalProcessingNotice';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/data/tools';
import { constructMetadata } from '@/lib/seo/metadata';
import { FileText, ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'All PDF Tools — Private In-Browser Document Utilities',
  description:
    'Browse all 15 privacy-focused PDF tools. Merge, split, convert, compress, rotate, watermark, and protect your PDF documents directly on your device.',
  path: '/pdf-tools',
});

export default function PdfToolsPage() {
  return (
    <Container className="py-8 space-y-10">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'PDF Tools' }]} />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            All PDF Tools
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl">
            Every tool runs 100% client-side in your browser. Pick a utility below to start processing your files with zero cloud uploads.
          </p>
        </div>
        <LocalProcessingNotice compact />
      </div>

      {/* Tools Grouped By Category */}
      <div className="space-y-12">
        {TOOL_CATEGORIES.map((cat) => {
          const tools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);

          return (
            <section key={cat.id} className="space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="text-xs font-normal text-slate-400">({tools.length} tools)</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {cat.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tools.map((tool) => (
                  <Link key={tool.slug} href={`/pdf-tools/${tool.slug}`} className="group block">
                    <Card hoverable className="p-5 h-full flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                          </div>
                          {tool.badge && (
                            <Badge variant={tool.badge === 'Popular' ? 'primary' : 'secondary'}>
                              {tool.badge}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {tool.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        <span>Open tool</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <AdSlot slotId="tools-directory-bottom" />
    </Container>
  );
}
