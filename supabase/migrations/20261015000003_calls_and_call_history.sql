-- ====================================================================
-- DUOCHAT DATABASE MIGRATION: CALLS & CALL HISTORY
-- Secure WebRTC Voice & Video Call Metadata with Row Level Security (RLS)
-- ====================================================================

-- 1. CALLS TABLE
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'initiating' CHECK (
    status IN ('initiating', 'ringing', 'accepted', 'connected', 'declined', 'cancelled', 'busy', 'missed', 'completed', 'failed')
  ),
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INDEXES FOR HIGH-PERFORMANCE RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_calls_conversation_id ON public.calls(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calls_initiator_id ON public.calls(initiator_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only conversation members can view call history for that conversation
DROP POLICY IF EXISTS "Call participants can view conversation calls" ON public.calls;
CREATE POLICY "Call participants can view conversation calls"
  ON public.calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = calls.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

-- Policy 2: Authenticated conversation members can initiate call records
DROP POLICY IF EXISTS "Conversation members can initiate calls" ON public.calls;
CREATE POLICY "Conversation members can initiate calls"
  ON public.calls FOR INSERT
  TO authenticated
  WITH CHECK (
    initiator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = calls.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

-- Policy 3: Conversation members can update call status, ended_at, and duration
DROP POLICY IF EXISTS "Conversation members can update call records" ON public.calls;
CREATE POLICY "Conversation members can update call records"
  ON public.calls FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = calls.conversation_id
        AND cm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = calls.conversation_id
        AND cm.user_id = auth.uid()
    )
  );
