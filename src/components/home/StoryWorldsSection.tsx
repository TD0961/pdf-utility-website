'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Minimize2,
  ShieldCheck,
  ArrowRight,
  FileText,
  Split,
  RotateCw,
  SlidersHorizontal,
  Lock,
  Unlock,
  Stamp,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';

interface WorldData {
  id: 'organize' | 'optimize' | 'convert' | 'protect';
  number: string;
  name: string;
  headline: string;
  description: string;
  tools: { slug: string; name: string; description: string; icon: React.ReactNode }[];
  visualMetric: { label: string; value: string; detail: string };
}

const WORLDS: WorldData[] = [
  {
    id: 'organize',
    number: '01',
    name: 'Organize',
    headline: 'Rearrange and assemble documents.',
    description:
      'Merge multiple files into one, extract specific page ranges, rotate orientations, or visually reorder sheets in local memory.',
    tools: [
      { slug: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple files into a single unified document.', icon: <Layers className="w-4 h-4" /> },
      { slug: 'split-pdf', name: 'Split PDF', description: 'Extract ranges or separate sheets into independent documents.', icon: <Split className="w-4 h-4" /> },
      { slug: 'rotate-pdf', name: 'Rotate PDF', description: 'Reorient landscape and portrait pages with geometric precision.', icon: <RotateCw className="w-4 h-4" /> },
      { slug: 'organize-pdf', name: 'Organize PDF', description: 'Rearrange, duplicate, and remove individual pages visually.', icon: <SlidersHorizontal className="w-4 h-4" /> },
      { slug: 'extract-pages', name: 'Extract Pages', description: 'Isolate key pages into a brand-new standalone file.', icon: <FileText className="w-4 h-4" /> },
    ],
    visualMetric: {
      label: 'PROCESSING MODEL',
      value: 'IN-MEMORY',
      detail: 'Pages rearranged instantly with zero quality loss',
    },
  },
  {
    id: 'optimize',
    number: '02',
    name: 'Optimize',
    headline: 'Reduce file size while keeping clarity.',
    description:
      'Compress dense scans and embedded images, flatten forms, or convert color profiles while preserving readable vector typography.',
    tools: [
      { slug: 'compress-pdf', name: 'Compress PDF', description: 'Reduce megabytes while retaining vector text sharpness.', icon: <Minimize2 className="w-4 h-4" /> },
      { slug: 'resize-pdf', name: 'Resize PDF', description: 'Standardize page dimensions to standard paper geometries.', icon: <SlidersHorizontal className="w-4 h-4" /> },
      { slug: 'flatten-pdf', name: 'Flatten PDF', description: 'Lock interactive form layers into an immutable surface.', icon: <Layers className="w-4 h-4" /> },
      { slug: 'grayscale-pdf', name: 'Grayscale PDF', description: 'Convert color pages to monochrome for efficient printing.', icon: <FileText className="w-4 h-4" /> },
    ],
    visualMetric: {
      label: 'FILE REDUCTION',
      value: 'UP TO 70%',
      detail: 'Local stream optimization with zero network lag',
    },
  },
  {
    id: 'convert',
    number: '03',
    name: 'Convert',
    headline: 'Convert between PDF and other formats.',
    description:
      'Export PDFs to editable Word, Excel spreadsheets, JPG images, or clean text—and convert image files to PDF containers.',
    tools: [
      { slug: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Render high-resolution image files of each page.', icon: <ImageIcon className="w-4 h-4" /> },
      { slug: 'pdf-to-word', name: 'PDF to Word', description: 'Reconstruct paragraphs and formatting into editable DOCX.', icon: <FileText className="w-4 h-4" /> },
      { slug: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract tabular coordinates into clean spreadsheets.', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { slug: 'pdf-to-text', name: 'PDF to Text', description: 'Extract plain Unicode text without layout overhead.', icon: <FileCode className="w-4 h-4" /> },
      { slug: 'jpg-to-pdf', name: 'Image to PDF', description: 'Combine photos and scans into a single standard PDF.', icon: <Layers className="w-4 h-4" /> },
    ],
    visualMetric: {
      label: 'ACCURACY',
      value: 'CLIENT-SIDE',
      detail: 'Preserves typography and layout structure',
    },
  },
  {
    id: 'protect',
    number: '04',
    name: 'Protect',
    headline: 'Safeguard your confidential documents.',
    description:
      'Encrypt PDFs with strong AES-256 passwords, strip hidden metadata, imprint confidentiality watermarks, or unlock secured files.',
    tools: [
      { slug: 'protect-pdf', name: 'Protect PDF', description: 'Secure documents with AES-256 password encryption.', icon: <Lock className="w-4 h-4" /> },
      { slug: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove password restrictions locally in your browser.', icon: <Unlock className="w-4 h-4" /> },
      { slug: 'watermark-pdf', name: 'Watermark PDF', description: 'Apply custom text or stamp confidentiality marks.', icon: <Stamp className="w-4 h-4" /> },
      { slug: 'remove-pdf-metadata', name: 'Sanitize Metadata', description: 'Strip author names, GPS tags, and edit history.', icon: <ShieldCheck className="w-4 h-4" /> },
    ],
    visualMetric: {
      label: 'PRIVACY ARCHITECTURE',
      value: 'IN-BROWSER RAM',
      detail: 'Zero cloud upload. Zero server logs. Operates strictly in device memory.',
    },
  },
];

export function StoryWorldsSection() {
  const [activeWorldId, setActiveWorldId] = useState<WorldData['id']>('organize');
  const activeWorld = WORLDS.find((w) => w.id === activeWorldId) || WORLDS[0];

  return (
    <section id="worlds" className="py-16 sm:py-24 border-t border-stone-200/80 dark:border-stone-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-500 dark:text-stone-400">
              Tool Suites
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-sans">
              Explore by Workflow
            </h2>
          </div>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-md">
            Fast, client-side utilities designed for every document task. Select a workflow below to view tools.
          </p>
        </div>

        {/* Workflow Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WORLDS.map((world) => {
            const isActive = world.id === activeWorldId;
            return (
              <button
                key={world.id}
                onClick={() => setActiveWorldId(world.id)}
                className={`p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer ${
                  isActive
                    ? 'paper-sheet bg-white dark:bg-stone-900 border-stone-900/40 dark:border-stone-400/50 shadow-md translate-y-[-2px]'
                    : 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-white/80 dark:hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-bold tracking-wider text-stone-400 dark:text-stone-500">
                    {world.number}
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-stone-900 dark:bg-stone-100" />}
                </div>
                <div className="pt-3">
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                    {world.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                    {world.headline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Workflow Stage */}
        <div className="paper-sheet rounded-3xl p-6 sm:p-10 bg-white dark:bg-stone-900/90 border border-stone-300/80 dark:border-stone-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Workflow Description & Key Metric */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[11px] font-mono text-stone-700 dark:text-stone-300 font-semibold">
                {worldName(activeWorld.id)}
              </span>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
                {activeWorld.headline}
              </h3>

              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed pt-1">
                {activeWorld.description}
              </p>
            </div>

            {/* Key Metric Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {activeWorld.visualMetric.label}
              </span>
              <p className="text-lg font-mono font-bold text-stone-900 dark:text-stone-100">
                {activeWorld.visualMetric.value}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {activeWorld.visualMetric.detail}
              </p>
            </div>
          </div>

          {/* Right Column: Tool Cards */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block pb-1">
              Available Tools
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeWorld.tools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/pdf-tools/${t.slug}`}
                  className="group block p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 hover:bg-white dark:hover:bg-stone-900 transition-all duration-200 hover:shadow-md hover:border-stone-400 dark:hover:border-stone-700"
                >
                  <div className="flex items-center justify-between pb-2">
                    <div className="w-8 h-8 rounded-xl bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 group-hover:scale-105 transition-transform">
                      {t.icon}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-950 dark:group-hover:text-white">
                    {t.name}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function worldName(id: string) {
  switch (id) {
    case 'organize':
      return 'Suite 01 — Organize';
    case 'optimize':
      return 'Suite 02 — Optimize';
    case 'convert':
      return 'Suite 03 — Convert';
    default:
      return 'Suite 04 — Protect';
  }
}
