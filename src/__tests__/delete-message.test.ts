import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/chat/delete-message/route';

describe('POST /api/chat/delete-message', () => {
  it('returns 400 if conversationId is missing', async () => {
    const req = new Request('http://localhost:3000/api/chat/delete-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: 'msg-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Conversation ID is required');
  });

  it('returns 400 if message IDs are missing', async () => {
    const req = new Request('http://localhost:3000/api/chat/delete-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('At least one message ID is required');
  });

  it('returns 401 if unauthenticated and no user provided', async () => {
    const req = new Request('http://localhost:3000/api/chat/delete-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-123', messageId: 'msg-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });
});
