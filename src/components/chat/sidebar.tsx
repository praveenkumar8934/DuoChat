'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  LogOut,
  Search,
  Image as ImageIcon,
  Music,
  Film,
  FileText,
  Heart,
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
  MessageSquare,
  CircleDot,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Plus,
  Sparkles,
  Clock,
  RefreshCw,
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
import { usePrivacySettings } from '@/lib/privacy-features';
import { LockedChatModal } from './locked-chat-modal';
import { useCall } from '@/context/call-context';
import type { ConversationWithDetails } from '@/types/database';

export interface CallRecord {
  id: string;
  conversationId?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string | null;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
  status?: string;
}

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const { startCall, callState } = useCall();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isUserOnline,
    getUserLastSeen,
    incomingRequests,
    respondToRequest,
    typingUsers,
  } = useChat();
  const router = useRouter();

  // Privacy Settings Hook
  const {
    ghostMode,
    isSnapchatModeActive,
    isConversationChatLocked,
    isChatUnlockedInSession,
  } = usePrivacySettings();

  // Dialog & Modal States
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [lockedChatToUnlock, setLockedChatToUnlock] = React.useState<ConversationWithDetails | null>(null);

  // Bottom Navigation Tab: 'chats' | 'status' | 'calls'
  const [activeTab, setActiveTab] = React.useState<'chats' | 'status' | 'calls'>('chats');

  // Status Tab States
  const [myStatus, setMyStatus] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('duochat_my_status');
        if (saved) return saved;
      } catch {
        // fallback
      }
    }
    return profile?.bio || 'Living every moment in love ✨❤️';
  });
  const [isEditingStatus, setIsEditingStatus] = React.useState(false);
  const [tempStatusInput, setTempStatusInput] = React.useState(myStatus);
  const [selectedStatusFriend, setSelectedStatusFriend] = React.useState<{
    id: string;
    name: string;
    avatar?: string | null;
    statusText: string;
    isOnline: boolean;
    lastSeen?: string | null;
  } | null>(null);

  // Call History State (Valid calls only)
  const [callHistory, setCallHistory] = React.useState<CallRecord[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = React.useState(false);

  // Clear any legacy mock call history from localStorage
  React.useEffect(() => {
    try {
      localStorage.removeItem('duochat_call_history_v1');
    } catch {
      // ignore
    }
  }, []);

  const fetchCallHistory = React.useCallback(async () => {
    try {
      setIsLoadingCalls(true);
      const res = await fetch('/api/calls/history');
      if (!res.ok) return;
      const data = await res.json();
      const calls: Array<{
        id: string;
        conversation_id: string;
        initiator_id: string;
        call_type: string;
        status: string;
        duration_seconds?: number;
        created_at?: string;
        initiator?: {
          id: string;
          username: string | null;
          display_name: string;
          avatar_path: string | null;
        } | null;
      }> = data.calls || [];

      // Filter and format only VALID calls (completed with duration > 0, missed, or declined)
      const validRecords: CallRecord[] = [];

      for (const c of calls) {
        if (!c.status) continue;
        if (c.status !== 'completed' && c.status !== 'missed' && c.status !== 'declined') {
          continue;
        }
        if (c.status === 'completed' && (!c.duration_seconds || c.duration_seconds <= 0)) {
          // Cancelled dial attempts or 0-duration incomplete calls are not valid finished calls
          continue;
        }

        const conv = conversations.find(cv => cv.id === c.conversation_id);
        const partner = conv?.otherUser;
        const isMyCall = profile?.id && c.initiator_id === profile.id;

        const otherUserId = isMyCall
          ? (partner?.id || c.initiator_id)
          : (c.initiator?.id || partner?.id || c.initiator_id);

        const otherUserName = isMyCall
          ? (partner?.display_name || partner?.username || 'Partner')
          : (c.initiator?.display_name || c.initiator?.username || partner?.display_name || 'Partner');

        const otherUserAvatar = isMyCall
          ? (partner?.avatar_path || null)
          : (c.initiator?.avatar_path || partner?.avatar_path || null);

        let direction: 'incoming' | 'outgoing' | 'missed' = isMyCall ? 'outgoing' : 'incoming';
        if (c.status === 'missed' || (!isMyCall && c.status === 'declined')) {
          direction = 'missed';
        }

        let durationText: string | undefined;
        if (c.status === 'completed') {
          const d = Number(c.duration_seconds || 0);
          if (d >= 60) {
            const m = Math.floor(d / 60);
            const s = d % 60;
            durationText = s > 0 ? `${m}m ${s}s` : `${m} min${m > 1 ? 's' : ''}`;
          } else {
            durationText = `${d}s`;
          }
        } else if (c.status === 'missed') {
          durationText = 'Missed';
        } else if (c.status === 'declined') {
          durationText = 'Declined';
        }

        // Relative timestamp formatting
        let timeStr = 'Recently';
        if (c.created_at) {
          const callDate = new Date(c.created_at);
          const now = new Date();
          const isToday = callDate.toDateString() === now.toDateString();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const isYesterday = callDate.toDateString() === yesterday.toDateString();

          const timeFormatted = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (isToday) {
            timeStr = `Today, ${timeFormatted}`;
          } else if (isYesterday) {
            timeStr = `Yesterday, ${timeFormatted}`;
          } else {
            timeStr = `${callDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeFormatted}`;
          }
        }

        validRecords.push({
          id: c.id,
          conversationId: c.conversation_id,
          otherUserId,
          otherUserName,
          otherUserAvatar,
          type: (c.call_type === 'video' ? 'video' : 'voice') as 'voice' | 'video',
          direction,
          timestamp: timeStr,
          duration: durationText,
          status: c.status,
        });
      }

      setCallHistory(validRecords);
    } catch (err) {
      console.warn('Could not load valid call history:', err);
    } finally {
      setIsLoadingCalls(false);
    }
  }, [conversations, profile?.id]);

  // Fetch valid call history when Calls tab is active
  React.useEffect(() => {
    if (activeTab === 'calls') {
      fetchCallHistory();
    }
  }, [activeTab, fetchCallHistory]);

  // Also refresh after an active call terminates
  React.useEffect(() => {
    if (callState === 'idle') {
      fetchCallHistory();
    }
  }, [callState, fetchCallHistory]);

  const handleStartCall = (targetUser: { id: string; name: string; avatar?: string | null }, type: 'voice' | 'video') => {
    const targetConv = conversations.find(c => c.otherUser?.id === targetUser.id) || conversations[0];
    if (targetConv) {
      startCall(targetConv.id, type, {
        id: targetUser.id,
        name: targetUser.name,
        avatar: targetUser.avatar,
      });
    } else {
      toast.error('Connect with a partner first to start voice/video calls.');
    }
  };

  const handleSaveMyStatus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempStatusInput.trim()) return;
    setMyStatus(tempStatusInput.trim());
    try {
      localStorage.setItem('duochat_my_status', tempStatusInput.trim());
    } catch {
      // ignore
    }
    setIsEditingStatus(false);
    toast.success('Your status has been updated! ✨');
  };

  const totalUnread = React.useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const hasOnlineFriends = React.useMemo(() => {
    return conversations.some(c => c.otherUser?.id && isUserOnline(c.otherUser.id));
  }, [conversations, isUserOnline]);

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

  return (
    <>
      <aside className="w-full md:w-80 lg:w-88 flex flex-col h-full bg-sidebar-bg border-r border-border/70 select-none transition-colors">
        {/* WhatsApp-Style Top Bar */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-border/50 bg-card/70 backdrop-blur-md flex items-center justify-between gap-2 select-none sticky top-0 z-20">
          {/* Logo with Name */}
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size="md" href="/chat" />
          </div>

          {/* Right Action Icons: App Theme Toggle, Notification Bell, Connect Button, 3 Dots */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* App Theme Toggle on Header */}
            <ThemeToggle />

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

        {/* Tab 1: Chats View */}
        {activeTab === 'chats' && (
          <>
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
          </>
        )}

        {/* Tab 2: Status View */}
        {activeTab === 'status' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* My Status Card */}
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                My Status
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-card border border-border/60 hover:bg-muted/40 transition-colors shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <Avatar
                      src={profile?.avatar_path}
                      name={profile?.display_name || 'Me'}
                      size="md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTempStatusInput(myStatus);
                        setIsEditingStatus(true);
                      }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-background shadow-xs hover:scale-110 transition-transform cursor-pointer"
                      title="Update my status"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {profile?.display_name || 'My Status'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {myStatus || 'Tap + to add a status update'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTempStatusInput(myStatus);
                    setIsEditingStatus(true);
                  }}
                  className="h-7 px-2.5 text-[11px] text-primary hover:bg-primary/10 rounded-lg font-semibold"
                >
                  Edit
                </Button>
              </div>
            </div>

            {/* Friends Status Updates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Recent Updates</span>
                <span className="text-[10px] text-primary font-normal">{filteredConversations.length} friends</span>
              </div>

              {filteredConversations.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                  <CircleDot className="w-9 h-9 mx-auto text-muted-foreground/50 animate-pulse" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">No status updates yet</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Connect with partners to view their statuses and stories
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsInviteOpen(true)}
                    className="h-7 text-xs rounded-xl border-primary/30 text-primary"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Connect Partner
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map(conv => {
                    const other = conv.otherUser;
                    const isOnline = other?.id ? isUserOnline(other.id) : false;
                    const lastSeen = other?.id ? getUserLastSeen(other.id) : undefined;
                    const statusText = other?.bio || (isOnline ? 'Online and chatting with my favorite person 💖' : 'Taking a little break ✨');

                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => {
                          setSelectedStatusFriend({
                            id: other?.id || conv.id,
                            name: other?.display_name || 'Partner',
                            avatar: other?.avatar_path,
                            statusText,
                            isOnline,
                            lastSeen,
                          });
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-muted/60 transition-colors text-left group cursor-pointer border border-transparent hover:border-border/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Colorful Story Ring around Avatar */}
                          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-emerald-400 via-primary to-pink-500 shadow-xs group-hover:scale-105 transition-transform">
                            <div className="p-0.5 bg-background rounded-full">
                              <Avatar
                                src={other?.avatar_path}
                                name={other?.display_name || 'Friend'}
                                size="md"
                                isOnline={isOnline}
                              />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {other?.display_name || 'Partner'}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {statusText}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-[10px] text-muted-foreground">
                          <span>{isOnline ? 'Active now' : formatChatListItemTime(conv.updated_at)}</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">View</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Calls View (Valid calls only) */}
        {activeTab === 'calls' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {/* Call Header action */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-xs font-bold text-foreground">Call History</h3>
                <p className="text-[10px] text-muted-foreground">Recent valid audio & video calls</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchCallHistory}
                  disabled={isLoadingCalls}
                  className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  title="Refresh calls"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isLoadingCalls && 'animate-spin')} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0];
                    if (activeConv?.otherUser) {
                      handleStartCall(
                        {
                          id: activeConv.otherUser.id,
                          name: activeConv.otherUser.display_name || 'Partner',
                          avatar: activeConv.otherUser.avatar_path,
                        },
                        'voice'
                      );
                    } else {
                      setIsInviteOpen(true);
                    }
                  }}
                  className="h-7 px-2.5 text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                >
                  <Phone className="w-3 h-3" />
                  <span>New Call</span>
                </Button>
              </div>
            </div>

            {isLoadingCalls && callHistory.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <div className="w-6 h-6 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Loading call history...</p>
              </div>
            ) : callHistory.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">No call history yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Valid completed and missed calls with your partner will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 divide-y divide-border/20">
                {callHistory.map(call => {
                  const isIncoming = call.direction === 'incoming';
                  const isOutgoing = call.direction === 'outgoing';
                  const isMissed = call.direction === 'missed';

                  return (
                    <div
                      key={call.id}
                      className="pt-2 pb-2 first:pt-0 flex items-center justify-between gap-2 hover:bg-muted/40 p-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => {
                        if (call.conversationId) {
                          const conv = conversations.find(c => c.id === call.conversationId);
                          if (conv) handleConversationClick(conv);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={call.otherUserAvatar}
                          name={call.otherUserName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-xs font-semibold truncate',
                              isMissed ? 'text-destructive font-bold' : 'text-foreground'
                            )}
                          >
                            {call.otherUserName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {call.type === 'video' ? (
                              <Video className="w-3 h-3 text-muted-foreground shrink-0" />
                            ) : null}
                            {isIncoming && <PhoneIncoming className="w-3 h-3 text-emerald-500 shrink-0" />}
                            {isOutgoing && <PhoneOutgoing className="w-3 h-3 text-primary shrink-0" />}
                            {isMissed && <PhoneMissed className="w-3 h-3 text-destructive shrink-0" />}
                            <span className="truncate">{call.timestamp}</span>
                            {call.duration && (
                              <>
                                <span>•</span>
                                <span className={cn('text-[10px]', isMissed && 'text-destructive font-semibold')}>
                                  {call.duration}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() =>
                            handleStartCall(
                              {
                                id: call.otherUserId,
                                name: call.otherUserName,
                                avatar: call.otherUserAvatar,
                              },
                              'voice'
                            )
                          }
                          className="p-2 rounded-xl text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title={`Voice call ${call.otherUserName}`}
                          aria-label="Voice Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStartCall(
                              {
                                id: call.otherUserId,
                                name: call.otherUserName,
                                avatar: call.otherUserAvatar,
                              },
                              'video'
                            )
                          }
                          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          title={`Video call ${call.otherUserName}`}
                          aria-label="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modern WhatsApp-Style Bottom Navigation: Chats | Status | Calls */}
        <div className="border-t border-border/60 bg-card/75 backdrop-blur-md px-2 py-1.5 flex items-center justify-around select-none">
          {/* Chats Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('chats')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative',
              activeTab === 'chats'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
            title="Chats"
            aria-label="Chats"
          >
            <div className="relative">
              <MessageSquare className={cn('w-5 h-5 transition-transform', activeTab === 'chats' && 'scale-110')} />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500 text-white min-w-[16px] text-center shadow-xs">
                  {totalUnread}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Chats</span>
            {activeTab === 'chats' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>

          {/* Status Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative',
              activeTab === 'status'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
            title="Status"
            aria-label="Status"
          >
            <div className="relative">
              <CircleDot className={cn('w-5 h-5 transition-transform', activeTab === 'status' && 'scale-110')} />
              {/* Active status indicator dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Status</span>
            {activeTab === 'status' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>

          {/* Calls Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative',
              activeTab === 'calls'
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
            )}
            title="Calls"
            aria-label="Calls"
          >
            <div className="relative">
              <Phone className={cn('w-5 h-5 transition-transform', activeTab === 'calls' && 'scale-110')} />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Calls</span>
            {activeTab === 'calls' && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </aside>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* 📱 Status / Story Viewer Dialog */}
      <Dialog
        isOpen={!!selectedStatusFriend}
        onClose={() => setSelectedStatusFriend(null)}
        title={`${selectedStatusFriend?.name || 'Partner'}'s Status`}
        description={
          selectedStatusFriend?.isOnline
            ? 'Active now'
            : selectedStatusFriend?.lastSeen
            ? `Last seen ${formatLastSeen(selectedStatusFriend.lastSeen)}`
            : 'Recently updated'
        }
        size="sm"
      >
        {selectedStatusFriend && (
          <div className="space-y-4 pt-1">
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-primary/10 via-pink-500/10 to-violet-500/10 border border-primary/20 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
              <Sparkles className="w-6 h-6 text-primary/40 absolute top-2 right-2 animate-pulse" />
              <div className="p-1 rounded-full bg-gradient-to-tr from-emerald-400 via-primary to-pink-500 shadow-xs">
                <Avatar
                  src={selectedStatusFriend.avatar}
                  name={selectedStatusFriend.name}
                  size="lg"
                  isOnline={selectedStatusFriend.isOnline}
                />
              </div>
              <p className="text-base font-semibold text-foreground leading-relaxed break-words">
                &ldquo;{selectedStatusFriend.statusText}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Active for 24 hours</span>
              </div>
            </div>

            <Button
              className="w-full rounded-xl gap-2 font-semibold"
              onClick={() => {
                const targetConv = conversations.find(c => c.otherUser?.id === selectedStatusFriend.id);
                if (targetConv) {
                  handleConversationClick(targetConv);
                }
                setSelectedStatusFriend(null);
                setActiveTab('chats');
              }}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Message</span>
            </Button>
          </div>
        )}
      </Dialog>

      {/* ✏️ Edit My Status Dialog */}
      <Dialog
        isOpen={isEditingStatus}
        onClose={() => setIsEditingStatus(false)}
        title="Update My Status"
        size="sm"
      >
        <form onSubmit={handleSaveMyStatus} className="space-y-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              What&apos;s on your mind?
            </label>
            <input
              type="text"
              value={tempStatusInput}
              onChange={e => setTempStatusInput(e.target.value)}
              placeholder="e.g. In love ❤️, Busy, Sleeping..."
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-muted/60 border border-border/80 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <span className="text-[10px] text-muted-foreground block text-right mt-1">
              {tempStatusInput.length}/80
            </span>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Quick Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Living every moment in love ✨❤️',
                'Available 💬',
                'At work 💼',
                'In a meeting 🔇',
                'Traveling ✈️',
                'Sleeping 😴',
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTempStatusInput(preset)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-muted/70 hover:bg-muted text-foreground border border-border/50 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingStatus(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Status
            </Button>
          </div>
        </form>
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
