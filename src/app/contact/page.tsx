import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { Card } from '@/components/ui/Card';
import { constructMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/config/site';
import { Mail, ShieldCheck, HelpCircle } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Contact Us — PDFSimplify',
  description:
    'Have feedback, feature requests, or questions regarding PDFSimplify? Get in touch with our engineering team.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <Container size="md" className="py-8 space-y-10">
      <Breadcrumbs items={[{ label: 'Contact' }]} />

      <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact PDFSimplify
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          We welcome bug reports, suggestions, browser compatibility feedback, and privacy inquiries.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Inquiries & Support</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            For general feedback, feature suggestions, technical questions, or bug reports:
          </p>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block pt-2"
          >
            {siteConfig.supportEmail}
          </a>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            Typical response time: 24–48 business hours.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Privacy & Architecture Inquiries</h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            For technical security audits, privacy policy questions, or zero-backend compliance inquiries:
          </p>
          <a
            href={`mailto:${siteConfig.privacyEmail}`}
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline block pt-2"
          >
            {siteConfig.privacyEmail}
          </a>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            Handled directly by our security & privacy engineering lead.
          </p>
        </Card>
      </div>

      {/* Structured Bug Reporting & Guidelines */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Help Us Help You Faster
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Because PDFSimplify processes documents entirely in your local browser without uploading files to our servers, our team cannot see your documents or server logs. When reporting a tool issue, including the following details helps us reproduce and fix it rapidly:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">1. Browser & Version</span>
            <span>e.g., Chrome 128, Safari 18, Firefox 130</span>
          </li>
          <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">2. Operating System</span>
            <span>e.g., Windows 11, macOS Sequoia, iOS 18, Android 14</span>
          </li>
          <li className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">3. Error Notice</span>
            <span>Exact error message or visual behavior observed</span>
          </li>
        </ul>
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300">
          <strong>Privacy Note:</strong> Please do <em>not</em> email confidential or sensitive documents. Our tools are designed for zero document custody, and we will never ask you to transmit confidential files over email.
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <span>Before contacting us:</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Check out our frequently asked questions on our{' '}
          <Link href="/#faq" className="text-indigo-600 underline font-medium">
            Homepage FAQ
          </Link>{' '}
          or browse our{' '}
          <Link href="/guides" className="text-indigo-600 underline font-medium">
            Guides Section
          </Link>{' '}
          for step-by-step troubleshooting.
        </p>
      </div>
    </Container>
  );
}
