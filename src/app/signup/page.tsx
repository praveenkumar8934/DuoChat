'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Sparkles,
} from 'lucide-react';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
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
      email: '',
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

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setIsLoading(false);
        router.push('/chat');
      }, 500);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
            username: data.username.toLowerCase(),
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      } else if (authData.session) {
        router.push('/chat');
      } else {
        setSignupSuccess(true);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Sign up failed');
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[380px] bg-rose-500/10 dark:bg-rose-950/20 blur-[130px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
              Your own little world starts here.
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              A private space for the messages, memories, and moments you share.
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-card/90 border border-border/80 shadow-2xl space-y-5 backdrop-blur-md">
            {signupSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-semibold text-foreground">Check your email</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We&apos;ve sent a confirmation link to your inbox. Once verified, you can sign in and start your private conversation.
                </p>
                <Link href="/login" className="inline-block mt-2">
                  <Button size="sm" className="rounded-xl">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {authError && (
                  <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Your Name / Nickname
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Alex"
                      leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
                      error={errors.displayName?.message}
                      className="rounded-xl"
                      {...register('displayName')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Username
                    </label>
                    <Input
                      type="text"
                      placeholder="alex"
                      leftIcon={<AtSign className="w-4 h-4 text-muted-foreground" />}
                      error={errors.username?.message}
                      className="rounded-xl"
                      {...register('username')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
                      error={errors.email?.message}
                      className="rounded-xl"
                      {...register('email')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
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
                      {...register('password')}
                    />

                    {/* Password Strength Checklist */}
                    {passwordVal && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <span className={hasLength ? 'text-emerald-500 font-medium' : ''}>
                          ✓ 8+ characters
                        </span>
                        <span className={hasUpper ? 'text-emerald-500 font-medium' : ''}>
                          ✓ Uppercase letter
                        </span>
                        <span className={hasLower ? 'text-emerald-500 font-medium' : ''}>
                          ✓ Lowercase letter
                        </span>
                        <span className={hasNumber ? 'text-emerald-500 font-medium' : ''}>
                          ✓ Number
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Confirm Password
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
                      error={errors.confirmPassword?.message}
                      className="rounded-xl"
                      {...register('confirmPassword')}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-2xl font-semibold shadow-md mt-4 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white hover:opacity-95 cursor-pointer"
                  >
                    Create Our Account
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>

                <div className="text-center pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in here
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
