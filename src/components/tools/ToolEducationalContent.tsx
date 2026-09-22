import React from 'react';
import { ToolMetadata } from '@/types/tool';
import {
  ShieldCheck,
  Cpu,
  Lock,
  FileCheck2,
  Briefcase,
  Scale,
  GraduationCap,
  UserCheck,
  Server,
  Laptop,
} from 'lucide-react';

interface ToolEducationalContentProps {
  tool: ToolMetadata;
}

export function ToolEducationalContent({ tool }: ToolEducationalContentProps) {
  // Determine customized use case hints based on category or slug
  const isOrganize = tool.category === 'organize';
  const isSecurity = tool.category === 'secure';
  const isConvert = tool.category === 'create-convert';
  const isOptimize = tool.category === 'optimize';

  return (
    <div className="space-y-12 pt-4">
      {/* 1. Real-World Practical Use Cases */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Practical Use Cases for {tool.name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Discover how professionals, academics, and individuals leverage {tool.name} for secure, high-efficiency document workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Business & Enterprise</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isOrganize
                ? 'Consolidate monthly financial reviews, pitch decks, client proposals, and invoices into unified executive reports.'
                : isSecurity
                ? 'Enforce data confidentiality on corporate roadmaps, customer agreements, and internal trade secret audits.'
                : isConvert
                ? 'Transform legacy scans and image receipts into searchable, professional documents for accounting archival.'
                : isOptimize
                ? 'Compress heavy quarterly presentations for seamless email delivery to stakeholders without hitting file size limits.'
                : 'Prepare polished corporate presentations, marketing collateral, and standardized client documentation.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Legal & Compliance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isSecurity
                ? 'Apply standard AES encryption and user access credentials to non-disclosure agreements and judicial depositions.'
                : isOrganize
                ? 'Assemble court exhibits, deposition transcripts, and statutory filings in strict sequential evidentiary order.'
                : 'Maintain strict document integrity for contractual annexes, client retainers, and regulatory filings.'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic & Research</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Merge multi-chapter dissertations, scholarly journal submissions, reading packets, and curriculum vitae while preserving original typography and citation footnotes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Personal Administration</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Organize medical summaries, apartment lease applications, tax filings, travel itineraries, and government forms without uploading personal identity records to third-party clouds.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Architectural Security Comparison Table */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture Breakdown</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Client-Side Browser Processing vs Traditional Cloud Converters
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Understand why processing documents directly within your browser’s local memory represents the gold standard in privacy and speed.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">Workflow Feature</th>
                <th className="py-3.5 px-4 font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  <span>PDFSimplify (In-Browser)</span>
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-4 h-4" />
                    <span>Traditional Cloud Converters</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">File Transmission</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                  0 bytes sent (100% Local Device)
                </td>
                <td className="py-3 px-4 text-slate-500">Transmitted over HTTP to remote servers</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Server Custody & Storage</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Zero retention; cleared immediately on tab close
                </td>
                <td className="py-3 px-4 text-slate-500">Cached in server disk queues or cloud buckets</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Processing Latency</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Instantaneous (no upload or download queues)
                </td>
                <td className="py-3 px-4 text-slate-500">Dependent on upload bandwidth & server congestion</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Offline Functionality</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Fully operational offline once loaded
                </td>
                <td className="py-3 px-4 text-slate-500">Fails completely without active internet</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Compliance & Privacy</td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Native GDPR, HIPAA, & FERPA data protection
                </td>
                <td className="py-3 px-4 text-slate-500">Subject to third-party provider terms & policies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Technical Specifications & PDF Standards */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Technical Specifications & Standards Compliance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>ISO 32000 PDF Compliance</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Full compatibility with ISO 32000-1 and ISO 32000-2 specifications, supporting PDF versions 1.0 through 2.0.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vector & Font Fidelity</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Maintains exact vector paths, TrueType/OpenType font descriptors, annotations, and embedded color spaces without lossy degradation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-violet-600" />
              <span>Memory Isolation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Data is loaded into ephemeral TypedArray memory blocks. Browser garbage collection clears memory immediately when unmounted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
