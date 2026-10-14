import { describe, it, expect } from 'vitest';
import { generateChatPdf } from '@/lib/export-chat-pdf';
import { MessageWithDetails } from '@/types/database';

describe('generateChatPdf', () => {
  it('generates a valid PDF document with header and metadata', () => {
    const messages: MessageWithDetails[] = [
      {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'user-me',
        message_type: 'text',
        body: 'Hello my sweetheart!',
        storage_path: null,
        original_filename: null,
        mime_type: null,
        file_size: null,
        duration_seconds: null,
        reply_to_message_id: null,
        created_at: '2026-10-14T10:00:00Z',
        updated_at: '2026-10-14T10:00:00Z',
        edited_at: null,
        deleted_at: null,
      },
      {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'user-partner',
        message_type: 'text',
        body: 'Hey love! How is your day going? ❤️',
        storage_path: null,
        original_filename: null,
        mime_type: null,
        file_size: null,
        duration_seconds: null,
        reply_to_message_id: null,
        created_at: '2026-10-14T10:01:00Z',
        updated_at: '2026-10-14T10:01:00Z',
        edited_at: null,
        deleted_at: null,
      },
    ];

    const doc = generateChatPdf({
      partnerName: 'Sweetheart',
      partnerUsername: 'sweetheart123',
      currentUserId: 'user-me',
      currentUserName: 'Me',
      messages,
      daysTogether: 42,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('handles empty message list gracefully without crashing', () => {
    const doc = generateChatPdf({
      partnerName: 'Sweetheart',
      partnerUsername: null,
      currentUserId: 'user-me',
      currentUserName: 'Me',
      messages: [],
      daysTogether: null,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
