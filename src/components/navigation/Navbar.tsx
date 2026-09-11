'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ShieldCheck, Menu, X, ChevronDown } from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '@/data/tools';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

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
          {/* Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-6">
            <BrandLogo linkHref="/" variant="compact" />

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

                      {/* Megamenu Dropdown */}
                      {toolsDropdownOpen && (
                        <div className="absolute top-full left-0 w-[640px] p-5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                          {TOOL_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="space-y-1.5">
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                                {cat.name}
                              </h4>
                              <div className="space-y-0.5">
                                {TOOLS_REGISTRY.filter((t) => t.category === cat.id).slice(0, 4).map((tool) => (
                                  <Link
                                    key={tool.slug}
                                    href={`/pdf-tools/${tool.slug}`}
                                    className="block px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                                  >
                                    {tool.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="col-span-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400 dark:text-slate-500">Client-Side • No server upload</span>
                            <Link
                              href="/pdf-tools"
                              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View all {TOOLS_REGISTRY.length} PDF tools &rarr;
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

          {/* Actions: Theme Switcher, Zero-Upload Pill, CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <PwaInstallButton variant="pill" />
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 px-3 py-1.5 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Server Uploads</span>
            </div>
            <ThemeToggle />
            <Link href="/pdf-tools">
              <Button size="sm">Explore Tools</Button>
            </Link>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-base font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 px-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 p-2.5 rounded-xl font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero Server Uploads — Processed in Browser</span>
              </div>
              <PwaInstallButton className="w-full justify-center py-2.5 text-sm" />
              <Link href="/pdf-tools" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full min-h-[44px]">All {TOOLS_REGISTRY.length} PDF Tools</Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
