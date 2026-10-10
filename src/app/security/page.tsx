import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Security & Architecture — PDFSimplify Document Utilities',
  description:
    'Detailed overview of PDFSimplify security architecture: local in-browser document processing, HTTPS transport, memory lifecycle, and practical browser security boundaries.',
  path: '/security',
});

export default function SecurityPage() {
  return (
    <Container className="py-10 max-w-3xl">
      <div className="space-y-12">
        <Breadcrumbs items={[{ label: 'Security' }]} />

        {/* Minimalist Header */}
        <header className="space-y-4 border-b border-stone-200/80 dark:border-stone-800/80 pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">
            SECURITY • ARCHITECTURAL DISCLOSURE
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Client-side execution model.
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            PDFSimplify processes PDF documents directly within your browser session rather than uploading files to remote conversion queues. Here is how our memory sandbox, network boundaries, and transport security work.
          </p>
        </header>

        {/* 01 / In-Browser Execution Model */}
        <section className="space-y-4 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>01</span>
            <span>/</span>
            <span>In-Browser Execution Model</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            No Document Uploads
          </h2>
          <p>
            Traditional document web services require uploading confidential PDFs over HTTP to remote servers. The remote server stores the file on disk, runs worker scripts, and streams the result back.
          </p>
          <p>
            PDFSimplify executes all supported PDF operations—merging, splitting, rotating, extracting, compressing, visual signing, and client-side OCR—locally on your machine via JavaScript, HTML5 Canvas, and WebAssembly (WASM).
          </p>
          <div className="p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-xs sm:text-sm space-y-2 font-mono">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
              <span>MEMORY SANDBOX</span>
              <span>EPHEMERAL RAM</span>
            </div>
            <p className="font-sans text-stone-700 dark:text-stone-300 text-xs leading-relaxed">
              Byte arrays and document objects reside only in temporary browser memory. Reloading or closing the tab immediately flushes all in-memory buffers. Our web hosting servers never receive or store your document bytes.
            </p>
          </div>
        </section>

        {/* 02 / Transport Security */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>02</span>
            <span>/</span>
            <span>Transport & Delivery</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            TLS & Content Security
          </h2>
          <p>
            While document processing occurs locally, our static application assets (HTML, CSS, JavaScript bundles, WebAssembly binaries, and web fonts) are distributed across globally authenticated Content Delivery Networks over encrypted HTTPS.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm pt-1">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 font-bold">•</span>
              <span><strong>Modern TLS:</strong> All web traffic is strictly encrypted in transit with HTTP Strict Transport Security (HSTS).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 font-bold">•</span>
              <span><strong>Static Zero-Database Architecture:</strong> Because PDFSimplify is statically exported, there are no dynamic server-side database endpoints or user document storage repositories that could be subjected to server-side SQL injection or credential leaks.</span>
            </li>
          </ul>
        </section>

        {/* 03 / Practical Boundaries */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>03</span>
            <span>/</span>
            <span>Practical Boundaries & Limitations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Responsible Security Boundaries
          </h2>
          <p>
            We believe responsible engineering requires stating realistic boundaries clearly rather than making untruthful &quot;100% unhackable&quot; marketing claims:
          </p>
          <ul className="space-y-3 pt-1 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 font-bold shrink-0">A.</span>
              <span><strong>Device Security & Extensions:</strong> Because processing runs inside your browser, rogue extensions or malware installed on your computer could inspect page memory. Keep your browser updated and use extensions from trusted sources.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 font-bold shrink-0">B.</span>
              <span><strong>Visual Signatures vs PKI:</strong> Our Sign PDF tool places visual stamp signatures onto documents. It does not issue qualified electronic signatures (QES) or cryptographic X.509 PKI certificates.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-mono text-stone-400 font-bold shrink-0">C.</span>
              <span><strong>Zero Document Custody Means No Server Backups:</strong> Because we never store copies of your files, we cannot recover or restore documents once closed. Retain your original files before modifications.</span>
            </li>
          </ul>
        </section>

        {/* 04 / Advertising & Network Transparency */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>04</span>
            <span>/</span>
            <span>Data Isolation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Advertising Segregation
          </h2>
          <p>
            PDFSimplify is supported by digital advertising through Google and publisher ad networks. Your document contents, page text, form fields, and images are completely segregated in local memory and are never transmitted to any advertising partners.
          </p>
          <p className="text-xs text-stone-500">
            Standard web diagnostics and cookies are handled separately according to our{' '}
            <Link href="/privacy-policy" className="underline hover:text-stone-900 dark:hover:text-stone-100">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/cookie-policy" className="underline hover:text-stone-900 dark:hover:text-stone-100">
              Cookie Policy
            </Link>.
          </p>
        </section>

        {/* 05 / Contact & Disclosure */}
        <section className="space-y-4 border-t border-stone-200/80 dark:border-stone-800/80 pt-8 text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            <span>05</span>
            <span>/</span>
            <span>Responsible Disclosure</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">
            Security Contact
          </h2>
          <p>
            If you are a security researcher with questions about our client-side architecture or wish to report a static asset issue, please contact us directly at{' '}
            <a href="mailto:tensaedeme61@gmail.com" className="font-mono font-semibold underline text-stone-900 dark:text-stone-100">
              tensaedeme61@gmail.com
            </a>.
          </p>
        </section>

        {/* Minimalist Outro Navigation */}
        <div className="pt-8 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <Link
            href="/pdf-tools"
            className="font-bold text-stone-900 dark:text-stone-100 hover:underline flex items-center gap-1.5"
          >
            <span>Explore all PDF tools</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-stone-400">Archival Specification • Updated September 2026</span>
        </div>
      </div>
    </Container>
  );
}
