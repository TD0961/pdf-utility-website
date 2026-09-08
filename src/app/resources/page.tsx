import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { constructMetadata } from '@/lib/seo/metadata';
import { ShieldCheck, Cpu, HardDrive, ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Resources & Technical Architecture — iLikePDF',
  description:
    'Explore technical specifications, WebAssembly documentation, and developer architecture for client-side PDF processing.',
  path: '/resources',
});

export default function ResourcesPage() {
  const resources = [
    {
      title: 'Zero-Backend Architecture Whitepaper',
      description: 'An architectural breakdown of why client-side document processing eliminates server vulnerability vectors.',
      icon: ShieldCheck,
      href: '/guides/how-browser-based-pdf-processing-works',
    },
    {
      title: 'WebAssembly & Canvas Rendering Engine',
      description: 'How Mozilla PDF.js renders PDF page objects directly to HTML5 canvas without Node.js bindings.',
      icon: Cpu,
      href: '/guides/what-is-ocr',
    },
    {
      title: 'Local Browser Memory Lifecycle',
      description: 'Understanding ArrayBuffer allocation, Garbage Collection, and Object URL revocation for large PDF files.',
      icon: HardDrive,
      href: '/guides/how-browser-based-pdf-processing-works',
    },
  ];

  return (
    <Container className="py-8 space-y-10">
      <div className="space-y-4">
        <Breadcrumbs items={[{ label: 'Resources' }]} />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Resources & Technical Architecture
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl">
            Documentation, whitepapers, and technical references detailing our privacy-preserving client-side PDF utility ecosystem.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href} className="group block">
              <Card hoverable className="p-6 h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 flex items-center justify-between">
                  <span>Explore resource</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
