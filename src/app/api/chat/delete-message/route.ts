import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId, messageId, messageIds } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const idsToDelete: string[] = [];
    if (messageId && typeof messageId === 'string') {
      idsToDelete.push(messageId);
    }
    if (Array.isArray(messageIds)) {
      idsToDelete.push(...messageIds.filter(id => typeof id === 'string'));
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'At least one message ID is required' },
        { status: 400 }
      );
    }

    // 1. Get authenticated user
    let userId: string | null = req.headers.get('x-user-id') || body.userId || null;

    if (!userId) {
      try {
        const userClient = await createServerSupabase();
        const {
          data: { user },
        } = await userClient.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Fallback
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceKey = env.supabaseServiceRoleKey;
    if (!serviceKey || !env.supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration missing' },
        { status: 500 }
      );
    }

    const adminClient = createServiceClient(env.supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 2. Verify user is a member of this conversation
    const { data: membership } = await adminClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this conversation' },
        { status: 403 }
      );
    }

    // 3. Soft-delete the messages
    const now = new Date().toISOString();
    const { error: deleteError } = await adminClient
      .from('messages')
      .update({ deleted_at: now })
      .eq('conversation_id', conversationId)
      .in('id', idsToDelete)
      .is('deleted_at', null);

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      deletedAt: now,
    });
  } catch (err: any) {
    console.error('Unexpected error in delete-message route:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
