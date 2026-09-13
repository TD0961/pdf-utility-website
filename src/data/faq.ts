export interface GlobalFaqItem {
  question: string;
  answer: string;
  category: 'privacy' | 'general' | 'technical' | 'security';
}

export const GLOBAL_FAQS: GlobalFaqItem[] = [
  {
    category: 'privacy',
    question: 'Are my PDF files uploaded to a server?',
    answer:
      'No. Your PDF is processed locally in your browser. PDFSimplify operates with a zero-backend architecture for document processing. All processing logic executes inside your browser using JavaScript and WebAssembly. Your files are loaded into your local computer’s memory and are not transmitted to our servers or external file processors.',
  },
  {
    category: 'privacy',
    question: 'Do you keep a copy or store my document data?',
    answer:
      'No. We do not operate a file storage system, database, or server processing queue. When you close the browser tab or click Reset, all file data held in browser memory is released.',
  },
  {
    category: 'general',
    question: 'Is PDFSimplify free to use?',
    answer:
      'Yes, PDFSimplify is free. There are no subscriptions, paywalls, or hidden charges. We support platform maintenance through unobtrusive advertising.',
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
      'PDFSimplify supports all modern standards-compliant web browsers including Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge, and modern mobile browsers on iOS and Android.',
  },
  {
    category: 'security',
    question: 'How are passwords and encrypted files handled?',
    answer:
      'When you use tools like Protect PDF or Unlock PDF, encryption and decryption algorithms run locally in your browser. Passwords and decrypted documents are processed in volatile memory without server transmission.',
  },
];
