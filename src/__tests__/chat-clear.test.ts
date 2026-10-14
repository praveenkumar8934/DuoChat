import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/chat/clear/route';

describe('POST /api/chat/clear', () => {
  it('returns 400 if conversationId is missing', async () => {
    const req = new Request('http://localhost:3000/api/chat/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Conversation ID is required');
  });

  it('returns 401 if unauthenticated and no user id provided', async () => {
    const req = new Request('http://localhost:3000/api/chat/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });
});
