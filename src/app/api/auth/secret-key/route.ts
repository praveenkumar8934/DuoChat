import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAdminSupabase } from '@/lib/auth-server';
import { generateSecretKey } from '@/lib/secret-key';

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid authentication session is required' }, { status: 401 });
    }
    const userId = user.id;
    const adminClient = getAdminSupabase();

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
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid authentication session is required' }, { status: 401 });
    }
    const userId = user.id;
    const adminClient = getAdminSupabase();

    // Verify user exists in profiles
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Read user-provided secret key from request body
    const body = await req.json().catch(() => ({}));
    const rawKey = typeof body?.secretKey === 'string' ? body.secretKey.trim() : '';

    let chosenKey = '';
    if (rawKey) {
      if (rawKey.length < 8) {
        return NextResponse.json(
          { error: 'Secret Key must be at least 8 characters long for security.' },
          { status: 400 }
        );
      }
      if (rawKey.length > 64) {
        return NextResponse.json(
          { error: 'Secret Key cannot exceed 64 characters.' },
          { status: 400 }
        );
      }

      // Check if another user has already taken this key
      const { data: conflict } = await adminClient
        .from('invitations')
        .select('id, created_by')
        .ilike('token_hash', `sec:${rawKey}`)
        .neq('created_by', userId)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { error: 'This Secret Key is already in use by another account. Please choose a different, more unique key.' },
          { status: 409 }
        );
      }

      chosenKey = rawKey;
    } else {
      chosenKey = generateSecretKey();
    }

    const tokenHash = `sec:${chosenKey}`;

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

    try {
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { secret_key: chosenKey },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      hasKey: true,
      secretKey: chosenKey,
      message: 'Secret Key saved successfully in your profile!',
    });
  } catch (err: any) {
    console.error('Error in secret-key POST:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Valid authentication session is required' }, { status: 401 });
    }
    const userId = user.id;
    const adminClient = getAdminSupabase();

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
      message: 'Secret key removed successfully',
    });
  } catch (err: any) {
    console.error('Error in secret-key DELETE:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
