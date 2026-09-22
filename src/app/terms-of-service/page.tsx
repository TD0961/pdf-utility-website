import { Metadata } from 'next';
import TermsPage from '../terms/page';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Terms of Service — PDFSimplify Document Utilities',
  description: 'Terms and conditions governing the use of PDFSimplify client-side tools, website, and services.',
  path: '/terms',
});

export default TermsPage;
