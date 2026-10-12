'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquare,
  Mail,
  Lock,
  User,
  AtSign,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

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
        // Confirmation email required by Supabase settings
        setSignupSuccess(true);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Sign up failed');
      setIsLoading(false);
    }
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
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-xs text-muted-foreground">
              Set up your profile to connect with your friend
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xl space-y-5">
            {authError && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
                {authError}
              </div>
            )}

            {signupSuccess ? (
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <h3 className="font-bold text-sm">Account created!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please check your email inbox to verify your account, then sign in to begin messaging.
                </p>
                <Link href="/login">
                  <Button size="sm" className="mt-2 rounded-xl">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Display Name
                  </label>
                  <Input
                    placeholder="e.g. Alex Rivera"
                    leftIcon={<User className="w-4 h-4" />}
                    error={errors.displayName?.message}
                    {...register('displayName')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Username
                  </label>
                  <Input
                    placeholder="e.g. alex_rivera"
                    leftIcon={<AtSign className="w-4 h-4" />}
                    error={errors.username?.message}
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
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
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

                  {/* Password requirements feedback */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-muted-foreground">
                    <span className={hasLength ? 'text-emerald-500 font-medium' : ''}>
                      • 8+ characters
                    </span>
                    <span className={hasUpper ? 'text-emerald-500 font-medium' : ''}>
                      • 1 uppercase letter
                    </span>
                    <span className={hasLower ? 'text-emerald-500 font-medium' : ''}>
                      • 1 lowercase letter
                    </span>
                    <span className={hasNumber ? 'text-emerald-500 font-medium' : ''}>
                      • 1 number
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full rounded-xl font-medium shadow-sm mt-3"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-border/50 text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
