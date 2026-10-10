'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, ChevronDown, ShieldCheck, Cpu, HardDrive, Layers, Minimize2, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Fast Static Loading Optimization: Dynamically load Three.js canvas on client only
const DocumentUniverseCanvas = dynamic(
  () => import('@/components/3d/DocumentUniverseCanvas').then((mod) => mod.DocumentUniverseCanvas),
  {
    ssr: false,
    loading: () => <HeroPaperFallback />,
  }
);

/**
 * Lightweight, zero-JS pure CSS 3D paper fallback rendered during hydration
 * Guarantees instantaneous initial static file load (FCP < 100ms, 0 layout shift).
 */
function HeroPaperFallback() {
  return (
    <div className="hidden sm:flex w-full h-full min-h-[420px] items-center justify-end pr-8 sm:pr-16 lg:pr-24 pointer-events-none opacity-80">
      <div className="relative w-72 md:w-80 h-96 md:h-[440px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between transform rotate-[-3deg] translate-y-2 transition-all">
        {/* Paper Faux Document Header */}
        <div className="space-y-3">
          <div className="w-16 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
          <div className="w-full h-0.5 bg-stone-200/70 dark:bg-stone-800" />
          <div className="w-4/5 h-0.5 bg-stone-200/70 dark:bg-stone-800" />
          <div className="w-5/6 h-0.5 bg-stone-200/70 dark:bg-stone-800" />
          <div className="w-3/5 h-0.5 bg-stone-200/70 dark:bg-stone-800" />
        </div>

        {/* Paper Faux Body Lines */}
        <div className="space-y-2 py-4">
          <div className="w-full h-0.5 bg-stone-100 dark:bg-stone-800/60" />
          <div className="w-11/12 h-0.5 bg-stone-100 dark:bg-stone-800/60" />
          <div className="w-4/5 h-0.5 bg-stone-100 dark:bg-stone-800/60" />
        </div>

        {/* Paper Footer Folio */}
        <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 dark:text-stone-500 pt-3 border-t border-stone-100 dark:border-stone-800/80">
          <span>PAGE 01 / SPEC</span>
          <span>AIR-GAPPED RAM</span>
        </div>
      </div>
    </div>
  );
}

export function HeroUniverseSection() {
  return (
    <section className="relative min-h-[88vh] sm:min-h-[92vh] flex flex-col justify-center overflow-hidden pt-8 pb-14">
      {/* 3D Paper Canvas Viewport (Positioned with architectural composition) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <DocumentUniverseCanvas phase="hero" interactive={true} className="w-full h-full" />
      </div>

      {/* Hero Content Overlay (Generous breathing room, deliberate typography) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pointer-events-none">
        <div className="max-w-2xl text-left pointer-events-auto space-y-6 sm:space-y-8">
          {/* Editorial Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-300/80 dark:border-stone-800 bg-stone-100/90 dark:bg-stone-900/90 backdrop-blur-md shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            <span className="text-xs font-mono font-medium tracking-wide uppercase text-stone-700 dark:text-stone-300">
              Client-Side WebAssembly Architecture
            </span>
          </div>

          {/* Primary Editorial Headline */}
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[0.96] text-stone-900 dark:text-stone-50 font-sans">
              YOUR DOCUMENTS.
              <br />
              <span className="text-stone-600 dark:text-stone-300 font-light">SIMPLIFIED.</span>
            </h1>
          </div>

          {/* Supporting Statement */}
          <p className="text-base sm:text-xl text-stone-600 dark:text-stone-300 max-w-xl font-normal leading-relaxed">
            Fast, private PDF tools that execute entirely in your browser memory.
            Zero server uploads. Your confidential files never leave your physical device.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
            <a href="#worlds">
              <Button size="lg" className="w-full sm:w-auto px-7 py-3.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-xl shadow-md bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200">
                <span>Explore Tools</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </a>

            <a href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 py-3.5 text-xs font-mono uppercase tracking-wider font-semibold rounded-xl border-stone-300 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-900"
              >
                How it works
              </Button>
            </a>
          </div>

          {/* Popular Tools */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 uppercase tracking-wider shrink-0">
              Popular Tools:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/pdf-tools/merge-pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl paper-sheet bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 transition-all hover:scale-105"
              >
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>Merge</span>
              </Link>
              <Link
                href="/pdf-tools/compress-pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl paper-sheet bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 transition-all hover:scale-105"
              >
                <Minimize2 className="w-3.5 h-3.5 text-stone-500" />
                <span>Compress</span>
              </Link>
              <Link
                href="/pdf-tools/protect-pdf"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl paper-sheet bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 transition-all hover:scale-105"
              >
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Protect</span>
              </Link>
              <Link
                href="/pdf-tools/pdf-to-jpg"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl paper-sheet bg-white/90 dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-100 transition-all hover:scale-105"
              >
                <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>PDF to JPG</span>
              </Link>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 border-t border-stone-300/60 dark:border-stone-800/80 grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8 text-xs font-mono text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0" />
              <span>In-Memory RAM</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Private</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0" />
              <span>Local CPU Speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto hidden sm:flex flex-col items-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors">
        <a href="#worlds" className="flex flex-col items-center gap-1 group text-[11px] font-mono uppercase tracking-widest">
          <span>Explore Workflows</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
        </a>
      </div>
    </section>
  );
}
