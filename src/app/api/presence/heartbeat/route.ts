import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAdminSupabase } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid authentication session is required' },
        { status: 401 }
      );
    }
    const userId = user.id;

    const adminClient = getAdminSupabase();

    const nowIso = new Date().toISOString();

    const { error } = await adminClient
      .from('profiles')
      .update({ last_seen_at: nowIso })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update last_seen_at:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lastSeenAt: nowIso,
    });
  } catch (err: any) {
    console.error('Error in presence heartbeat:', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
