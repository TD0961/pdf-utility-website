import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { constructMetadata } from '@/lib/seo/metadata';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Globe,
  AlertTriangle,
  Mail,
  ArrowRight,
  ServerOff,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Security & Architecture — PDFSimplify Document Utilities',
  description:
    'Detailed overview of PDFSimplify security architecture: local in-browser document processing, HTTPS transport, memory lifecycle, and practical browser security boundaries.',
  path: '/security',
});

export default function SecurityPage() {
  return (
    <Container size="md" className="py-8 space-y-12">
      <Breadcrumbs items={[{ label: 'Security' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Architecture & Trust Disclosures</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Security & Processing Model
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          PDFSimplify is engineered to process supported PDF files directly within your web browser rather than transferring document content to remote conversion servers. This page outlines our technical architecture, transport security, and practical security boundaries.
        </p>
      </header>

      {/* 1. In-Browser Document Processing */}
      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ServerOff className="w-6 h-6 text-indigo-600" />
          <span>1. In-Browser Execution Model</span>
        </h2>
        <p>
          Traditional web-based document utilities require users to upload confidential files over HTTP to a multi-tenant cloud server. The remote server stores the file on disk, places it into an asynchronous queue, runs a server-side engine (such as Ghostscript or Poppler), and streams the converted document back.
        </p>
        <p>
          PDFSimplify departs fundamentally from this model. Supported PDF workflows—including merging, splitting, rotating, extracting, compressing, visual signing, and client-side OCR—execute entirely on your device using client-side JavaScript, HTML5 Canvas, and WebAssembly (WASM).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No Document Uploads</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Files selected for supported tools are parsed directly in local RAM. Our hosting servers do not receive or store your document files.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Local WebAssembly & JS</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Engines like pdf-lib, Mozilla PDF.js, and Tesseract.js compile to browser runtimes to execute transformations on your local CPU.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-violet-600" />
              <span>Ephemeral Memory</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Byte arrays and document objects reside only in session memory. Reloading or closing the tab immediately drops all in-memory buffers.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Transport & Delivery Security */}
      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-600" />
          <span>2. HTTPS & Transport Security</span>
        </h2>
        <p>
          While document processing occurs locally, our static web assets (HTML, CSS, JavaScript bundles, WebAssembly binaries, and web fonts) are distributed across globally authenticated Content Delivery Networks over encrypted HTTPS.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Transport Layer Security (TLS):</strong> Modern TLS encryption protocols are enforced for all static asset traffic to prevent tampering or man-in-the-middle attacks.
          </li>
          <li>
            <strong>Strict Content Security Policy:</strong> Security headers (including <code className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">X-Content-Type-Options: nosniff</code> and frame-ancestors restrictions) help ensure scripts load only from authorized origins.
          </li>
          <li>
            <strong>Static Architecture:</strong> Because PDFSimplify is statically exported, there are no dynamic server-side database endpoints or user document storage repositories that could be subjected to server-side SQL injection or database credential breaches.
          </li>
        </ul>
      </section>

      {/* 3. Practical Boundaries & Limitations */}
      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <span>3. Practical Security Boundaries & Limitations</span>
        </h2>
        <p>
          Responsible engineering requires stating practical boundaries clearly. We do not make absolute, untruthful security claims such as &quot;100% unhackable&quot; or &quot;zero risk.&quot; Users should understand the following browser-level realities:
        </p>

        <div className="space-y-3 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white">Local Device Environment & Extensions</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Because code runs inside your local browser tab, malicious browser extensions, keyloggers, or spyware installed on your personal device could potentially inspect page memory or DOM elements. Maintain an updated browser and install extensions only from trusted sources.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white">Visual Signatures vs Cryptographic PKI Certificates</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Our Sign PDF utility allows drawing or placing visual signature stamps onto PDF pages. It does not issue qualified electronic signatures (QES) or cryptographic X.509 PKI certificates. For legal proceedings requiring cryptographic non-repudiation certificates, utilize dedicated PKI software.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-1">
            <h4 className="font-bold text-slate-900 dark:text-white">Zero Document Custody Means No Recovery</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Because we never store copies of your documents on any server, we cannot recover or retrieve files you modify, compress, or protect. Always retain your original source files before running modifications.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Advertising & Network Transparency */}
      <section className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          4. Advertising & Network Transparency
        </h2>
        <p>
          PDFSimplify is supported by digital advertising, including Google AdSense. It is important to distinguish between document data and advertising network traffic:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm">
          <li>
            <strong>Your PDF files are never sent to advertisers:</strong> Document contents, page text, form fields, and images are completely segregated in local memory and are never transmitted to Google AdSense or any ad partner.
          </li>
          <li>
            <strong>Standard Web Advertising:</strong> Google and other third-party vendors use cookies to serve ads based on prior visits to this and other websites across the Internet. For full details on managing your ad preferences, see our <Link href="/privacy-policy" className="text-indigo-600 dark:text-indigo-400 underline font-medium">Privacy Policy</Link> and <Link href="/cookie-policy" className="text-indigo-600 dark:text-indigo-400 underline font-medium">Cookie Policy</Link>.
          </li>
        </ul>
      </section>

      {/* 5. Contact & Responsible Disclosure */}
      <section className="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          <span>Responsible Disclosure & Technical Questions</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          If you are a security researcher, developer, or user with technical questions about our client-side architecture or discover an issue with our static deployment, please contact us at:
        </p>
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          <a href="mailto:support@pdfsimplify.com" className="hover:underline">
            support@pdfsimplify.com
          </a>
        </p>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          Last reviewed for architectural accuracy: September 2026.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/pdf-tools">
            <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore Tools
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="sm">
              About Project
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
