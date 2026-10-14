'use client';

import * as React from 'react';

export type DisappearingMode =
  | 'off'
  | 'seen_10s' // Snapchat mode: disappears 10 seconds after seen
  | 'seen_30s'
  | 'seen_1m'
  | 'seen_24h'
  | 'seen_7d';

export type AppLockTimeout = 'immediate' | '1m' | '5m' | '15m';

export interface DisappearingOption {
  id: DisappearingMode;
  label: string;
  shortLabel: string;
  description: string;
  seconds: number;
  badge?: string;
}

export const DISAPPEARING_OPTIONS: DisappearingOption[] = [
  {
    id: 'seen_10s',
    label: '10 Seconds (Snapchat Mode)',
    shortLabel: '10s (Snapchat)',
    description: 'Messages disappear 10 seconds after your partner reads them',
    seconds: 10,
    badge: 'Snapchat',
  },
  {
    id: 'seen_30s',
    label: '30 Seconds after seen',
    shortLabel: '30s',
    description: 'Messages vanish 30 seconds after being seen',
    seconds: 30,
  },
  {
    id: 'seen_1m',
    label: '1 Minute after seen',
    shortLabel: '1 min',
    description: 'Disappears 1 minute after recipient views the message',
    seconds: 60,
  },
  {
    id: 'seen_24h',
    label: '24 Hours after seen',
    shortLabel: '24h',
    description: 'Messages expire 24 hours after being read',
    seconds: 86400,
  },
  {
    id: 'seen_7d',
    label: '7 Days after seen',
    shortLabel: '7 days',
    description: 'Messages automatically clear after one week',
    seconds: 604800,
  },
  {
    id: 'off',
    label: 'Off (Keep Forever)',
    shortLabel: 'Off',
    description: 'Messages remain in chat history until manually cleared',
    seconds: 0,
  },
];

// Storage Keys
export const STORAGE_KEYS = {
  DISAPPEARING_MODE: 'duochat_privacy_disappearing_mode',
  GHOST_MODE: 'duochat_privacy_ghost_mode',
  APP_LOCK_PIN: 'duochat_app_lock_pin',
  APP_LOCK_ENABLED: 'duochat_app_lock_enabled',
  APP_LOCKED: 'duochat_app_locked_state',
  APP_LOCK_TIMEOUT: 'duochat_app_lock_timeout',
  APP_LOCK_LAST_ACTIVE: 'duochat_app_lock_last_active',
  HIDE_NOTIFICATION_PREVIEW: 'duochat_privacy_hide_preview',
  READ_RECEIPTS: 'duochat_privacy_read_receipts',
  TYPING_INDICATORS: 'duochat_privacy_typing_indicators',
  SOUNDS_ENABLED: 'duochat_privacy_sounds_enabled',
  DND_ENABLED: 'duochat_privacy_dnd_enabled',
  SCREENSHOT_ALERT: 'duochat_privacy_screenshot_alert',
  PRIVATE_VAULT_NOTES: 'duochat_private_vault_notes',
  LOCKED_CONVERSATIONS: 'duochat_locked_conversations',
  SESSION_UNLOCKED_CHATS: 'duochat_unlocked_chat_sessions',
} as const;

// Helper Getters / Setters
export function getDisappearingMode(): DisappearingMode {
  if (typeof window === 'undefined') return 'off';
  const val = localStorage.getItem(STORAGE_KEYS.DISAPPEARING_MODE) as DisappearingMode;
  return val && DISAPPEARING_OPTIONS.some(o => o.id === val) ? val : 'off';
}

export function setDisappearingMode(mode: DisappearingMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DISAPPEARING_MODE, mode);
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getDisappearingSeconds(mode: DisappearingMode): number {
  const opt = DISAPPEARING_OPTIONS.find(o => o.id === mode);
  return opt ? opt.seconds : 0;
}

export function getGhostMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.GHOST_MODE) === 'true';
}

export function setGhostMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GHOST_MODE, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getAppLockPin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.APP_LOCK_PIN);
}

export function setAppLockPin(pin: string | null): void {
  if (typeof window === 'undefined') return;
  if (!pin) {
    localStorage.removeItem(STORAGE_KEYS.APP_LOCK_PIN);
    localStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, 'false');
    localStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'false');
  } else {
    localStorage.setItem(STORAGE_KEYS.APP_LOCK_PIN, pin);
    localStorage.setItem(STORAGE_KEYS.APP_LOCK_ENABLED, 'true');
  }
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function isAppLocked(): boolean {
  if (typeof window === 'undefined') return false;
  const pin = getAppLockPin();
  if (!pin) return false;
  return localStorage.getItem(STORAGE_KEYS.APP_LOCKED) === 'true';
}

