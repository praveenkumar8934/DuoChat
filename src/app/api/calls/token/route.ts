import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { AccessToken } from 'livekit-server-sdk';
import { env, livekitEnv, isLiveKitConfigured } from '@/lib/env';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from session
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to join or start calls.' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request payload
    const body = await req.json();
    const { conversationId, callType = 'voice', existingCallId } = body;

    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing conversationId.' },
        { status: 400 }
      );
    }

    if (callType !== 'voice' && callType !== 'video') {
      return NextResponse.json(
        { error: 'Invalid callType. Must be "voice" or "video".' },
        { status: 400 }
      );
    }

    // 3. Verify conversation membership and authorization
    const db = env.supabaseServiceRoleKey
      ? createServiceClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
          auth: { persistSession: false },
        })
      : userClient;

    const { data: memberRecord, error: memberError } = await db
      .from('conversation_members')
      .select('conversation_id, user_id, role')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !memberRecord) {
      return NextResponse.json(
        { error: 'Forbidden. You are not an authorized member of this private conversation.' },
        { status: 403 }
      );
    }

    // 4. Fetch own profile and partner profile
    const { data: userProfile } = await db
      .from('profiles')
      .select('id, username, display_name, avatar_path')
      .eq('id', user.id)
      .maybeSingle();

    const { data: partnerMember } = await db
      .from('conversation_members')
      .select('user_id, profiles(id, username, display_name, avatar_path)')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .maybeSingle();

    const partnerProfile = partnerMember?.profiles as unknown as {
      id: string;
      username: string | null;
      display_name: string;
      avatar_path: string | null;
    } | null;

    // 5. Track or Update Call Record in DB
    let callId = existingCallId || null;
    try {
      if (!callId) {
        const { data: newCall } = await db
          .from('calls')
          .insert({
            conversation_id: conversationId,
            initiator_id: user.id,
            call_type: callType,
            status: 'initiating',
          })
          .select('id')
          .single();

        if (newCall?.id) {
          callId = newCall.id;
        }
      } else {
        await db
          .from('calls')
          .update({ status: 'connected' })
          .eq('id', callId);
      }
    } catch {
      // If table is not yet migrated, generate temporary UUID
    }

    if (!callId) {
      callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Optional LiveKit token if configured
    let token: string | null = null;
    const roomName = `duochat_${conversationId}`;

    if (isLiveKitConfigured()) {
      try {
        const at = new AccessToken(livekitEnv.apiKey, livekitEnv.apiSecret, {
          identity: user.id,
          name: userProfile?.display_name || user.email || 'DuoChat User',
          ttl: '15m',
        });
        at.addGrant({
          roomJoin: true,
          room: roomName,
          canPublish: true,
          canSubscribe: true,
          canPublishData: true,
        });
        token = await at.toJwt();
      } catch {
        // Fall back to native WebRTC
      }
    }

    return NextResponse.json({
      success: true,
      callId,
      roomName,
      token,
      livekitUrl: livekitEnv.url || null,
      iceServers: DEFAULT_ICE_SERVERS,
      user: {
        id: user.id,
        name: userProfile?.display_name || 'Me',
        avatar: userProfile?.avatar_path || null,
      },
      partner: partnerProfile
        ? {
            id: partnerProfile.id,
            name: partnerProfile.display_name,
            avatar: partnerProfile.avatar_path,
            username: partnerProfile.username,
          }
        : null,
    });
  } catch (err: unknown) {
    console.error('Error in /api/calls/token:', err);
    return NextResponse.json(
      { error: 'Internal Server Error while generating call credentials.' },
      { status: 500 }
    );
  }
}
