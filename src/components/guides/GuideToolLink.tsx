'use client';

import React from 'react';
import Link from 'next/link';
import { trackGuideToToolClick } from '@/lib/analytics/events';

export interface GuideToolLinkProps {
  guideSlug: string;
  targetToolSlug: string;
  className?: string;
  children: React.ReactNode;
}

export function GuideToolLink({
  guideSlug,
  targetToolSlug,
  className,
  children,
}: GuideToolLinkProps) {
  const handleClick = () => {
    trackGuideToToolClick(guideSlug, targetToolSlug);
  };

  return (
    <Link
      href={`/pdf-tools/${targetToolSlug}`}
      className={className}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
