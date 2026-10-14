'use client';

import * as React from 'react';
import { Lock, ShieldCheck, Delete, ArrowRight, LogOut, KeyRound } from 'lucide-react';
import { usePrivacySettings } from '@/lib/privacy-features';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export function AppLockOverlay() {
  const { appLockPin, appLocked, setAppLocked } = usePrivacySettings();
  const { signOut } = useAuth();

  const [enteredPin, setEnteredPin] = React.useState('');
  const [errorShake, setErrorShake] = React.useState(false);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  const { screenshotAlert } = usePrivacySettings();

  // Global Screenshot Caution Listener
  React.useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!screenshotAlert) return;
      if (
        e.key === 'PrintScreen' ||
        (e.key?.toLowerCase() === 's' && (e.metaKey || e.ctrlKey) && e.shiftKey)
      ) {
        toast.info('📸 Screenshot noticed: Please keep private moments between each other.');
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [screenshotAlert]);

  // If no PIN is configured or app is not in locked state, don't show overlay
  if (!appLockPin || !appLocked) {
    return null;
  }

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const verifyPin = (pin: string) => {
    if (pin === appLockPin) {
      setIsUnlocked(true);
      setTimeout(() => {
        setAppLocked(false);
        setEnteredPin('');
        setIsUnlocked(false);
        toast.success('Chat unlocked');
      }, 300);
    } else {
      setErrorShake(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
      setTimeout(() => {
        setEnteredPin('');
        setErrorShake(false);
      }, 600);
      toast.error('Incorrect PIN');
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleForgotPin = async () => {
    if (window.confirm('To reset your PIN, you need to log out and sign in again. Continue?')) {
      await signOut();
      setAppLocked(false);
      window.location.href = '/login';
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background/95 backdrop-blur-2xl transition-all duration-300 select-none',
        isUnlocked && 'opacity-0 scale-98 pointer-events-none'
      )}
    >
      <div className="w-full max-w-xs flex flex-col items-center space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Lock Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
            {isUnlocked ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500 animate-in zoom-in" />
            ) : (
              <Lock className="w-8 h-8 animate-pulse" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-xs">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-serif">
            Chat Locked
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your 4-digit security PIN to access your chat
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div
          className={cn(
            'flex items-center justify-center gap-4 py-2 transition-transform',
            errorShake && 'animate-shake'
          )}
        >
          {[0, 1, 2, 3].map(index => {
            const isFilled = enteredPin.length > index;
            return (
              <div
                key={index}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all duration-200',
                  isFilled
                    ? errorShake
                      ? 'border-destructive bg-destructive scale-110'
                      : 'border-primary bg-primary scale-110 shadow-sm shadow-primary/40'
                    : 'border-muted-foreground/30 bg-muted/40'
                )}
              />
            );
          })}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-card hover:bg-muted/80 active:bg-primary/20 border border-border/80 text-foreground font-semibold text-xl transition-all shadow-2xs hover:scale-102 active:scale-95 flex items-center justify-center cursor-pointer select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEnteredPin('')}
            className="h-14 rounded-2xl bg-transparent hover:bg-muted/50 text-muted-foreground text-xs font-medium transition-colors flex items-center justify-center cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-card hover:bg-muted/80 active:bg-primary/20 border border-border/80 text-foreground font-semibold text-xl transition-all shadow-2xs hover:scale-102 active:scale-95 flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-card hover:bg-muted/80 active:bg-destructive/20 border border-border/80 text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:scale-102 active:scale-95 flex items-center justify-center cursor-pointer select-none"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/40 w-full flex items-center justify-center">
          <button
            type="button"
            onClick={handleForgotPin}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Forgot PIN? Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
