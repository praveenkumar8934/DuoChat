'use client';

import * as React from 'react';
import { useChat } from '@/context/chat-context';
import ChatPage from '../page';

export default function DirectConversationClient({
  conversationId,
}: {
  conversationId: string;
}) {
  const { setActiveConversationId, activeConversationId } = useChat();

  React.useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
  }, [conversationId, setActiveConversationId]);

  return <ChatPage />;
}
