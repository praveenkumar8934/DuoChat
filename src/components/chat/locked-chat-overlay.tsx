'use client';

import * as React from 'react';
import { Lock, ShieldCheck, KeyRound, Delete, ArrowLeft } from 'lucide-react';
import { usePrivacySettings } from '@/lib/privacy-features';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

interface LockedChatOverlayProps {
  conversationId: string;
  partnerName?: string;
  onUnlock?: () => void;
  onClose?: () => void;
}

export function LockedChatOverlay({
  conversationId,
  partnerName = 'Partner',
  onUnlock,
  onClose,
}: LockedChatOverlayProps) {
  const { appLockPin, setAppLockPin, unlockChatInSession } = usePrivacySettings();
  const [enteredPin, setEnteredPin] = React.useState('');
  const [errorShake, setErrorShake] = React.useState(false);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  // Fallback setup states if no PIN is set yet
  const [isSettingPin, setIsSettingPin] = React.useState(!appLockPin);
  const [setupPin, setSetupPin] = React.useState('');
  const [setupConfirm, setSetupConfirm] = React.useState('');
  const [setupError, setSetupError] = React.useState('');

  React.useEffect(() => {
    setIsSettingPin(!appLockPin);
  }, [appLockPin]);

  const verifyPin = React.useCallback(
    (pin: string) => {
      if (pin === appLockPin) {
        setIsUnlocked(true);
        setTimeout(() => {
          unlockChatInSession(conversationId);
          setEnteredPin('');
          setIsUnlocked(false);
          toast.success('Chat unlocked');
          onUnlock?.();
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
    },
    [appLockPin, conversationId, onUnlock, unlockChatInSession]
  );

  const handleDigit = React.useCallback(
    (digit: string) => {
      if (enteredPin.length < 4) {
        const nextPin = enteredPin + digit;
        setEnteredPin(nextPin);
        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
      }
    },
    [enteredPin, verifyPin]
  );

  const handleDelete = React.useCallback(() => {
    setEnteredPin(prev => prev.slice(0, -1));
  }, []);

  // Listen to physical keyboard input
  React.useEffect(() => {
    if (isSettingPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, isSettingPin, onClose]);

  const handleSaveSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      setSetupError('PIN must be exactly 4 digits');
      return;
    }
    if (setupPin !== setupConfirm) {
      setSetupError('PINs do not match');
      return;
    }
    setAppLockPin(setupPin);
    unlockChatInSession(conversationId);
    toast.success('PIN created and chat unlocked!');
    onUnlock?.();
  };

  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-xl transition-all duration-300 select-none relative overflow-hidden',
        isUnlocked && 'opacity-0 scale-95 pointer-events-none'
      )}
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-950/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-xs flex flex-col items-center space-y-5 text-center relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Lock Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10">
            {isUnlocked ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500 animate-in zoom-in" />
            ) : (
              <Lock className="w-8 h-8 animate-pulse text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground shadow-xs">
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-serif">
            Chat Locked
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
            {isSettingPin ? (
              <>Set a 4-digit PIN to lock and unlock this chat.</>
            ) : (
              <>
                This chat with <strong className="text-foreground">{partnerName}</strong> is locked. Enter your 4-digit PIN to open.
              </>
            )}
          </p>
        </div>

        {isSettingPin ? (
          <form onSubmit={handleSaveSetupPin} className="w-full space-y-3 pt-2">
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={setupPin}
                onChange={e => setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full text-center text-lg tracking-[0.5em] font-mono py-2 rounded-xl bg-card border border-border focus:border-emerald-500 outline-none"
                autoFocus
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Confirm 4-digit PIN"
                value={setupConfirm}
                onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full text-center text-lg tracking-[0.5em] font-mono py-2 rounded-xl bg-card border border-border focus:border-emerald-500 outline-none"
              />
            </div>
            {setupError && <p className="text-xs text-rose-500">{setupError}</p>}
            <div className="flex items-center gap-2 pt-2">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs">
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={setupPin.length !== 4 || setupConfirm.length !== 4}
                className="flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save & Unlock
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* 4 PIN Dots */}
            <div
              className={cn(
                'flex items-center justify-center gap-3.5 py-1 transition-transform',
                errorShake && 'animate-shake'
              )}
            >
              {[0, 1, 2, 3].map(index => {
                const isFilled = enteredPin.length > index;
                return (
                  <div
                    key={index}
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border transition-all duration-150',
                      isFilled
                        ? errorShake
                          ? 'bg-rose-500 border-rose-500 scale-110 shadow-xs shadow-rose-500/40'
                          : 'bg-emerald-500 border-emerald-500 scale-110 shadow-xs shadow-emerald-500/40'
                        : 'border-border bg-muted/40'
                    )}
                  />
                );
              })}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-12 rounded-2xl bg-card/80 hover:bg-muted border border-border/60 text-lg font-semibold text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-12 rounded-2xl bg-card/80 hover:bg-muted border border-border/60 text-lg font-semibold text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete last digit"
                className="h-12 rounded-2xl bg-card/80 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {onClose && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to chats</span>
                </Button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/80 pt-1">
              Only this specific conversation is locked
            </p>
          </>
        )}
      </div>
    </div>
  );
}
