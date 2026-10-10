'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  ArrowRight, 
  Layers, 
  Minimize2, 
  KeyRound, 
  FileUp,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const CONSOLE_TOOLS = [
  {
    slug: 'compress-pdf',
    name: 'Compress',
    tag: 'Deflate Compaction',
    metric: 'Up to -80%',
    metricLabel: 'Typical Size Reduction',
    icon: Minimize2,
    accent: 'emerald',
  },
  {
    slug: 'merge-pdf',
    name: 'Merge',
    tag: 'Tree Concatenation',
    metric: 'Instant',
    metricLabel: 'Multi-Document Bind',
    icon: Layers,
    accent: 'cyan',
  },
  {
    slug: 'protect-pdf',
    name: 'Protect',
    tag: 'AES-256 Bitmask',
    metric: 'Air-Gapped',
    metricLabel: 'Browser Decryption Vault',
    icon: KeyRound,
    accent: 'amber',
  },
  {
    slug: 'unlock-pdf',
    name: 'Unlock',
    tag: 'Web Crypto Auth',
    metric: 'In-RAM',
    metricLabel: 'Password Verification',
    icon: Lock,
    accent: 'emerald',
  },
];

export function HomeBentoConsole() {
  const [activeToolIndex, setActiveToolIndex] = useState(0);
  const router = useRouter();
  const current = CONSOLE_TOOLS[activeToolIndex];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Segmented Control Bar (Fintech-grade data switcher) */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel shadow-sm border border-slate-200/80 dark:border-white/10">
          {CONSOLE_TOOLS.map((t, idx) => {
            const Icon = t.icon;
            const isActive = idx === activeToolIndex;
            return (
              <button
                key={t.slug}
                onClick={() => setActiveToolIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>WASM RUNTIME: ACTIVE</span>
        </div>
      </div>

      {/* Bento Grid Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Console Stage (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-xl border border-slate-200/80 dark:border-white/10">
          {/* Subtle luminous accent in top corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-400/10 blur-3xl rounded-full pointer-events-none -z-10" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="hud-chip text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50/80 dark:bg-emerald-950/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {current.tag}
              </span>

              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                CLIENT-THREAD
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {current.name} PDF Workspace
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md">
                Fast client-side document processing in memory. Never touches external servers.
              </p>
            </div>
          </div>

          {/* Interactive Launch Deck */}
          <div className="p-6 rounded-2xl bg-slate-900/5 dark:bg-black/30 border border-slate-200/80 dark:border-white/10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <FileUp className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Ready to process documents
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Open {current.name} PDF tool in your browser
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => router.push(`/pdf-tools/${current.slug}`)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch {current.name} Studio
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/10 pt-3">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Air-Gapped RAM Execution
            </span>
            <span className="font-mono">NO DATA RETENTION</span>
          </div>
        </div>

        {/* Right Bento Column: 2 Telemetry Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card 1: Live Privacy Telemetry Gauge */}
          <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col justify-between space-y-4 shadow-lg border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Privacy Telemetry
                  </h4>
                  <p className="text-[10px] text-slate-400">Zero Cloud Custody</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold">
                SECURE
              </span>
            </div>

            {/* Graphic Data Viz Meter */}
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">SERVER UPLOAD:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">0 BYTES (0%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="w-0 h-full bg-emerald-500 rounded-full" />
              </div>

              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-slate-500">LOCAL MEMORY:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">100% IN-DEVICE</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/10 pt-2">
              Files are parsed directly by WebAssembly in RAM. Never logged, never retained.
            </p>
          </div>

          {/* Card 2: Performance Benchmark Card */}
          <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col justify-between space-y-4 shadow-lg border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Engine Metric
                  </h4>
                  <p className="text-[10px] text-slate-400">{current.name} Engine</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                BENCHMARK
              </span>
            </div>

            <div className="flex items-baseline gap-2 py-1">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {current.metric}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {current.metricLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/10 pt-2 font-mono">
              <span>LATENCY: ~80ms</span>
              <Link
                href="/resources"
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-sans font-semibold"
              >
                <span>Architecture</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
