import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy — Zero-Backend Document Architecture & Advertising Disclosures',
  description:
    'Comprehensive privacy policy for PDFSimplify detailing client-side WebAssembly execution, zero document retention, Newor Media and Google programmatic ad partner disclosures, and user rights.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        {/* Minimalist Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>LEGAL ARCHITECTURE</span>
            <span>UPDATED SEPTEMBER 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Privacy Policy
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            At PDFSimplify, user privacy is enforced by technical architecture, not merely promises. All document operations execute within your browser sandbox without server custody.
          </p>
        </header>

        {/* Minimalist Architectural Summary */}
        <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
            Core Privacy Architecture
          </h2>
          <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            <li className="flex items-start gap-2">
              <span className="font-mono text-stone-400 font-bold">•</span>
              <span><strong>Local Browser Execution:</strong> Files selected for supported tools are processed in local device memory rather than uploaded to remote servers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-stone-400 font-bold">•</span>
              <span><strong>Zero Document Custody:</strong> We operate no file storage databases, conversion queues, or document logging infrastructure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-stone-400 font-bold">•</span>
              <span><strong>Data Isolation:</strong> Filenames, contents, and metadata are strictly segregated from analytics and advertising networks.</span>
            </li>
          </ul>
        </div>

        {/* Legal Sections */}
        <div className="space-y-10 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>01</span>
              <span>/</span>
              <span>Excluded Data</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Information We Do Not Collect
            </h2>
            <p>
              Because PDFSimplify operates client-side using WebAssembly and modern browser standards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-600 dark:text-stone-400 text-sm">
              <li>We do NOT collect, inspect, read, or store your PDF documents or images.</li>
              <li>We do NOT collect passwords entered into document security or decryption tools.</li>
              <li>We do NOT collect extracted text strings, tabular data, or rendered image plates.</li>
              <li>We do NOT require user account registrations, usernames, or mandatory credentials.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-8">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>02</span>
              <span>/</span>
              <span>Runtime Lifecycle</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Technical Execution in Browser Memory
            </h2>
            <p>
              When you select a document on pdfsimplify.com, your browser loads file bytes into an <code className="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-stone-200">ArrayBuffer</code> inside your personal device memory (RAM). WebAssembly and JavaScript engines execute all manipulation algorithms directly on your local hardware.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Once you refresh the tab, navigate away, or click Reset, your browser revokes memory object URLs and garbage-collects all file buffers. No residual document data remains.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-8">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>03</span>
              <span>/</span>
              <span>Monetization Disclosures</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Programmatic Advertising & Cookies
            </h2>
            <p>
              To keep PDFSimplify free and accessible without subscription paywalls, we partner with programmatic digital advertising management platforms, including Newor Media and Google Ad Manager, along with authorized demand exchange partners.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Third-party advertising networks use cookies and device diagnostics to serve, measure, and evaluate advertisements based on visits across the web. You may manage or opt out of personalized advertising tracking at any time via:
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono pt-1">
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-900 dark:text-stone-100 hover:text-stone-600"
              >
                Google Ads Settings &rarr;
              </a>
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-900 dark:text-stone-100 hover:text-stone-600"
              >
                DAA Choices &rarr;
              </a>
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-stone-900 dark:text-stone-100 hover:text-stone-600"
              >
                NAI Opt-Out &rarr;
              </a>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 pt-2">
              <strong>Strict Technical Isolation:</strong> All third-party advertisements execute in isolated, sandboxed iframes. Advertising scripts have zero technical access to local WebAssembly memory buffers, document bytes, filenames, passwords, or extracted contents.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-8">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>04</span>
              <span>/</span>
              <span>Statutory Compliance</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              GDPR, UK GDPR, & CCPA Rights
            </h2>
            <p className="text-sm">
              Under international privacy frameworks (including GDPR, UK GDPR, and CCPA/CPRA):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              <li><strong>Zero Document Sale:</strong> PDFSimplify does not sell or share personal document data or files with third parties.</li>
              <li><strong>Immediate Erasure:</strong> Document data is purged immediately upon tab closure or memory reset on your local device.</li>
              <li><strong>Right of Access:</strong> Because we do not store documents, accounts, or personal user profiles, we hold no user document records to provide.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-8">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <span>05</span>
              <span>/</span>
              <span>Inquiries</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Privacy Inquiries & Data Protection Contact
            </h2>
            <p className="text-sm">
              For questions regarding this policy or our client-side architecture, contact:
            </p>
            <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-xs font-mono space-y-1">
              <p><strong>Entity:</strong> PDFSimplify Engineering & Privacy</p>
              <p><strong>Primary:</strong> <a href="mailto:tensaedeme61@gmail.com" className="underline font-bold text-stone-900 dark:text-stone-100">tensaedeme61@gmail.com</a></p>
              <p><strong>Alternate:</strong> <a href="mailto:privacy@pdfsimplify.com" className="underline font-bold text-stone-900 dark:text-stone-100">privacy@pdfsimplify.com</a></p>
            </div>
          </section>
        </div>

        {/* Outro */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between text-xs font-mono text-stone-500">
          <Link href="/terms" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            &larr; Terms of Service
          </Link>
          <Link href="/cookie-policy" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Cookie Policy &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
