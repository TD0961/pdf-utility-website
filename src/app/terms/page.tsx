import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service — PDFSimplify Document Utilities',
  description: 'Terms and conditions governing the use of PDFSimplify client-side tools, website, and services.',
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
            By accessing or using pdfsimplify.com and its associated browser-based document utilities, you agree to be bound by these Terms of Service and our{' '}
            <Link href="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              Privacy Policy
            </Link>. If you do not agree to all terms and conditions, you must not access or use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Nature of Service & Client-Side Architecture</h2>
          <p>
            PDFSimplify provides free, browser-based utilities for creating, modifying, converting, annotating, and securing PDF files. All processing occurs locally within the user’s personal browser sandbox using WebAssembly and JavaScript. PDFSimplify does not transmit, store, copy, inspect, or retain your documents on any remote server.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. User Ownership & Document Backups</h2>
          <p>
            You retain 100% ownership, copyright, and intellectual property rights in and to all documents, images, and content you process with PDFSimplify. Because PDFSimplify operates on a zero-document-custody model, we cannot recover lost, overwritten, or modified files. You are solely responsible for maintaining backup copies of your source files.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Acceptable Use Policy</h2>
          <p>
            You agree to use PDFSimplify only for lawful purposes in compliance with all applicable local, national, and international laws. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Attempt to reverse-engineer, decompile, or tamper with the web application’s client-side runtime for unauthorized redistribution.</li>
            <li>Introduce malicious software, automated scrapers, or DDoS attacks against our static content delivery infrastructure.</li>
            <li>Use the platform to violate third-party copyright, intellectual property, or confidential trade secrets.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Advertising & Third-Party Networks</h2>
          <p>
            PDFSimplify is supported through third-party advertising programs, including Google AdSense. By using our website, you acknowledge that third-party vendors may display ads and utilize cookies in accordance with our{' '}
            <Link href="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              Privacy Policy
            </Link>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Disclaimer of Warranties</h2>
          <p>
            PDFSimplify is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">7. Limitation of Liability</h2>
          <p>
            In no event shall PDFSimplify, its developers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of, or inability to use, our utilities or website.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">8. Contact Information</h2>
          <p>
            For legal inquiries or questions regarding these Terms of Service, please reach out to{' '}
            <a href="mailto:support@pdfsimplify.com" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              support@pdfsimplify.com
            </a>.
          </p>
        </section>
      </div>
    </Container>
  );
}