export function setAppLocked(locked: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.APP_LOCKED, String(locked));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

// Specific Chat Lock Helpers (WhatsApp-style per-chat lock)
export function getLockedConversationIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const val = localStorage.getItem(STORAGE_KEYS.LOCKED_CONVERSATIONS);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export function isConversationChatLocked(conversationId: string): boolean {
  if (!conversationId) return false;
  return getLockedConversationIds().includes(conversationId);
}

export function setConversationChatLocked(conversationId: string, locked: boolean): void {
  if (typeof window === 'undefined' || !conversationId) return;
  const current = getLockedConversationIds();
  let next: string[];
  if (locked) {
    next = Array.from(new Set([...current, conversationId]));
  } else {
    next = current.filter(id => id !== conversationId);
    lockChatInSession(conversationId);
  }
  localStorage.setItem(STORAGE_KEYS.LOCKED_CONVERSATIONS, JSON.stringify(next));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getSessionUnlockedChatIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const val = sessionStorage.getItem(STORAGE_KEYS.SESSION_UNLOCKED_CHATS);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
}

export function isChatUnlockedInSession(conversationId: string): boolean {
  if (!conversationId) return true;
  if (!isConversationChatLocked(conversationId)) return true;
  return getSessionUnlockedChatIds().includes(conversationId);
}

export function unlockChatInSession(conversationId: string): void {
  if (typeof window === 'undefined' || !conversationId) return;
  const current = getSessionUnlockedChatIds();
  const next = Array.from(new Set([...current, conversationId]));
  sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED_CHATS, JSON.stringify(next));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function lockChatInSession(conversationId: string): void {
  if (typeof window === 'undefined' || !conversationId) return;
  const current = getSessionUnlockedChatIds();
  const next = current.filter(id => id !== conversationId);
  sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED_CHATS, JSON.stringify(next));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function lockAllChatsInSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED_CHATS);
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

// On initial script load in browser, ensure all locked chats start in locked state
if (typeof window !== 'undefined') {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED_CHATS);
  } catch {
    // ignore
  }
}

export function getAppLockTimeout(): AppLockTimeout {
  if (typeof window === 'undefined') return '5m';
  const val = localStorage.getItem(STORAGE_KEYS.APP_LOCK_TIMEOUT) as AppLockTimeout;
  return val || '5m';
}

export function setAppLockTimeout(timeout: AppLockTimeout): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.APP_LOCK_TIMEOUT, timeout);
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getHideNotificationPreview(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.HIDE_NOTIFICATION_PREVIEW) === 'true';
}

export function setHideNotificationPreview(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HIDE_NOTIFICATION_PREVIEW, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getReadReceiptsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEYS.READ_RECEIPTS);
  return val === null ? true : val === 'true';
}

export function setReadReceiptsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.READ_RECEIPTS, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getTypingIndicatorsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEYS.TYPING_INDICATORS);
  return val === null ? true : val === 'true';
}

export function setTypingIndicatorsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TYPING_INDICATORS, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getSoundsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEYS.SOUNDS_ENABLED);
  return val === null ? true : val === 'true';
}

export function setSoundsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SOUNDS_ENABLED, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getDNDEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.DND_ENABLED) === 'true';
}

export function setDNDEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DND_ENABLED, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getScreenshotAlert(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEYS.SCREENSHOT_ALERT);
  return val === null ? true : val === 'true';
}

export function setScreenshotAlert(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SCREENSHOT_ALERT, String(enabled));
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function getPrivateVaultNotes(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.PRIVATE_VAULT_NOTES) || '';
}

export function setPrivateVaultNotes(notes: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRIVATE_VAULT_NOTES, notes);
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

export function clearLocalDataAndCache(): void {
  if (typeof window === 'undefined') return;
  // Clear temporary caches and media keys while preserving essential user identity/credentials
  const preserveKeys = [
    'sb-access-token',
    'sb-refresh-token',
    STORAGE_KEYS.APP_LOCK_PIN,
    STORAGE_KEYS.APP_LOCK_ENABLED,
  ];

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !preserveKeys.some(p => key.includes(p))) {
      toRemove.push(key);
    }
  }

  toRemove.forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  window.dispatchEvent(new Event('duochat_privacy_change'));
}

