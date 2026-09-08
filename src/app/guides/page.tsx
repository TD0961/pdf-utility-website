import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdSlot } from '@/components/ads/AdSlot';
import { GUIDES_REGISTRY } from '@/data/guides';
import { constructMetadata } from '@/lib/seo/metadata';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'PDF Guides, Tutorials & Privacy Architecture',
  description:
    'Comprehensive guides on how to work with PDF documents, how client-side PDF processing protects privacy, and document conversion tips.',
  path: '/guides',
});

export default function GuidesIndexPage() {
  return (
    <Container className="py-8 space-y-10">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Guides' }]} />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            PDF Guides & Educational Resources
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl">
            In-depth articles explaining PDF technology, privacy architectures, offline processing, and step-by-step document workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GUIDES_REGISTRY.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
            <Card hoverable className="p-6 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <Badge variant="outline">{guide.category}</Badge>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                  {guide.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {guide.shortDescription}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Read article</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <AdSlot slotId="guides-index-bottom" />
    </Container>
  );
}
