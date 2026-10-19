import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. IP-based rate limiting (10 attempts per 60 seconds)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many login attempts. Please wait a minute and try again.',
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

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const rawId = typeof (body.identifier || body.email) === 'string'
      ? (body.identifier || body.email).trim()
      : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!rawId || !password) {
      return NextResponse.json(
        { error: 'Please enter both your Account ID (username or email) and password.' },
        { status: 400 }
      );
    }

    let targetEmail = rawId;

    // 3. Resolve username to email if identifier does not contain '@'
    if (!rawId.includes('@')) {
      try {
        const adminClient = getAdminSupabase();
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id')
          .ilike('username', rawId)
          .maybeSingle();

        if (profile) {
          const { data: userData } = await adminClient.auth.admin.getUserById(profile.id);
          if (userData?.user?.email) {
            targetEmail = userData.user.email;
          } else {
            // Profile exists but auth user has no email
            return NextResponse.json(
              { error: 'Incorrect ID or password. Please verify your credentials and try again.' },
              { status: 401 }
            );
          }
        } else {
          // Username not found - return generic message to prevent user enumeration
          return NextResponse.json(
            { error: 'Incorrect ID or password. Please verify your credentials and try again.' },
            { status: 401 }
          );
        }
      } catch (lookupErr) {
        console.error('Username resolution error in login route:', lookupErr);
        return NextResponse.json(
          { error: 'Incorrect ID or password. Please verify your credentials and try again.' },
          { status: 401 }
        );
      }
    }

    // 4. Authenticate using server Supabase client (sets HTTP session cookies)
    const serverClient = await createServerSupabase();
    const { data: authData, error: authError } = await serverClient.auth.signInWithPassword({
      email: targetEmail.toLowerCase(),
      password,
    });

    if (authError || !authData.session) {
      // OWASP-compliant generic error to prevent account enumeration
      return NextResponse.json(
        { error: 'Incorrect ID or password. Please verify your credentials and try again.' },
        { status: 401 }
      );
    }

    // 5. Update last_seen_at for the authenticated user
    try {
      const adminClient = getAdminSupabase();
      await adminClient
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', authData.user.id);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      email: targetEmail.toLowerCase(),
    });
  } catch (err: any) {
    console.error('Login route error:', err);
    return NextResponse.json(
      { error: err?.message || 'Authentication failed. Please try again.' },
      { status: 500 }
    );
  }
}
