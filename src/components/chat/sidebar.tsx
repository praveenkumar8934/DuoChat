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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandLogo } from '@/components/ui/brand-logo';
import { InviteModal } from './invite-modal';
import { NotificationBell } from './notification-bar';
import { formatChatListItemTime, formatLastSeen, cn } from '@/lib/utils';
import { formatDuoId } from '@/lib/duo-id';
import { toast } from '@/components/ui/toast';

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
  } = useChat();
  const router = useRouter();

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');
  const [copiedId, setCopiedId] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const duoId = formatDuoId(profile);

  // Close 3-dots menu on click outside or escape key
  React.useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleCopyDuoId = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(duoId);
    setCopiedId(true);
    toast.success('Duo ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredConversations = React.useMemo(() => {
    if (!filterText.trim()) return conversations;
    const query = filterText.toLowerCase().trim();
    return conversations.filter(c => {
      const name = c.otherUser?.display_name?.toLowerCase() || '';
      const user = c.otherUser?.username?.toLowerCase() || '';
      const duo = formatDuoId(c.otherUser).toLowerCase();
      const lastMsg = c.lastMessage?.body?.toLowerCase() || '';
      return (
        name.includes(query) ||
        user.includes(query) ||
        duo.includes(query) ||
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
                title="More options"
                aria-label="More options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Backdrop to prevent click-through and darken background text */}
              {isMenuOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
                  onClick={() => setIsMenuOpen(false)}
                />
              )}

              {/* 3 Dots Popup Menu */}
              {isMenuOpen && (
                <div
                  style={{ backgroundColor: 'hsl(var(--popover))' }}
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-popover border border-border/90 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                >
                  <div
                    style={{ backgroundColor: 'hsl(var(--muted))' }}
                    className="px-3 py-2 border-b border-border/40 mb-1 bg-muted/60"
                  >
                    <p className="text-[11px] font-medium text-muted-foreground">Signed in as</p>
                    <p className="font-semibold text-foreground truncate">{profile?.display_name || 'My Profile'}</p>
                    <p className="text-[10px] text-primary font-mono">{duoId}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsInviteOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-primary shrink-0" />
                    <span>Connect Partner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsMediaDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <FolderHeart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Our Moments</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      handleCopyDuoId(e);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>Copy My Duo ID</span>
                    </div>
                    {copiedId ? (
                      <span className="text-[10px] text-emerald-500 font-medium">Copied!</span>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground">{duoId.slice(0, 8)}...</span>
                    )}
                  </button>

                  <div className="border-t border-border/40 my-1" />

                  <Link
                    href="/settings/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Profile & Account</span>
                  </Link>

                  <Link
                    href="/settings/appearance"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Appearance & Theme</span>
                  </Link>

                  <Link
                    href="/settings/privacy"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/80 text-foreground transition-colors"
                  >
                    <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>Privacy & Security</span>
                  </Link>

                  <div className="border-t border-border/40 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-destructive/10 text-destructive transition-colors cursor-pointer font-medium"
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
              className="w-full pl-10 pr-9 py-2 rounded-full text-xs sm:text-sm bg-muted/60 hover:bg-muted/80 focus:bg-background border border-border/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-all shadow-2xs"
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
                const duoIdText = formatDuoId(req.sender as any);
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
                          {duoIdText}
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
                    Share your Duo ID or connect with your partner to start chatting.
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
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      window.history.pushState({ chat: conv.id }, '', '/chat');
                    }
                  }}
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
                        {isFriendTyping ? (
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
                <span className="text-primary font-medium">{duoId}</span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleCopyDuoId}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
            title="Copy your Duo ID"
            aria-label="Copy Duo ID"
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

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </>
  );
}
