'use client';

import * as React from 'react';
import Link from 'next/link';
import { Shield, Flag, Lock, EyeOff, UserCheck, HeartHandshake } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { PublicCta } from '@/components/public-cta';

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 transition-colors">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20 border-b border-border/60">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 dark:bg-rose-950/20 blur-[130px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-xs text-xs font-semibold text-primary mb-5">
              <Shield className="w-4 h-4 text-primary" />
              <span>Safety & Well-being First</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
              Safety, Boundaries & Trust
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We believe meaningful conversations can only happen in an environment where you feel
              completely safe, respected, and in total control.
            </p>
          </div>
        </section>

        {/* Safety Tools & Measures */}
        <section className="py-16 sm:py-24 bg-muted/20">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 text-left hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-primary flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">
                  Consensual Connections
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  You only connect with people through intentional invitations or accepted connection
                  requests. Strangers cannot randomly message, spam, or search your private profile.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 text-left hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">
                  Reporting & Swift Action
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  If someone behaves inappropriately, you can report and immediately sever the
                  connection. We maintain zero tolerance for harassment, exploitation, or abusive conduct.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 text-left hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">
                  App Lock & PIN Security
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Protect your chat from shoulder-surfers or shared devices. Enable the built-in PIN
                  App Lock to gate access behind a secure 4-digit code.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4 text-left hover:border-primary/40 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground">
                  Instant Memory Wipe
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Whenever you need a fresh start, one click cleanly wipes shared messages across both
                  devices, completely removing them from the server.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Public CTA Banner */}
        <PublicCta />
      </main>

      <PublicFooter />
    </div>
  );
}
