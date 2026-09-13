import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AdSlot } from '@/components/ads/AdSlot';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/data/tools';
import { GUIDES_REGISTRY } from '@/data/guides';
import { GLOBAL_FAQS } from '@/data/faq';
import {
  ShieldCheck,
  Zap,
  HardDrive,
  Lock,
  ArrowRight,
  FileText,
  BookOpen,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/BrandLogo';

export default function HomePage() {
  const popularTools = TOOLS_REGISTRY.filter((t) => t.badge === 'Popular');

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-emerald-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

        <Container className="text-center space-y-6">
          <BrandMark size={56} className="mx-auto shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform duration-300" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Client-Side In-Browser Processing • Zero Server Uploads</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto">
            Simple PDF tools.{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Private by design.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Merge, split, convert, organize, and work with PDF files directly in your browser. No files are uploaded to any server.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/pdf-tools">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore PDF Tools
              </Button>
            </Link>
            <Link href="/guides">
              <Button variant="outline" size="lg">
                Browse Guides
              </Button>
            </Link>
          </div>

          {/* Core Trust Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/80 dark:border-slate-800 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Local Device</p>
                <p className="text-slate-500">Files stay in RAM</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Zero Backend</p>
                <p className="text-slate-500">No cloud queues</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Instant Speed</p>
                <p className="text-slate-500">No upload wait</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Free to Use</p>
                <p className="text-slate-500">No sign-up required</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Popular Tools Grid */}
      <section>
        <Container className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Popular Tools
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The most frequently used browser PDF utilities.
              </p>
            </div>
            <Link
              href="/pdf-tools"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {popularTools.map((tool) => (
              <Link key={tool.slug} href={`/pdf-tools/${tool.slug}`} className="group block">
                <Card hoverable className="p-6 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      {tool.badge && (
                        <Badge variant="primary">{tool.badge}</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tool.shortDescription}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>Use tool</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Non-intrusive AdSlot */}
      <Container>
        <AdSlot slotId="home-leaderboard" pageType="home" placement="in-content" />
      </Container>

      {/* How It Works Section */}
      <section className="bg-slate-100/70 dark:bg-slate-900/50 py-16 border-y border-slate-200/80 dark:border-slate-800">
        <Container className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              How PDFSimplify Works
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Three simple steps with local browser processing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose your PDF</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag and drop your file or pick it from your device. The file is loaded strictly into your browser’s local memory.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Process in your browser</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Our lightweight WebAssembly and JavaScript engines perform the requested operations locally on your hardware.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Download the result</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Save the processed document directly to your device. When you close the tab, all local memory is released.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Tool Categories Hierarchy */}
      <section>
        <Container className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              All PDF Tool Categories
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete catalog organized by workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOL_CATEGORIES.map((category) => {
              const tools = TOOLS_REGISTRY.filter((t) => t.category === category.id);

              return (
                <div
                  key={category.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {category.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {tools.map((t) => (
                      <Link
                        key={t.slug}
                        href={`/pdf-tools/${t.slug}`}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all flex items-center justify-between group"
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {t.name}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Educational Guides Highlight */}
      <section>
        <Container className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Helpful Guides & Tutorials
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Learn PDF tips, tricks, and understand how browser document processing works.
              </p>
            </div>
            <Link
              href="/guides"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GUIDES_REGISTRY.slice(0, 3).map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
                <Card hoverable className="p-6 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{guide.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{guide.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {guide.shortDescription}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <span>Read guide</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-100/50 dark:bg-slate-900/40 py-16 border-t border-slate-200/80 dark:border-slate-800">
        <Container size="md" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Clear answers about our privacy model, performance, and browser compatibility.
            </p>
          </div>

          <div className="space-y-4">
            {GLOBAL_FAQS.map((faq, index) => (
              <details
                key={index}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs open:ring-1 open:ring-indigo-500/20"
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
        </Container>
      </section>
    </div>
  );
}
