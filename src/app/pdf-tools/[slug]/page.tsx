import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdSlot } from '@/components/ads/AdSlot';
import { JsonLd } from '@/components/seo/JsonLd';
import { ToolClientWorkspace } from './ToolClientWorkspace';
import { MergeWorkspace } from '@/components/tools/merge/MergeWorkspace';
import { OrganizeWorkspace } from '@/components/tools/organize/OrganizeWorkspace';
import { SplitWorkspace } from '@/components/tools/split/SplitWorkspace';
import { JpgToPdfWorkspace } from '@/components/tools/jpg-to-pdf/JpgToPdfWorkspace';
import { PdfToJpgWorkspace } from '@/components/tools/pdf-to-jpg/PdfToJpgWorkspace';
import { PdfToTextWorkspace } from '@/components/tools/pdf-to-text/PdfToTextWorkspace';
import { RotateWorkspace } from '@/components/tools/rotate/RotateWorkspace';
import { ExtractWorkspace } from '@/components/tools/extract/ExtractWorkspace';
import { PageNumbersWorkspace } from '@/components/tools/page-numbers/PageNumbersWorkspace';
import { WatermarkWorkspace } from '@/components/tools/watermark/WatermarkWorkspace';
import { ProtectWorkspace } from '@/components/tools/protect/ProtectWorkspace';
import { UnlockWorkspace } from '@/components/tools/unlock/UnlockWorkspace';
import { PdfEditorWorkspace } from '@/components/tools/editor/PdfEditorWorkspace';
import { PdfToWordWorkspace } from '@/components/tools/pdf-to-word/PdfToWordWorkspace';
import { PdfToPptWorkspace } from '@/components/tools/pdf-to-ppt/PdfToPptWorkspace';
import { PdfToExcelWorkspace } from '@/components/tools/pdf-to-excel/PdfToExcelWorkspace';
import { CompressWorkspace } from '@/components/tools/compress/CompressWorkspace';
import { OcrWorkspace } from '@/components/tools/ocr/OcrWorkspace';
import { SignWorkspace } from '@/components/tools/sign/SignWorkspace';
import { FillWorkspace } from '@/components/tools/fill/FillWorkspace';
import { CropWorkspace } from '@/components/tools/crop/CropWorkspace';
import { CompareWorkspace } from '@/components/tools/compare/CompareWorkspace';
import { PdfToCsvWorkspace } from '@/components/tools/pdf-to-csv/PdfToCsvWorkspace';
import { PdfToMarkdownWorkspace } from '@/components/tools/pdf-to-markdown/PdfToMarkdownWorkspace';
import { ExtractImagesWorkspace } from '@/components/tools/extract-images/ExtractImagesWorkspace';
import { FlattenWorkspace } from '@/components/tools/flatten/FlattenWorkspace';
import { RemoveMetadataWorkspace } from '@/components/tools/remove-metadata/RemoveMetadataWorkspace';
import { ResizeWorkspace } from '@/components/tools/resize/ResizeWorkspace';
import { GrayscaleWorkspace } from '@/components/tools/grayscale/GrayscaleWorkspace';
import { HeaderFooterWorkspace } from '@/components/tools/header-footer/HeaderFooterWorkspace';
import { TOOLS_REGISTRY, getToolBySlug, getRelatedTools, getRelatedGuidesForTool } from '@/data/tools';
import { GUIDES_REGISTRY } from '@/data/guides';
import { constructMetadata, SITE_URL } from '@/lib/seo/metadata';
import { getToolSoftwareSchema, getFaqSchema } from '@/lib/seo/jsonld';
import { AnchorAd } from '@/components/ads/AnchorAd';
import {
  CheckCircle2,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return TOOLS_REGISTRY.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return constructMetadata({ title: 'Tool Not Found' });
  }

  return constructMetadata({
    title: `${tool.name} — Free & Private In-Browser PDF Tool`,
    description: tool.metaDescription,
    path: `/pdf-tools/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = getRelatedTools(tool);
  const relatedGuideSlugs = getRelatedGuidesForTool(tool);
  const relatedGuides = relatedGuideSlugs
    .map((gSlug) => GUIDES_REGISTRY.find((g) => g.slug === gSlug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  const jsonLdToolData = getToolSoftwareSchema({
    name: tool.name,
    description: tool.metaDescription,
    url: `${SITE_URL}/pdf-tools/${tool.slug}`,
  });

  const jsonLdFaqData = tool.faqs.length > 0 ? getFaqSchema(tool.faqs) : null;

  const isEditor = tool.slug === 'pdf-editor';
  const pageType = isEditor ? 'editor' : 'tool';

  return (
    <div className="pb-16 space-y-12">
      <JsonLd data={jsonLdToolData} />
      {jsonLdFaqData && <JsonLd data={jsonLdFaqData} />}

      <Container className="pt-6 space-y-6">
        {/* 1. Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'PDF Tools', href: '/pdf-tools' },
            { label: tool.name },
          ]}
        />

        {/* 2. Header: H1, Short Introduction */}
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2">
            {tool.badge && (
              <Badge variant={tool.badge === 'Popular' ? 'primary' : 'secondary'}>
                {tool.badge}
              </Badge>
            )}
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              {tool.category} utility
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tool.name}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {tool.shortDescription}
          </p>
        </div>

        {/* 3. Interactive Tool Workspace (Primary element) */}
        <section aria-label={`${tool.name} workspace`} className="pt-2">
          {tool.slug === 'merge-pdf' && <MergeWorkspace />}
          {tool.slug === 'organize-pdf' && <OrganizeWorkspace />}
          {tool.slug === 'split-pdf' && <SplitWorkspace />}
          {tool.slug === 'jpg-to-pdf' && <JpgToPdfWorkspace />}
          {tool.slug === 'pdf-to-jpg' && <PdfToJpgWorkspace />}
          {tool.slug === 'pdf-to-text' && <PdfToTextWorkspace />}
          {tool.slug === 'rotate-pdf' && <RotateWorkspace />}
          {tool.slug === 'extract-pages' && <ExtractWorkspace />}
          {tool.slug === 'add-page-numbers' && <PageNumbersWorkspace />}
          {tool.slug === 'watermark-pdf' && <WatermarkWorkspace />}
          {tool.slug === 'protect-pdf' && <ProtectWorkspace />}
          {tool.slug === 'unlock-pdf' && <UnlockWorkspace />}
          {tool.slug === 'pdf-editor' && <PdfEditorWorkspace />}
          {tool.slug === 'pdf-to-word' && <PdfToWordWorkspace />}
          {tool.slug === 'pdf-to-ppt' && <PdfToPptWorkspace />}
          {tool.slug === 'pdf-to-excel' && <PdfToExcelWorkspace />}
          {tool.slug === 'compress-pdf' && <CompressWorkspace />}
          {tool.slug === 'ocr-pdf' && <OcrWorkspace />}
          {tool.slug === 'sign-pdf' && <SignWorkspace />}
          {tool.slug === 'fill-pdf' && <FillWorkspace />}
          {tool.slug === 'crop-pdf' && <CropWorkspace />}
          {tool.slug === 'compare-pdf' && <CompareWorkspace />}
          {tool.slug === 'pdf-to-csv' && <PdfToCsvWorkspace />}
          {tool.slug === 'pdf-to-markdown' && <PdfToMarkdownWorkspace />}
          {tool.slug === 'extract-images' && <ExtractImagesWorkspace />}
          {tool.slug === 'flatten-pdf' && <FlattenWorkspace />}
          {tool.slug === 'remove-pdf-metadata' && <RemoveMetadataWorkspace />}
          {tool.slug === 'resize-pdf' && <ResizeWorkspace />}
          {tool.slug === 'grayscale-pdf' && <GrayscaleWorkspace />}
          {tool.slug === 'header-footer' && <HeaderFooterWorkspace />}
          {tool.slug !== 'merge-pdf' &&
            tool.slug !== 'organize-pdf' &&
            tool.slug !== 'split-pdf' &&
            tool.slug !== 'jpg-to-pdf' &&
            tool.slug !== 'pdf-to-jpg' &&
            tool.slug !== 'pdf-to-text' &&
            tool.slug !== 'rotate-pdf' &&
            tool.slug !== 'extract-pages' &&
            tool.slug !== 'add-page-numbers' &&
            tool.slug !== 'watermark-pdf' &&
            tool.slug !== 'protect-pdf' &&
            tool.slug !== 'unlock-pdf' &&
            tool.slug !== 'pdf-editor' &&
            tool.slug !== 'pdf-to-word' &&
            tool.slug !== 'pdf-to-ppt' &&
            tool.slug !== 'pdf-to-excel' &&
            tool.slug !== 'compress-pdf' &&
            tool.slug !== 'ocr-pdf' &&
            tool.slug !== 'sign-pdf' &&
            tool.slug !== 'fill-pdf' &&
            tool.slug !== 'crop-pdf' &&
            tool.slug !== 'compare-pdf' &&
            tool.slug !== 'pdf-to-csv' &&
            tool.slug !== 'pdf-to-markdown' &&
            tool.slug !== 'extract-images' &&
            tool.slug !== 'flatten-pdf' &&
            tool.slug !== 'remove-pdf-metadata' &&
            tool.slug !== 'resize-pdf' &&
            tool.slug !== 'grayscale-pdf' &&
            tool.slug !== 'header-footer' && <ToolClientWorkspace tool={tool} />}
        </section>

        {/* 4. Strategic AdSlot (Policy-controlled, strictly excluded on PDF Editor) */}
        <AdSlot
          slotId={`tool-${tool.slug}-post-tool`}
          pageType={pageType}
          placement="post-tool"
          format="horizontal"
        />

        {/* 5. How The Tool Works */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>How {tool.name} Works in Your Browser</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {tool.howItWorks}
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Why client-side processing is more private:
            </p>
            <p>
              Unlike conventional online converters, your documents never traverse external networks to third-party processing servers. Everything happens inside your local machine’s memory.
            </p>
          </div>
        </section>

        {/* 6. Step-by-Step Instructions */}
        <section className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            How to Use {tool.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tool.steps.map((step) => (
              <div
                key={step.step}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm">
                  {step.step}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Features Grid */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Key Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {tool.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Helpful Tips & Common Problems */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
            <h3 className="font-bold text-base text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <span>Helpful Tips</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-amber-900/90 dark:text-amber-300/90">
              {tool.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-slate-500" />
              <span>Troubleshooting & Notes</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {tool.commonProblems.map((prob, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{prob}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 9. FAQs */}
        {tool.faqs.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs"
                >
                  <summary className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">
                      ↓
                    </span>
                  </summary>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Separated Content Bottom AdSlot */}
        <AdSlot
          slotId={`tool-${tool.slug}-end`}
          pageType={pageType}
          placement="end-content"
          format="horizontal"
        />

        {/* 10. Related Tools */}
        {relatedTools.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Related PDF Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedTools.map((relTool) => (
                <Link key={relTool.slug} href={`/pdf-tools/${relTool.slug}`} className="group block">
                  <Card hoverable className="p-4 h-full flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600">
                        {relTool.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {relTool.shortDescription}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      <span>Try tool</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 11. Related Guides */}
        {relatedGuides.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Related Guides & Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGuides.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
                  <Card hoverable className="p-4 h-full flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 truncate">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {guide.shortDescription}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Viewport Bottom Anchor Ad (Automatically excluded on PDF Editor) */}
      <AnchorAd pageType={pageType} slotId={`tool-${tool.slug}-anchor`} />
    </div>
  );
}
