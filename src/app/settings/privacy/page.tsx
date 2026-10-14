'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Eye,
  Keyboard,
  BellRing,
  Trash2,
  Laptop,
  AlertTriangle,
  Ghost,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Sparkles,
  Flame,
  Check,
  BellOff,
  ShieldAlert,
  Smartphone,
  HardDriveDownload,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import {
  usePrivacySettings,
  DISAPPEARING_OPTIONS,
  type DisappearingMode,
  type AppLockTimeout,
} from '@/lib/privacy-features';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export default function PrivacySettingsPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  const {
    disappearingMode,
    setDisappearingMode,
    ghostMode,
    setGhostMode,
    appLockPin,
    setAppLockPin,
    setAppLocked,
    appLockTimeout,
    setAppLockTimeout,
    hideNotificationPreview,
    setHideNotificationPreview,
    readReceipts,
    setReadReceipts,
    typingIndicators,
    setTypingIndicators,
    soundsEnabled,
    setSoundsEnabled,
    dndEnabled,
    setDNDEnabled,
    screenshotAlert,
    setScreenshotAlert,
    clearLocalDataAndCache,
    isSnapchatModeActive,
  } = usePrivacySettings();

  // Modals
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');
  const [showClearCacheModal, setShowClearCacheModal] = React.useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setTimeout(async () => {
      await signOut();
      router.push('/');
    }, 1000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 numeric digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    setAppLockPin(newPin);
    setShowPinModal(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    toast.success('Passcode PIN successfully set!');
  };

  const handleRemovePin = () => {
    if (window.confirm('Are you sure you want to disable App Passcode Lock?')) {
      setAppLockPin(null);
      toast.success('App Lock disabled');
    }
  };

  const handleLockNow = () => {
    if (!appLockPin) {
      setShowPinModal(true);
      return;
    }
    setAppLocked(true);
    toast.success('App screen locked');
  };

  const handleClearCache = () => {
    clearLocalDataAndCache();
    setShowClearCacheModal(false);
    toast.success('Local cache and temporary data cleaned!');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Banner / Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-serif">
            Privacy & Security Control
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Configure disappearing messages, Snapchat mode, ghost presence, passcode screen lock, and data protection.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Snapchat Mode</span>
            <Ghost className={cn('w-4 h-4', isSnapchatModeActive ? 'text-amber-500 animate-pulse' : 'text-muted-foreground')} />
          </div>
          <p className="font-semibold text-xs text-foreground truncate">
            {disappearingMode === 'seen_10s'
              ? '⚡ Active (10s)'
              : disappearingMode === 'off'
              ? 'Off (Permanent)'
              : disappearingMode.replace('seen_', '')}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ghost Presence</span>
            <Eye className={cn('w-4 h-4', ghostMode ? 'text-violet-500' : 'text-emerald-500')} />
          </div>
          <p className="font-semibold text-xs text-foreground">
            {ghostMode ? '👻 Incognito' : '🟢 Public Online'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Passcode Lock</span>
            <Lock className={cn('w-4 h-4', appLockPin ? 'text-emerald-500' : 'text-muted-foreground')} />
          </div>
          <p className="font-semibold text-xs text-foreground">
            {appLockPin ? '🔒 4-Digit PIN' : 'Unlocked'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Read Receipts</span>
            <span className={readReceipts ? 'text-sky-500 font-bold' : 'text-muted-foreground'}>✓✓</span>
          </div>
          <p className="font-semibold text-xs text-foreground">
            {readReceipts ? 'Blue Ticks On' : 'Hidden'}
          </p>
        </div>
      </div>

      {/* 1. SNAPCHAT MODE & DISAPPEARING MESSAGES */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
              <Ghost className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Delete Message When Seen (Snapchat Mode)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  Snapchat Style
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically vanish and erase messages from both devices after your partner views and reads them.
              </p>
            </div>
          </div>

          {/* Quick 10s Snapchat button */}
          <Button
            size="sm"
            variant={isSnapchatModeActive ? 'default' : 'outline'}
            onClick={() => setDisappearingMode(isSnapchatModeActive ? 'off' : 'seen_10s')}
            className={cn(
              'rounded-xl text-xs gap-1.5 shrink-0 cursor-pointer',
              isSnapchatModeActive
                ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold'
                : 'border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isSnapchatModeActive ? 'Snapchat Mode Active' : 'Enable 10s Vanish'}</span>
          </Button>
        </div>

        {/* Disappearing Duration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {DISAPPEARING_OPTIONS.map(opt => {
            const isSelected = disappearingMode === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  setDisappearingMode(opt.id);
                  toast.success(
                    opt.id === 'off'
                      ? 'Disappearing messages turned off'
                      : `Messages will delete ${opt.shortLabel} after read!`
                  );
                }}
                className={cn(
                  'p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative select-none flex flex-col justify-between space-y-2',
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 shadow-2xs ring-1 ring-amber-500/20'
                    : 'border-border/60 bg-background/50 hover:border-border hover:bg-muted/40'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={cn('w-4 h-4', isSelected ? 'text-amber-500' : 'text-muted-foreground')} />
                    <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{opt.description}</p>
              </div>
            );
          })}
        </div>

        {/* Live Simulation Info Box */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How Snapchat Mode Works: </span>
            When you or your partner open a message and read receipts confirm it has been seen (double blue ticks),
            the message starts an ephemeral countdown timer and gets wiped permanently from both screens and the server.
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME PRESENCE & STEALTH PRIVACY */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Presence & Stealth Privacy
        </h3>

        <div className="space-y-3">
          {/* Ghost Mode Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <Ghost className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-foreground">Stealth / Ghost Mode</h4>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-500">
                    Incognito
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Hide your online presence and green status dot. Browse DuoChat in total stealth.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={ghostMode}
              onChange={e => {
                setGhostMode(e.target.checked);
                toast.success(e.target.checked ? 'Ghost Mode enabled' : 'Ghost Mode disabled');
              }}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>

          {/* Read Receipts */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Read Receipts</h4>
                <p className="text-[11px] text-muted-foreground">
                  Let your partner see when you have read their messages (blue double checkmarks)
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={e => setReadReceipts(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>

          {/* Typing Indicators */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <Keyboard className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Typing Indicators</h4>
                <p className="text-[11px] text-muted-foreground">
                  Broadcast live typing indicators when composing messages
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={typingIndicators}
              onChange={e => setTypingIndicators(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. APP PASSCODE & SCREEN LOCK */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">App Passcode & Screen Lock</h3>
              <p className="text-xs text-muted-foreground">
                Require a 4-digit PIN to open and view your private conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {appLockPin ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLockNow}
                  className="rounded-xl text-xs gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Now</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPinModal(true)}
                  className="rounded-xl text-xs gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change PIN</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemovePin}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Remove PIN
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowPinModal(true)}
                className="rounded-xl text-xs gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Set 4-Digit PIN</span>
              </Button>
            )}
          </div>
        </div>

        {appLockPin && (
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-foreground">Auto-Lock Timer</p>
              <p className="text-[11px] text-muted-foreground">
                Automatically lock screen when switching tabs or after inactivity
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['immediate', '1m', '5m', '15m'] as AppLockTimeout[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setAppLockTimeout(t);
                    toast.success(`Auto-lock set to ${t === 'immediate' ? 'Immediately' : t}`);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border',
                    appLockTimeout === t
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border/60'
                  )}
                >
                  {t === 'immediate' ? 'Immediate' : t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. NOTIFICATION & SCREEN PRIVACY */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-500" />
          Notification & Screen Privacy
        </h3>

        <div className="space-y-3">
          {/* Hide Previews */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Hide Message Content in Notifications</h4>
                <p className="text-[11px] text-muted-foreground">
                  Mask message text on lockscreens with a discrete &quot;New Message&quot; alert
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={hideNotificationPreview}
              onChange={e => {
                setHideNotificationPreview(e.target.checked);
                toast.success(e.target.checked ? 'Message preview hidden' : 'Message preview visible');
              }}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>

          {/* Do Not Disturb */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <BellOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Do Not Disturb (Mute Sounds)</h4>
                <p className="text-[11px] text-muted-foreground">
                  Mute all incoming notification chimes and sound effects
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dndEnabled}
              onChange={e => {
                setDNDEnabled(e.target.checked);
                toast.success(e.target.checked ? 'Do Not Disturb enabled' : 'Do Not Disturb disabled');
              }}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>

          {/* Screenshot advisory */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">Screenshot Awareness Banner</h4>
                <p className="text-[11px] text-muted-foreground">
                  Display an active security caution regarding screenshots and content privacy
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={screenshotAlert}
              onChange={e => setScreenshotAlert(e.target.checked)}
              className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. STORAGE & CACHE CLEANUP */}
      <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HardDriveDownload className="w-4 h-4 text-emerald-500" />
          Data & Local Storage Hygiene
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs">
          <div>
            <p className="font-semibold text-foreground">Clear Local Storage & Media Cache</p>
            <p className="text-[11px] text-muted-foreground">
              Purges temporary cached media blobs and local chat states without logging you out
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowClearCacheModal(true)}
            className="rounded-xl text-xs shrink-0 cursor-pointer"
          >
            Clean Local Cache
          </Button>
        </div>

        {/* Active Session Info */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Current Web Session</p>
              <p className="text-[11px] text-muted-foreground">Protected via Supabase SSR Auth with End-to-End Session Guard</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Active Now
          </span>
        </div>
      </div>

      {/* 6. DANGER ZONE */}
      <div className="p-6 rounded-3xl bg-card border border-destructive/30 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Permanent account, messages, and uploaded attachments deletion.
        </p>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-xl gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account & Conversations
        </Button>
      </div>

      {/* PIN Setup Modal */}
      <Dialog
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPinError('');
          setNewPin('');
          setConfirmPin('');
        }}
        size="sm"
        title="Set 4-Digit Passcode PIN"
        description="Choose a secure 4-digit PIN to lock your DuoChat screen when away."
      >
        <form onSubmit={handleSavePin} className="space-y-4 pt-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-widest text-xl font-mono py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Confirm PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-widest text-xl font-mono py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          {pinError && (
            <p className="text-xs text-destructive text-center font-medium">{pinError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPinModal(false);
                setPinError('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Passcode
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Clear Cache Confirmation Modal */}
      <Dialog
        isOpen={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        size="sm"
        title="Clear Local Cache?"
        description="This will purge offline cached messages, temporary audio/image blobs, and scratch memory. Your login credentials will remain intact."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearCacheModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleClearCache}
          >
            Confirm & Clean
          </Button>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="md"
        title="Delete Account?"
        description="This action will permanently delete your account, messages, reactions, and uploaded attachments. This cannot be undone."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Permanently Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
