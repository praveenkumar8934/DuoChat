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

    let query = db
      .from('calls')
      .select('*, initiator:profiles!calls_initiator_id_fkey(id, username, display_name, avatar_path)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }

    const { data: calls, error } = await query;

    if (error) {
      // If table does not exist or empty
      return NextResponse.json({ calls: [] });
    }

    return NextResponse.json({ calls: calls || [] });
  } catch (err: unknown) {
    console.error('Error fetching call history:', err);
    return NextResponse.json({ calls: [] });
  }
}
