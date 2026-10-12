import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function GET() {
  try {
    // 1. Get authenticated user
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const db =
      serviceKey && env.supabaseUrl
        ? createServiceClient(env.supabaseUrl, serviceKey, {
            auth: { persistSession: false },
          })
        : userClient;

    // 2. Fetch incoming requests where token_hash ends with `:${user.id}`
    // token_hash format: `req:${senderId}:${receiverId}`
    const { data: incomingRows, error: incomingErr } = await db
      .from('invitations')
      .select('id, created_by, token_hash, created_at, expires_at')
      .ilike('token_hash', `req:%:${user.id}`)
      .is('used_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (incomingErr) {
      console.error('Error fetching incoming connection requests:', incomingErr);
    }

    // Fetch sender profiles for each incoming request
    const senderIds = (incomingRows || []).map((r: any) => r.created_by);
    let senderProfilesMap = new Map();

    if (senderIds.length > 0) {
      const { data: senders } = await db
        .from('profiles')
        .select('id, display_name, username, avatar_path')
        .in('id', senderIds);

      if (senders) {
        senders.forEach((s: any) => senderProfilesMap.set(s.id, s));
      }
    }

    const incoming = (incomingRows || []).map((r: any) => ({
      id: r.id,
      createdAt: r.created_at,
      sender: senderProfilesMap.get(r.created_by) || {
        id: r.created_by,
        display_name: 'Unknown User',
        username: 'user',
      },
    }));

    // 3. Fetch outgoing requests sent by current user
    const { data: outgoingRows, error: outgoingErr } = await db
      .from('invitations')
      .select('id, created_by, token_hash, created_at, expires_at')
      .eq('created_by', user.id)
      .ilike('token_hash', `req:${user.id}:%`)
      .is('used_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (outgoingErr) {
      console.error('Error fetching outgoing requests:', outgoingErr);
    }

    const receiverIds = (outgoingRows || []).map((r: any) => {
      const parts = r.token_hash.split(':');
      return parts[2]; // `req:${sender}:${receiver}`
    }).filter(Boolean);

    let receiverProfilesMap = new Map();
    if (receiverIds.length > 0) {
      const { data: receivers } = await db
        .from('profiles')
        .select('id, display_name, username, avatar_path')
        .in('id', receiverIds);

      if (receivers) {
        receivers.forEach((rc: any) => receiverProfilesMap.set(rc.id, rc));
      }
    }

    const outgoing = (outgoingRows || []).map((r: any) => {
      const parts = r.token_hash.split(':');
      const receiverId = parts[2];
      return {
        id: r.id,
        createdAt: r.created_at,
        receiver: receiverProfilesMap.get(receiverId) || {
          id: receiverId,
          display_name: 'Unknown Partner',
          username: 'partner',
        },
      };
    });

    return NextResponse.json({
      incoming,
      outgoing,
      totalPendingIncoming: incoming.length,
    });
  } catch (err: any) {
    console.error('Get connection requests error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
