import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function GET(req: Request) {
  try {
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    const db = env.supabaseServiceRoleKey
      ? createServiceClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
          auth: { persistSession: false },
        })
      : userClient;

    // Find all conversation IDs where current authenticated user is an authorized member
    const { data: userMemberships, error: memberErr } = await db
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (memberErr || !userMemberships || userMemberships.length === 0) {
      return NextResponse.json({ calls: [] });
    }

    const userConvIds = userMemberships.map((m: { conversation_id: string }) => m.conversation_id);

    let query = db
      .from('calls')
      .select('*, initiator:profiles!calls_initiator_id_fkey(id, username, display_name, avatar_path)')
      .in('conversation_id', userConvIds)
      .in('status', ['completed', 'missed', 'declined'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationId) {
      if (!userConvIds.includes(conversationId)) {
        return NextResponse.json({ calls: [] });
      }
      query = query.eq('conversation_id', conversationId);
    }

    const { data: calls, error } = await query;

    if (error) {
      console.error('Error fetching call history:', error);
      return NextResponse.json({ calls: [] });
    }

    // Filter to only VALID calls:
    // 1. Must be in a valid status ('completed', 'missed', 'declined')
    // 2. If 'completed', must have actually connected with duration > 0
    const validCalls = (calls || []).filter((c: { status: string; duration_seconds?: number }) => {
      if (c.status === 'completed') {
        return typeof c.duration_seconds === 'number' && c.duration_seconds > 0;
      }
      return c.status === 'missed' || c.status === 'declined';
    });

    return NextResponse.json({ calls: validCalls });
  } catch (err: unknown) {
    console.error('Error fetching call history:', err);
    return NextResponse.json({ calls: [] });
  }
}
