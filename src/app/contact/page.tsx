import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { constructMetadata } from '@/lib/seo/metadata';
import { siteConfig } from '@/config/site';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail } from 'lucide-react';

export const metadata: Metadata = constructMetadata({
  title: 'Contact Us — PDFSimplify',
  description:
    'Have feedback, feature requests, or questions regarding PDFSimplify? Send a message directly to our team.',
  path: '/contact',
});

export default function ContactPage() {
  const email = siteConfig.supportEmail || 'tensaedeme61@gmail.com';

  return (
    <Container className="py-10 max-w-2xl">
      <div className="space-y-10">
        <Breadcrumbs items={[{ label: 'Contact' }]} />

        {/* Minimalist Header */}
        <header className="space-y-3 border-b border-stone-200/80 dark:border-stone-800/80 pb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block">
            CONTACT • DIRECT CHANNEL
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50 font-sans">
            Get in touch.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
            We welcome bug reports, browser compatibility questions, and privacy inquiries. You can reach our publisher directly at{' '}
            <a
              href={`mailto:${email}`}
              className="font-mono font-semibold text-stone-900 dark:text-stone-100 underline decoration-stone-300 hover:decoration-stone-900 dark:decoration-stone-700 dark:hover:decoration-stone-100"
            >
              {email}
            </a>
            {' '}or send a message below.
          </p>
        </header>

        {/* Direct Contact Form */}
        <ContactForm />

        {/* Minimalist Support Notes */}
        <div className="pt-6 border-t border-stone-200/80 dark:border-stone-800/80 space-y-4 text-xs font-mono text-stone-500 dark:text-stone-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              <span>Direct: <strong className="text-stone-800 dark:text-stone-200">{email}</strong></span>
            </div>
            <span>Typical Response: 24–48h</span>
          </div>

          <p className="font-sans text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
            Privacy notice: Please do not attach confidential documents in email. All PDF operations run locally in your personal browser session with zero server storage.
          </p>

          <div className="pt-2 flex items-center justify-between text-xs">
            <Link href="/about" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              &larr; About PDFSimplify
            </Link>
            <Link href="/privacy-policy" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Privacy Architecture &rarr;
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
