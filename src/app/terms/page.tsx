'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { PublicCta } from '@/components/public-cta';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 transition-colors">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20 border-b border-border/60">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 dark:bg-rose-950/20 blur-[130px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-xs text-xs font-semibold text-primary mb-5">
              <FileText className="w-4 h-4" />
              <span>User Agreement & Conditions</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
              Terms of Service
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Please review these terms governing your access and usage of the DuoChat private
              communication platform.
            </p>

            <p className="mt-3 text-xs text-muted-foreground/80 font-mono">
              Effective Date: October 2026 • Version 1.8
            </p>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-12 sm:py-16 bg-muted/20 border-b border-border/60">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-primary flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">Mutual Consent</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  DuoChat is an intimate 1-on-1 space founded on mutual trust and bilateral consent.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">Respect & Safety</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Harassment, non-consensual sharing, or illegal content will result in immediate termination.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">Account Safety</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are responsible for keeping your credentials and private invitation tokens secure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Terms */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-10 text-left">
            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-foreground">
                1. Acceptance of Agreement
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By creating an account or accessing DuoChat, you confirm that you are at least 13 years
                of age (or the minimum legal age in your jurisdiction) and agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the application.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-foreground">
                2. Intended Use & Boundaries
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                DuoChat is engineered strictly for private personal communication between two consenting
                individuals. You agree never to use the service for commercial spamming, bulk
                distribution, impersonation, or transmitting abusive, harmful, or unlawful materials.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-foreground">
                3. Your Content & Intellectual Property
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You retain complete ownership over all messages, romantic notes, voice clips, and photos
                transmitted through DuoChat. DuoChat does not claim intellectual property rights over
                any user-generated content.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-foreground">
                4. Service Availability & Modifications
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We strive for 99.9% uptime and dependable real-time messaging. However, DuoChat is
                provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We reserve the
                right to update, enhance, or temporarily suspend features for scheduled maintenance.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-foreground">
                5. Termination & Deletion
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You may delete your account and clear all conversation records at any time directly in
                your settings. We reserve the right to suspend or terminate accounts that breach safety
                guidelines.
              </p>
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
