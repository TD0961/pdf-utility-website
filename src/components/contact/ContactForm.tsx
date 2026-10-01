'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, CheckCircle2, Copy, Check, ExternalLink, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { siteConfig } from '@/config/site';

interface FormState {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  category: 'General Inquiry',
  subject: '',
  message: '',
};

const CATEGORIES = [
  'General Inquiry & Feedback',
  'Bug Report / Tool Issue',
  'Feature Request',
  'Advertising & AdSense Compliance',
  'Privacy & Security Verification',
];

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const destinationEmail = siteConfig.supportEmail || 'tensaedeme61@gmail.com';

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Please provide your name';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Please provide your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }
    if (!form.subject.trim()) {
      newErrors.subject = 'Please enter a subject';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      newErrors.message = 'Please describe your inquiry (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFormattedBody = (): string => {
    return [
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Inquiry Category: ${form.category}`,
      `Website: ${siteConfig.url}`,
      '',
      '--- Message ---',
      form.message.trim(),
    ].join('\n');
  };

  const getFullSubject = (): string => {
    return `[PDFSimplify] [${form.category}] ${form.subject.trim()}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fullSubject = getFullSubject();
    const body = getFormattedBody();
    const mailtoUrl = `mailto:${destinationEmail}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;

    // Trigger user's default email client
    if (typeof window !== 'undefined') {
      window.location.href = mailtoUrl;
    }

    setIsSubmitted(true);
  };

  const handleCopy = async () => {
    const textToCopy = `To: ${destinationEmail}\nSubject: ${getFullSubject()}\n\n${getFormattedBody()}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(destinationEmail)}&su=${encodeURIComponent(getFullSubject())}&body=${encodeURIComponent(getFormattedBody())}`;

  if (isSubmitted) {
    return (
      <Card className="p-6 sm:p-8 space-y-6 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Message Prepared for {destinationEmail}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your default email application was prompted to send your message. If it did not launch automatically, choose an option below:
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
          <strong>To:</strong> {destinationEmail}
          <br />
          <strong>Subject:</strong> {getFullSubject()}
          <br />
          <br />
          {getFormattedBody()}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={gmailWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 text-sm px-4 py-2.5 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in Gmail Web</span>
          </a>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied to Clipboard' : 'Copy Message Text'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setIsSubmitted(false);
              setForm(INITIAL_FORM);
            }}
          >
            Send Another Message
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 space-y-6 shadow-sm border-slate-200 dark:border-slate-800">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Send Us a Direct Message</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Messages are delivered straight to{' '}
          <strong className="text-slate-700 dark:text-slate-300">{destinationEmail}</strong>.
          We respond within 24–48 business hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="contact-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Alex Taylor"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name
                  ? 'border-red-500 dark:border-red-500/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="contact-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Your Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="e.g. alex@example.com"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.email
                  ? 'border-red-500 dark:border-red-500/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="contact-category" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Inquiry Category
            </label>
            <select
              id="contact-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label htmlFor="contact-subject" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-subject"
              type="text"
              value={form.subject}
              onChange={(e) => {
                setForm({ ...form, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              placeholder="Brief summary of your inquiry"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.subject
                  ? 'border-red-500 dark:border-red-500/80'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            />
            {errors.subject && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.subject}</p>}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label htmlFor="contact-message" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            value={form.message}
            onChange={(e) => {
              setForm({ ...form, message: e.target.value });
              if (errors.message) setErrors({ ...errors, message: undefined });
            }}
            placeholder="Please detail your question, feedback, or the steps to reproduce an issue..."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed ${
              errors.message
                ? 'border-red-500 dark:border-red-500/80'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          />
          {errors.message && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.message}</p>}
        </div>

        {/* Submit */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Sends directly to {destinationEmail}</span>
          </div>

          <Button
            type="submit"
            size="md"
            rightIcon={<Send className="w-4 h-4" />}
          >
            Send Message
          </Button>
        </div>
      </form>
    </Card>
  );
}
