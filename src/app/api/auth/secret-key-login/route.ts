import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/auth-server';
import { normalizeSecretKey } from '@/lib/secret-key';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. IP-based rate limiting (10 attempts per 60 seconds)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(`login:secret-key:${ip}`, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many secret key attempts. Please wait a minute and try again.',
          retryAfter: Math.ceil(rateLimit.resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil(rateLimit.resetMs / 1000))),
          },
        }
      );
    }

    // 2. Validate request payload
    const body = await req.json().catch(() => ({}));
    const rawKey = body?.secretKey;

    if (!rawKey || typeof rawKey !== 'string') {
      return NextResponse.json(
        { error: 'Please enter or paste your Secret Key.' },
        { status: 400 }
      );
    }

    const cleanKey = rawKey.trim();
    if (cleanKey.length < 4) {
      return NextResponse.json(
        { error: 'Please enter a valid Secret Key (at least 4 characters).' },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabase();

    // 3. Find Secret Key in database (exact, normalized, or case-insensitive)
    let keyRow = null;

    // A. Check exact match
    const { data: exactMatch } = await adminClient
      .from('invitations')
      .select('id, created_by, expires_at, revoked_at')
      .eq('token_hash', `sec:${cleanKey}`)
      .is('revoked_at', null)
      .maybeSingle();

    keyRow = exactMatch;

    // B. Check normalized match if not found
    if (!keyRow) {
      const normalizedKey = normalizeSecretKey(cleanKey);
      if (normalizedKey && normalizedKey !== cleanKey) {
        const { data: normMatch } = await adminClient
          .from('invitations')
          .select('id, created_by, expires_at, revoked_at')
          .eq('token_hash', `sec:${normalizedKey}`)
          .is('revoked_at', null)
          .maybeSingle();

        keyRow = normMatch;
      }
    }

    // C. Check case-insensitive match if still not found
    if (!keyRow) {
      const { data: ciMatch } = await adminClient
        .from('invitations')
        .select('id, created_by, expires_at, revoked_at')
        .ilike('token_hash', `sec:${cleanKey}`)
        .is('revoked_at', null)
        .maybeSingle();

      keyRow = ciMatch;
    }

    if (!keyRow) {
      return NextResponse.json(
        {
          error:
            'Invalid Secret Key. Please verify the key you created in your profile, or sign in with your email/username and password.',
        },
        { status: 401 }
      );
    }

    const userId = keyRow.created_by;

    // 4. Retrieve user account information
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error('Failed to find user for secret key:', userError);
      return NextResponse.json(
        { error: 'The account associated with this Secret Key could not be found.' },
        { status: 401 }
      );
    }

    const userEmail = userData.user.email;

    // 5. Generate one-time session token
    const linkRes = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    const hashedToken = linkRes.data?.properties?.hashed_token;
    if (!hashedToken) {
      console.error('Failed to generate authentication link:', linkRes.error);
      return NextResponse.json(
        { error: 'Could not generate login session. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Set HTTP session cookies on the server response
    try {
      const serverClient = await createServerSupabase();
      const { error: sessionError } = await serverClient.auth.verifyOtp({
        token_hash: hashedToken,
        type: 'magiclink',
      });

      if (sessionError) {
        console.warn('Server-side verifyOtp warning (client will verify as well):', sessionError.message);
      }
    } catch (cookieErr) {
      console.warn('Failed to set server cookies in route handler:', cookieErr);
    }

    // 7. Update last_seen_at on profile
    try {
      await adminClient
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      tokenHash: hashedToken,
      email: userEmail,
      userId,
      message: 'Secret key verified! Logging in...',
    });
  } catch (err: any) {
    console.error('Error in secret-key-login route:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal authentication error' },
      { status: 500 }
    );
  }
}
