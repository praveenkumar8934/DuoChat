'use client';

import * as React from 'react';
import { useChat } from '@/context/chat-context';
import { Sidebar } from '@/components/chat/sidebar';
import { ConversationHeader } from '@/components/chat/conversation-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageComposer } from '@/components/chat/message-composer';
import { MediaGalleryDrawer } from '@/components/chat/media-gallery-drawer';
import { MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteModal } from '@/components/chat/invite-modal';

export default function ChatPage() {
  const { activeConversationId, conversations } = useChat();
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar: hidden on mobile if an active conversation is open */}
      <div
        className={`h-full ${
          activeConversationId ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main Conversation Area: full screen on mobile when conversation selected */}
      <div
        className={`flex-1 flex flex-col h-full overflow-hidden bg-background ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversationId ? (
          <>
            <ConversationHeader />
            <MessageList />
            <MessageComposer />
          </>
        ) : (
          /* Empty state on desktop when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Welcome to DuoChat</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
              Select a conversation from the sidebar or invite your friend to start your private messaging sanctuary.
            </p>
            <Button
              onClick={() => setIsInviteOpen(true)}
              className="mt-5 rounded-xl gap-2 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Invite Friend
            </Button>
          </div>
        )}
      </div>

      {/* Right Drawer: Shared Media & Info */}
      <MediaGalleryDrawer />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
}
