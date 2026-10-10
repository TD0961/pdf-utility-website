import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Resources & Technical Architecture — PDFSimplify',
  description:
    'Explore technical specifications, WebAssembly documentation, and developer architecture for client-side PDF processing.',
  path: '/resources',
});

export default function ResourcesPage() {
  const resources = [
    {
      number: '01',
      title: 'Zero-Backend Architecture Whitepaper',
      description: 'An architectural breakdown of why client-side document processing eliminates server vulnerability vectors and cloud retention risks.',
      href: '/guides/how-browser-based-pdf-processing-works',
    },
    {
      number: '02',
      title: 'WebAssembly & Canvas Rendering Engine',
      description: 'How Mozilla PDF.js renders PDF page objects directly to HTML5 canvas without Node.js bindings or external processing servers.',
      href: '/guides/what-is-ocr',
    },
    {
      number: '03',
      title: 'Local Browser Memory Lifecycle',
      description: 'Understanding ArrayBuffer allocation, Garbage Collection, and Object URL revocation for client-side document safety.',
      href: '/guides/how-browser-based-pdf-processing-works',
    },
    {
      number: '04',
      title: 'Security Architecture & Trust Disclosures',
      description: 'Full technical overview of local sandboxed execution, TLS delivery, and responsible browser boundaries.',
      href: '/security',
    },
  ];

  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Resources' }]} />

        {/* Minimalist Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">
            RESOURCES • TECHNICAL DOCUMENTATION
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Technical Resources
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Documentation, whitepapers, and technical references detailing our privacy-preserving client-side PDF utility ecosystem.
          </p>
        </header>

        {/* Minimalist Resource List */}
        <div className="space-y-6">
          {resources.map((item) => (
            <Link
              key={item.number}
              href={item.href}
              className="group block p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900 transition-all hover:border-stone-400 dark:hover:border-stone-600"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-400 dark:text-stone-500">
                    <span>RESOURCE {item.number}</span>
                    <span>•</span>
                    <span>TECHNICAL REFERENCE</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-semibold text-stone-500 group-hover:text-stone-900 dark:group-hover:text-stone-100 shrink-0 pt-1">
                  <span>Read resource</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Outro */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-500">
          <Link href="/guides" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            &larr; View all Guides
          </Link>
          <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            About PDFSimplify &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
