import React from 'react';
import { Metadata } from 'next';
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
    <Container size="lg" className="py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="text-sm text-slate-500">Last updated: September 2026</p>
      </header>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your computer by web browsers when visiting websites. They help websites remember preferences or provide essential functionality.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. How PDFSimplify Uses Cookies</h2>
          <p>
            PDFSimplify itself does not use tracking cookies to identify individual users or document contents. Our core PDF tools operate without requiring cookies, accounts, or persistent session tokens.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Third-Party Cookies (Advertising & Header Bidding)</h2>
          <p>
            To keep PDFSimplify free without subscriptions, our monetization partners—primarily <strong>Newor Media Inc.</strong> and <strong>Google Ad Manager</strong>, alongside authorized header bidding demand partners (e.g. Amazon Publisher Services, OpenX, PubMatic, Sovrn, Rubicon Project, Criteo)—may place cookies or web beacons on your browser.
          </p>
          <p>
            These cookies are used to measure advertisement delivery, prevent fraudulent bot traffic, and serve contextual or interest-based advertisements. You may manage your preferences or opt out of targeted advertising at any time via:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            <li>
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
              >
                Google Ads Settings
              </a>
            </li>
            <li>
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
              >
                AboutAds.info Choices (DAA)
              </a>
            </li>
            <li>
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
              >
                Network Advertising Initiative (NAI)
              </a>
            </li>
            <li>
              <a
                href="https://newormedia.com/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 underline font-semibold"
              >
                Newor Media Privacy Policy
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Local & Session Storage</h2>
          <p>
            We may use browser LocalStorage or SessionStorage strictly for functional UI preferences (such as remembering your dark mode preference or tool UI configurations). No document files or extracted document contents are ever stored in persistent LocalStorage or IndexedDB databases.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">5. Service Worker & Cache Storage</h2>
          <p>
            PDFSimplify includes an optional Service Worker and utilizes browser Cache Storage strictly to cache static application code (HTML, CSS, JavaScript bundles, WebAssembly binaries, and web fonts). This allows the application interface to load quickly on repeat visits. User document files are never placed into Cache Storage.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">6. Managing and Disabling Cookies</h2>
          <p>
            Most modern web browsers allow you to view, manage, and delete cookies through your browser settings. You can configure your browser to block third-party cookies or alert you when cookies are set. Note that blocking functional storage may affect theme settings, but core in-browser PDF utilities will continue to operate.
          </p>
        </section>
      </div>
    </Container>
  );
}
