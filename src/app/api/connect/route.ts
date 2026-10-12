import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { cleanDuoIdentifier } from '@/lib/duo-id';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a valid Duo ID or username' },
        { status: 400 }
      );
    }

    // 1. Get authenticated user
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to connect with a partner' },
        { status: 401 }
      );
    }

    // 2. Prepare database client (use service role key if available to ensure reliable table creation)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const db =
      serviceKey && env.supabaseUrl
        ? createServiceClient(env.supabaseUrl, serviceKey, {
            auth: { persistSession: false },
          })
        : userClient;

    const clean = cleanDuoIdentifier(identifier);
    const rawTrimmed = identifier.trim();

    // 3. Search for target profile
    // Try by exact UUID, username, or ID prefix (Duo ID)
    let targetProfile = null;

    // Search by username
    const { data: byUsername } = await db
      .from('profiles')
      .select('*')
      .ilike('username', clean)
      .maybeSingle();

    if (byUsername) {
      targetProfile = byUsername;
    }

    // Search by full UUID
    if (!targetProfile && rawTrimmed.length >= 32) {
      const { data: byFullId } = await db
        .from('profiles')
        .select('*')
        .eq('id', rawTrimmed)
        .maybeSingle();
      if (byFullId) targetProfile = byFullId;
    }

    // Search by ID prefix (from #DUO-XXXXXXXX)
    if (!targetProfile && clean.length >= 4) {
      const { data: allProfiles } = await db
        .from('profiles')
        .select('*')
        .limit(100);

      if (allProfiles) {
        targetProfile = allProfiles.find((p: any) => {
          const strippedId = (p.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return (
            strippedId.startsWith(clean.toLowerCase()) ||
            (p.username && p.username.toLowerCase() === clean.toLowerCase())
          );
        });
      }
    }

    if (!targetProfile) {
      return NextResponse.json(
        { error: `No user found with Duo ID or username "${identifier}"` },
        { status: 404 }
      );
    }

    // Cannot connect with oneself
    if (targetProfile.id === user.id) {
      return NextResponse.json(
        { error: 'You cannot connect with your own Duo ID. Share it with your partner!' },
        { status: 400 }
      );
    }

    // 4. Check if direct conversation already exists between current user & target
    const { data: userMemberships } = await db
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (userMemberships && userMemberships.length > 0) {
      const convIds = userMemberships.map((m: any) => m.conversation_id);

      const { data: partnerMemberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', targetProfile.id)
        .in('conversation_id', convIds);

      if (partnerMemberships && partnerMemberships.length > 0) {
        // Direct conversation already exists!
        const existingConvId = partnerMemberships[0].conversation_id;
        return NextResponse.json({
          success: true,
          conversationId: existingConvId,
          isExisting: true,
          partner: targetProfile,
          message: `Reconnected with ${targetProfile.display_name}!`,
        });
      }
    }

    // 5. Create new direct conversation
    const { data: newConv, error: convError } = await db
      .from('conversations')
      .insert({ type: 'direct' })
      .select('id')
      .single();

    if (convError || !newConv) {
      console.error('Failed to create conversation:', convError);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    const conversationId = newConv.id;

    // 6. Add both members
    const { error: memberError } = await db
      .from('conversation_members')
      .insert([
        {
          conversation_id: conversationId,
          user_id: user.id,
          role: 'member',
        },
        {
          conversation_id: conversationId,
          user_id: targetProfile.id,
          role: 'member',
        },
      ]);

    if (memberError) {
      console.error('Failed to add conversation members:', memberError);
      return NextResponse.json(
        { error: 'Failed to add conversation members' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversationId,
      isExisting: false,
      partner: targetProfile,
      message: `Connected with ${targetProfile.display_name}! Your private world is ready.`,
    });
  } catch (err: any) {
    console.error('Connect API unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
