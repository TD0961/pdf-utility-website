import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Cookie Policy — PDFSimplify',
  description: 'Detailed explanation of cookie usage and local browser storage on PDFSimplify.',
  path: '/cookie-policy',
});

export default function CookiePolicyPage() {
  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />

        {/* Minimalist Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>STORAGE POLICY</span>
            <span>UPDATED SEPTEMBER 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Cookie Policy
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            Detailed disclosure regarding cookie usage, browser local storage, and third-party advertising measurements on PDFSimplify.
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by web browsers when accessing websites. They help websites remember preferences, facilitate security, and measure traffic.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">2. How PDFSimplify Uses Cookies</h2>
            <p>
              PDFSimplify itself does not deploy tracking cookies to profile individual users or inspect document contents. Our core PDF tools operate without requiring cookies, user accounts, or persistent session identifiers.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">3. Third-Party Advertising & Measurement Cookies</h2>
            <p>
              To maintain PDFSimplify as a free service without subscription fees, advertising partners (including Newor Media and Google Ad Manager) and authorized exchange demand partners may set cookies or web beacons in your browser.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              These cookies measure ad impressions, prevent invalid bot fraud, and serve contextual or targeted ads. You may manage your ad preferences via:
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
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">4. Local & Session Storage</h2>
            <p>
              We use browser <code className="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-stone-200">localStorage</code> strictly for functional interface preferences (such as remembering your dark or light theme choice). No document files or extracted document contents are ever stored in persistent LocalStorage or IndexedDB databases.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">5. Managing & Disabling Cookies</h2>
            <p>
              You can configure your browser to block or alert you about cookies. Because our core PDF utilities operate via in-memory WebAssembly, disabling cookies will not impair tool functionality.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">6. Contact</h2>
            <p>
              If you have questions regarding our cookie practices, reach out to{' '}
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
          <Link href="/terms" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
