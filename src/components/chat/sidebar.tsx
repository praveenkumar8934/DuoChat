'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  UserPlus,
  Settings,
  LogOut,
  Search,
  Image as ImageIcon,
  Music,
  Film,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { InviteModal } from './invite-modal';
import { formatMessageTime, cn } from '@/lib/utils';

export function Sidebar() {
  const { profile, signOut, isConfigured } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    friendPresence,
  } = useChat();
  const router = useRouter();

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [filterText, setFilterText] = React.useState('');

  const filteredConversations = conversations.filter(c => {
    if (!filterText) return true;
    const name = c.otherUser?.display_name?.toLowerCase() || '';
    const user = c.otherUser?.username?.toLowerCase() || '';
    return name.includes(filterText.toLowerCase()) || user.includes(filterText.toLowerCase());
  });

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getMediaPreviewIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 inline mr-1" />;
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
      <aside className="w-full md:w-80 lg:w-88 flex flex-col h-full bg-sidebar-bg border-r border-border/80 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground flex items-center gap-1.5">
                DuoChat
                {!isConfigured && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Preview
                  </span>
                )}
              </span>
              <p className="text-[10px] text-muted-foreground font-medium">Private 1-on-1 Messenger</p>
            </div>
          </Link>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsInviteOpen(true)}
            className="rounded-xl text-xs gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
            title="Invite friend"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>

        {/* Search / Filter Box */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-background/60 border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-xs">No conversations yet.</p>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setIsInviteOpen(true)}
                className="mt-3 text-xs rounded-xl"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite your friend
              </Button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = conv.otherUser;
              const isActive = conv.id === activeConversationId;
              const isOtherOnline = other?.id === friendPresence.userId ? friendPresence.online : false;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-150',
                    isActive
                      ? 'bg-card border border-border shadow-xs text-card-foreground'
                      : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Avatar
                    src={other?.avatar_path}
                    name={other?.display_name || 'Friend'}
                    size="md"
                    isOnline={isOtherOnline}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4
                        className={cn(
                          'text-xs font-semibold truncate',
                          isActive ? 'text-foreground' : 'text-foreground/90'
                        )}
                      >
                        {other?.display_name || 'Direct Chat'}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {formatMessageTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <p className="truncate text-[11px] text-muted-foreground max-w-[170px]">
                        {getMediaPreviewIcon(conv.lastMessage?.message_type)}
                        {conv.lastMessage?.body ||
                          conv.lastMessage?.original_filename ||
                          (conv.lastMessage?.message_type ? `[${conv.lastMessage.message_type}]` : 'Say hello!')}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
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

        {/* User Footer Profile & Controls */}
        <div className="p-3 border-t border-border/70 bg-card/40 flex items-center justify-between">
          <Link
            href="/settings/profile"
            className="flex items-center gap-2.5 min-w-0 p-1.5 rounded-xl hover:bg-muted transition-colors flex-1"
          >
            <Avatar
              src={profile?.avatar_path}
              name={profile?.display_name || 'Me'}
              size="sm"
            />
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold truncate text-foreground leading-tight">
                {profile?.display_name || 'My Account'}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                @{profile?.username || 'user'}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <Link
              href="/settings/profile"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
