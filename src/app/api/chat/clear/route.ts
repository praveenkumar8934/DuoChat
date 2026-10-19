import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getAdminSupabase } from '@/lib/auth-server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    // Soft-delete all messages in the conversation
    const now = new Date().toISOString();
    const { error: clearError } = await adminClient
      .from('messages')
      .update({ deleted_at: now })
      .eq('conversation_id', conversationId)
      .is('deleted_at', null);

    if (clearError) {
      console.error('Error clearing chat history:', clearError);
      return NextResponse.json(
        { error: clearError.message || 'Failed to clear chat history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared successfully',
    });
  } catch (err: unknown) {
    console.error('API clear chat error:', err);
    return NextResponse.json(
      { error: (err as Error)?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
