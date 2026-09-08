'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Menu, X, FileText, ChevronDown } from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '@/data/tools';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: 'PDF Tools', href: '/pdf-tools', hasDropdown: true },
    { label: 'Guides', href: '/guides' },
    { label: 'Resources', href: '/resources' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex items-baseline">
                <span>iLike</span>
                <span className="text-indigo-600 dark:text-indigo-400">PDF</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 ml-1.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold tracking-wide">
                  Private
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                if (link.hasDropdown) {
                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => setToolsDropdownOpen(true)}
                      onMouseLeave={() => setToolsDropdownOpen(false)}
                    >
                      <Link
                        href={link.href}
                        className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {link.label}
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </Link>

                      {/* Dropdown Menu */}
                      {toolsDropdownOpen && (
                        <div className="absolute top-full left-0 w-[580px] p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 animate-in fade-in-50 zoom-in-95 duration-150">
                          {TOOL_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="space-y-1.5">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                                {cat.name}
                              </h4>
                              <div className="space-y-0.5">
                                {TOOLS_REGISTRY.filter((t) => t.category === cat.id).slice(0, 3).map((tool) => (
                                  <Link
                                    key={tool.slug}
                                    href={`/pdf-tools/${tool.slug}`}
                                    className="block px-2.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                  >
                                    {tool.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                            <Link
                              href="/pdf-tools"
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View all 15 PDF tools &rarr;
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Privacy Assurance Pill & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 px-3 py-1.5 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Server Uploads</span>
            </div>
            <Link href="/pdf-tools">
              <Button size="sm">Explore Tools</Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 px-4">
              <Link href="/pdf-tools" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">All PDF Tools</Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
