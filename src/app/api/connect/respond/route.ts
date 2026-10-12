import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid requestId and action ("accept" | "decline") are required' },
        { status: 400 }
      );
    }

    // 1. Authenticate current user (receiver)
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const db =
      serviceKey && env.supabaseUrl
        ? createServiceClient(env.supabaseUrl, serviceKey, {
            auth: { persistSession: false },
          })
        : userClient;

    // 2. Fetch the invitation
    const { data: requestRow, error: reqErr } = await db
      .from('invitations')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (reqErr || !requestRow) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      );
    }

    // 3. Verify user is receiver
    const expectedSuffix = `:${user.id}`;
    if (!requestRow.token_hash.endsWith(expectedSuffix)) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this request' },
        { status: 403 }
      );
    }

    const senderId = requestRow.created_by;

    // 4. Handle Decline
    if (action === 'decline') {
      await db
        .from('invitations')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', requestId);

      return NextResponse.json({
        success: true,
        action: 'declined',
        message: 'Connection request declined',
      });
    }

    // 5. Handle Accept
    await db
      .from('invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', requestId);

    // Check if direct conversation already exists between sender & current user
    const { data: userMemberships } = await db
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    let conversationId: string | null = null;

    if (userMemberships && userMemberships.length > 0) {
      const convIds = userMemberships.map((m: any) => m.conversation_id);

      const { data: partnerMemberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', senderId)
        .in('conversation_id', convIds);

      if (partnerMemberships && partnerMemberships.length > 0) {
        conversationId = partnerMemberships[0].conversation_id;
      }
    }

    if (!conversationId) {
      // Create new direct conversation
      const { data: newConv, error: convError } = await db
        .from('conversations')
        .insert({ type: 'direct' })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Failed to create conversation on accept:', convError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversationId = newConv.id;

      // Add both members
      const { error: membersError } = await db
        .from('conversation_members')
        .insert([
          { conversation_id: conversationId, user_id: senderId, role: 'member' },
          { conversation_id: conversationId, user_id: user.id, role: 'member' },
        ]);

      if (membersError) {
        console.error('Failed to add members on accept:', membersError);
        return NextResponse.json(
          { error: 'Failed to add members' },
          { status: 500 }
        );
      }
    }

    // Fetch sender profile for the response
    const { data: senderProfile } = await db
      .from('profiles')
      .select('id, display_name, username, avatar_path')
      .eq('id', senderId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      action: 'accepted',
      conversationId,
      partner: senderProfile,
      message: `You are now connected with ${senderProfile?.display_name || 'your partner'}!`,
    });
  } catch (err: any) {
    console.error('Respond to request API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
