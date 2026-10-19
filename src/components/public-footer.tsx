'use client';

import * as React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/ui/brand-logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 py-12 bg-card/30 transition-colors">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-border/50">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3 text-left">
            <BrandLogo size="md" href="/" />
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">
              An intimate, private messaging sanctuary crafted exclusively for couples and soulmates.
              Stay close with daily thoughts, Little Notes, music, and treasured moments.
            </p>
            <p className="font-serif italic text-xs text-primary pt-1">
              &quot;A little closer, even when we&apos;re apart.&quot;
            </p>
          </div>

          {/* Nav Links Column 1: Platform */}
          <div className="md:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About DuoChat
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-foreground transition-colors">
                  Couple Features
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-foreground transition-colors">
                  Safety & Boundaries
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links Column 2: Legal & Account */}
          <div className="md:col-span-4 space-y-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Legal & Account
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign In to DuoChat
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">
                  Create Space
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="text-[11px] font-sans">
            © {new Date().getFullYear()} DuoChat. Made with love for couples.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link href="/safety" className="hover:underline">
              Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
