import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service — PDFSimplify',
  description: 'Terms and conditions governing the use of PDFSimplify client-side tools and website.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <Container size="md" className="py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500">Last updated: September 2026</p>
      </header>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using pdfsimplify.com and its associated browser-based document utilities, you agree to be bound by these Terms of Service. If you do not agree, please do not use the website.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Nature of Service</h2>
          <p>
            PDFSimplify provides free, client-side browser tools for managing and converting PDF files. All processing occurs locally on your own computer or device. We do not store, copy, or retain your documents.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. User Responsibility & Disclaimers</h2>
          <p>
            You retain all ownership and copyright of your files. You are solely responsible for keeping backup copies of your documents. The service is provided &ldquo;as is&rdquo; without warranties of any kind regarding suitability for legal or commercial archiving.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Acceptable Use</h2>
          <p>
            You agree not to misuse the website, attempt to disrupt browser code execution, or reverse-engineer the platform for malicious purposes.
          </p>
        </section>
      </div>
    </Container>
  );
}
