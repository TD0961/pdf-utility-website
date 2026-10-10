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

      <Container size="lg" className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Guides', href: '/guides' },
            { label: guide.title },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-8">
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

            {/* Mobile Tool Quick Callout */}
            {relatedTool && (
              <div className="lg:hidden p-4 rounded-2xl paper-sheet bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-stone-900 dark:text-stone-100">
                    Try this tool online
                  </p>
                  <p className="text-stone-600 dark:text-stone-400">
                    Use our in-browser {relatedTool.name} tool with 100% local privacy.
                  </p>
                </div>
                <Link href={`/pdf-tools/${relatedTool.slug}`} className="shrink-0">
                  <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open {relatedTool.name}
                  </Button>
                </Link>
              </div>
            )}

            {/* Article Sections */}
            <div className="space-y-8 text-stone-700 dark:text-stone-300 leading-relaxed text-sm sm:text-base">
              {guide.content.sections.map((sec, idx) => (
                <section key={idx} id={`section-${idx + 1}`} className="space-y-3 scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 pt-2 font-sans">
                    {sec.heading}
                  </h2>
                  {sec.body.map((p, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {sec.callout && (
                    <div className="my-4 p-4 rounded-2xl paper-sheet bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-start gap-3 text-xs sm:text-sm">
                      {sec.callout.type === 'tip' && (
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {sec.callout.type === 'info' && (
                        <Info className="w-5 h-5 text-stone-600 dark:text-stone-400 shrink-0 mt-0.5" />
                      )}
                      {sec.callout.type === 'warning' && (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {sec.callout.text}
                      </p>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Summary */}
            <div className="p-6 rounded-2xl paper-sheet bg-stone-50/60 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 space-y-2 text-stone-800 dark:text-stone-200">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Summary</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
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
              <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 space-y-4">
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                  Related Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedGuides.map((relGuide) => (
                    <Link
                      key={relGuide.slug}
                      href={`/guides/${relGuide.slug}`}
                      className="p-4 rounded-xl paper-sheet border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-white dark:bg-stone-900/90 transition-all block group"
                    >
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white">
                        {relGuide.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                        {relGuide.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-24">
            {/* Quick Tool Launcher */}
            {relatedTool && (
              <div className="p-5 rounded-2xl paper-sheet bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>PDF Tool</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    {relatedTool.name}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {relatedTool.shortDescription}
                  </p>
                </div>
                <Link href={`/pdf-tools/${relatedTool.slug}`} className="block pt-1">
                  <Button size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Open {relatedTool.name}
                  </Button>
                </Link>
              </div>
            )}

            {/* In This Guide (TOC) */}
            <div className="p-5 rounded-2xl paper-sheet bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                In This Guide
              </h3>
              <nav className="space-y-1.5 text-xs">
                {guide.content.sections.map((sec, idx) => (
                  <a
                    key={idx}
                    href={`#section-${idx + 1}`}
                    className="block text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 transition-colors py-1 line-clamp-1"
                  >
                    {sec.heading}
                  </a>
                ))}
              </nav>
            </div>

            {/* Client-Side Privacy Guarantee */}
            <div className="p-4 rounded-2xl paper-sheet bg-stone-50/60 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Server Uploads</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                PDFSimplify runs tools entirely in local browser RAM. No files or document telemetry are ever sent to our servers.
              </p>
            </div>
          </aside>
        </div>
      </Container>
      <AnchorAd pageType="guide" />
    </article>
  );
}
