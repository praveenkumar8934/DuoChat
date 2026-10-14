import { describe, it, expect, beforeEach } from 'vitest';
import {
  isConversationChatLocked,
  setConversationChatLocked,
  getLockedConversationIds,
  isChatUnlockedInSession,
  unlockChatInSession,
  lockChatInSession,
  lockAllChatsInSession,
  getAppLockPin,
  setAppLockPin,
} from '@/lib/privacy-features';

describe('Chat Lock Privacy Features', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should initially report chat as not locked', () => {
    expect(isConversationChatLocked('conv-123')).toBe(false);
    expect(getLockedConversationIds()).toEqual([]);
  });

  it('should lock and unlock a specific conversation via setConversationChatLocked', () => {
    setConversationChatLocked('conv-partner-1', true);
    expect(isConversationChatLocked('conv-partner-1')).toBe(true);
    expect(isConversationChatLocked('conv-partner-2')).toBe(false);
    expect(getLockedConversationIds()).toContain('conv-partner-1');

    setConversationChatLocked('conv-partner-1', false);
    expect(isConversationChatLocked('conv-partner-1')).toBe(false);
  });

  it('should require PIN verification: isChatUnlockedInSession is false until unlocked', () => {
    setConversationChatLocked('conv-locked-1', true);

    // Locked conversation is NOT unlocked by default in session
    expect(isChatUnlockedInSession('conv-locked-1')).toBe(false);

    // An unlocked conversation is always accessible
    expect(isChatUnlockedInSession('conv-unlocked-2')).toBe(true);

    // After entering correct PIN, unlockChatInSession is called
    unlockChatInSession('conv-locked-1');
    expect(isChatUnlockedInSession('conv-locked-1')).toBe(true);

    // If chat is re-locked in session, isChatUnlockedInSession becomes false again
    lockChatInSession('conv-locked-1');
    expect(isChatUnlockedInSession('conv-locked-1')).toBe(false);
  });

  it('should lock all chats in session via lockAllChatsInSession', () => {
    setConversationChatLocked('conv-a', true);
    setConversationChatLocked('conv-b', true);

    unlockChatInSession('conv-a');
    unlockChatInSession('conv-b');
    expect(isChatUnlockedInSession('conv-a')).toBe(true);
    expect(isChatUnlockedInSession('conv-b')).toBe(true);

    lockAllChatsInSession();
    expect(isChatUnlockedInSession('conv-a')).toBe(false);
    expect(isChatUnlockedInSession('conv-b')).toBe(false);
  });

  it('should manage 4-digit PIN in storage', () => {
    expect(getAppLockPin()).toBeNull();

    setAppLockPin('1234');
    expect(getAppLockPin()).toBe('1234');

    setAppLockPin(null);
    expect(getAppLockPin()).toBeNull();
  });
});
