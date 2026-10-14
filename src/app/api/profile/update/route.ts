import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { displayName, username, bio, avatarPath } = body;

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
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const adminClient = createServiceClient(env.supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Check if new username is already taken by another account
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      const { data: existingUser } = await adminClient
        .from('profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .neq('id', userId)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { error: 'This username is already taken by another user.' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (displayName !== undefined && displayName !== null) {
      updatePayload.display_name = displayName.trim();
    }
    if (username !== undefined && username !== null) {
      updatePayload.username = username.trim().toLowerCase();
    }
    if (bio !== undefined) {
      updatePayload.bio = bio ? bio.trim() : null;
    }
    if (avatarPath !== undefined) {
      updatePayload.avatar_path = avatarPath;
    }

    const { data: updatedProfile, error: updateError } = await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    console.error('API profile update error:', err);
    return NextResponse.json(
      { error: (err as Error)?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
