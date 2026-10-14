'use client';

import * as React from 'react';
import { Lock, ShieldCheck, KeyRound, Delete, X } from 'lucide-react';
import { usePrivacySettings } from '@/lib/privacy-features';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { ConversationWithDetails } from '@/types/chat';

interface LockedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationWithDetails | null;
  onUnlocked: (conversationId: string) => void;
}

export function LockedChatModal({
  isOpen,
  onClose,
  conversation,
  onUnlocked,
}: LockedChatModalProps) {
  const { appLockPin, setAppLockPin, unlockChatInSession } = usePrivacySettings();
  const [enteredPin, setEnteredPin] = React.useState('');
  const [errorShake, setErrorShake] = React.useState(false);
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  // Fallback setup states if no PIN has been set yet
  const [isSettingPin, setIsSettingPin] = React.useState(!appLockPin);
  const [setupPin, setSetupPin] = React.useState('');
  const [setupConfirm, setSetupConfirm] = React.useState('');
  const [setupError, setSetupError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setEnteredPin('');
      setErrorShake(false);
      setIsUnlocked(false);
      setIsSettingPin(!appLockPin);
      setSetupPin('');
      setSetupConfirm('');
      setSetupError('');
    }
  }, [isOpen, appLockPin]);

  const verifyPin = React.useCallback(
    (pin: string) => {
      if (!conversation) return;
      if (pin === appLockPin) {
        setIsUnlocked(true);
        setTimeout(() => {
          unlockChatInSession(conversation.id);
          setEnteredPin('');
          setIsUnlocked(false);
          toast.success('Chat unlocked');
          onUnlocked(conversation.id);
          onClose();
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
    [appLockPin, conversation, onClose, onUnlocked, unlockChatInSession]
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

  // Keyboard navigation for PIN entry
  React.useEffect(() => {
    if (!isOpen || isSettingPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSettingPin, handleDigit, handleDelete, onClose]);

  const handleSaveSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;
    if (setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      setSetupError('PIN must be exactly 4 digits');
      return;
    }
    if (setupPin !== setupConfirm) {
      setSetupError('PINs do not match');
      return;
    }
    setAppLockPin(setupPin);
    unlockChatInSession(conversation.id);
    toast.success('PIN created and chat unlocked!');
    onUnlocked(conversation.id);
    onClose();
  };

  if (!isOpen || !conversation) return null;

  const partner = conversation.otherUser;
  const partnerName = partner?.display_name || 'Partner';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      className="p-0 overflow-hidden border-border/80 shadow-2xl bg-background/95 backdrop-blur-xl"
    >
      <div className="p-6 flex flex-col items-center text-center relative select-none">
        {/* Close Button in corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

        {/* Partner Avatar with Lock Badge */}
        <div className="relative mb-3.5 mt-1">
          <Avatar
            src={partner?.avatar_path}
            name={partnerName}
            size="lg"
            className="ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            {isUnlocked ? (
              <ShieldCheck className="w-3.5 h-3.5 animate-in zoom-in" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Header Text */}
        <div className="space-y-1 mb-5">
          <h3 className="text-lg font-bold text-foreground font-serif tracking-tight flex items-center justify-center gap-1.5">
            <span>Locked Chat</span>
          </h3>
          <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">
            {isSettingPin ? (
              <>Set a 4-digit PIN to lock and unlock this chat.</>
            ) : (
              <>
                Enter 4-digit PIN to open chat with <strong className="text-foreground">{partnerName}</strong>.
              </>
            )}
          </p>
        </div>

        {isSettingPin ? (
          /* Initial PIN Setup Form if not set yet */
          <form onSubmit={handleSaveSetupPin} className="w-full space-y-3">
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
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl text-xs">
                Cancel
              </Button>
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
          /* 4-digit PIN Dots & Keypad */
          <div className="w-full flex flex-col items-center space-y-4">
            {/* PIN Dots */}
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

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-11 rounded-xl bg-card/80 hover:bg-muted border border-border/60 text-base font-semibold text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-11 rounded-xl bg-card/80 hover:bg-muted border border-border/60 text-base font-semibold text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete last digit"
                className="h-11 rounded-xl bg-card/80 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
