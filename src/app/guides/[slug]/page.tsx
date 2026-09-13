import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { AdSlot } from '@/components/ads/AdSlot';
import { AnchorAd } from '@/components/ads/AnchorAd';
import { JsonLd } from '@/components/seo/JsonLd';
import { GUIDES_REGISTRY, getGuideBySlug } from '@/data/guides';
import { getToolBySlug } from '@/data/tools';
import { constructMetadata, SITE_URL } from '@/lib/seo/metadata';
import { getArticleSchema } from '@/lib/seo/jsonld';
import { Clock, Calendar, ArrowRight, ShieldCheck, Info, Lightbulb, AlertTriangle } from 'lucide-react';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDES_REGISTRY.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return constructMetadata({ title: 'Guide Not Found' });
  }

  return constructMetadata({
    title: `${guide.title} — PDFSimplify Guides`,
    description: guide.metaDescription,
    path: `/guides/${guide.slug}`,
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const relatedTool = guide.relatedToolSlug ? getToolBySlug(guide.relatedToolSlug) : undefined;
  const relatedGuides = guide.relatedGuides
    .map((gSlug) => getGuideBySlug(gSlug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const jsonLdData = getArticleSchema({
    title: guide.title,
    description: guide.metaDescription,
    url: `${SITE_URL}/guides/${guide.slug}`,
    publishedDate: guide.publishedDate,
    updatedDate: guide.updatedDate,
  });

  return (
    <article className="py-8 space-y-8">
      <JsonLd data={jsonLdData} />

      <Container size="md" className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Guides', href: '/guides' },
            { label: guide.title },
          ]}
        />

        {/* Header */}
        <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {guide.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {guide.publishedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {guide.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {guide.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {guide.content.intro}
          </p>
        </header>

        {/* Related Tool Quick Callout */}
        {relatedTool && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-slate-900 dark:text-white">
                Ready to try this tool?
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Use our free in-browser {relatedTool.name} utility with 100% client-side privacy.
              </p>
            </div>
            <Link href={`/pdf-tools/${relatedTool.slug}`} className="shrink-0">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Launch {relatedTool.name}
              </Button>
            </Link>
          </div>
        )}

        {/* Article Sections */}
        <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
          {guide.content.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white pt-2">
                {sec.heading}
              </h2>
              {sec.body.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {p}
                </p>
              ))}

              {sec.callout && (
                <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs sm:text-sm">
                  {sec.callout.type === 'tip' && (
                    <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  {sec.callout.type === 'info' && (
                    <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  )}
                  {sec.callout.type === 'warning' && (
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {sec.callout.text}
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Summary */}
        <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2 text-emerald-950 dark:text-emerald-200">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Summary</span>
          </h3>
          <p className="text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-300/90">
            {guide.content.summary}
          </p>
        </div>

        <AdSlot
          slotId={`guide-${guide.slug}-bottom`}
          pageType="guide"
          placement="end-content"
        />

        {/* Related Guides Links */}
        {relatedGuides.length > 0 && (
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Related Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGuides.map((relGuide) => (
                <Link
                  key={relGuide.slug}
                  href={`/guides/${relGuide.slug}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all block group"
                >
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600">
                    {relGuide.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {relGuide.shortDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
      <AnchorAd pageType="guide" />
    </article>
  );
}
