'use client';

import React from 'react';
import { ToolMetadata } from '@/types/tool';
import { ShieldCheck } from 'lucide-react';

export interface ToolWorkspaceIntroProps {
  tool: ToolMetadata;
}

export function ToolWorkspaceIntro({ tool }: ToolWorkspaceIntroProps) {
  return (
    <div className="w-full mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {tool.category}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Processed locally in browser</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-sans">
            {tool.name}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl font-normal leading-relaxed">
            {tool.shortDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

