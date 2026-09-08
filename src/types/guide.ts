export interface GuideArticle {
  slug: string;
  title: string;
  shortDescription: string;
  metaDescription: string;
  category: string;
  readTime: string;
  publishedDate: string;
  updatedDate: string;
  relatedToolSlug?: string;
  relatedGuides: string[];
  content: {
    intro: string;
    sections: {
      heading: string;
      subheading?: string;
      body: string[];
      callout?: {
        type: 'info' | 'tip' | 'warning';
        text: string;
      };
    }[];
    summary: string;
  };
}
