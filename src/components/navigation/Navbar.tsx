'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ShieldCheck, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS_REGISTRY } from '@/data/tools';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: 'Tools', href: '/pdf-tools', hasDropdown: true },
    { label: 'Guides', href: '/guides' },
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-[#fcfbf9]/90 dark:bg-[#0b0e14]/90 backdrop-blur-md shadow-xs transition-colors">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-7">
            <BrandLogo linkHref="/" variant="compact" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1.5" aria-label="Main Navigation">
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-1 transition-all ${
                          isActive
                            ? 'text-stone-950 dark:text-stone-50 bg-stone-200/60 dark:bg-stone-800/60'
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-50 hover:bg-stone-100/70 dark:hover:bg-stone-800/40'
                        }`}
                      >
                        <span>{link.label}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </Link>

                      {/* Megamenu Dropdown: Paper Universe Styling */}
                      {toolsDropdownOpen && (
                        <div className="absolute top-full left-0 w-[640px] p-5 paper-sheet bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200/90 dark:border-stone-800 grid grid-cols-3 gap-4 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                          {TOOL_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="space-y-1.5">
                              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2">
                                {cat.name}
                              </h4>
                              <div className="space-y-0.5">
                                {TOOLS_REGISTRY.filter((t) => t.category === cat.id).slice(0, 4).map((tool) => (
                                  <Link
                                    key={tool.slug}
                                    href={`/pdf-tools/${tool.slug}`}
                                    className="block px-2 py-1.5 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors truncate"
                                  >
                                    {tool.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                          <div className="col-span-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-stone-400 dark:text-stone-500 text-[11px]">
                              Client-Side • Air-gapped RAM processing
                            </span>
                            <Link
                              href="/pdf-tools"
                              className="font-semibold text-stone-900 dark:text-stone-100 hover:underline flex items-center gap-1"
                            >
                              <span>View all {TOOLS_REGISTRY.length} tools</span>
                              <ArrowRight className="w-3 h-3" />
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                      isActive
                        ? 'text-stone-950 dark:text-stone-50 bg-stone-200/60 dark:bg-stone-800/60'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-50 hover:bg-stone-100/70 dark:hover:bg-stone-800/40'
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
            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-700 dark:text-stone-300 bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 px-3 py-1.5 rounded-full font-medium shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero Server Uploads</span>
            </div>
            <ThemeToggle />
            <Link href="/pdf-tools">
              <Button
                size="sm"
                className="bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 font-mono text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-xl shadow-xs"
              >
                Explore Tools
              </Button>
            </Link>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="flex sm:hidden items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-mono uppercase tracking-wider font-semibold rounded-lg text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 px-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono text-stone-700 dark:text-stone-300 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 p-2.5 rounded-xl font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero Server Uploads — Processed in Browser</span>
              </div>
              <PwaInstallButton className="w-full justify-center py-2.5 text-sm" />
              <Link href="/pdf-tools" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full min-h-[44px] bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 font-mono text-xs uppercase tracking-wider">
                  All {TOOLS_REGISTRY.length} PDF Tools
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
