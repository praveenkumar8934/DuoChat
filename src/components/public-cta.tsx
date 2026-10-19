'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

export function PublicCta() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-t border-border/60 bg-gradient-to-b from-transparent via-rose-500/[0.04] to-rose-500/[0.08] transition-colors">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-rose-500/10 dark:bg-rose-950/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your own private digital world</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
          Start your two-person sanctuary today
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          No public feeds, algorithmic distractions, or prying eyes. Just a calm, beautiful space designed for you and your favorite person.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {user ? (
            <Link href="/chat">
              <Button
                size="lg"
                className="rounded-full px-8 font-semibold shadow-md bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 transition-all inline-flex items-center gap-2"
              >
                <span>Enter Your Chat</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 font-semibold shadow-md bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 transition-all inline-flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Create Your Space</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-6 text-foreground hover:bg-muted/60 transition-colors"
                >
                  Sign In to DuoChat
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Badges */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>Row-Level Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero Advertising</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Forever Free for Couples</span>
          </div>
        </div>
      </div>
    </section>
  );
}
