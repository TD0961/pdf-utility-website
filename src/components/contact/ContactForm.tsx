'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, CheckCircle2, Mail, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
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
  category: 'General Inquiry & Feedback',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${destinationEmail}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          _subject: `[PDFSimplify] [${form.category}] ${form.subject.trim()}`,
          category: form.category,
          subject: form.subject.trim(),
          message: form.message.trim(),
          _template: 'table',
          _captcha: 'false',
        }),
      });

      const data = await response.json();

      // FormSubmit returns success "true" or an activation notice which also means accepted
      if (response.ok && (data.success === 'true' || data.success === true || (data.message && data.message.includes('Activation')))) {
        setSubmittedData({ ...form });
        setIsSuccess(true);
        setForm(INITIAL_FORM);
      } else {
        throw new Error(data.message || 'Failed to submit form');
      }
    } catch {
      // Fallback: If network is blocked by adblocker, offer direct mailto fallback
      setErrorMessage(
        'Unable to send automatically via network. You can also send directly using your email client.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && submittedData) {
    return (
      <Card className="p-8 sm:p-10 space-y-6 border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Message Sent Successfully!
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Thank you, <strong className="text-slate-900 dark:text-white">{submittedData.name}</strong>. Your message has been delivered directly to{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">{destinationEmail}</strong>.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Our team typically reviews and responds to inquiries within 24 to 48 business hours.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left max-w-lg mx-auto text-xs space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span>Inquiry Topic:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedData.category}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Subject:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{submittedData.subject}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>From:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedData.email}</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              setIsSuccess(false);
              setSubmittedData(null);
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
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

      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{errorMessage}</p>
            <a
              href={`mailto:${destinationEmail}?subject=${encodeURIComponent(form.subject || 'Inquiry')}&body=${encodeURIComponent(form.message || '')}`}
              className="text-indigo-600 dark:text-indigo-400 underline font-semibold block"
            >
              Open email client directly →
            </a>
          </div>
        </div>
      )}

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
              disabled={isSubmitting}
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="e.g. Alex Taylor"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${
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
              disabled={isSubmitting}
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="e.g. alex@example.com"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${
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
              disabled={isSubmitting}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
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
              disabled={isSubmitting}
              value={form.subject}
              onChange={(e) => {
                setForm({ ...form, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: undefined });
              }}
              placeholder="Brief summary of your inquiry"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${
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
            disabled={isSubmitting}
            value={form.message}
            onChange={(e) => {
              setForm({ ...form, message: e.target.value });
              if (errors.message) setErrors({ ...errors, message: undefined });
            }}
            placeholder="Please detail your question, feedback, or the steps to reproduce an issue..."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed disabled:opacity-60 ${
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
            <span>Delivered directly to {destinationEmail}</span>
          </div>

          <Button
            type="submit"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            {isSubmitting ? 'Sending Message...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
