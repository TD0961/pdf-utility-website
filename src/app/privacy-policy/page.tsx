import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ShieldCheck, ServerOff, Cookie, Lock, Globe, Mail } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy — Zero-Backend Document Architecture & Advertising Disclosures',
  description:
    'Comprehensive privacy policy for PDFSimplify detailing client-side WebAssembly execution, zero document retention, Newor Media and Google programmatic ad partner disclosures, and user rights.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <Container size="lg" className="py-8 space-y-8">
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
            <span>3. Programmatic Advertising Partners (Newor Media & Google Ad Manager)</span>
          </h2>
          <p>
            To keep PDFSimplify free and accessible without mandatory subscription fees or account paywalls, we partner with programmatic digital advertising management platforms, primarily <strong>Newor Media Inc.</strong> and <strong>Google Ad Manager</strong>, along with their authorized header bidding exchange partners (including Amazon Publisher Services, OpenX, PubMatic, Sovrn, Rubicon Project, Criteo, and authorized Google AdSense/AdX resellers).
          </p>
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">
              Advertising Partner & Data Collection Disclosures:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Third-Party Vendors & Demand Partners:</strong> Third-party advertising networks, including Newor Media and Google, use cookies, web beacons, and mobile device identifiers to collect non-personally identifiable diagnostic information (such as browser type, approximate geographic region based on IP, operating system, and interaction timestamps) to serve, target, and evaluate relevant advertisements across websites.
              </li>
              <li>
                <strong>Personalized & Contextual Advertising:</strong> Advertising partners may use browsing data across the web to serve personalized advertisements based on user interests, or contextual advertisements related to general website content.
              </li>
              <li>
                <strong>Newor Media Privacy Standards:</strong> You can review the comprehensive data privacy and cookie practices of our ad management partner at{' '}
                <a
                  href="https://newormedia.com/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
                >
                  Newor Media Privacy Policy
                </a>.
              </li>
              <li>
                <strong>User Opt-Out Mechanisms:</strong> You may control or opt out of personalized ad tracking through any of the following industry portals:
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>
                    Google Advertising Preferences:{' '}
                    <a
                      href="https://www.google.com/settings/ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline"
                    >
                      Google Ads Settings
                    </a>
                  </li>
                  <li>
                    Digital Advertising Alliance (DAA):{' '}
                    <a
                      href="https://www.aboutads.info/choices/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline"
                    >
                      aboutads.info/choices
                    </a>
                  </li>
                  <li>
                    Network Advertising Initiative (NAI):{' '}
                    <a
                      href="https://optout.networkadvertising.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline"
                    >
                      optout.networkadvertising.org
                    </a>
                  </li>
                  <li>
                    European Interactive Digital Advertising Alliance (EDAA):{' '}
                    <a
                      href="https://www.youronlinechoices.eu/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 underline"
                    >
                      youronlinechoices.eu
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <p>
            <strong>Strict Technical Sandboxing:</strong> All third-party advertisements run in isolated, sandboxed iframes enforced by modern browser cross-origin boundaries. Advertising scripts and demand partners have zero technical access to local WebAssembly memory buffers, document bytes, filenames, passwords, or extracted contents processed on PDFSimplify.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Cookies & Web Storage</h2>
          <p>
            PDFSimplify uses cookies and local browser storage strictly for functional website features:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li><strong>Essential & Functional Storage:</strong> We use browser <code>localStorage</code> solely to remember user interface preferences (such as your chosen light or dark theme).</li>
            <li><strong>Advertising & Header Bidding Cookies:</strong> As detailed in Section 3, Newor Media, Google, and authorized SSP partners may set cookies or HTML5 local storage to measure impression delivery, manage frequency capping, and prevent invalid bot traffic.</li>
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
              <a href="mailto:tensaedeme61@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
                tensaedeme61@gmail.com
              </a>
            </p>
            <p className="text-slate-500 text-xs pt-1">Inquiries are answered within 24–48 business hours.</p>
          </div>
        </section>
      </div>
    </Container>
  );
}
