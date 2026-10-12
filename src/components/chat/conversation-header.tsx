'use client';

import * as React from 'react';
import { ArrowLeft, Search, Folder, MoreVertical, ShieldCheck, X } from 'lucide-react';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatLastSeen } from '@/lib/utils';
import Link from 'next/link';

export function ConversationHeader() {
  const {
    activeConversation,
    friendPresence,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    isMediaDrawerOpen,
    setIsMediaDrawerOpen,
    typingUsers,
  } = useChat();

  const friend = activeConversation?.otherUser;

  return (
    <div className="flex flex-col border-b border-border/80 bg-card/60 backdrop-blur-md z-10">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <Link
            href="/chat"
            className="md:hidden p-2 -ml-1 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Back to conversations list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Friend Avatar & Presence */}
          <div className="relative">
            <Avatar
              src={friend?.avatar_path}
              name={friend?.display_name || 'Friend'}
              size="md"
              isOnline={friendPresence.online}
            />
          </div>

          {/* Friend Name & Dynamic Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold truncate text-foreground">
                {friend?.display_name || 'Direct Conversation'}
              </h2>
              <span title="Private 1-on-1 Conversation" className="inline-flex">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              </span>
            </div>

            <div className="text-xs truncate">
              {typingUsers.length > 0 ? (
                <span className="text-primary font-medium animate-pulse">
                  typing...
                </span>
              ) : friendPresence.online ? (
                <span className="text-emerald-500 font-medium">Online</span>
              ) : (
                <span className="text-muted-foreground">
                  {formatLastSeen(friend?.last_seen_at || friendPresence.lastSeen)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearching(!isSearching)}
            className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Search in conversation"
            aria-label="Search conversation"
          >
            <Search className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
            className={`rounded-xl transition-colors ${
              isMediaDrawerOpen
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Shared media & documents"
            aria-label="Toggle media panel"
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* In-conversation Search Bar when toggled */}
      {isSearching && (
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-muted/40 border-t border-border/50 animate-in slide-in-from-top-1 duration-150">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages, files, or photos..."
            autoFocus
            className="w-full bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
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
  );
}
