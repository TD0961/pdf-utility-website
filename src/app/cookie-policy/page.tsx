import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton';

export const metadata: Metadata = constructMetadata({
  title: 'Cookie Policy',
  description: 'Detailed explanation of cookie usage and local browser storage on PDFSimplify.',
  path: '/cookie-policy',
});

export default function CookiePolicyPage() {
  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Cookie Policy', href: '/cookie-policy' }]} />

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
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-100/60 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800">
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Granular Consent Controls
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Review and customize your active analytics and advertising cookie choices at any time.
                </p>
              </div>
              <CookiePreferencesButton />
            </div>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device by web browsers when accessing websites. They help websites remember preferences, facilitate security, and measure traffic.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">2. Cookie Categories & Stored Keys</h2>
            <p>
              PDFSimplify operates on a client-side architecture. Below is the complete, verifiable inventory of browser cookies and local storage keys used across our services:
            </p>

            <div className="overflow-x-auto my-4">
              <table className="w-full text-xs text-left border-collapse border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 font-mono">
                  <tr>
                    <th className="p-3 border-b border-stone-200 dark:border-stone-800">Key / Identifier</th>
                    <th className="p-3 border-b border-stone-200 dark:border-stone-800">Category</th>
                    <th className="p-3 border-b border-stone-200 dark:border-stone-800">Provider</th>
                    <th className="p-3 border-b border-stone-200 dark:border-stone-800">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">pdfsimplify_cookie_consent_v1</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Strictly Necessary</td>
                    <td className="p-3">Local (PDFSimplify)</td>
                    <td className="p-3 font-sans text-stone-600 dark:text-stone-400">Stores user explicit cookie consent selections in localStorage.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">theme</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Strictly Necessary</td>
                    <td className="p-3">Local (PDFSimplify)</td>
                    <td className="p-3 font-sans text-stone-600 dark:text-stone-400">Preserves light or dark mode user interface theme preference.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">_ga, _ga_*</td>
                    <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">Optional Analytics</td>
                    <td className="p-3">Google Analytics (G-XZ1VE80DQL)</td>
                    <td className="p-3 font-sans text-stone-600 dark:text-stone-400">Aggregated usage diagnostics and coarse tool execution duration buckets. Strictly consent-gated. Defaults to denied under Consent Mode v2.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">__gads, IDE, test_cookie</td>
                    <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">Optional Advertising</td>
                    <td className="p-3">Google AdSense / Newor Media</td>
                    <td className="p-3 font-sans text-stone-600 dark:text-stone-400">Contextual and display advertising delivery to fund free site access. Strictly consent-gated. Never loaded without user opt-in.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              * Document invariant: Zero file bytes, document names, extracted text, or passwords are ever stored in cookies or web storage.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">3. Third-Party Advertising & Measurement</h2>
            <p>
              To maintain PDFSimplify as a free service without subscription fees, advertising partners (including Newor Media and Google Ad Manager) and authorized exchange demand partners may set cookies or web beacons in your browser, but only after you have given consent where legally required.
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
              We use browser <code className="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-stone-200">localStorage</code> strictly for functional interface preferences (such as remembering your dark or light theme choice and your consent settings). No document files or extracted document contents are ever stored in persistent LocalStorage or IndexedDB databases.
            </p>
          </section>

          <section className="space-y-3 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">5. Managing & Disabling Cookies</h2>
            <p>
              You can configure your browser to block or alert you about cookies, or change your settings using our on-site controls below:
            </p>
            <div className="pt-1">
              <CookiePreferencesButton />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Because all PDF processing takes place in client memory via WebAssembly modules, completely rejecting cookies will not impair or block any PDF utility.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">6. Browser Signals (DNT & GPC)</h2>
            <p>
              PDFSimplify honors the <strong className="font-semibold text-stone-900 dark:text-stone-100">Do Not Track (DNT)</strong> and <strong className="font-semibold text-stone-900 dark:text-stone-100">Global Privacy Control (GPC)</strong> browser signals. When our application detects that DNT is enabled (<code className="font-mono text-xs">navigator.doNotTrack === &apos;1&apos;</code>) or GPC is active (<code className="font-mono text-xs">navigator.globalPrivacyControl === true</code>), optional analytics and advertising cookies are automatically disabled by default.
            </p>
          </section>

          <section className="space-y-2 border-t border-stone-200/80 dark:border-stone-800/80 pt-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">7. Contact</h2>
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
