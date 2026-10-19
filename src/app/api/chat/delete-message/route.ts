import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAdminSupabase } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { conversationId, messageId, messageIds } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const idsToDelete: string[] = [];
    if (messageId && typeof messageId === 'string') {
      idsToDelete.push(messageId);
    }
    if (Array.isArray(messageIds)) {
      idsToDelete.push(...messageIds.filter(id => typeof id === 'string'));
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'At least one message ID is required' },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const adminClient = getAdminSupabase();

    // Verify authenticated user is a member of this conversation
    const { data: membership } = await adminClient
      .from('conversation_members')
      .select('conversation_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this conversation' },
        { status: 403 }
      );
    }

    // Soft-delete the messages
    const now = new Date().toISOString();
    const { error: deleteError } = await adminClient
      .from('messages')
      .update({ deleted_at: now })
      .eq('conversation_id', conversationId)
      .in('id', idsToDelete)
      .is('deleted_at', null);

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      deletedAt: now,
    });
  } catch (err: any) {
    console.error('Unexpected error in delete-message route:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
