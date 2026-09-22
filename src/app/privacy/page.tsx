import { Metadata } from 'next';
import PrivacyPolicyPage from '../privacy-policy/page';
import { constructMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = constructMetadata({
  title: 'Privacy Policy — Zero-Backend Document Architecture & AdSense Disclosures',
  description:
    'Comprehensive privacy policy for PDFSimplify detailing client-side WebAssembly execution, zero document retention, Google AdSense third-party cookie disclosures, and user rights.',
  path: '/privacy',
});

export default PrivacyPolicyPage;
