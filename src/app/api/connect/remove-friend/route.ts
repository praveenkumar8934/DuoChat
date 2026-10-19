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

    const body = await req.json().catch(() => ({}));
    const { friendId, conversationId } = body;

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    const db = getAdminSupabase();

    // 1. Locate the direct conversation between userId and friendId
    let targetConvId: string | null = conversationId || null;

    if (!targetConvId) {
      const { data: userMemberships } = await db
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      const convIds = (userMemberships || []).map((m: any) => m.conversation_id);

      if (convIds.length > 0) {
        const { data: friendMembership } = await db
          .from('conversation_members')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', friendId)
          .maybeSingle();

        if (friendMembership) {
          targetConvId = friendMembership.conversation_id;
        }
      }
    }

    // 2. If a conversation exists, delete it cleanly
    if (targetConvId) {
      // Delete conversation members first
      await db
        .from('conversation_members')
        .delete()
        .eq('conversation_id', targetConvId);

      // Delete the conversation record
      await db
        .from('conversations')
        .delete()
        .eq('id', targetConvId);
    }

    // 3. Remove or revoke invitation records between these two users
    await db
      .from('invitations')
      .delete()
      .or(`token_hash.eq.req:${userId}:${friendId},token_hash.eq.req:${friendId}:${userId}`);

    await db
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .or(`token_hash.eq.req:${userId}:${friendId},token_hash.eq.req:${friendId}:${userId}`);

    // 4. Real-time broadcast to both users so their lists update immediately
    const channelUsers = [userId, friendId];
    for (const uid of channelUsers) {
      try {
        const channel = db.channel(`user-notifications:${uid}`);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'friend-removed',
          payload: {
            friendId,
            conversationId: targetConvId,
            removedBy: userId,
          },
        });
        db.removeChannel(channel);
      } catch {
        // Non-blocking broadcast
      }
    }

    return NextResponse.json({
      success: true,
      conversationId: targetConvId,
      message: 'Friend removed successfully',
    });
  } catch (err: any) {
    console.error('Error in remove-friend route:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to remove friend' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  return POST(req);
}
