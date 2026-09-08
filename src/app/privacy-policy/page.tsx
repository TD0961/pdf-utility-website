import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ShieldCheck, ServerOff } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy — iLikePDF Zero-Backend Guarantee',
  description:
    'Our comprehensive privacy policy detailing our zero-backend architecture, client-side PDF processing, and data protection practices.',
  path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
  return (
    <Container size="md" className="py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>Last Updated: February 2025</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          At iLikePDF, your privacy is protected by technical architecture, not merely promises.
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
            <span><strong>Your PDF is processed locally in your browser:</strong> Files selected for processing are loaded into your device’s local memory and are never uploaded to an iLikePDF processing server.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span><strong>Zero Document Custody:</strong> We operate no file storage infrastructure, databases, document queues, or backend conversion APIs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">•</span>
            <span><strong>No Document Data in Analytics or Ads:</strong> Document filenames, contents, passwords, metadata, and extracted text are strictly isolated and never transmitted to any analytics or advertising partners.</span>
          </li>
        </ul>
      </div>

      <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Information We Do Not Collect</h2>
          <p>
            Because iLikePDF tools operate 100% client-side:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>We do NOT collect, inspect, or store your PDF files.</li>
            <li>We do NOT collect passwords entered into security tools.</li>
            <li>We do NOT collect extracted text or rendered image pages.</li>
            <li>We do NOT require user account registrations, emails, or personal identification.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Technical Execution in Browser Memory</h2>
          <p>
            When you interact with a PDF tool on iLikePDF.com, your browser creates a local ArrayBuffer in your device’s RAM. WebAssembly and JavaScript libraries (such as Mozilla PDF.js and pdf-lib) parse the document tree locally. Once you refresh the browser, navigate away, or click Reset, the browser revokes memory references and discards all data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Analytics and Advertising</h2>
          <p>
            We may use privacy-preserving aggregate metrics to understand high-level website traffic (such as tool page views and anonymous error rates). No analytics event ever contains file contents, filenames, or user document metadata.
          </p>
          <p>
            We display contextual advertising via Google AdSense to fund platform hosting and maintenance. Advertisements are strictly separated from tool controls and have zero access to the browser’s PDF processing memory space.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Contact Us Regarding Privacy</h2>
          <p>
            If you have questions, architectural audit inquiries, or privacy concerns, please contact our data protection team at{' '}
            <a href="mailto:privacy@ilikepdf.com" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              privacy@ilikepdf.com
            </a>.
          </p>
        </section>
      </div>
    </Container>
  );
}
