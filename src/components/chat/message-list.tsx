'use client';

import * as React from 'react';
import { useChat } from '@/context/chat-context';
import { MessageBubble } from './message-bubble';
import { formatMessageDate } from '@/lib/utils';
import { MessageSquare, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

export function MessageList() {
  const {
    messages,
    isLoadingMessages,
    searchQuery,
    typingUsers,
    activeConversation,
  } = useChat();

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Filter messages based on search query
  const filteredMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      m =>
        (m.body && m.body.toLowerCase().includes(q)) ||
        (m.original_filename && m.original_filename.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Group filtered messages by formatted date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; items: typeof messages }[] = [];
    let currentDate = '';

    filteredMessages.forEach(msg => {
      const msgDate = formatMessageDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, items: [msg] });
      } else {
        groups[groups.length - 1].items.push(msg);
      }
    });

    return groups;
  }, [filteredMessages]);

  // Scroll to bottom on initial load or new messages
  React.useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, searchQuery]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex justify-start">
          <div className="w-48 h-12 bg-muted/60 animate-pulse rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <div className="w-64 h-16 bg-primary/20 animate-pulse rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <div className="w-56 h-36 bg-muted/60 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (filteredMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        {searchQuery ? (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="w-6 h-6 opacity-60" />
            </div>
            <p className="text-sm font-medium text-foreground">No matching messages</p>
            <p className="text-xs text-muted-foreground mt-1">
              Could not find anything matching &quot;{searchQuery}&quot;
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Private Space Ready</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Say hello or share a photo, song, or document. Messages and files are private between both of you.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
    >
      {groupedMessages.map(group => (
        <div key={group.date} className="space-y-2">
          {/* Centered Date Badge */}
          <div className="flex items-center justify-center my-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-muted/80 text-muted-foreground border border-border/40 select-none shadow-xs">
              {group.date}
            </span>
          </div>

          {/* Messages */}
          {group.items.map((message, idx) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFirstInGroup={idx === 0 || group.items[idx - 1]?.sender_id !== message.sender_id}
            />
          ))}
        </div>
      ))}

      {/* Typing Indicator Bubble */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 pl-2 animate-in fade-in duration-200">
          <Avatar
            name={typingUsers[0]}
            size="xs"
            src={activeConversation?.otherUser?.avatar_path}
          />
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-card border border-border/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
