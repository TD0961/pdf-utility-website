import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
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
import { ToolEducationalContent } from '@/components/tools/ToolEducationalContent';
import { ToolWorkspaceIntro } from '@/components/tools/ToolWorkspaceIntro';
import { TOOLS_REGISTRY, getToolBySlug, getRelatedTools, getRelatedGuidesForTool } from '@/data/tools';
import { GUIDES_REGISTRY } from '@/data/guides';
import { constructMetadata, SITE_URL } from '@/lib/seo/metadata';
import { getToolSoftwareSchema, getFaqSchema } from '@/lib/seo/jsonld';
import { AnchorAd } from '@/components/ads/AnchorAd';
import {
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  FileText,
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

  const allFaqs = tool.faqs;
  const jsonLdFaqData = allFaqs.length > 0 ? getFaqSchema(allFaqs) : null;

  const isEditor = tool.slug === 'pdf-editor';
  const pageType = isEditor ? 'editor' : 'tool';

  return (
    <div className="pb-20 space-y-12 relative overflow-hidden">
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

        {/* 2. Narrative Tool Intro (Architectural Universe Entry) */}
        <ToolWorkspaceIntro tool={tool} />

        {/* 3. Interactive Tool Workspace (Primary element) */}
        <section aria-label={`${tool.name} workspace`} className="pt-1">
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

        {/* Step-by-Step Instructions */}
        <section className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Quick Guide
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-sans">
              How to Use {tool.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tool.steps.map((step) => (
              <div
                key={step.step}
                className="paper-sheet bg-white dark:bg-stone-900/90 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono font-bold flex items-center justify-center text-xs">
                  0{step.step}
                </div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Unified Capabilities & Processing Details */}
        <section className="paper-sheet bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-7 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Key Features */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-sans">
                Key Capabilities
              </h3>
              <div className="space-y-2.5">
                {tool.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: How It Operates Locally & Tips */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-stone-100 dark:border-stone-800/80 pt-6 md:pt-0 md:pl-8">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-sans">
                  Local Execution
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {tool.howItWorks}
                </p>
              </div>

              {(tool.tips.length > 0 || tool.commonProblems.length > 0) && (
                <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block">
                    Helpful Tips
                  </span>
                  <ul className="space-y-1">
                    {tool.tips.map((tip, idx) => (
                      <li key={`tip-${idx}`} className="flex items-start gap-2">
                        <span className="text-stone-400 dark:text-stone-500">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                    {tool.commonProblems.map((prob, idx) => (
                      <li key={`prob-${idx}`} className="flex items-start gap-2">
                        <span className="text-stone-400 dark:text-stone-500">•</span>
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Technical Deep Dive (Only for tools with specific engine nuances) */}
        <ToolEducationalContent tool={tool} />

        {/* Frequently Asked Questions */}
        {allFaqs.length > 0 && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-2.5">
              {allFaqs.map((faq, idx) => (
                <details
                  key={idx}
                  className="group paper-sheet bg-white dark:bg-stone-900/90 rounded-2xl p-4 sm:p-5 border border-stone-200/80 dark:border-stone-800 shadow-2xs transition-all"
                >
                  <summary className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 cursor-pointer list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-stone-400 group-open:rotate-180 transition-transform font-mono text-xs">
                      ↓
                    </span>
                  </summary>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800 leading-relaxed font-normal">
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

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-stone-200/80 dark:border-stone-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Related PDF Tools
              </h2>
              <Link href="/pdf-tools" className="text-xs font-mono text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
                All 30 tools &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedTools.map((relTool) => (
                <Link key={relTool.slug} href={`/pdf-tools/${relTool.slug}`} className="group block h-full">
                  <div className="paper-sheet rounded-2xl p-4 bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all h-full flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white">
                        {relTool.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {relTool.shortDescription}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 text-xs font-mono font-semibold text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 flex items-center justify-between">
                      <span>Open tool</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Related Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGuides.map((guide) => (
                <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
                  <div className="paper-sheet rounded-2xl p-4 bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white truncate">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {guide.shortDescription}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
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
