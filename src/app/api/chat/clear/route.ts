import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    // 3. Soft-delete all messages in the conversation
    const now = new Date().toISOString();
    const { error: clearError } = await adminClient
      .from('messages')
      .update({ deleted_at: now })
      .eq('conversation_id', conversationId)
      .is('deleted_at', null);

    if (clearError) {
      console.error('Error clearing chat history:', clearError);
      return NextResponse.json(
        { error: clearError.message || 'Failed to clear chat history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (err: unknown) {
    console.error('API clear chat error:', err);
    return NextResponse.json(
      { error: (err as Error)?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
