'use client';
import React from 'react';
import Link from 'next/link';

export interface BrandMarkProps {
  size?: number | string;
  className?: string;
  ariaHidden?: boolean;
}

/**
 * PDFSimplify Custom Brand Mark
 * Custom SVG mark merging document geometry (PDF) with a modern stylized "S" (Simplify) dynamic wave and spark.
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
        className="w-full h-full p-1"
      >
        <defs>
          <linearGradient id="markFoldGrad" x1="23" y1="5" x2="31" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Document-shaped contour with 45-degree top-right corner cut */}
        <path
          d="M9 5H23L31 13V27C31 29.2 29.2 31 27 31H9C6.8 31 5 29.2 5 27V9C5 6.8 6.8 5 9 5Z"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.06)"
        />

        {/* Folded Corner Flap */}
        <path
          d="M23 5V12C23 12.6 23.4 13 24 13H31L23 5Z"
          fill="url(#markFoldGrad)"
        />

        {/* Minimalist S Contour Line */}
        <path
          d="M22.5 15.5H15.5C13.2 15.5 11.5 17.2 11.5 19.2C11.5 21.2 13.2 22.5 15.5 22.5H20.5C22.8 22.5 24.5 23.8 24.5 25.8C24.5 27.8 22.8 29.5 20.5 29.5H13.5"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic Precision Flow Terminals */}
        <circle cx="22.5" cy="15.5" r="1.3" fill="#38bdf8" />
        <circle cx="13.5" cy="29.5" r="1.3" fill="#a5b4fc" />
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
 * PDFSimplify Production Brand Logo Component
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
            PDF<span className="text-indigo-600 dark:text-indigo-400">Simplify</span>
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
