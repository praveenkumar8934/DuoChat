'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import {
  ConversationWithDetails,
  MessageWithDetails,
  MessageType,
  UserPresence,
  MessageReaction,
} from '@/types/database';
import {
  DEMO_CONVERSATION,
  DEMO_MESSAGES,
  DEMO_CURRENT_USER,
  DEMO_FRIEND_USER,
} from '@/lib/mock-data';

interface ChatContextType {
  conversations: ConversationWithDetails[];
  activeConversationId: string | null;
  activeConversation: ConversationWithDetails | null;
  messages: MessageWithDetails[];
  isLoadingMessages: boolean;
  replyingTo: MessageWithDetails | null;
  searchQuery: string;
  isSearching: boolean;
  isMediaDrawerOpen: boolean;
  typingUsers: string[];
  friendPresence: UserPresence;
  setActiveConversationId: (id: string | null) => void;
  setReplyingTo: (msg: MessageWithDetails | null) => void;
  setSearchQuery: (q: string) => void;
  setIsSearching: (val: boolean) => void;
  setIsMediaDrawerOpen: (val: boolean) => void;
  sendMessage: (payload: {
    messageType: MessageType;
    body?: string;
    file?: File;
    replyToId?: string;
    durationSeconds?: number;
  }) => Promise<{ error?: string }>;
  editMessage: (messageId: string, newBody: string) => Promise<{ error?: string }>;
  deleteMessage: (messageId: string) => Promise<{ error?: string }>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  broadcastTyping: (isTyping: boolean) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { profile, isConfigured } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [friendPresence, setFriendPresence] = useState<UserPresence>({
    userId: 'usr_sarah_002',
    online: true,
    lastSeen: '2026-10-12T12:00:00.000Z',
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Active conversation object
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Load conversations
  const refreshConversations = useCallback(async () => {
    if (!profile) return;

    if (!isConfigured) {
      setConversations([DEMO_CONVERSATION]);
      if (!activeConversationId) {
        setActiveConversationId(DEMO_CONVERSATION.id);
      }
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      // Fetch conversations the user is a member of
      const { data: memberRows, error: memberErr } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            id,
            type,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', profile.id);

      if (memberErr || !memberRows) {
        console.error('Error fetching member rows:', memberErr);
        return;
      }

      const convList: ConversationWithDetails[] = [];

      for (const row of memberRows) {
        const conv = (row as any).conversations;
        if (!conv) continue;

        // Fetch all members of this conversation
        const { data: allMembers } = await supabase
          .from('conversation_members')
          .select(`
            conversation_id,
            user_id,
            joined_at,
            last_read_at,
            role,
            profiles (*)
          `)
          .eq('conversation_id', conv.id);

        const mappedMembers = (allMembers || []).map((m: any) => ({
          ...m,
          profile: m.profiles,
        }));

        const otherMember = mappedMembers.find((m: any) => m.user_id !== profile.id);

        // Fetch last message
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count unread
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', row.last_read_at)
          .neq('sender_id', profile.id)
          .is('deleted_at', null);

        convList.push({
          id: conv.id,
          type: conv.type,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          members: mappedMembers,
          otherUser: otherMember?.profile,
          lastMessage: lastMsgData ?? null,
          unreadCount: unreadCount || 0,
        });
      }

      setConversations(convList);
      if (!activeConversationId && convList.length > 0) {
        setActiveConversationId(convList[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [profile, isConfigured, activeConversationId]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);

    if (!isConfigured) {
      setMessages(DEMO_MESSAGES);
      setIsLoadingMessages(false);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*),
          receipts:message_receipts(*),
          reactions:message_reactions(*)
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        const enriched: MessageWithDetails[] = await Promise.all(
          data.map(async (msg: any) => {
            let signedMediaUrl = null;
            if (msg.storage_path) {
              const { data: signedData } = await supabase.storage
                .from('chat-media')
                .createSignedUrl(msg.storage_path, 3600);
              signedMediaUrl = signedData?.signedUrl ?? null;
            }

            // Calculate delivery status
            let status: MessageWithDetails['deliveryStatus'] = 'sent';
            const receipts = msg.receipts || [];
            if (receipts.some((r: any) => r.read_at)) {
              status = 'read';
            } else if (receipts.some((r: any) => r.delivered_at)) {
              status = 'delivered';
            }

            return {
              ...msg,
              deliveryStatus: status,
              signedMediaUrl,
            };
          })
        );
        setMessages(enriched);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isConfigured]);

  // Initialize conversations
  useEffect(() => {
    if (profile) {
      refreshConversations();
    }
  }, [profile, refreshConversations]);

  // Handle active conversation change
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  // Realtime subscription setup
  useEffect(() => {
    if (!isConfigured || !activeConversationId || !profile) return;

    const supabase = getSupabaseBrowserClient();
    const channelName = `conversation:${activeConversationId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: profile.id,
        },
      },
    });

    channelRef.current = channel;

    // Presence listeners
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserId = activeConversation?.otherUser?.id;
        if (otherUserId && state[otherUserId]) {
          setFriendPresence({
            userId: otherUserId,
            online: true,
            lastSeen: new Date().toISOString(),
          });
        }
      })
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        if (key === activeConversation?.otherUser?.id) {
          setFriendPresence(prev => ({
            ...prev,
            online: true,
            lastSeen: new Date().toISOString(),
          }));
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        if (key === activeConversation?.otherUser?.id) {
          setFriendPresence(prev => ({
            ...prev,
            online: false,
            lastSeen: new Date().toISOString(),
          }));
        }
      });

    // Broadcast typing indicator
    channel.on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
      if (payload.userId !== profile.id) {
        if (payload.isTyping) {
          setTypingUsers(prev => Array.from(new Set([...prev, payload.displayName])));
        } else {
          setTypingUsers(prev => prev.filter(name => name !== payload.displayName));
        }
      }
    });

    // Listen to database message inserts
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as any;
          if (newMsg.deleted_at) return;

          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          let signedUrl = null;
          if (newMsg.storage_path) {
            const { data: signedData } = await supabase.storage
              .from('chat-media')
              .createSignedUrl(newMsg.storage_path, 3600);
            signedUrl = signedData?.signedUrl ?? null;
          }

          const completeMessage: MessageWithDetails = {
            ...newMsg,
            sender: senderProfile,
            reactions: [],
            receipts: [],
            deliveryStatus: 'delivered',
            signedMediaUrl: signedUrl,
          };

          setMessages(prev => {
            // Deduplicate if already present (e.g. optimistic)
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) {
              return prev.map(m => (m.id === newMsg.id ? completeMessage : m));
            }
            return [...prev, completeMessage];
          });

          // If incoming message from other user, record receipt
          if (newMsg.sender_id !== profile.id) {
            await supabase.from('message_receipts').upsert(
              {
                message_id: newMsg.id,
                user_id: profile.id,
                delivered_at: new Date().toISOString(),
                read_at: new Date().toISOString(),
              },
              { onConflict: 'message_id,user_id' }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload: any) => {
          const updated = payload.new as any;
          if (updated.deleted_at) {
            // Remove soft-deleted message from view
            setMessages(prev => prev.filter(m => m.id !== updated.id));
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === updated.id
                  ? { ...m, ...updated, body: updated.body, edited_at: updated.edited_at }
                  : m
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          // Refresh reactions
          if (activeConversationId) {
            loadMessages(activeConversationId);
          }
        }
      );

    channel.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          online_at: new Date().toISOString(),
          user_id: profile.id,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [isConfigured, activeConversationId, profile, activeConversation?.otherUser?.id, loadMessages]);

  // Broadcast typing
  const broadcastTyping = useCallback(
    (isTyping: boolean) => {
      if (!profile) return;

      if (!isConfigured) {
        if (isTyping) {
          // In demo mode, trigger a playful auto response if user wants to see typing
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers([]);
          }, 3000);
        }
        return;
      }

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: profile.id,
            displayName: profile.display_name,
            isTyping,
          },
        });
      }
    },
    [profile, isConfigured]
  );

  // Send message
  const sendMessage = async (payload: {
    messageType: MessageType;
    body?: string;
    file?: File;
    replyToId?: string;
    durationSeconds?: number;
  }): Promise<{ error?: string }> => {
    if (!profile || !activeConversationId) {
      return { error: 'No active conversation' };
    }

    const optimisticId = `temp_${Date.now()}`;
    let localPreviewUrl: string | null = null;

    if (payload.file) {
      localPreviewUrl = URL.createObjectURL(payload.file);
    }

    const replyContext = payload.replyToId
      ? messages.find(m => m.id === payload.replyToId)
      : null;

    const optimisticMessage: MessageWithDetails = {
      id: optimisticId,
      conversation_id: activeConversationId,
      sender_id: profile.id,
      sender: profile,
      message_type: payload.messageType,
      body: payload.body || null,
      storage_path: null,
      original_filename: payload.file?.name || null,
      mime_type: payload.file?.type || null,
      file_size: payload.file?.size || null,
      duration_seconds: payload.durationSeconds || null,
      reply_to_message_id: payload.replyToId || null,
      reply_to: replyContext
        ? {
            id: replyContext.id,
            sender_name: replyContext.sender?.display_name || 'Friend',
            message_type: replyContext.message_type,
            body: replyContext.body,
            original_filename: replyContext.original_filename,
          }
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      deliveryStatus: 'sending',
      signedMediaUrl: localPreviewUrl,
      isOptimistic: true,
      reactions: [],
      receipts: [],
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setReplyingTo(null);

    if (!isConfigured) {
      // Demo mode: simulate network delivery
      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticId ? { ...m, deliveryStatus: 'sent' } : m))
        );
      }, 500);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticId ? { ...m, deliveryStatus: 'delivered' } : m))
        );
      }, 1200);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticId ? { ...m, deliveryStatus: 'read' } : m))
        );
      }, 2500);

      // Simulate a smart friend reply in demo mode
      setTimeout(() => {
        setTypingUsers([DEMO_FRIEND_USER.display_name]);
      }, 3500);

      setTimeout(() => {
        setTypingUsers([]);
        const replies = [
          'Sounds fantastic! Excited for this.',
          'Love this so much! Let me save it.',
          'Got it! Looking over it right now.',
          'This is why DuoChat is so much better than cluttered apps.',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const friendMsg: MessageWithDetails = {
          id: `msg_demo_${Date.now()}`,
          conversation_id: activeConversationId,
          sender_id: DEMO_FRIEND_USER.id,
          sender: DEMO_FRIEND_USER,
          message_type: 'text',
          body: randomReply,
          storage_path: null,
          original_filename: null,
          mime_type: null,
          file_size: null,
          duration_seconds: null,
          reply_to_message_id: optimisticId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          edited_at: null,
          deleted_at: null,
          deliveryStatus: 'read',
          reactions: [],
          receipts: [],
        };
        setMessages(prev => [...prev, friendMsg]);
      }, 6000);

      return {};
    }

    try {
      const supabase = getSupabaseBrowserClient();
      let storagePath: string | null = null;

      // Upload file to private storage if present
      if (payload.file) {
        const fileExt = payload.file.name.split('.').pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
        const filePath = `${activeConversationId}/${safeName}`;

        const { error: uploadErr } = await supabase.storage
          .from('chat-media')
          .upload(filePath, payload.file, {
            contentType: payload.file.type,
            upsert: false,
          });

        if (uploadErr) {
          throw new Error(`Upload failed: ${uploadErr.message}`);
        }

        storagePath = filePath;
      }

      const { data: insertedMsg, error: insertErr } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          sender_id: profile.id,
          message_type: payload.messageType,
          body: payload.body || null,
          storage_path: storagePath,
          original_filename: payload.file?.name || null,
          mime_type: payload.file?.type || null,
          file_size: payload.file?.size || null,
          duration_seconds: payload.durationSeconds || null,
          reply_to_message_id: payload.replyToId || null,
        })
        .select()
        .single();

      if (insertErr || !insertedMsg) {
        throw new Error(insertErr?.message || 'Failed to send message');
      }

      // Update optimistic message with real ID and sent status
      setMessages(prev =>
        prev.map(m =>
          m.id === optimisticId
            ? { ...m, ...insertedMsg, isOptimistic: false, deliveryStatus: 'sent' }
            : m
        )
      );

      return {};
    } catch (err: unknown) {
      const errMsg = (err as Error)?.message || 'Failed to send message';
      setMessages(prev =>
        prev.map(m => (m.id === optimisticId ? { ...m, deliveryStatus: 'failed' } : m))
      );
      return { error: errMsg };
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newBody: string): Promise<{ error?: string }> => {
    if (!profile) return { error: 'Not authenticated' };

    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, body: newBody, edited_at: new Date().toISOString() }
          : m
      )
    );

    if (!isConfigured) return {};

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('messages')
        .update({
          body: newBody,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', profile.id);

      if (error) return { error: error.message };
      return {};
    } catch (err: unknown) {
      return { error: (err as Error)?.message || 'Failed to edit message' };
    }
  };

  // Delete message (soft-delete)
  const deleteMessage = async (messageId: string): Promise<{ error?: string }> => {
    if (!profile) return { error: 'Not authenticated' };

    // Soft delete locally
    setMessages(prev => prev.filter(m => m.id !== messageId));

    if (!isConfigured) return {};

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('messages')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', profile.id);

      if (error) return { error: error.message };
      return {};
    } catch (err: unknown) {
      return { error: (err as Error)?.message || 'Failed to delete message' };
    }
  };

  // Toggle emoji reaction
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!profile) return;

    const targetMessage = messages.find(m => m.id === messageId);
    if (!targetMessage) return;

    const existingReaction = targetMessage.reactions?.find(
      r => r.user_id === profile.id && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction locally
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                reactions: (m.reactions || []).filter(r => r.id !== existingReaction.id),
              }
            : m
        )
      );

      if (isConfigured) {
        const supabase = getSupabaseBrowserClient();
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', profile.id)
          .eq('emoji', emoji);
      }
    } else {
      // Add reaction locally
      const newReaction: MessageReaction = {
        id: `react_${Date.now()}`,
        message_id: messageId,
        user_id: profile.id,
        emoji,
        created_at: new Date().toISOString(),
      };

      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                reactions: [...(m.reactions || []), newReaction],
              }
            : m
        )
      );

      if (isConfigured) {
        const supabase = getSupabaseBrowserClient();
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: profile.id,
          emoji,
        });
      }
    }
  };

  // Mark conversation as read
  const markConversationAsRead = async (conversationId: string) => {
    if (!profile) return;

    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    );

    if (isConfigured) {
      const supabase = getSupabaseBrowserClient();
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', profile.id);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoadingMessages,
        replyingTo,
        searchQuery,
        isSearching,
        isMediaDrawerOpen,
        typingUsers,
        friendPresence,
        setActiveConversationId,
        setReplyingTo,
        setSearchQuery,
        setIsSearching,
        setIsMediaDrawerOpen,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        broadcastTyping,
        markConversationAsRead,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
