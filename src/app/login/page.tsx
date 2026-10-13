'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  UserPlus,
  KeyRound,
  Zap,
  ClipboardPaste,
  ShieldCheck,
} from 'lucide-react';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/chat';
  const initialEmail = searchParams.get('email') || '';
  const initialError = searchParams.get('error_description') || searchParams.get('error') || null;
  const initialMethod = searchParams.get('method') === 'secret-key' ? 'secret-key' : 'password';
  const initialKey = searchParams.get('key') || '';

  const { isConfigured } = useAuth();

  const [activeTab, setActiveTab] = React.useState<'password' | 'secret-key'>(initialMethod);
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(initialError);
  const [isNotRegistered, setIsNotRegistered] = React.useState(false);
  const [attemptedEmail, setAttemptedEmail] = React.useState(initialEmail);
  const [isLoading, setIsLoading] = React.useState(false);

  // Secret Key form state
  const [secretKeyInput, setSecretKeyInput] = React.useState(initialKey);
  const [showSecretKeyInput, setShowSecretKeyInput] = React.useState(true);
  const [isSecretKeyLoading, setIsSecretKeyLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: '',
    },
  });

  const handleTabChange = (tab: 'password' | 'secret-key') => {
    setActiveTab(tab);
    setAuthError(null);
    setIsNotRegistered(false);
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSecretKeyInput(text.trim());
      }
    } catch {
      // Browser permission denied or unavailable
    }
  };

  // Standard Email & Password Login
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    setIsNotRegistered(false);
    const cleanEmail = data.email.trim();
    setAttemptedEmail(cleanEmail);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: data.password,
      });

      if (error) {
        // Check if the user exists in database
        try {
          const checkRes = await fetch('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail }),
          });
          const checkData = await checkRes.json();

          if (checkData.exists === false) {
            setIsNotRegistered(true);
            setAuthError(
              'No account found with this email. You are not registered yet. Please create an account first before logging in.'
            );
            setIsLoading(false);
            return;
          }
        } catch (checkErr) {
          console.warn('Unable to verify user registration status:', checkErr);
        }

        // User is registered, but credentials failed
        const lowerMsg = (error.message || '').toLowerCase();
        if (lowerMsg.includes('invalid login credentials')) {
          setAuthError('Incorrect password. Please verify your password and try again.');
        } else if (lowerMsg.includes('email not confirmed')) {
          setAuthError('Your email address has not been confirmed yet. Please check your inbox.');
        } else {
          setAuthError(error.message);
        }
        setIsLoading(false);
      } else {
        router.push(redirectTo);
      }
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
    setIsNotRegistered(false);

    try {
      const res = await fetch('/api/auth/secret-key-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: cleanKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Failed to sign in with Secret Key.');
        setIsSecretKeyLoading(false);
        return;
      }

      // Establish client-side Supabase session immediately
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

      // Redirect user directly into application
      window.location.href = redirectTo;
    } catch (err: unknown) {
      setAuthError((err as Error)?.message || 'Could not verify Secret Key. Please try again.');
      setIsSecretKeyLoading(false);
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
            <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              Sign in to your private conversation space
            </p>
          </div>

          <div className="p-6 sm:p-7 rounded-3xl bg-card/90 border border-border/80 shadow-2xl space-y-5 backdrop-blur-md">
            {/* Login Mode Segmented Switcher */}
            <div className="p-1 rounded-2xl bg-muted/60 border border-border/50 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleTabChange('password')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'password'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('secret-key')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'secret-key'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                <span>Secret Key</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-primary/15 text-primary">
                  Fast
                </span>
              </button>
            </div>

            {authError && (
              <div
                className={`p-4 rounded-2xl text-xs border space-y-2.5 ${
                  isNotRegistered
                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30'
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
                  <p className="font-medium leading-relaxed">{authError}</p>
                </div>

                {isNotRegistered && (
                  <div className="pt-1 flex items-center gap-2">
                    <Link
                      href={`/signup?email=${encodeURIComponent(attemptedEmail)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white dark:bg-amber-500 hover:opacity-95 font-semibold text-xs shadow-xs transition-opacity cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account Now</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: PASSWORD & GOOGLE LOGIN */}
            {activeTab === 'password' && (
              <>
                {/* Google Sign In Option */}
                <div className="space-y-4">
                  <GoogleSignInButton
                    text="Continue with Google"
                    redirectTo={redirectTo}
                    onError={(err) => {
                      setIsNotRegistered(false);
                      setAuthError(err);
                    }}
                  />

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative px-3 bg-card text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                      or sign in with email
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      {...register('password')}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-2xl font-semibold shadow-md mt-3 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white hover:opacity-95 cursor-pointer"
                  >
                    Sign In to Our Space
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              </>
            )}

            {/* TAB 2: INSTANT SECRET KEY LOGIN */}
            {activeTab === 'secret-key' && (
              <form onSubmit={onSecretKeySubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Passwordless Access</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Enter the personal Secret Key you created in your profile settings to jump straight into DuoChat without passwords.
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
                    type={showSecretKeyInput ? 'text' : 'password'}
                    placeholder="Enter your Secret Key"
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4 text-muted-foreground" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowSecretKeyInput(!showSecretKeyInput)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={showSecretKeyInput ? 'Hide secret key' : 'Show secret key'}
                      >
                        {showSecretKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    className="rounded-xl font-mono text-sm"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter the secret phrase or key you saved in your Profile.
                  </p>
                </div>

                <Button
                  type="submit"
                  isLoading={isSecretKeyLoading}
                  className="w-full rounded-2xl font-semibold shadow-md mt-3 bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white hover:opacity-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  Sign In with Secret Key
                  <ArrowRight className="w-4 h-4 ml-1.5" />
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
                  , or create one in your Profile Settings after signing in.
                </div>
              </form>
            )}

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
