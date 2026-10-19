'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Zap,
  ClipboardPaste,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Please enter your Account ID (username or email)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginInputs = z.infer<typeof loginFormSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const initialEmail = searchParams.get('email') || '';
  const initialError = searchParams.get('error_description') || searchParams.get('error') || null;
  const initialMethod = searchParams.get('method') === 'secret-key' ? 'secret-key' : 'password';
  const initialKey = searchParams.get('key') || '';

  const [activeTab, setActiveTab] = React.useState<'password' | 'secret-key'>(initialMethod);
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(initialError);
  const [isLoading, setIsLoading] = React.useState(false);

  // Secret Key Login State
  const [secretKeyInput, setSecretKeyInput] = React.useState(initialKey);
  const [isSecretKeyLoading, setIsSecretKeyLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: initialEmail,
      password: '',
    },
  });

  const handleTabChange = (tab: 'password' | 'secret-key') => {
    setActiveTab(tab);
    setAuthError(null);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSecretKeyInput(text.trim().toUpperCase());
      }
    } catch {
      // Browser permission denied or unavailable
    }
  };

  // Standard Account ID & Password Login
  const onSubmit = async (data: LoginInputs) => {
    setIsLoading(true);
    setAuthError(null);
    const cleanIdentifier = data.identifier.trim();

    try {
      // 1. Authenticate via server-side endpoint with IP rate-limiting & ID resolution
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setAuthError(
          resData.error || 'Incorrect ID or password. Please verify your credentials and try again.'
        );
        setIsLoading(false);
        return;
      }

      // 2. Also sync client Supabase session if email returned
      if (resData.email) {
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.signInWithPassword({
            email: resData.email,
            password: data.password,
          });
        } catch {
          // Server session cookies already set
        }
      }

      // 3. Redirect to destination
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Instant Secret Key Login
  const onSecretKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = secretKeyInput.trim();

    if (!cleanKey) {
      setAuthError('Please enter or paste your Secret Key.');
      return;
    }

    setIsSecretKeyLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/secret-key-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: cleanKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(
          data.error || 'Invalid Secret Key. Please verify your key from profile settings.'
        );
        setIsSecretKeyLoading(false);
        return;
      }

      // Sync client-side session if tokenHash returned
      if (data.tokenHash) {
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.verifyOtp({
            token_hash: data.tokenHash,
            type: 'magiclink',
          });
        } catch (otpErr) {
          console.warn('Client-side OTP verification fallback:', otpErr);
        }
      }

      // Redirect into app
      window.location.href = redirectTo;
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Secret Key authentication failed. Please try again.');
      setIsSecretKeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 relative overflow-hidden transition-colors">
      {/* Luminous Ambient Background Glows centered behind the glass card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#702C45]/20 via-[#A84B69]/25 to-[#C96B83]/20 dark:from-[#702C45]/30 dark:via-[#A84B69]/35 dark:to-[#C96B83]/25 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-12 -left-20 w-[380px] h-[380px] bg-rose-400/20 dark:bg-rose-900/25 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute bottom-12 -right-20 w-[400px] h-[400px] bg-violet-400/20 dark:bg-violet-900/25 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between container mx-auto max-w-6xl relative z-10">
        <BrandLogo size="md" href="/" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Glassmorphic Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-2 sm:my-6">
        <div className="w-full max-w-[440px] space-y-5">
          {/* Header Title & Pill */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 backdrop-blur-md shadow-xs text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Private & Intimate Space</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sign in to your private sanctuary to continue chatting
            </p>
          </div>

          {/* Frosted Glass Card */}
          <div className="relative rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/80 dark:bg-slate-900/80 border border-white/70 dark:border-white/10 shadow-[0_20px_50px_rgba(112,44,69,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/5 transition-all">
            {/* Top Glossy Highlight Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

            {/* Segmented Login Mode Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/70 backdrop-blur-md mb-6 border border-border/50 text-xs font-semibold text-center">
              <button
                type="button"
                onClick={() => handleTabChange('password')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'password'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Account ID</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('secret-key')}
                className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'secret-key'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Secret Key</span>
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-5 p-4 rounded-2xl text-xs border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                <p className="font-medium leading-relaxed">{authError}</p>
              </div>
            )}

            {/* TAB 1: ACCOUNT ID & PASSWORD + GOOGLE */}
            {activeTab === 'password' && (
              <>
                {/* Google Quick Sign-In */}
                <div className="space-y-4 mb-5">
                  <GoogleSignInButton
                    text="Continue with Google"
                    redirectTo={redirectTo}
                    onError={(err) => setAuthError(err)}
                  />

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/80" />
                    </div>
                    <div className="relative px-3 bg-card/90 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
                      or sign in with Account ID
                    </div>
                  </div>
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Account ID or Email
                    </label>
                    <Input
                      type="text"
                      placeholder="Username (e.g. praveen) or email"
                      leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
                      error={errors.identifier?.message}
                      className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-sm"
                      autoComplete="username"
                      {...register('identifier')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline font-medium transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.password?.message}
                      className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-sm"
                      autoComplete="current-password"
                      {...register('password')}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-full py-3.5 font-bold text-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2 mt-2"
                  >
                    Sign In to DuoChat
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </>
            )}

            {/* TAB 2: INSTANT SECRET KEY LOGIN */}
            {activeTab === 'secret-key' && (
              <form onSubmit={onSecretKeySubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Passwordless Access</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Paste your personal Secret Key below to jump straight into your chat without entering your password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Your Secret Key
                    </label>
                    <button
                      type="button"
                      onClick={handlePasteKey}
                      className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Paste from clipboard
                    </button>
                  </div>

                  <Input
                    type="text"
                    placeholder="Enter your secret key"
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
                    className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all font-mono tracking-wider text-sm"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isSecretKeyLoading}
                  className="w-full rounded-full py-3.5 font-bold text-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2 mt-2"
                >
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Sign In with Secret Key
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <div className="pt-2 text-center text-xs text-muted-foreground leading-relaxed">
                  Lost or don&apos;t have a Secret Key yet?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange('password')}
                    className="font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Use Password instead
                  </button>
                  , or generate one in your Profile Settings after signing in.
                </div>
              </form>
            )}

            {/* Bottom Card Footer */}
            <div className="text-center pt-5 mt-5 border-t border-border/60 text-xs text-muted-foreground">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="font-bold text-primary hover:underline">
                Create one together
              </Link>
            </div>
          </div>

          {/* Privacy & Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-end private • Zero trackers</span>
            <span>•</span>
            <Link href="/privacy" className="hover:underline hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-sm">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
