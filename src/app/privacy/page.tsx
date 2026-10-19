'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Trash2,
  Download,
  KeyRound,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { PublicCta } from '@/components/public-cta';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 transition-colors">
      <PublicHeader />

      <main className="flex-1">
        {/* Header Hero */}
        <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20 border-b border-border/60">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-rose-500/10 dark:bg-rose-950/20 blur-[130px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 shadow-xs text-xs font-semibold text-primary mb-5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Zero-Surveillance Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
              Privacy & Data Protection Policy
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your conversations are sacred. DuoChat is built specifically so that what you share
              with your favorite person stays strictly between the two of you.
            </p>

            <p className="mt-3 text-xs text-muted-foreground/80 font-mono">
              Last updated: October 2026 • Version 2.4
            </p>
          </div>
        </section>

        {/* Core Privacy Pillars Grid */}
        <section className="py-12 sm:py-16 bg-muted/20 border-b border-border/60">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">
                  Isolated by Design
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PostgreSQL Row Level Security (RLS) ensures only authenticated members of a
                  pair can access shared messages, notes, and photos.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">
                  No Ad Tracking or Selling
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We never display third-party advertisements, sell user profiles, or train
                  generative AI models on your private messages or voice clips.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-3 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-primary flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-base text-foreground">
                  Full Data Control
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Delete individual messages, clear your entire conversation history with one click,
                  or export a keepsake PDF anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Policy Sections */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-12 text-left">
            {/* Section 1 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center justify-center">
                  1
                </span>
                Information We Collect & Why
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  To provide you with a reliable real-time communication platform, we collect only the
                  minimum data necessary:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Account Information:</strong> Your display name, chosen username, and email
                    address to manage authentication and allow your partner to recognize you.
                  </li>
                  <li>
                    <strong className="text-foreground">Communications Data:</strong> Text messages, romantic Little Notes, and
                    media attachments shared in your private chat threads.
                  </li>
                  <li>
                    <strong className="text-foreground">Presence & Connection Status:</strong> Ephemeral online/offline status
                    signaling transmitted via WebSockets to let your partner know when you are active.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center justify-center">
                  2
                </span>
                Cryptographic Storage & Security
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  All data in transit is protected by strict TLS 1.3 encryption. Media uploads
                  (photos, audio recordings, song files) are stored in private Supabase Storage buckets
                  accessible strictly via cryptographically signed URLs with short token lifespans.
                </p>
                <p>
                  Passwords are never stored in plaintext; they are salted and hashed using industry-standard
                  cryptographic algorithms before ever touching our database.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center justify-center">
                  3
                </span>
                Your Rights & Data Export
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  You own your conversation. DuoChat provides direct in-app tools for complete control:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                    <Download className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">PDF Chat Export</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Download your cherished memory archives and Little Notes as a formatted keepsake PDF.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3">
                    <Trash2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-foreground">Instant Chat Wipe</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Permanently purge all shared messages across both participants whenever desired.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center justify-center">
                  4
                </span>
                Contact & Inquiries
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If you have questions regarding this Privacy Policy, your account data, or wish to submit
                a formal deletion request, please reach out to our privacy team at{' '}
                <a
                  href="mailto:privacy@duochat.app"
                  className="text-primary font-semibold hover:underline"
                >
                  privacy@duochat.app
                </a>.
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
