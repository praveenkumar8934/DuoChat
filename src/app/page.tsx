'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ShieldCheck,
  Music,
  Image as ImageIcon,
  Film,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">DuoChat</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-xl font-medium shadow-xs">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
            {/* Private Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-6 animate-in fade-in duration-300">
              <Lock className="w-3.5 h-3.5" />
              <span>Invite-Only Private Real-Time Messenger</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.15]">
              Your conversations.{' '}
              <span className="text-primary">Your memories.</span>{' '}
              One private space.
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Designed exclusively for two people to talk without noise. Share text, photos, songs, voice recordings, videos, and documents in a secure, distraction-free environment.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-xl gap-2 font-semibold shadow-md">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/chat" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-xl gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Live Preview
                </Button>
              </Link>
            </div>

            {/* Interactive Preview Mockup */}
            <div className="mt-14 max-w-3xl mx-auto rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-4 sm:p-6 shadow-2xl text-left">
              {/* Preview Window Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-xs">
                    SC
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Sarah Chen</h3>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                    Encrypted Session
                  </span>
                </div>
              </div>

              {/* Sample Messages */}
              <div className="py-6 space-y-3.5">
                {/* Incoming Bubble */}
                <div className="flex flex-col items-start max-w-md">
                  <div className="rounded-2xl rounded-bl-xs p-3.5 bg-muted/90 text-foreground border border-border/40 text-xs sm:text-sm shadow-xs">
                    Hey! Did you hear the acoustic track I recorded this morning? 🎸
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-1 font-mono">10:42 AM</span>
                </div>

                {/* Outgoing Audio Bubble */}
                <div className="flex flex-col items-end ml-auto max-w-md">
                  <div className="rounded-2xl rounded-br-xs p-3.5 bg-primary text-primary-foreground text-xs sm:text-sm shadow-sm space-y-2">
                    <p>Yes, loved the chorus chords! Here is take #2 with drums:</p>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/20 text-white">
                      <div className="w-7 h-7 rounded-full bg-white text-primary flex items-center justify-center font-bold text-xs">
                        ▶
                      </div>
                      <div className="flex-1">
                        <div className="h-1.5 bg-white/40 rounded-full overflow-hidden">
                          <div className="w-2/3 h-full bg-white rounded-full" />
                        </div>
                      </div>
                      <span className="text-[10px] font-mono">1:48</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 mr-1 font-mono">
                    <span>10:44 AM</span>
                    <span className="text-primary font-bold">✓✓</span>
                  </div>
                </div>

                {/* Incoming photo with reaction */}
                <div className="flex flex-col items-start max-w-sm">
                  <div className="rounded-2xl rounded-bl-xs p-2 bg-muted/90 border border-border/40 shadow-xs space-y-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80"
                      alt="Preview sunset"
                      className="rounded-xl w-full h-36 object-cover"
                    />
                    <p className="text-xs px-1 text-foreground">Listening to it from this spot 🌅</p>
                  </div>
                  <div className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-full bg-card border border-border text-xs shadow-xs">
                    <span>❤️</span>
                    <span className="text-[10px] font-mono text-muted-foreground">1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars Section */}
        <section className="py-16 border-t border-border/60 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Built specifically for genuine connection
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                No endless group chats, no algorithmic feeds, and no random messages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base">Invite-Only Security</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Connect through cryptographically generated, single-use invitation tokens. Conversations are strictly isolated to authorized participants.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base">Rich Media & Sound</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Send high-resolution photos, MP3 songs, video files, documents, and record quick voice messages straight from your microphone.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base">Instant Real-Time Sync</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Real-time delivery receipts, read statuses, live typing pulses, and emoji reactions with persistent cloud storage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 bg-card/40">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
              D
            </div>
            <span>DuoChat — Private Two-Person Real-Time Messaging</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Create Account
            </Link>
            <Link href="/chat" className="hover:text-foreground transition-colors">
              App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
