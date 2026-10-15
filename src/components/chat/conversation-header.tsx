'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Search,
  FolderHeart,
  ShieldCheck,
  X,
  Heart,
  CalendarHeart,
  Sparkles,
  UserMinus,
  Trash2,
  Loader2,
  MoreVertical,
  Palette,
  User,
  Download,
  Bell,
  BellOff,
  Check,
  Copy,
  Clock,
  Sparkle,
  Flame,
  FileDown,
  Lock,
  Unlock,
  Ghost,
  FileEdit,
  HardDriveDownload,
  Phone,
  Video,
} from 'lucide-react';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { useCall } from '@/context/call-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatLastSeen, cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { useRomanticFeatures } from '@/lib/romantic-features';
import { Dialog } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { downloadChatPdf } from '@/lib/export-chat-pdf';

import { CHAT_THEMES, type ThemeOption } from '@/lib/chat-themes';
import {
  usePrivacySettings,
  DISAPPEARING_OPTIONS,
  type DisappearingMode,
} from '@/lib/privacy-features';


export function ConversationHeader() {
  const router = useRouter();
  const { profile } = useAuth();
  const {
    activeConversation,
    setActiveConversationId,
    friendPresence,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    isMediaDrawerOpen,
    setIsMediaDrawerOpen,
    typingUsers,
    deleteFriend,
    clearChatHistory,
    chatTheme,
    setChatTheme,
    messages,
  } = useChat();

  const { anniversary, daysTogether, updateAnniversary } = useRomanticFeatures();
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(anniversary || '');

  // Privacy Settings & Shifted Features
  const {
    appLockPin,
    setAppLockPin,
    isConversationChatLocked,
    setConversationChatLocked,
    isChatUnlockedInSession,
    lockChatInSession,
    disappearingMode,
    setDisappearingMode,
    dndEnabled,
    setDNDEnabled,
    vaultNotes,
    setVaultNotes,
    clearLocalDataAndCache,
    isSnapchatModeActive,
  } = usePrivacySettings();

  const [isPinModalOpen, setIsPinModalOpen] = React.useState(false);
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');

  // Shifted Feature Modals from Sidebar
  const [isVanishModalOpen, setIsVanishModalOpen] = React.useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = React.useState(false);
  const [tempNotes, setTempNotes] = React.useState(vaultNotes);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = React.useState(false);

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setVaultNotes(tempNotes);
    setIsNotesModalOpen(false);
    toast.success('Vault notes saved securely ❤️');
  };

  const handleClearCacheConfirm = () => {
    clearLocalDataAndCache();
    setIsClearCacheModalOpen(false);
    toast.success('Local cache & scratch storage cleared');
  };

  const isCurrentChatLocked = activeConversation?.id ? isConversationChatLocked(activeConversation.id) : false;
  const isUnlockedThisSession = activeConversation?.id ? isChatUnlockedInSession(activeConversation.id) : false;

  // 3-dots Menu & Modals State
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [themeFilter, setThemeFilter] = React.useState<'all' | 'live' | 'classic'>('all');

  // Action Loading States
  const [isDeletingFriend, setIsDeletingFriend] = React.useState(false);
  const [isClearingHistory, setIsClearingHistory] = React.useState(false);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [, setTick] = React.useState(0);

  const menuRef = React.useRef<HTMLDivElement>(null);
  const friend = activeConversation?.otherUser;
  const { startCall } = useCall();

  const handleStartVoiceCall = () => {
    if (!activeConversation?.id || !friend?.id) return;
    startCall(activeConversation.id, 'voice', {
      id: friend.id,
      name: friend.display_name || 'Partner',
      avatar: friend.avatar_path,
      username: friend.username,
    });
  };

  const handleStartVideoCall = () => {
    if (!activeConversation?.id || !friend?.id) return;
    startCall(activeConversation.id, 'video', {
      id: friend.id,
      name: friend.display_name || 'Partner',
      avatar: friend.avatar_path,
      username: friend.username,
    });
  };

  // Periodically refresh the time-ago text every 30s so "Active just now" updates to "Active 1m ago", etc.
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync mute state per conversation from localStorage
  React.useEffect(() => {
    if (!activeConversation?.id) return;
    try {
      const muted = localStorage.getItem(`duochat_muted_${activeConversation.id}`) === 'true';
      setIsMuted(muted);
    } catch {
      // ignore
    }
  }, [activeConversation?.id]);

  // Click outside and Escape listeners for 3-dots menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMenuOpen(false);
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleToggleMute = () => {
    if (!activeConversation) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem(`duochat_muted_${activeConversation.id}`, String(nextMuted));
    } catch {
      // ignore
    }
    if (nextMuted) {
      toast.info(`Notifications muted for ${friend?.display_name || 'partner'}`);
    } else {
      toast.success('Notifications unmuted');
    }
  };

  const handleToggleChatLock = () => {
    setIsMenuOpen(false);
    if (!activeConversation?.id) return;

    if (!isCurrentChatLocked) {
      if (!appLockPin) {
        setIsPinModalOpen(true);
      } else {
        setConversationChatLocked(activeConversation.id, true);
        lockChatInSession(activeConversation.id);
        toast.success('Chat Lock enabled for this chat!');
      }
    } else {
      if (isUnlockedThisSession) {
        lockChatInSession(activeConversation.id);
        toast.info('Chat locked. PIN required to view.');
      } else {
        setConversationChatLocked(activeConversation.id, false);
        toast.success('Chat Lock disabled for this chat');
      }
    }
  };

  const handleDisableChatLock = () => {
    setIsMenuOpen(false);
    if (!activeConversation?.id) return;
    setConversationChatLocked(activeConversation.id, false);
    toast.success('Chat Lock removed from this chat');
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    setAppLockPin(newPin);
    setIsPinModalOpen(false);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    if (activeConversation?.id) {
      setConversationChatLocked(activeConversation.id, true);
      lockChatInSession(activeConversation.id);
      toast.success('Chat Lock enabled and locked!');
    } else {
      toast.success('PIN set successfully!');
    }
  };

  // Export Chat History as PDF
  const handleExportChat = () => {
    if (!activeConversation) return;
    const partnerName = friend?.display_name || 'Partner';
    setIsExportingPdf(true);
    try {
      const filename = downloadChatPdf({
        partnerName,
        partnerUsername: friend?.username,
        currentUserId: profile?.id || '',
        currentUserName: profile?.display_name || 'Me',
        messages,
        daysTogether,
      });
      toast.success(`Chat history exported to PDF (${filename})`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      toast.error('Failed to generate PDF file. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleClearHistory = async () => {
    if (!activeConversation) return;
    setIsClearingHistory(true);
    try {
      const res = await clearChatHistory(activeConversation.id);
      if (res.success) {
        toast.success('Chat history cleared successfully');
        setIsClearModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to clear chat history');
      }
    } catch {
      toast.error('Network error. Failed to clear chat.');
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    updateAnniversary(selectedDate || null);
    setIsDateDialogOpen(false);
    toast.success('Our special date updated 💕');
  };

  const handleDeleteFriend = async () => {
    if (!friend || !activeConversation) return;
    setIsDeletingFriend(true);
    try {
      const res = await deleteFriend(friend.id, activeConversation.id);
      if (res.success) {
        toast.success(`${friend.display_name} removed from friends.`);
        setIsDeleteModalOpen(false);
      } else {
        toast.error(res.error || 'Failed to remove friend');
      }
    } catch {
      toast.error('Network error. Failed to remove friend.');
    } finally {
      setIsDeletingFriend(false);
    }
  };

  const filteredThemes = React.useMemo(() => {
    if (themeFilter === 'live') return CHAT_THEMES.filter(t => t.isLive);
    if (themeFilter === 'classic') return CHAT_THEMES.filter(t => !t.isLive);
    return CHAT_THEMES;
  }, [themeFilter]);

  return (
    <>
      <div className="flex flex-col border-b border-border/70 bg-card/70 backdrop-blur-md z-10 select-none">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => {
                setActiveConversationId(null);
                if (typeof window !== 'undefined' && window.history.state?.chat) {
                  window.history.back();
                } else {
                  router.push('/chat');
                }
              }}
              className="md:hidden p-2 -ml-1 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Friend Avatar with presence ring - Clickable to open Profile */}
            <div
              className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => setIsProfileModalOpen(true)}
              title="View partner profile"
            >
              <Avatar
                src={friend?.avatar_path}
                name={friend?.display_name || 'Partner'}
                size="md"
                isOnline={friendPresence.online}
              />
            </div>

            {/* Partner Name, Dynamic Status & Romantic Badge */}
            <div className="min-w-0">
              <div
                className="flex items-center gap-1.5 cursor-pointer group"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <h2 className="text-sm font-semibold truncate text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                  {friend?.display_name || 'My Partner'}
                  {isCurrentChatLocked && (
                    <span title={isUnlockedThisSession ? 'Chat Lock enabled' : 'Chat locked'}>
                      <Lock className={cn('w-3 h-3 shrink-0', isUnlockedThisSession ? 'text-emerald-500' : 'text-amber-500')} />
                    </span>
                  )}
                  <Sparkles className="w-3 h-3 text-rose-400 inline shrink-0" />
                </h2>
                <span title="Private Romantic Sanctuary" className="inline-flex">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs truncate">
                {typingUsers.length > 0 ? (
                  <span className="text-primary font-medium flex items-center gap-1 animate-pulse">
                    <span>typing</span>
                    <span className="inline-block animate-bounce">...</span>
                  </span>
                ) : friendPresence.online ? (
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Online now
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {formatLastSeen(friendPresence.lastSeen || friend?.last_seen_at)}
                  </span>
                )}

                {/* Day Counter Mini Pill in Header */}
                {daysTogether !== null && (
                  <button
                    onClick={() => {
                      setSelectedDate(anniversary || '');
                      setIsDateDialogOpen(true);
                    }}
                    className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.2 rounded-full border border-rose-500/20 cursor-pointer transition-colors"
                    title="Click to view or edit our special date"
                  >
                    <Heart className="w-2.5 h-2.5 fill-current" />
                    Day {daysTogether}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1">
            {/* Real-time Voice Call Button */}
            {(!isCurrentChatLocked || isUnlockedThisSession) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartVoiceCall}
                className="rounded-xl text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                title="Start Voice Call"
                aria-label="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}

            {/* Real-time Video Call Button */}
            {(!isCurrentChatLocked || isUnlockedThisSession) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartVideoCall}
                className="rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Start Video Call"
                aria-label="Video Call"
              >
                <Video className="w-4 h-4" />
              </Button>
            )}

            {/* In-Chat Search Button (hidden when chat is locked) */}
            {(!isCurrentChatLocked || isUnlockedThisSession) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearching(!isSearching)}
                className={cn(
                  'rounded-xl transition-colors cursor-pointer',
                  isSearching
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title="Search messages in conversation"
                aria-label="Search conversation"
              >
                <Search className="w-4 h-4" />
              </Button>
            )}

            {/* 3 DOTS MENU TRIGGER & DROPDOWN */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className={cn(
                  'rounded-xl transition-colors cursor-pointer',
                  isMenuOpen
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                title="More options"
                aria-label="More conversation options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-popover text-popover-foreground border border-border shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none">
                  {/* View Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span>View Partner Profile</span>
                  </button>

                  {/* Change Chat Theme */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsThemeModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span>Change Chat Theme</span>
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded-md capitalize truncate ml-2">
                        {chatTheme.replace('-live', ' ✨')}
                      </span>
                    </div>
                  </button>

                  {/* Our Moments / Media */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMediaDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <FolderHeart className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Our Moments & Media</span>
                  </button>

                  {/* Our Special Date */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setSelectedDate(anniversary || '');
                      setIsDateDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <CalendarHeart className="w-4 h-4 text-pink-500 shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span>Our Special Date</span>
                      {daysTogether !== null && (
                        <span className="text-[10px] text-rose-500 font-semibold ml-2">
                          Day {daysTogether}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Specific Chat Lock Controls */}
                  {!isCurrentChatLocked ? (
                    <button
                      type="button"
                      onClick={handleToggleChatLock}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer group"
                    >
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="font-medium text-foreground">
                          Enable Chat Lock
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0 ml-2">
                          {appLockPin ? 'Lock' : 'Setup'}
                        </span>
                      </div>
                    </button>
                  ) : (
                    <>
                      {/* Lock Chat Now (if currently unlocked in session) */}
                      {isUnlockedThisSession && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (activeConversation?.id) {
                              lockChatInSession(activeConversation.id);
                              toast.info('Chat locked with PIN');
                            }
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer group"
                        >
                          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            <span className="font-medium text-foreground">
                              Lock Chat Now
                            </span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0 ml-2">
                              Lock
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Disable Chat Lock */}
                      <button
                        type="button"
                        onClick={handleDisableChatLock}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer group"
                      >
                        <Unlock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="font-medium text-foreground">
                            Unlock / Remove Lock
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Off
                          </span>
                        </div>
                      </button>
                    </>
                  )}

                  {/* 🌟 Shifted from Sidebar: Snapchat Mode (Auto-Delete) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsVanishModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer group"
                  >
                    <Ghost className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span className="font-medium text-foreground">Snapchat Mode</span>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0 ml-2">
                        {disappearingMode === 'seen_10s'
                          ? '10s'
                          : disappearingMode === 'off'
                          ? 'Off'
                          : disappearingMode.replace('seen_', '')}
                      </span>
                    </div>
                  </button>

                  {/* 🌟 Shifted from Sidebar: Do Not Disturb */}
                  <button
                    type="button"
                    onClick={() => {
                      setDNDEnabled(!dndEnabled);
                      toast.success(
                        !dndEnabled
                          ? 'Do Not Disturb on: sounds silenced'
                          : 'Notification chimes restored'
                      );
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer group"
                  >
                    {dndEnabled ? (
                      <BellOff className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <Bell className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span>Do Not Disturb</span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ml-2',
                          dndEnabled
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {dndEnabled ? 'Muted' : 'Sound On'}
                      </span>
                    </div>
                  </button>

                  {/* Mute Notifications */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleToggleMute();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400">Unmute Notifications</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>Mute Notifications</span>
                      </>
                    )}
                  </button>

                  {/* 🌟 Shifted from Sidebar: Private Vault Notes */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setTempNotes(vaultNotes);
                      setIsNotesModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <FileEdit className="w-4 h-4 text-teal-500 shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span>Private Vault Notes</span>
                      <span className="text-[10px] text-muted-foreground">Notes</span>
                    </div>
                  </button>

                  {/* 🌟 Shifted from Sidebar: Clean Local Cache */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsClearCacheModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer"
                  >
                    <HardDriveDownload className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <span>Clean Local Cache</span>
                      <span className="text-[10px] text-muted-foreground">Clean</span>
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-border/60" />

                  {/* Export Chat as PDF (hidden when chat is locked) */}
                  {(!isCurrentChatLocked || isUnlockedThisSession) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleExportChat();
                      }}
                      disabled={isExportingPdf}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted/80 transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      {isExportingPdf ? (
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                      ) : (
                        <FileDown className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span>Export Chat History</span>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded-md">
                          PDF
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Divider */}
                  <div className="my-1.5 border-t border-border/60" />

                  {/* Clear Chat History */}
                  {/* Clear Chat History (hidden when chat is locked) */}
                  {(!isCurrentChatLocked || isUnlockedThisSession) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsClearModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Clear Chat History</span>
                    </button>
                  )}

                  {/* Remove Friend */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left cursor-pointer"
                  >
                    <UserMinus className="w-4 h-4 shrink-0" />
                    <span>Remove Friend</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* In-conversation Search Bar when toggled */}
        {isSearching && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted/40 border-t border-border/50 animate-in slide-in-from-top-1 duration-150">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages, little notes, or memories..."
              autoFocus
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-xs text-muted-foreground hover:text-foreground font-medium px-1 cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* 1. CHANGE CHAT THEME / WALLPAPER MODAL */}
      <Dialog
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        size="md"
        title="Chat Theme & Live Wallpapers"
        description="Personalize your romantic sanctuary with modern live animated gradients and aesthetic wallpapers."
      >
        <div className="space-y-3 pt-1">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setThemeFilter('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                themeFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Themes ({CHAT_THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('live')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer',
                themeFilter === 'live'
                  ? 'bg-background text-rose-500 shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>Live Themes ({CHAT_THEMES.filter(t => t.isLive).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('classic')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                themeFilter === 'classic'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Classic ({CHAT_THEMES.filter(t => !t.isLive).length})
            </button>
          </div>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredThemes.map(theme => {
              const isSelected = chatTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setChatTheme(theme.id);
                    toast.success(`Wallpaper changed to ${theme.name}`);
                  }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer relative group',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20'
                      : 'border-border/70 hover:border-primary/50 hover:bg-muted/40'
                  )}
                >
                  {/* Visual Swatch */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl shrink-0 border relative overflow-hidden flex items-center justify-center shadow-xs transition-transform group-hover:scale-105',
                      theme.bgPreview
                    )}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full', theme.dotColor)} />
                    {theme.isLive && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-center text-white py-0.2 tracking-wider">
                        LIVE
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 backdrop-blur-[0.5px] flex items-center justify-center text-primary-foreground">
                        <Check className="w-5 h-5 text-primary stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {theme.name}
                      </p>
                      {theme.isLive && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded-md">
                          <Flame className="w-2.5 h-2.5" />
                          Live
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-md ml-auto">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-500 inline" />
              Live themes feature smooth GPU-accelerated motion.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsThemeModalOpen(false)}
              className="rounded-xl px-4 text-xs bg-primary text-primary-foreground cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 2. CLEAR CHAT HISTORY MODAL */}
      <Dialog
        isOpen={isClearModalOpen}
        onClose={() => !isClearingHistory && setIsClearModalOpen(false)}
        size="sm"
        title="Clear Chat History"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                Delete all messages in this chat?
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                This will clear conversation history for both of you.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to clear your chat with <strong className="text-foreground">{friend?.display_name || 'your partner'}</strong>? All text messages and shared file notes will be erased. This action cannot be reversed.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isClearingHistory}
              onClick={() => setIsClearModalOpen(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isClearingHistory}
              onClick={handleClearHistory}
              className="text-xs rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isClearingHistory ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Clear Chat</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 3. PARTNER PROFILE MODAL */}
      <Dialog
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        size="sm"
        title="Partner Profile"
      >
        <div className="space-y-4 pt-2">
          {/* Avatar & Main Info Banner */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-b from-rose-500/10 via-pink-500/5 to-transparent border border-rose-500/15 relative overflow-hidden">
            <div className="relative mb-3">
              <Avatar
                src={friend?.avatar_path}
                name={friend?.display_name || 'Partner'}
                size="lg"
                isOnline={friendPresence.online}
                className="w-20 h-20 text-2xl shadow-md border-2 border-background"
              />
            </div>

            <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <span>{friend?.display_name || 'Partner'}</span>
              <Sparkles className="w-4 h-4 text-rose-500" />
            </h3>

            {friend?.username && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`@${friend.username}`);
                  toast.success(`Copied @${friend.username} to clipboard`);
                }}
                className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono text-muted-foreground bg-muted/70 hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Click to copy username"
              >
                <span>@{friend.username}</span>
                <Copy className="w-3 h-3 opacity-60" />
              </button>
            )}

            {/* Online Status Pill */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-background/80 border border-border/60 shadow-xs">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  friendPresence.online
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-muted-foreground/50'
                )}
              />
              <span className={friendPresence.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                {friendPresence.online
                  ? 'Online now'
                  : formatLastSeen(friendPresence.lastSeen || friend?.last_seen_at)}
              </span>
            </div>
          </div>

          {/* Bio / About */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <Sparkle className="w-3 h-3 text-primary" />
              <span>About</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed italic">
              &quot;{friend?.bio || 'Loving every little moment with you in our private sanctuary.'}&quot;
            </p>
          </div>

          {/* Days Together Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {daysTogether !== null ? `Day ${daysTogether}` : 'Special Date'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {daysTogether !== null
                    ? 'Days together in your journey'
                    : 'Set your anniversary date'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsProfileModalOpen(false);
                setSelectedDate(anniversary || '');
                setIsDateDialogOpen(true);
              }}
              className="text-xs rounded-xl h-7 px-2.5 border-rose-500/30 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
            >
              {daysTogether !== null ? 'Change' : 'Set Date'}
            </Button>
          </div>

          {/* Fast Actions in Profile */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsThemeModalOpen(true);
              }}
              className="rounded-xl text-xs gap-1.5 cursor-pointer h-9"
            >
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>Theme</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsMediaDrawerOpen(true);
              }}
              className="rounded-xl text-xs gap-1.5 cursor-pointer h-9"
            >
              <FolderHeart className="w-3.5 h-3.5 text-amber-500" />
              <span>Media</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsProfileModalOpen(false);
                handleExportChat();
              }}
              disabled={isExportingPdf}
              className="rounded-xl text-xs gap-1.5 cursor-pointer h-9"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Export PDF</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 4. ANNIVERSARY / SPECIAL DATE CONFIGURATION MODAL */}
      <Dialog
        isOpen={isDateDialogOpen}
        onClose={() => setIsDateDialogOpen(false)}
        size="sm"
        title="Our Special Date"
        description="Choose the meaningful day you two started your journey together (e.g. your anniversary, first date, or day you met)."
      >
        <form onSubmit={handleSaveDate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Meaningful Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-background border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              This count stays completely private to you two.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {anniversary && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateAnniversary(null);
                  setIsDateDialogOpen(false);
                  toast.info('Special date removed');
                }}
                className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Remove Date
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDateDialogOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-primary text-primary-foreground font-medium cursor-pointer"
              >
                Save Date
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* 5. REMOVE FRIEND CONFIRMATION MODAL */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeletingFriend && setIsDeleteModalOpen(false)}
        title="Remove Friend"
        size="sm"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
            <div className="w-10 h-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {friend?.display_name || 'Partner'}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {friend?.username ? `@${friend.username}` : ''}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove <strong className="text-foreground">{friend?.display_name || 'this partner'}</strong> from your friends? This will delete your conversation history and disconnect you as partners.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeletingFriend}
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeletingFriend}
              onClick={handleDeleteFriend}
              className="text-xs rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isDeletingFriend ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Remove Friend</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 6. CHAT LOCK PASSCODE PIN SETUP MODAL */}
      <Dialog
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPinError('');
          setNewPin('');
          setConfirmPin('');
        }}
        size="sm"
        title="Set 4-Digit Chat Lock PIN"
        description="Create a 4-digit numeric PIN to protect and lock this chat."
      >
        <form onSubmit={handleSavePin} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Enter 4-Digit PIN</label>
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

          <div className="space-y-1.5">
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsPinModalOpen(false);
                setPinError('');
                setNewPin('');
                setConfirmPin('');
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={newPin.length !== 4 || confirmPin.length !== 4}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              Enable & Lock
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 7. SNAPCHAT / DISAPPEARING MESSAGES MODAL */}
      <Dialog
        isOpen={isVanishModalOpen}
        onClose={() => setIsVanishModalOpen(false)}
        size="md"
        title="Snapchat Mode / Delete When Seen"
        description="Choose how fast messages vanish and self-destruct after your partner views them."
      >
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Snapchat-Style Ephemeral Chat</p>
              <p className="text-[11px] text-muted-foreground">
                Once read by the recipient, messages automatically dissolve from both screens.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        : `Vanish mode set: ${opt.shortLabel} after read!`
                    );
                  }}
                  className={cn(
                    'p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-1.5 select-none',
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30'
                      : 'border-border/70 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{opt.label}</span>
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

          <div className="flex items-center justify-end pt-2 border-t border-border/40">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsVanishModalOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 8. PRIVATE SECRET NOTES / VAULT MODAL */}
      <Dialog
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        size="md"
        title="Private Secret Vault Notes"
        description="A private, encrypted scratchpad for surprise gift ideas, personal memories, or secrets. Only you can read this."
      >
        <form onSubmit={handleSaveNotes} className="space-y-4 pt-3">
          <div className="space-y-2">
            <textarea
              rows={6}
              value={tempNotes}
              onChange={e => setTempNotes(e.target.value)}
              placeholder="Write your secret notes, surprise anniversary gift ideas, reminders..."
              className="w-full p-3 rounded-2xl border border-border bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
            <span>🔒 Stored securely in your device</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNotesModalOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="cursor-pointer">
                Save Notes
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* 9. CLEAN CACHE CONFIRMATION MODAL */}
      <Dialog
        isOpen={isClearCacheModalOpen}
        onClose={() => setIsClearCacheModalOpen(false)}
        size="sm"
        title="Clean Local Storage & Cache?"
        description="This will purge temporary cached files and scratch memory to free up device space. Your login session will be kept safe."
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsClearCacheModalOpen(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleClearCacheConfirm}
            className="cursor-pointer"
          >
            Clean Now
          </Button>
        </div>
      </Dialog>
    </>
  );
}
