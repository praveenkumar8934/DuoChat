import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Rate limiting: 100 requests per second per IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(ip, 100, 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Maximum 100 signups per second allowed.',
          retryAfter: Math.ceil(rateLimit.resetMs / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil(rateLimit.resetMs / 1000))),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetMs),
          },
        }
      );
    }

    const body = await req.json();
    const { email, password, displayName, username } = body;

    if (!email || !password || !displayName || !username) {
      return NextResponse.json(
        { error: 'All fields (email, password, displayName, username) are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || !env.supabaseUrl) {
      return NextResponse.json(
        { error: 'Server configuration missing. Check SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 500 }
      );
    }

    const adminClient = createClient(env.supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Create user via admin API with email_confirm: true to bypass email rate limits
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: cleanDisplayName,
        username: cleanUsername,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (err: any) {
    console.error('Error in signup route:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
