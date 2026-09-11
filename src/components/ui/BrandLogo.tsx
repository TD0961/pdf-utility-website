'use client';
import React from 'react';
import Link from 'next/link';

export interface BrandMarkProps {
  size?: number | string;
  className?: string;
  ariaHidden?: boolean;
}

/**
 * iLikePDF Custom Brand Mark
 * Custom SVG mark merging document geometry (PDF) with a stylized "like" / thumbs-up symbol.
 * Vector-sharp, highly recognizable at favicon, header, and mobile dimensions.
 */
export function BrandMark({ size = 36, className = '', ariaHidden = true }: BrandMarkProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 shrink-0 overflow-hidden ${className}`}
      aria-hidden={ariaHidden}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        <defs>
          <linearGradient id="markFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Document Sheet Silhouette */}
        <path
          d="M9 6C7.89543 6 7 6.89543 7 8V28C7 29.1046 7.89543 30 9 30H27C28.1046 30 29 29.1046 29 28V14L21 6H9Z"
          fill="currentColor"
          fillOpacity="0.18"
        />

        {/* Document Folded Corner */}
        <path
          d="M21 6V12C21 13.1046 21.8954 14 23 14H29L21 6Z"
          fill="url(#markFoldGrad)"
        />

        {/* Stylized Geometric "Like" / Thumbs-up Glyph */}
        <g transform="translate(1, 1)">
          {/* Thumb */}
          <path
            d="M14.5 13.5C14.5 11.5 15.5 9 17 9C18.2 9 18.5 10.2 18.5 11.8C18.5 13.2 17.5 14.8 17.5 16H22C23.1 16 24 16.9 24 18C24 18.4 23.8 18.8 23.5 19.1C23.8 19.4 24 19.8 24 20.3C24 20.8 23.8 21.2 23.5 21.5C23.8 21.8 23.9 22.2 23.9 22.6C23.9 23.7 23 24.5 22 24.5H16.5C14.8 24.5 13.5 23.5 13 22"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Palm base / cuff */}
          <rect
            x="9.5"
            y="16.5"
            width="3"
            height="8"
            rx="1.2"
            fill="#ffffff"
          />
        </g>
      </svg>
    </div>
  );
}

export interface BrandLogoProps {
  variant?: 'compact' | 'full' | 'inline' | 'iconOnly';
  markSize?: number;
  showTagline?: boolean;
  className?: string;
  linkHref?: string;
}

/**
 * iLikePDF Production Brand Logo Component
 * Consistent across Header, Footer, Hero, and Documentation.
 */
export function BrandLogo({
  variant = 'compact',
  markSize = 36,
  showTagline = false,
  className = '',
  linkHref,
}: BrandLogoProps) {
  if (variant === 'iconOnly') {
    return <BrandMark size={markSize} className={className} />;
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandMark size={markSize} className="group-hover:scale-105 transition-transform duration-200" />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            iLike<span className="text-indigo-600 dark:text-indigo-400">PDF</span>
          </span>
          {variant === 'compact' && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold tracking-wide">
              Private
            </span>
          )}
        </div>
        {(variant === 'full' || showTagline) && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Simple PDF tools. Private by design.
          </span>
        )}
      </div>
    </div>
  );

  if (linkHref) {
    return (
      <Link href={linkHref} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
