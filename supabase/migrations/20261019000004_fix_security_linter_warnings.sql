-- ====================================================================
-- SUPABASE DATABASE LINTER REMEDIATION MIGRATION
-- Fixes:
-- 1. function_search_path_mutable (0011)
-- 2. anon_security_definer_function_executable (0028)
-- 3. authenticated_security_definer_function_executable (0029)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. FIX: public.handle_updated_at (Trigger Function)
-- Issue: Mutable search_path + public execution
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Trigger functions should never be directly invoked via PostgREST RPC
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;


-- --------------------------------------------------------------------
-- 2. FIX: public.handle_new_user (Auth Trigger Function)
-- Issue: Mutable search_path + callable by anon/authenticated via RPC
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_display_name TEXT;
  v_username TEXT;
BEGIN
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4));

  INSERT INTO public.profiles (id, display_name, username, avatar_path)
  VALUES (NEW.id, v_display_name, v_username, NEW.raw_user_meta_data->>'avatar_path')
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      username = EXCLUDED.username;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger functions run with postgres/system rights on auth.users; revoke API execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;


-- --------------------------------------------------------------------
-- 3. FIX: is_conversation_member (Internal RLS Helper)
-- Issue: Exposed via /rest/v1/rpc/is_conversation_member to anon/authenticated
-- Solution: Move helper to private schema so PostgREST never exposes it as an RPC
-- --------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_conversation_member(conv_id UUID, usr_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id AND user_id = usr_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION private.is_conversation_member(UUID, UUID) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION private.is_conversation_member(UUID, UUID) FROM PUBLIC, anon;

-- Update RLS policies to point to private.is_conversation_member
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR private.is_conversation_member(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view conversations they belong to" ON public.conversations;
CREATE POLICY "Users can view conversations they belong to"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    private.is_conversation_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    private.is_conversation_member(conversation_id, auth.uid())
  );

DROP POLICY IF EXISTS "Authorized members can send messages" ON public.messages;
CREATE POLICY "Authorized members can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND private.is_conversation_member(conversation_id, auth.uid())
  );

-- Drop the old public function to eliminate /rest/v1/rpc/is_conversation_member
DROP FUNCTION IF EXISTS public.is_conversation_member(UUID, UUID);


-- --------------------------------------------------------------------
-- 4. FIX: public.accept_invitation (Atomic Invitation Acceptance)
-- Issue: Mutable search_path + executable by anon
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inviter_id UUID;
  v_current_user_id UUID;
  v_conversation_id UUID;
  v_existing_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept invitation';
  END IF;

  -- Verify invitation
  SELECT created_by INTO v_inviter_id
  FROM public.invitations
  WHERE token_hash = p_token_hash
    AND expires_at > timezone('utc'::text, now())
    AND used_at IS NULL
    AND revoked_at IS NULL;

  IF v_inviter_id IS NULL THEN
    RAISE EXCEPTION 'Invalid, expired, or already used invitation';
  END IF;

  IF v_inviter_id = v_current_user_id THEN
    RAISE EXCEPTION 'You cannot accept your own invitation';
  END IF;

  -- Mark invitation as used
  UPDATE public.invitations
  SET used_at = timezone('utc'::text, now())
  WHERE token_hash = p_token_hash;

  -- Check if conversation already exists between the two users
  SELECT c.id INTO v_existing_id
  FROM public.conversations c
  JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = v_inviter_id
  JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = v_current_user_id
  WHERE c.type = 'direct'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Create new direct conversation
  INSERT INTO public.conversations (type)
  VALUES ('direct')
  RETURNING id INTO v_conversation_id;

  -- Add both members
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES
    (v_conversation_id, v_inviter_id, 'member'),
    (v_conversation_id, v_current_user_id, 'member');

  RETURN v_conversation_id;
END;
$$;

-- Block anonymous execution (fixes anon_security_definer_function_executable)
REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT) FROM PUBLIC, anon;

-- Grant to authenticated users so they can accept invitations
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;