// React Hook for dynamic reactivity across all components
export function usePrivacySettings() {
  const [disappearingMode, setDisappearingModeState] = React.useState<DisappearingMode>('off');
  const [ghostMode, setGhostModeState] = React.useState(false);
  const [appLockPin, setAppLockPinState] = React.useState<string | null>(null);
  const [appLocked, setAppLockedState] = React.useState(false);
  const [appLockTimeout, setAppLockTimeoutState] = React.useState<AppLockTimeout>('5m');
  const [hideNotificationPreview, setHideNotificationPreviewState] = React.useState(false);
  const [readReceipts, setReadReceiptsState] = React.useState(true);
  const [typingIndicators, setTypingIndicatorsState] = React.useState(true);
  const [soundsEnabled, setSoundsEnabledState] = React.useState(true);
  const [dndEnabled, setDNDEnabledState] = React.useState(false);
  const [screenshotAlert, setScreenshotAlertState] = React.useState(true);
  const [vaultNotes, setVaultNotesState] = React.useState('');
  const [lockedConversationIds, setLockedConversationIdsState] = React.useState<string[]>([]);
  const [sessionUnlockedChatIds, setSessionUnlockedChatIdsState] = React.useState<string[]>([]);

  const syncState = React.useCallback(() => {
    setDisappearingModeState(getDisappearingMode());
    setGhostModeState(getGhostMode());
    setAppLockPinState(getAppLockPin());
    setAppLockedState(isAppLocked());
    setAppLockTimeoutState(getAppLockTimeout());
    setHideNotificationPreviewState(getHideNotificationPreview());
    setReadReceiptsState(getReadReceiptsEnabled());
    setTypingIndicatorsState(getTypingIndicatorsEnabled());
    setSoundsEnabledState(getSoundsEnabled());
    setDNDEnabledState(getDNDEnabled());
    setScreenshotAlertState(getScreenshotAlert());
    setVaultNotesState(getPrivateVaultNotes());
    setLockedConversationIdsState(getLockedConversationIds());
    setSessionUnlockedChatIdsState(getSessionUnlockedChatIds());
  }, []);

  React.useEffect(() => {
    syncState();

    const handleStorageOrCustom = () => {
      syncState();
    };

    window.addEventListener('storage', handleStorageOrCustom);
    window.addEventListener('duochat_privacy_change', handleStorageOrCustom);

    return () => {
      window.removeEventListener('storage', handleStorageOrCustom);
      window.removeEventListener('duochat_privacy_change', handleStorageOrCustom);
    };
  }, [syncState]);

  return {
    disappearingMode,
    setDisappearingMode: (mode: DisappearingMode) => {
      setDisappearingMode(mode);
      setDisappearingModeState(mode);
    },
    ghostMode,
    setGhostMode: (val: boolean) => {
      setGhostMode(val);
      setGhostModeState(val);
    },
    appLockPin,
    setAppLockPin: (pin: string | null) => {
      setAppLockPin(pin);
      setAppLockPinState(pin);
    },
    appLocked,
    setAppLocked: (locked: boolean) => {
      setAppLocked(locked);
      setAppLockedState(locked);
    },
    appLockTimeout,
    setAppLockTimeout: (timeout: AppLockTimeout) => {
      setAppLockTimeout(timeout);
      setAppLockTimeoutState(timeout);
    },
    hideNotificationPreview,
    setHideNotificationPreview: (val: boolean) => {
      setHideNotificationPreview(val);
      setHideNotificationPreviewState(val);
    },
    readReceipts,
    setReadReceipts: (val: boolean) => {
      setReadReceiptsEnabled(val);
      setReadReceiptsState(val);
    },
    typingIndicators,
    setTypingIndicators: (val: boolean) => {
      setTypingIndicatorsEnabled(val);
      setTypingIndicatorsState(val);
    },
    soundsEnabled,
    setSoundsEnabled: (val: boolean) => {
      setSoundsEnabled(val);
      setSoundsEnabledState(val);
    },
    dndEnabled,
    setDNDEnabled: (val: boolean) => {
      setDNDEnabled(val);
      setDNDEnabledState(val);
    },
    screenshotAlert,
    setScreenshotAlert: (val: boolean) => {
      setScreenshotAlert(val);
      setScreenshotAlertState(val);
    },
    vaultNotes,
    setVaultNotes: (notes: string) => {
      setPrivateVaultNotes(notes);
      setVaultNotesState(notes);
    },
    clearLocalDataAndCache,
    isSnapchatModeActive: disappearingMode === 'seen_10s',
    lockedConversationIds,
    sessionUnlockedChatIds,
    isConversationChatLocked: (conversationId: string) => lockedConversationIds.includes(conversationId),
    isChatUnlockedInSession: (conversationId: string) =>
      !lockedConversationIds.includes(conversationId) || sessionUnlockedChatIds.includes(conversationId),
    setConversationChatLocked: (conversationId: string, locked: boolean) => setConversationChatLocked(conversationId, locked),
    unlockChatInSession: (conversationId: string) => unlockChatInSession(conversationId),
    lockChatInSession: (conversationId: string) => lockChatInSession(conversationId),
    lockAllChatsInSession: () => lockAllChatsInSession(),
  };
}
