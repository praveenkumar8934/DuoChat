'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const { isConfigured } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);

    if (!isConfigured) {
      // In preview/demo mode, transition directly to chat
      setTimeout(() => {
        setIsLoading(false);
        router.push(redirectTo);
      }, 500);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      } else {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Sign in failed');
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setValue('email', 'alex@duochat.local');
    setValue('password', 'SecretPassword123');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Bar */}
      <header className="p-4 flex items-center justify-between border-b border-border/40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-base">DuoChat</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-xs text-muted-foreground">
              Sign in to your private conversation space
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xl space-y-5">
            {authError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
                {authError}
              </div>
            )}

            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Preview Mode Active
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Supabase keys are not set yet. You can sign in with any email to explore!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="shrink-0 text-[11px] underline font-medium hover:opacity-80"
                >
                  Fill Demo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
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
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full rounded-xl font-medium shadow-sm mt-2"
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-border/50 text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Create one
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
