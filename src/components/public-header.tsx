'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export function PublicHeader() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
      <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
        <BrandLogo size="md" href="/" />

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-muted-foreground">
          <Link
            href="/about"
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/safety"
            className="hover:text-foreground transition-colors"
          >
            Safety
          </Link>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <Link href="/chat">
              <Button
                size="sm"
                className="rounded-full text-xs font-semibold shadow-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 transition-all inline-flex items-center gap-1.5 px-4"
              >
                <span>Open Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="rounded-full text-xs font-semibold shadow-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 transition-all px-4"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border/60 bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2 text-xs font-semibold text-muted-foreground">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              About DuoChat
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Couple Features
            </Link>
            <Link
              href="/safety"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Safety & Boundaries
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </nav>

          <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
            {user ? (
              <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-full py-2.5 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white font-semibold text-xs">
                  Open Chat
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full py-2.5 text-xs font-medium">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-full py-2.5 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white font-semibold text-xs">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
