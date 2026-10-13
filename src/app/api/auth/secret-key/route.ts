import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { generateSecretKey } from '@/lib/secret-key';

export async function GET(req: Request) {
  try {
    let userId: string | null = req.headers.get('x-user-id') || null;

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

    // Lookup secret key from invitations table
    const { data: keyRow, error } = await adminClient
      .from('invitations')
      .select('id, token_hash, created_at')
      .eq('created_by', userId)
      .like('token_hash', 'sec:%')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching secret key:', error);
      return NextResponse.json({ error: 'Failed to fetch secret key' }, { status: 500 });
    }

    if (!keyRow) {
      return NextResponse.json({ hasKey: false, secretKey: null });
    }

    const secretKey = keyRow.token_hash.replace(/^sec:/, '');
    return NextResponse.json({
      hasKey: true,
      secretKey,
      createdAt: keyRow.created_at,
    });
  } catch (err: any) {
    console.error('Error in secret-key GET:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let userId: string | null = req.headers.get('x-user-id') || null;

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

    // Verify user exists in profiles
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Generate new secure secret key
    const newSecretKey = generateSecretKey();
    const tokenHash = `sec:${newSecretKey}`;

    // Clean up any existing secret keys for this user
    await adminClient
      .from('invitations')
      .delete()
      .eq('created_by', userId)
      .like('token_hash', 'sec:%');

    // Store new key with 100-year expiration
    const expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await adminClient.from('invitations').insert({
      created_by: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('Error storing secret key:', insertError);
      return NextResponse.json({ error: 'Failed to save secret key' }, { status: 500 });
    }

    // Also update auth.users user_metadata for redundancy
    try {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { secret_key: newSecretKey },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      hasKey: true,
      secretKey: newSecretKey,
      message: 'New Secret Key generated successfully! Save it in a safe place.',
    });
  } catch (err: any) {
    console.error('Error in secret-key POST:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let userId: string | null = req.headers.get('x-user-id') || null;

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

    await adminClient
      .from('invitations')
      .delete()
      .eq('created_by', userId)
      .like('token_hash', 'sec:%');

    try {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { secret_key: null },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      hasKey: false,
      secretKey: null,
      message: 'Secret key revoked successfully',
    });
  } catch (err: any) {
    console.error('Error in secret-key DELETE:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
