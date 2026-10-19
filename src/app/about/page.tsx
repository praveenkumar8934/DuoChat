'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, Sparkles, Music, ShieldCheck, ArrowRight, MessageSquareHeart } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { PublicCta } from '@/components/public-cta';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 transition-colors">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/60">
          {/* Subtle Ambient Background Gradient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 dark:bg-rose-950/20 blur-[130px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-xs text-xs font-semibold text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Our Mission & Story</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-foreground leading-[1.12]">
              A quiet room in a{' '}
              <span className="bg-gradient-to-r from-[#702C45] via-[#A84B69] to-[#C96B83] bg-clip-text text-transparent">
                very noisy world.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Modern messaging apps are built for group chaos, endless notifications, read receipts,
              and algorithmic distractions. DuoChat was created to do the opposite: slow down, strip
              away the noise, and give two people a private haven designed purely for them.
            </p>

            <div className="mt-8 flex justify-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-3.5 font-bold text-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Create Your Space</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* The 3 Core Philosophies */}
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">
                What makes DuoChat different
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Every feature was designed intentionally to nurture closeness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-7 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-primary flex items-center justify-center">
                  <Heart className="w-6 h-6 stroke-[2.2] fill-primary/20" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">Strictly 1-on-1</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  No public feeds, stories, follower counts, or group threads. Your attention belongs
                  to each other without third-party interruptions.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <MessageSquareHeart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">Little Notes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Special heartfelt notes formatted with parchment cards, bookmarks, and editorial
                  typography to cherish small affectionate moments.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3.5 hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">Total Privacy</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Signed media access, single-use invite tokens, and PostgreSQL RLS security ensure
                  your memories remain private by design.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <PublicCta />
      </main>

      <PublicFooter />
    </div>
  );
}
