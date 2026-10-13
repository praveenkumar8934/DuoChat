import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    let userId: string | null = null;

    // 1. Try reading userId from body
    try {
      const bodyText = await req.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        if (body?.userId && typeof body.userId === 'string') {
          userId = body.userId;
        }
      }
    } catch {
      // Body may be empty
    }

    // 2. Fallback to auth session from cookies
    if (!userId) {
      try {
        const serverClient = await createServerSupabase();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch {
        // Fallback
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user identified' }, { status: 400 });
    }

    const serviceKey = env.supabaseServiceRoleKey;
    if (!serviceKey || !env.supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const adminClient = createServiceClient(env.supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const nowIso = new Date().toISOString();

    const { error } = await adminClient
      .from('profiles')
      .update({ last_seen_at: nowIso })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update last_seen_at:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lastSeenAt: nowIso,
    });
  } catch (err: any) {
    console.error('Error in presence heartbeat:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
