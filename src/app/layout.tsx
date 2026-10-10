import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { getWebsiteSchema } from '@/lib/seo/jsonld';
import { constructMetadata } from '@/lib/seo/metadata';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastContainer } from '@/components/notifications/ToastContainer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = constructMetadata();

const themeScript = `(function() {
  try {
    var stored = localStorage.getItem('pdfsimplify_theme') || localStorage.getItem('ilikepdf_theme');
    var theme = stored || 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XZ1VE80DQL"
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XZ1VE80DQL');
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7704232652384788"
          crossOrigin="anonymous"
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <JsonLd data={getWebsiteSchema()} />
          <SkipToContent />
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <OfflineIndicator />
          <ServiceWorkerRegister />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
