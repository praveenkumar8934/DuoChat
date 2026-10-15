import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { callId, status, durationSeconds } = body;

    if (!callId || !status) {
      return NextResponse.json(
        { error: 'Missing required callId or status' },
        { status: 400 }
      );
    }

    const db = env.supabaseServiceRoleKey
      ? createServiceClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
          auth: { persistSession: false },
        })
      : userClient;

    const updatePayload: Record<string, unknown> = {
      status,
    };

    if (
      status === 'completed' ||
      status === 'declined' ||
      status === 'missed' ||
      status === 'cancelled' ||
      status === 'failed'
    ) {
      updatePayload.ended_at = new Date().toISOString();
    }

    if (typeof durationSeconds === 'number') {
      updatePayload.duration_seconds = Math.max(0, Math.floor(durationSeconds));
    }

    const { error: updateError } = await db
      .from('calls')
      .update(updatePayload)
      .eq('id', callId);

    if (updateError) {
      // Non-fatal if table doesn't exist yet
      console.warn('Call status update notice:', updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Error in /api/calls/status:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
