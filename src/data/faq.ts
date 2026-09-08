export interface GlobalFaqItem {
  question: string;
  answer: string;
  category: 'privacy' | 'general' | 'technical' | 'security';
}

export const GLOBAL_FAQS: GlobalFaqItem[] = [
  {
    category: 'privacy',
    question: 'How do you guarantee my PDF files are never uploaded to your server?',
    answer:
      'iLikePDF operates with a zero-backend architecture for document processing. All processing logic executes inside your browser using JavaScript and WebAssembly. Your files are loaded into your local computer’s memory and are never transmitted across the network to our servers or any third-party file processor.',
  },
  {
    category: 'privacy',
    question: 'Do you keep a copy or store my document data?',
    answer:
      'No. We do not operate a file storage system, database, or server processing queue. When you close the browser tab or click Reset, all file data held in browser memory is permanently discarded.',
  },
  {
    category: 'general',
    question: 'Is iLikePDF free to use?',
    answer:
      'Yes, 100% free. There are no subscriptions, paywalls, or hidden charges. We support platform maintenance through unobtrusive, privacy-friendly advertising.',
  },
  {
    category: 'technical',
    question: 'What is the maximum file size supported?',
    answer:
      'Because processing takes place directly in your browser, limits depend on your device’s available RAM rather than an arbitrary server cap. We recommend files up to 150MB for smooth performance on typical computers and mobile devices.',
  },
  {
    category: 'technical',
    question: 'Which browsers are supported?',
    answer:
      'iLikePDF supports all modern standards-compliant web browsers including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and modern mobile browsers on iOS and Android.',
  },
  {
    category: 'security',
    question: 'Are my passwords or confidential data safe?',
    answer:
      'Yes. When you use tools like Protect PDF or Unlock PDF, the encryption algorithms run locally in your browser. Passwords and decrypted documents are never transmitted over the internet.',
  },
];
