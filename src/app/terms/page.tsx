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
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

        {/* Minimalist Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>TERMS • USER AGREEMENT</span>
            <span>UPDATED SEPTEMBER 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Terms of Service
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Terms governing the use of PDFSimplify browser-based document utilities, client-side tools, and website services.
          </p>
        </header>

        {/* Terms Sections */}
        <div className="space-y-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">1. Acceptance of Terms</h2>
            <p>
              By accessing or using pdfsimplify.com and its associated browser-based document utilities, you agree to be bound by these Terms of Service and our{' '}
              <Link href="/privacy-policy" className="underline font-semibold text-stone-900 dark:text-stone-100">
                Privacy Policy
              </Link>. If you do not agree to all terms and conditions, you must not access or use our services.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">2. Nature of Service & Client-Side Execution</h2>
            <p>
              PDFSimplify provides free, browser-based utilities for creating, modifying, converting, annotating, and securing PDF files. All processing occurs locally within the user’s personal browser sandbox using WebAssembly and JavaScript. PDFSimplify does not transmit, store, copy, inspect, or retain your documents on any remote server.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">3. User Ownership & Document Backups</h2>
            <p>
              You retain 100% ownership, copyright, and intellectual property rights in and to all documents, images, and content you process with PDFSimplify. Because PDFSimplify operates on a zero-document-custody model, we cannot recover lost, overwritten, or modified files. You are solely responsible for maintaining backup copies of your source files.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">4. Acceptable Use Policy</h2>
            <p>
              You agree to use PDFSimplify only for lawful purposes in compliance with all applicable local, national, and international laws. You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400 text-sm">
              <li>Attempt to reverse-engineer, decompile, or tamper with the web application’s client-side runtime for unauthorized redistribution.</li>
              <li>Introduce malicious software, automated scrapers, or DDoS attacks against our static content delivery infrastructure.</li>
              <li>Use the platform to violate third-party copyright, intellectual property, or confidential trade secrets.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">5. Advertising & Third-Party Networks</h2>
            <p>
              PDFSimplify is supported through third-party advertising programs, including Google AdSense. By using our website, you acknowledge that third-party vendors may display ads and utilize cookies in accordance with our{' '}
              <Link href="/privacy-policy" className="underline font-semibold text-stone-900 dark:text-stone-100">
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">6. Disclaimer of Warranties</h2>
            <p>
              PDFSimplify is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express, implied, statutory, or otherwise, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">7. Limitation of Liability</h2>
            <p>
              In no event shall PDFSimplify, its developers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of, or inability to use, our utilities or website.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">8. Legal Contact</h2>
            <p>
              For legal inquiries or questions regarding these Terms of Service, contact{' '}
              <a href="mailto:tensaedeme61@gmail.com" className="font-mono font-semibold underline text-stone-900 dark:text-stone-100">
                tensaedeme61@gmail.com
              </a>.
            </p>
          </section>
        </div>

        {/* Outro */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-500">
          <Link href="/privacy-policy" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            &larr; Privacy Policy
          </Link>
          <Link href="/cookie-policy" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Cookie Policy &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
