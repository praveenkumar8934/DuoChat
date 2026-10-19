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
  Shield,
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

  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(initialError);
  const [isLoading, setIsLoading] = React.useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-rose-500/20">
      {/* Top Bar */}
      <header className="p-4 flex items-center justify-between border-b border-border/40">
        <BrandLogo size="md" href="/" />
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-rose-500/10 dark:bg-rose-950/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Encrypted & Private</span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              Sign in with your Account ID and password to access DuoChat
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-card/90 border border-border/80 shadow-2xl space-y-5 backdrop-blur-md">
            {authError && (
              <div className="p-4 rounded-2xl text-xs border space-y-2.5 bg-destructive/10 text-destructive border-destructive/20">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                  <p className="font-medium leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            {/* Google Sign In Option */}
            <div className="space-y-4">
              <GoogleSignInButton
                text="Continue with Google"
                redirectTo={redirectTo}
                onError={(err) => setAuthError(err)}
              />

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative px-3 bg-card text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  or sign in with Account ID
                </div>
              </div>
            </div>

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
                  className="rounded-xl"
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
                    className="text-xs text-primary hover:underline font-medium"
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
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  className="rounded-xl"
                  autoComplete="current-password"
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full rounded-2xl font-semibold shadow-md mt-3 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white hover:opacity-95 cursor-pointer"
              >
                Sign In to DuoChat
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-border/50 text-xs text-muted-foreground">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create one together
              </Link>
            </div>
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
