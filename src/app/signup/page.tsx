'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  User,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialError = searchParams.get('error_description') || searchParams.get('error') || null;

  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(initialError);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [signupSuccess, setSignupSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: initialEmail,
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password', '');
  const hasLength = passwordVal.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordVal);
  const hasLower = /[a-z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setAuthError(null);
    setIsAlreadyRegistered(false);

    try {
      const cleanEmail = data.email.trim();

      // 1. Server-side registration with auto-confirm
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: data.password,
          displayName: data.displayName.trim(),
          username: data.username.toLowerCase().trim(),
        }),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        const errorType = resData.error;
        const msg = resData.message || resData.error || 'Registration failed';

        if (errorType === 'both_exist' || errorType === 'email_exists') {
          setIsAlreadyRegistered(true);
        } else {
          setIsAlreadyRegistered(false);
        }

        setAuthError(msg);
        setIsLoading(false);
        return;
      }

      // 2. Account successfully created & auto-confirmed: log in directly
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: data.password,
      });

      if (!signInError) {
        router.push('/chat');
        return;
      }

      setSignupSuccess(true);
      setIsLoading(false);
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20 relative overflow-hidden transition-colors">
      {/* Luminous Ambient Background Glows centered behind the glass card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#702C45]/20 via-[#A84B69]/25 to-[#C96B83]/20 dark:from-[#702C45]/30 dark:via-[#A84B69]/35 dark:to-[#C96B83]/25 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-12 -right-20 w-[380px] h-[380px] bg-rose-400/20 dark:bg-rose-900/25 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute bottom-12 -left-20 w-[400px] h-[400px] bg-violet-400/20 dark:bg-violet-900/25 rounded-full blur-[110px] pointer-events-none -z-10" />

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
        <div className="w-full max-w-[450px] space-y-5">
          {/* Header Title & Pill */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 backdrop-blur-md shadow-xs text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Created for Two</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
              Your own little world
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Create your private space and invite your favorite person
            </p>
          </div>

          {/* Frosted Glass Card */}
          <div className="relative rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-card/80 dark:bg-slate-900/80 border border-white/70 dark:border-white/10 shadow-[0_20px_50px_rgba(112,44,69,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/5 transition-all">
            {/* Top Glossy Highlight Line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent pointer-events-none" />

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/70 backdrop-blur-md mb-6 border border-border/50 text-xs font-semibold text-center">
              <Link
                href="/login"
                className="py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <span className="py-2 rounded-xl bg-card text-foreground shadow-xs cursor-default">
                Create Space
              </span>
            </div>

            {/* Success State */}
            {signupSuccess ? (
              <div className="p-6 rounded-2xl text-center space-y-4 bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-foreground">
                    Account Created Successfully!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your private sanctuary is ready. Sign in with your password to continue.
                  </p>
                </div>
                <Link href="/login" className="inline-block mt-2">
                  <Button className="rounded-full px-6 py-2.5 font-bold text-xs bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 shadow-md">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Error Banner */}
                {authError && (
                  <div className="mb-5 p-4 rounded-2xl text-xs border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                      <p className="font-medium leading-relaxed">{authError}</p>
                    </div>
                    {isAlreadyRegistered && (
                      <div className="pt-2 border-t border-red-500/20 flex items-center justify-between">
                        <span className="text-[11px] text-red-700 dark:text-red-300">
                          Already have this account?
                        </span>
                        <Link
                          href="/login"
                          className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Sign in here
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Sign-in */}
                <div className="space-y-4 mb-5">
                  <GoogleSignInButton
                    text="Sign up with Google"
                    redirectTo="/chat"
                    onError={(err) => setAuthError(err)}
                  />

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/80" />
                    </div>
                    <div className="relative px-3 bg-card/90 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
                      or register with details
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Display Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Praveen"
                        leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
                        error={errors.displayName?.message}
                        className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-xs sm:text-sm"
                        {...register('displayName')}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Username
                      </label>
                      <Input
                        type="text"
                        placeholder="unique_id"
                        leftIcon={<AtSign className="w-4 h-4 text-muted-foreground" />}
                        error={errors.username?.message}
                        className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-xs sm:text-sm"
                        autoCapitalize="none"
                        {...register('username')}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                      error={errors.email?.message}
                      className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-xs sm:text-sm"
                      autoComplete="email"
                      {...register('email')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
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
                      className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-xs sm:text-sm"
                      autoComplete="new-password"
                      {...register('password')}
                    />
                  </div>

                  {/* Password Checklist */}
                  {passwordVal && (
                    <div className="grid grid-cols-2 gap-1.5 p-3 rounded-2xl bg-muted/60 border border-border/60 text-[11px] animate-in fade-in duration-200">
                      <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                        <span>{hasLength ? '✓' : '○'}</span> 8+ chars
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                        <span>{hasUpper ? '✓' : '○'}</span> Uppercase
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                        <span>{hasLower ? '✓' : '○'}</span> Lowercase
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                        <span>{hasNumber ? '✓' : '○'}</span> Number
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Confirm Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                      error={errors.confirmPassword?.message}
                      className="rounded-2xl bg-background/60 dark:bg-background/40 backdrop-blur-md border-border/80 focus:bg-background transition-all text-xs sm:text-sm"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                    By signing up, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline font-medium">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>.
                  </p>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-full py-3.5 font-bold text-sm bg-gradient-to-tr from-[#702C45] via-[#A84B69] to-[#C96B83] text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center gap-2 mt-2"
                  >
                    Create Our Space
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </>
            )}

            {/* Bottom Card Footer */}
            <div className="text-center pt-5 mt-5 border-t border-border/60 text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Sign in
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

export default function SignupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FCFCFD] dark:bg-slate-950 text-slate-600 text-sm">
          Loading sign up...
        </div>
      }
    >
      <SignupForm />
    </React.Suspense>
  );
}
