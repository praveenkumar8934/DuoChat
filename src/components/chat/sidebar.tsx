'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Settings,
  LogOut,
  Search,
  Image as ImageIcon,
  Music,
  Film,
  FileText,
  Heart,
  FolderHeart,
  Copy,
  Check,
  X,
  Bell,
  MoreVertical,
  User,
  Shield,
  Palette,
  CheckCheck,
  Lock,
  Ghost,
  Flame,
  Clock,
  Sparkles,
  BellOff,
  HardDriveDownload,
  FileEdit,
  ShieldCheck,
  Info,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';
import { InviteModal } from './invite-modal';
import { NotificationBell } from './notification-bar';
import { formatChatListItemTime, formatLastSeen, cn } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import {
  usePrivacySettings,
  DISAPPEARING_OPTIONS,
  type DisappearingMode,
} from '@/lib/privacy-features';
import { CHAT_THEMES, type ThemeOption } from '@/lib/chat-themes';
import { useRomanticFeatures } from '@/lib/romantic-features';
import { LockedChatModal } from './locked-chat-modal';
import type { ConversationWithDetails } from '@/types/database';

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isUserOnline,
    getUserLastSeen,
    setIsMediaDrawerOpen,
    incomingRequests,
    respondToRequest,
    typingUsers,
    chatTheme,
    setChatTheme,
  } = useChat();
  const router = useRouter();

  // Romantic Features
  const { anniversary, daysTogether, updateAnniversary } = useRomanticFeatures();

  // Privacy Settings Hook
  const {
    disappearingMode,
    setDisappearingMode,
    ghostMode,
    dndEnabled,
    setDNDEnabled,
    vaultNotes,
    setVaultNotes,
    clearLocalDataAndCache,
    isSnapchatModeActive,
    isConversationChatLocked,
    isChatUnlockedInSession,
  } = usePrivacySettings();

  // Dialog & Modal States
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Feature Modals
  const [isThemeModalOpen, setIsThemeModalOpen] = React.useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = React.useState(false);
  const [isVanishModalOpen, setIsVanishModalOpen] = React.useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = React.useState(false);
  const [isClearCacheModalOpen, setIsClearCacheModalOpen] = React.useState(false);
  const [lockedChatToUnlock, setLockedChatToUnlock] = React.useState<ConversationWithDetails | null>(null);

  const handleConversationClick = React.useCallback(
    (conv: ConversationWithDetails) => {
      const isLocked = isConversationChatLocked(conv.id);
      const isUnlocked = isChatUnlockedInSession(conv.id);

      // If chat is locked and not currently unlocked in this active view, prompt for PIN!
      if (isLocked && !isUnlocked) {
        setLockedChatToUnlock(conv);
        return;
      }

      setActiveConversationId(conv.id);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        window.history.pushState({ chat: conv.id }, '', '/chat');
      }
    },
    [isConversationChatLocked, isChatUnlockedInSession, setActiveConversationId]
  );

  // Form states inside modals
  const [themeFilter, setThemeFilter] = React.useState<'all' | 'live' | 'classic'>('all');
  const [selectedDate, setSelectedDate] = React.useState(anniversary || '');
  const [tempNotes, setTempNotes] = React.useState(vaultNotes);

  // Close 3-dots menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCopyUsername = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const uname = profile?.username ? `@${profile.username}` : '';
    if (uname) {
      navigator.clipboard.writeText(uname);
      setCopiedId(true);
      toast.success('Username copied to clipboard!');
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      toast.error('No username set yet');
    }
  };

  const filteredConversations = React.useMemo(() => {
    if (!filterText.trim()) return conversations;
    const query = filterText.toLowerCase().trim();
    return conversations.filter(c => {
      const name = c.otherUser?.display_name?.toLowerCase() || '';
      const user = c.otherUser?.username?.toLowerCase() || '';
      const lastMsg = c.lastMessage?.body?.toLowerCase() || '';
      return (
        name.includes(query) ||
        user.includes(query) ||
        lastMsg.includes(query)
      );
    });
  }, [conversations, filterText]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setVaultNotes(tempNotes);
    setIsNotesModalOpen(false);
    toast.success('Private secret notes saved!');
  };

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    updateAnniversary(selectedDate || null);
    setIsDateModalOpen(false);
    toast.success('Special anniversary date saved!');
  };

  const handleClearCacheConfirm = () => {
    clearLocalDataAndCache();
    setIsClearCacheModalOpen(false);
    toast.success('Local cache and temporary data cleaned!');
  };

  const getMediaPreviewIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-rose-500 shrink-0 inline mr-1" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-violet-500 shrink-0 inline mr-1" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-sky-500 shrink-0 inline mr-1" />;
      case 'file':
        return <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 inline mr-1" />;
      default:
        return null;
    }
  };

  const filteredThemes = React.useMemo(() => {
    if (themeFilter === 'live') return CHAT_THEMES.filter(t => t.isLive);
    if (themeFilter === 'classic') return CHAT_THEMES.filter(t => !t.isLive);
    return CHAT_THEMES;
  }, [themeFilter]);

  return (
    <>
      <aside className="w-full md:w-80 lg:w-88 flex flex-col h-full bg-sidebar-bg border-r border-border/70 select-none transition-colors">
        {/* WhatsApp-Style Top Bar */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-border/50 bg-card/70 backdrop-blur-md flex items-center justify-between gap-2 select-none sticky top-0 z-20">
          {/* Logo with Name */}
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size="md" href="/chat" />
          </div>

          {/* Right Action Icons: Notification Bell, Connect Button, 3 Dots */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Notification Bell */}
            <NotificationBell onOpenConnect={() => setIsInviteOpen(true)} />

            {/* Connect Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInviteOpen(true)}
              className="h-8 px-2.5 sm:px-3 rounded-xl text-xs gap-1.5 border-primary/25 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all cursor-pointer font-medium shadow-2xs"
              title="Connect partner"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="font-semibold">Connect</span>
            </Button>

            {/* 3 Dots Menu Button & Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className={cn(
                  'p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer',
                  isMenuOpen ? 'bg-muted text-foreground ring-1 ring-border' : 'hover:bg-muted/70'
                )}
                title="More options & features"
                aria-label="More options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Backdrop */}
              {isMenuOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setIsMenuOpen(false)}
                />
              )}

              {/* 🌟 3 Dots Feature-Packed Dropdown Popup */}
              {isMenuOpen && (
                <div
                  style={{ backgroundColor: 'hsl(var(--popover))' }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-popover border border-border/90 shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden max-h-[85vh] overflow-y-auto"
                >
                  {/* User Profile Card */}
                  <div
                    style={{ backgroundColor: 'hsl(var(--muted))' }}
                    className="px-3.5 py-2.5 border-b border-border/50 bg-muted/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={profile?.avatar_path}
                        name={profile?.display_name || 'User'}
                        size="sm"
                        isOnline={!ghostMode}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate leading-tight">
                          {profile?.display_name || 'My Profile'}
                        </p>
                        <p className="text-[10px] text-primary font-mono truncate">
                          @{profile?.username || 'user'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {ghostMode ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-500/15 text-violet-500 border border-violet-500/25 flex items-center gap-1">
                          <Ghost className="w-2.5 h-2.5" />
                          <span>Stealth</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Online</span>
                        </span>
                      )}
                      {isSnapchatModeActive && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          <span>10s Vanish</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Section Label: Quick Privacy & Features */}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Features & Privacy Hub
                  </div>

                  {/* 1. Snapchat Mode (Delete Message When Seen) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsVanishModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 group-hover:bg-amber-500/20">
                        <Ghost className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <span>Snapchat Mode</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Auto-Delete
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Delete messages when seen
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2',
                        disappearingMode === 'seen_10s'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : disappearingMode === 'off'
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-primary/10 text-primary border-primary/20'
                      )}
                    >
                      {disappearingMode === 'seen_10s'
                        ? '10s (Active)'
                        : disappearingMode === 'off'
                        ? 'Off'
                        : disappearingMode.replace('seen_', '')}
                    </span>
                  </button>

                  {/* 2. Change Chat Theme (Live & Classic) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsThemeModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500 shrink-0 group-hover:bg-pink-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Change Chat Theme</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          8 Live animated & 5 classic wallpapers
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground capitalize shrink-0 ml-2">
                      {chatTheme.replace('-live', ' ✨')}
                    </span>
                  </button>

                  {/* 4. Our Special Date / Anniversary Counter */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setSelectedDate(anniversary || '');
                      setIsDateModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 group-hover:bg-rose-500/20">
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Our Special Date</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {daysTogether ? `${daysTogether} days together` : 'Milestone anniversary counter'}
                        </p>
                      </div>
                    </div>
                    {daysTogether ? (
                      <span className="text-[10px] font-bold text-rose-500 shrink-0 ml-2">
                        {daysTogether}d ❤️
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Set</span>
                    )}
                  </button>

                  {/* 5. Do Not Disturb (Mute Sounds) */}
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
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 group-hover:bg-indigo-500/20">
                        {dndEnabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Do Not Disturb</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Mute incoming notification chimes
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ml-2',
                        dndEnabled
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {dndEnabled ? 'Muted' : 'Sound On'}
                    </span>
                  </button>

                  {/* 6. Private Secret Notes / Vault Scratchpad */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setTempNotes(vaultNotes);
                      setIsNotesModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500 shrink-0 group-hover:bg-teal-500/20">
                        <FileEdit className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Private Vault Notes</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Personal scratchpad & surprise gift ideas
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Open</span>
                  </button>

                  {/* 7. Clean Local Storage Cache */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsClearCacheModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-600/10 text-amber-600 shrink-0 group-hover:bg-amber-600/20">
                        <HardDriveDownload className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Clean Local Cache</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Clear offline files & temporary blobs
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Clean</span>
                  </button>

                  {/* Section Divider */}
                  <div className="border-t border-border/40 my-1.5" />

                  {/* Section Label: Connection & Media */}
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Connect & Media
                  </div>

                  {/* Connect Partner */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsInviteOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-primary shrink-0" />
                    <span>Connect Partner</span>
                  </button>

                  {/* Our Moments */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMediaDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <FolderHeart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Our Moments & Vault</span>
                  </button>

                  {/* Copy Username */}
                  <button
                    type="button"
                    onClick={e => {
                      handleCopyUsername(e);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Copy My Username</span>
                    </div>
                    {copiedId ? (
                      <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">@{profile?.username || 'user'}</span>
                    )}
                  </button>

                  {/* Section Divider */}
                  <div className="border-t border-border/40 my-1.5" />

                  {/* Section Label: Account Settings */}
                  <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Settings
                  </div>

                  <Link
                    href="/settings/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Profile & Account</span>
                  </Link>

                  <Link
                    href="/settings/appearance"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Appearance & Themes</span>
                  </Link>

                  <Link
                    href="/settings/privacy"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Privacy & Security</span>
                    </div>
                    {isSnapchatModeActive && (
                      <span className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                        Snapchat On
                      </span>
                    )}
                  </Link>

                  {/* Section Divider */}
                  <div className="border-t border-border/40 my-1.5" />

                  {/* Log Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp-Style Search Bar */}
        <div className="px-3.5 sm:px-4 py-2.5 bg-sidebar-bg/60 border-b border-border/40">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search friends or chats..."
              className="w-full pl-10 pr-9 py-2 rounded-full text-xs sm:text-sm bg-muted/60 hover:bg-muted/80 focus:bg-background border border-border/60 focus:border-primary/50 focus:outline-hidden focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-all shadow-2xs"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* All Friends / Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/20">
          {/* Pending Connection Requests Banner in Sidebar */}
          {incomingRequests.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-rose-500/10 via-primary/10 to-pink-500/10 border-b border-primary/25 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  Connection Requests ({incomingRequests.length})
                </span>
              </div>

              {incomingRequests.map(req => {
                return (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-2xl bg-card/80 border border-primary/20 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={req.sender.avatar_path || undefined}
                        name={req.sender.display_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {req.sender.display_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          @{req.sender.username || 'user'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Button
                        size="sm"
                        onClick={() => respondToRequest(req.id, 'accept')}
                        className="flex-1 h-7 rounded-xl text-[11px] gap-1 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Accept</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondToRequest(req.id, 'decline')}
                        className="h-7 px-2.5 rounded-xl text-[11px] gap-1 border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Decline</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filtered Friends List */}
          {filteredConversations.length === 0 ? (
            filterText.trim() ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-40 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">No friends found</p>
                <p className="text-[11px] text-muted-foreground">
                  No friend in your list matches &ldquo;{filterText}&rdquo;
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterText('')}
                  className="mt-2 text-xs rounded-xl"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">No friends yet</p>
                  <p className="text-xs text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                    Share your username or connect with your partner to start chatting.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsInviteOpen(true)}
                  className="rounded-xl text-xs shadow-xs gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Connect Partner
                </Button>
              </div>
            )
          ) : (
            filteredConversations.map(conv => {
              const other = conv.otherUser;
              const isActive = conv.id === activeConversationId;
              const isOtherOnline = other?.id ? isUserOnline(other.id) : false;
              const isFriendTyping = other?.display_name && typingUsers.includes(other.display_name);
              const friendLastSeen = other?.id ? (getUserLastSeen(other.id) || other.last_seen_at) : other?.last_seen_at;
              const isLastMsgFromMe = conv.lastMessage?.sender_id === profile?.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 sm:px-4 py-3 cursor-pointer transition-colors relative group',
                    isActive
                      ? 'bg-card/90 shadow-2xs'
                      : 'hover:bg-muted/50 active:bg-muted/70'
                  )}
                >
                  {/* Subtle active left highlight strip */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                  )}

                  {/* Friend Avatar with online indicator */}
                  <Avatar
                    src={other?.avatar_path}
                    name={other?.display_name || 'Partner'}
                    size="md"
                    isOnline={isOtherOnline}
                    className="shrink-0"
                  />

                  {/* Friend Info & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                        <span>{other?.display_name || 'Partner'}</span>
                        {isConversationChatLocked(conv.id) && (
                          <span title="Locked chat" className="inline-flex items-center">
                            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                          </span>
                        )}
                        {other?.username && (
                          <span className="text-[10px] text-muted-foreground font-normal font-mono hidden sm:inline">
                            @{other.username}
                          </span>
                        )}
                      </h4>

                      {/* Timestamp */}
                      <span
                        className={cn(
                          'text-[11px] shrink-0 font-medium ml-2',
                          conv.unreadCount > 0 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'
                        )}
                      >
                        {formatChatListItemTime(conv.lastMessage?.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {/* Subtitle / Last Message Preview */}
                      <div className="truncate text-xs text-muted-foreground max-w-[200px] sm:max-w-[180px] flex items-center">
                        {isConversationChatLocked(conv.id) && !isChatUnlockedInSession(conv.id) ? (
                          <span className="italic text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-500/80 inline shrink-0" />
                            <span>Locked chat</span>
                          </span>
                        ) : isFriendTyping ? (
                          <span className="text-emerald-500 font-medium flex items-center gap-1 animate-pulse">
                            <span>typing</span>
                            <span className="inline-block animate-bounce">...</span>
                          </span>
                        ) : conv.lastMessage ? (
                          <>
                            {isLastMsgFromMe && (() => {
                              const otherLastRead = other?.id ? conv.members?.find(m => m.user_id === other.id)?.last_read_at : null;
                              const isRead = otherLastRead && conv.lastMessage?.created_at && new Date(otherLastRead) >= new Date(conv.lastMessage.created_at);
                              if (isRead) {
                                return <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] stroke-[2.5] shrink-0 inline mr-1" />;
                              }
                              if (isOtherOnline) {
                                return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0 inline mr-1" />;
                              }
                              return <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0 inline mr-1" />;
                            })()}
                            {getMediaPreviewIcon(conv.lastMessage?.message_type)}
                            <span className="truncate">
                              {conv.lastMessage?.body?.startsWith('[💌 Note]')
                                ? '💌 Little Note'
                                : conv.lastMessage?.body ||
                                  conv.lastMessage?.original_filename ||
                                  (conv.lastMessage?.message_type ? `[${conv.lastMessage.message_type}]` : 'Message')}
                            </span>
                          </>
                        ) : isOtherOnline ? (
                          <span className="text-emerald-500 font-medium">Online now</span>
                        ) : (
                          <span className="text-muted-foreground/80">
                            {formatLastSeen(friendLastSeen)}
                          </span>
                        )}
                      </div>

                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white min-w-[18px] text-center shadow-xs shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer Profile & Quick Access */}
        <div className="p-3 border-t border-border/60 bg-card/50 flex items-center justify-between gap-1 select-none">
          <Link
            href="/settings/profile"
            className="flex items-center gap-2.5 min-w-0 p-1.5 rounded-xl hover:bg-muted/70 transition-colors flex-1"
          >
            <Avatar
              src={profile?.avatar_path}
              name={profile?.display_name || 'Me'}
              size="sm"
            />
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold truncate text-foreground leading-tight">
                {profile?.display_name || 'My Profile'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono truncate">
                <span className="text-primary font-medium">@{profile?.username || 'user'}</span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleCopyUsername}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
            title="Copy your username"
            aria-label="Copy Username"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
            <ThemeToggle />
            <Link
              href="/settings/profile"
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Settings & Preferences"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* 🌟 1. QUICK THEME SELECTOR MODAL */}
      <Dialog
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        size="lg"
        title="Choose Chat Theme"
        description="Select a live animated aura or classic wallpaper for your conversations."
      >
        <div className="space-y-4 pt-2">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40 text-xs">
            <button
              type="button"
              onClick={() => setThemeFilter('all')}
              className={cn(
                'flex-1 py-1 px-2 rounded-lg font-medium transition-all cursor-pointer text-center',
                themeFilter === 'all'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Themes ({CHAT_THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('live')}
              className={cn(
                'flex-1 py-1 px-2 rounded-lg font-medium transition-all cursor-pointer text-center flex items-center justify-center gap-1',
                themeFilter === 'live'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Live Themes ({CHAT_THEMES.filter(t => t.isLive).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter('classic')}
              className={cn(
                'flex-1 py-1 px-2 rounded-lg font-medium transition-all cursor-pointer text-center',
                themeFilter === 'classic'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Classic ({CHAT_THEMES.filter(t => !t.isLive).length})
            </button>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredThemes.map(theme => {
              const isSelected = chatTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    setChatTheme(theme.id);
                    toast.success(`Theme switched to ${theme.name}!`);
                  }}
                  className={cn(
                    'p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 relative select-none',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.01]'
                      : 'border-border/70 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl border border-border/60 shrink-0 shadow-inner flex items-center justify-center relative overflow-hidden',
                        theme.bgPreview
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full shadow-xs', theme.dotColor)} />
                      {theme.isLive && (
                        <Sparkles className="w-3 h-3 text-white/90 absolute bottom-1 right-1 drop-shadow-xs" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-foreground truncate">{theme.name}</h4>
                        {theme.isLive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/20 text-primary border border-primary/30">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{theme.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-border/40">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsThemeModalOpen(false)}
              className="rounded-xl"
            >
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 🌟 2. SNAPCHAT / DISAPPEARING MESSAGES MODAL */}
      <Dialog
        isOpen={isVanishModalOpen}
        onClose={() => setIsVanishModalOpen(false)}
        size="md"
        title="Snapchat Mode / Delete When Seen"
        description="Choose how fast messages vanish and self-destruct after your partner views them."
      >
        <div className="space-y-4 pt-2">
          {/* Ghost Mode Highlight */}
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

          {/* Options Grid */}
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
              className="rounded-xl"
            >
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 🌟 3. ANNIVERSARY & LOVE DAY MODAL */}
      <Dialog
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        size="sm"
        title="Our Special Date"
        description="Choose the special day you two started your story (e.g. your anniversary, first date, or day you met)."
      >
        <form onSubmit={handleSaveDate} className="space-y-4 pt-3">
          {daysTogether !== null && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-1">
              <span className="text-2xl font-serif font-bold text-rose-500">
                {daysTogether} Days in Love
              </span>
              <p className="text-xs text-muted-foreground">Every day with you is a gift ❤️</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Select Special Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            {anniversary && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateAnniversary(null);
                  setSelectedDate('');
                  toast.success('Anniversary date reset');
                }}
                className="text-destructive hover:bg-destructive/10 text-xs"
              >
                Reset Date
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Date
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* 🌟 4. PRIVATE SECRET NOTES / VAULT MODAL */}
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
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Notes
              </Button>
            </div>
          </div>
        </form>
      </Dialog>


      {/* 🌟 6. CLEAN CACHE CONFIRMATION MODAL */}
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
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleClearCacheConfirm}
          >
            Clean Now
          </Button>
        </div>
      </Dialog>

      {/* 🔒 Locked Chat PIN Verification Modal */}
      <LockedChatModal
        isOpen={!!lockedChatToUnlock}
        onClose={() => setLockedChatToUnlock(null)}
        conversation={lockedChatToUnlock}
        onUnlocked={(convId) => {
          setActiveConversationId(convId);
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            window.history.pushState({ chat: convId }, '', '/chat');
          }
          setLockedChatToUnlock(null);
        }}
      />
    </>
  );
}
