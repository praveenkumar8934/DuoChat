'use client';

import * as React from 'react';
import { useChat } from '@/context/chat-context';
import { Sidebar } from '@/components/chat/sidebar';
import { ConversationHeader } from '@/components/chat/conversation-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageComposer } from '@/components/chat/message-composer';
import { MediaGalleryDrawer } from '@/components/chat/media-gallery-drawer';
import { UserPlus, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteModal } from '@/components/chat/invite-modal';
import { BrandLogo } from '@/components/ui/brand-logo';

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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none romantic-wallpaper">
            <div className="max-w-md space-y-4 animate-in fade-in duration-300">
              <BrandLogo size="lg" className="justify-center mb-2" />

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-foreground">
                  Just us, in our own little world.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Your favorite person is just one message away. Select your conversation from the sidebar or send an invitation to connect.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Button
                  onClick={() => setIsInviteOpen(true)}
                  className="rounded-2xl gap-2 font-medium bg-gradient-to-tr from-[#702C45] to-[#C96B83] text-white shadow-md hover:opacity-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Partner
                </Button>
              </div>

              <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Made for the moments between us.</span>
              </div>
            </div>
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
