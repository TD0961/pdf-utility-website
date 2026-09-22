import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ShieldCheck, ServerOff, Cookie, Lock, Globe, Mail } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy — Zero-Backend Document Architecture & AdSense Disclosures',
  description:
    'Comprehensive privacy policy for PDFSimplify detailing client-side WebAssembly execution, zero document retention, Google AdSense third-party cookie disclosures, and user rights.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <Container size="md" className="py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>Last Updated: September 2026</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          At PDFSimplify, your privacy is protected by technical architecture, not merely promises.
        </p>
      </header>

      {/* Highlights Box */}
      <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
        <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
          <ServerOff className="w-5 h-5 text-emerald-600" />
          <span>Core Privacy Architecture</span>
        </h2>
        <ul className="space-y-2 text-xs sm:text-sm text-emerald-900/90 dark:text-emerald-200/90">
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span><strong>Local Browser Processing:</strong> PDF files selected for supported tools are processed locally in your browser rather than uploaded to PDFSimplify’s servers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span><strong>Zero Document Custody:</strong> We operate no file storage servers, databases, document processing queues, or server-side conversion pipelines.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span><strong>Strict Data Isolation:</strong> Document filenames, text contents, passwords, metadata, and extracted data are strictly isolated and never transmitted to any analytics, tracking, or advertising partners.</span>
          </li>
        </ul>
      </div>

      <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>1. Information We Do Not Collect</span>
          </h2>
          <p>
            Because PDFSimplify tools operate client-side using WebAssembly and modern browser standards:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>We do NOT collect, inspect, read, or store your PDF documents or images.</li>
            <li>We do NOT collect passwords entered into document security or decryption tools.</li>
            <li>We do NOT collect extracted text, tabular data, or rendered image pages.</li>
            <li>We do NOT require user account registrations, usernames, or mandatory credentials.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>2. Technical Execution in Browser Memory</span>
          </h2>
          <p>
            When you interact with any PDF tool on pdfsimplify.com, your web browser loads the document bytes into an <code>ArrayBuffer</code> inside your personal device’s local memory (RAM). JavaScript and WebAssembly libraries (such as Mozilla PDF.js, pdf-lib, and Tesseract OCR) execute all manipulation algorithms directly on your CPU.
          </p>
          <p>
            Once you refresh the browser page, navigate away, or click Reset, the browser revokes all memory object URLs and garbage-collects all file data. No residual document copies remain.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cookie className="w-5 h-5 text-indigo-600" />
            <span>3. Google AdSense & Third-Party Advertising Disclosures</span>
          </h2>
          <p>
            To keep PDFSimplify free and accessible without subscription fees, we partner with third-party advertising networks, specifically <strong>Google AdSense</strong>.
          </p>
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">
              Mandatory Google AdSense Policy Disclosure:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Third-party vendor notice:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to PDFSimplify or other websites across the internet.
              </li>
              <li>
                <strong>Advertising cookies:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
              </li>
              <li>
                <strong>Opt-out options:</strong> Users may opt out of personalized advertising at any time by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  Google Ads Settings
                </a>.
              </li>
              <li>
                Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  www.aboutads.info
                </a>{' '}
                or the Network Advertising Initiative opt-out page at{' '}
                <a
                  href="https://optout.networkadvertising.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  optout.networkadvertising.org
                </a>.
              </li>
            </ul>
          </div>
          <p>
            <strong>Strict Firewall:</strong> Advertisements delivered through Google AdSense operate in isolated iframes managed by the browser. Ad networks and advertising scripts have zero programmatic access to the browser memory buffers holding your PDF documents.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Cookies & Web Storage</h2>
          <p>
            PDFSimplify uses cookies and local browser storage strictly for functional website features:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Essential & Functional Storage:</strong> We use browser <code>localStorage</code> solely to remember user interface preferences (such as your chosen light or dark theme).</li>
            <li><strong>Advertising Cookies:</strong> As detailed in Section 3, Google and approved advertising partners may set cookies to measure ad performance and combat fraud.</li>
          </ul>
          <p>
            You can configure your browser to block or alert you about cookies. Note that disabling cookies will not affect your ability to use our client-side PDF utilities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. GDPR and International Privacy Rights</h2>
          <p>
            Under the European General Data Protection Regulation (GDPR) and UK GDPR, users have specific statutory rights regarding personal data:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Right of Access & Portability:</strong> Because we do not store documents, accounts, or personal user profiles, we hold no document records to provide.</li>
            <li><strong>Right to Erasure:</strong> Document data is purged immediately upon tab closure or memory reset on your local device.</li>
            <li><strong>Consent Management:</strong> Users within the European Economic Area (EEA) and UK are provided with consent mechanisms regarding personalized advertising cookies.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. California Consumer Privacy Rights (CCPA / CPRA)</h2>
          <p>
            Under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>PDFSimplify does NOT sell your personal document data or files to third parties.</li>
            <li>We do not collect identifiers such as Social Security numbers, financial account details, or government IDs.</li>
            <li>California residents have the right to opt out of the sharing of personal information for cross-context behavioral advertising through the opt-out links provided in Section 3.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <span>7. Contact Information & Data Protection Lead</span>
          </h2>
          <p>
            If you have inquiries regarding this Privacy Policy, our client-side technical architecture, or data protection practices, please contact our privacy team:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-1">
            <p><strong>Entity:</strong> PDFSimplify Engineering & Privacy Team</p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@pdfsimplify.com" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
                privacy@pdfsimplify.com
              </a>
            </p>
            <p>
              <strong>Support Desk:</strong>{' '}
              <a href="mailto:support@pdfsimplify.com" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
                support@pdfsimplify.com
              </a>
            </p>
            <p className="text-slate-500 text-xs pt-1">Inquiries are answered within 24–48 business hours.</p>
          </div>
        </section>
      </div>
    </Container>
  );
}
