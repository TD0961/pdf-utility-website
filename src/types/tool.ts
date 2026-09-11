export type ToolCategory = 'create-convert' | 'edit' | 'organize' | 'optimize' | 'secure';

export type ToolStatus = 'available' | 'beta' | 'planned';

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolMetadata {
  slug: string;
  name: string;
  shortDescription: string;
  metaDescription: string;
  category: ToolCategory;
  badge?: string;
  status: ToolStatus;
  icon: string;
  acceptsMultiple: boolean;
  maxFiles?: number;
  acceptedFileTypes: string[];
  features: string[];
  howItWorks: string;
  steps: ToolStep[];
  tips: string[];
  commonProblems: string[];
  faqs: ToolFaqItem[];
  relatedTools: string[];
  relatedGuides: string[];
}
