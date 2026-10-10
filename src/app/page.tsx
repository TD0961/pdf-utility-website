import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { AdSlot } from '@/components/ads/AdSlot';
import { TOOLS_REGISTRY, TOOL_CATEGORIES } from '@/data/tools';
import { GUIDES_REGISTRY } from '@/data/guides';
import { GLOBAL_FAQS } from '@/data/faq';
import { ArrowRight, BookOpen } from 'lucide-react';
import { HeroUniverseSection } from '@/components/home/HeroUniverseSection';
import { StoryWorldsSection } from '@/components/home/StoryWorldsSection';

export default function HomePage() {

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Cinematic Opening Scene: 3D Paper World + Editorial Typography */}
      <HeroUniverseSection />

      {/* 2. Visual Narrative: The Four Document Worlds (Organize, Optimize, Convert, Protect) */}
      <StoryWorldsSection />

      {/* 3. Monetization Unit (Policy-Compliant, Editorial Framing) */}
      <Container>
        <div className="py-2">
          <AdSlot slotId="home-leaderboard" pageType="home" placement="in-content" />
        </div>
      </Container>

      {/* 4. Complete Architecture: All 30 Tools Grouped by World */}
      <section id="all-tools" className="scroll-mt-20">
        <Container className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Complete Tool Index
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
                All In-Browser Utilities
              </h2>
            </div>
            <Link
              href="/pdf-tools"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white flex items-center gap-1.5"
            >
              <span>Explore all {TOOLS_REGISTRY.length} tools</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOL_CATEGORIES.map((category) => {
              const categoryTools = TOOLS_REGISTRY.filter((t) => t.category === category.id);
              return (
                <div
                  key={category.id}
                  className="paper-sheet rounded-2xl p-5 bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2 border-b border-stone-100 dark:border-stone-800/80 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      CATEGORY
                    </span>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {category.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                      {category.description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {categoryTools.slice(0, 6).map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/pdf-tools/${tool.slug}`}
                        className="block px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors truncate"
                      >
                        {tool.name}
                      </Link>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
                    <Link
                      href={`/pdf-tools#${category.id}`}
                      className="text-[11px] font-mono font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 flex items-center justify-between"
                    >
                      <span>View category</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 5. Architectural Execution Model: How It Works */}
      <section id="how-it-works" className="bg-stone-100/70 dark:bg-stone-900/40 py-16 sm:py-20 border-y border-stone-200/80 dark:border-stone-800/80 scroll-mt-20">
        <Container className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Technical Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-sans">
              How Local Processing Works
            </h2>
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed">
              Unlike traditional cloud document converters that upload your PDFs to remote servers, PDFSimplify executes all parsing and assembly directly on your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="paper-sheet p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 space-y-4 border border-stone-200/80 dark:border-stone-800 text-left">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Select & Load
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                When you choose a PDF, your browser reads the file directly in local memory. Zero files or document data are uploaded to external servers.
              </p>
            </div>

            <div className="paper-sheet p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 space-y-4 border border-stone-200/80 dark:border-stone-800 text-left">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Process Locally
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                WebAssembly modules process the document directly on your device CPU—merging pages, compressing images, or encrypting files in seconds.
              </p>
            </div>

            <div className="paper-sheet p-6 sm:p-8 rounded-3xl bg-white dark:bg-stone-900 space-y-4 border border-stone-200/80 dark:border-stone-800 text-left">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Save & Download
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                The completed document is saved directly to your device disk. Once downloaded, temporary memory buffers are automatically released.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Editorial Guides Section */}
      <section>
        <Container className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-5">
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Documentation & Tutorials
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
                Guides & Tutorials
              </h2>
            </div>
            <Link
              href="/guides"
              className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white flex items-center gap-1.5"
            >
              <span>View all guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GUIDES_REGISTRY.slice(0, 3).map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group block">
                <div className="paper-sheet p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-stone-500 dark:text-stone-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{guide.category.toUpperCase()}</span>
                      <span>•</span>
                      <span>{guide.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:underline leading-snug">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      {guide.shortDescription}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
                    <span>Read guide</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 7. Comprehensive FAQ Section (Full SEO Preservation) */}
      <section className="bg-stone-100/50 dark:bg-stone-900/30 py-16 border-t border-stone-200/80 dark:border-stone-800/80">
        <Container className="space-y-10 max-w-4xl">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Direct Answers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-sans">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Verified answers regarding client-side security, memory limits, and format compatibility.
            </p>
          </div>

          <div className="space-y-3">
            {GLOBAL_FAQS.map((faq, index) => (
              <details
                key={index}
                className="group paper-sheet bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 open:shadow-md transition-all"
              >
                <summary className="font-semibold text-sm sm:text-base text-stone-900 dark:text-stone-100 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform text-sm font-mono">
                    ↓
                  </span>
                </summary>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 leading-relaxed">
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
