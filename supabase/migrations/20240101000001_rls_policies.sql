-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Comprehensive security policies for all tables
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view their own data, coaches can view their clients, admins can view all
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (
    auth.uid()::text = id::text
    OR
    -- Coaches can view their clients' user data
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      JOIN client_profiles cli ON cli.coach_id = cp.id
      WHERE cp.user_id::text = auth.uid()::text
        AND cli.user_id = users.id
    )
    OR
    -- Admins can view all users
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text AND u.role = 'ADMIN'
    )
  );

-- UPDATE: Users can update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- INSERT: Only admins can create new users (handled by service role)
CREATE POLICY "users_insert_admin_only" ON users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- DELETE: Only admins can delete users
CREATE POLICY "users_delete_admin_only" ON users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- =====================================================
-- COACH PROFILES TABLE POLICIES
-- =====================================================

-- SELECT: Coaches can view their own profile, admins can view all
CREATE POLICY "coach_profiles_select" ON coach_profiles
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- INSERT: Coaches can create their own profile
CREATE POLICY "coach_profiles_insert_own" ON coach_profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- UPDATE: Coaches can update their own profile
CREATE POLICY "coach_profiles_update_own" ON coach_profiles
  FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- DELETE: Only admins can delete coach profiles
CREATE POLICY "coach_profiles_delete_admin_only" ON coach_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- =====================================================
-- CLIENT PROFILES TABLE POLICIES
-- =====================================================

-- SELECT: Clients can view own profile, coaches can view their clients, admins view all
CREATE POLICY "client_profiles_select" ON client_profiles
  FOR SELECT
  USING (
    auth.uid()::text = user_id::text
    OR
    -- Coaches can view their clients
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      WHERE cp.id = client_profiles.coach_id
        AND cp.user_id::text = auth.uid()::text
    )
    OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- INSERT: Only coaches can create client profiles (for their clients)
CREATE POLICY "client_profiles_insert_coach" ON client_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = client_profiles.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- UPDATE: Coaches can update their clients' profiles
CREATE POLICY "client_profiles_update_coach" ON client_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = client_profiles.coach_id
        AND user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = client_profiles.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- DELETE: Coaches and admins can delete client profiles
CREATE POLICY "client_profiles_delete" ON client_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = client_profiles.coach_id
        AND user_id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- =====================================================
-- PORTAL TEMPLATES TABLE POLICIES
-- =====================================================

-- SELECT: Coaches can view their own templates
CREATE POLICY "portal_templates_select_own" ON portal_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = portal_templates.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- INSERT: Coaches can create their own templates
CREATE POLICY "portal_templates_insert_own" ON portal_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = portal_templates.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- UPDATE: Coaches can update their own templates
CREATE POLICY "portal_templates_update_own" ON portal_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = portal_templates.coach_id
        AND user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = portal_templates.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- DELETE: Coaches can delete their own templates
CREATE POLICY "portal_templates_delete_own" ON portal_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles
      WHERE id = portal_templates.coach_id
        AND user_id::text = auth.uid()::text
    )
  );

-- =====================================================
-- PROGRESS TABLE POLICIES
-- =====================================================

-- SELECT: Clients can view own progress, coaches can view their clients' progress
CREATE POLICY "progress_select" ON progress
  FOR SELECT
  USING (
    -- Client viewing own progress
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = progress.client_profile_id
        AND user_id::text = auth.uid()::text
    )
    OR
    -- Coach viewing their client's progress
    EXISTS (
      SELECT 1 FROM client_profiles cli
      JOIN coach_profiles cp ON cli.coach_id = cp.id
      WHERE cli.id = progress.client_profile_id
        AND cp.user_id::text = auth.uid()::text
    )
    OR
    -- Admin viewing all progress
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- INSERT: Clients can create their own progress entries
CREATE POLICY "progress_insert_own" ON progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = progress.client_profile_id
        AND user_id::text = auth.uid()::text
    )
  );

-- UPDATE: Clients can update their own progress, coaches can update their clients' progress
CREATE POLICY "progress_update" ON progress
  FOR UPDATE
  USING (
    -- Client updating own progress
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = progress.client_profile_id
        AND user_id::text = auth.uid()::text
    )
    OR
    -- Coach updating their client's progress
    EXISTS (
      SELECT 1 FROM client_profiles cli
      JOIN coach_profiles cp ON cli.coach_id = cp.id
      WHERE cli.id = progress.client_profile_id
        AND cp.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    -- Same conditions for check
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = progress.client_profile_id
        AND user_id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM client_profiles cli
      JOIN coach_profiles cp ON cli.coach_id = cp.id
      WHERE cli.id = progress.client_profile_id
        AND cp.user_id::text = auth.uid()::text
    )
  );

-- DELETE: Only coaches and admins can delete progress
CREATE POLICY "progress_delete" ON progress
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles cli
      JOIN coach_profiles cp ON cli.coach_id = cp.id
      WHERE cli.id = progress.client_profile_id
        AND cp.user_id::text = auth.uid()::text
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- SELECT: Users can view messages they sent or received
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT
  USING (
    auth.uid()::text = sender_id::text
    OR
    auth.uid()::text = receiver_id::text
  );

-- INSERT: Users can send messages (sender_id must match auth)
CREATE POLICY "messages_insert_as_sender" ON messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

-- UPDATE: Users can update messages they received (e.g., mark as read)
CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE
  USING (auth.uid()::text = receiver_id::text)
  WITH CHECK (auth.uid()::text = receiver_id::text);

-- DELETE: Users can delete messages they sent or received
CREATE POLICY "messages_delete_own" ON messages
  FOR DELETE
  USING (
    auth.uid()::text = sender_id::text
    OR
    auth.uid()::text = receiver_id::text
  );

-- =====================================================
-- ROLE PERMISSIONS TABLE POLICIES
-- =====================================================

-- SELECT: All authenticated users can view role permissions
CREATE POLICY "role_permissions_select_all" ON role_permissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: Only admins (handled by service role)
CREATE POLICY "role_permissions_admin_only" ON role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- =====================================================
-- SSO TOKENS TABLE POLICIES
-- =====================================================

-- SELECT: Users can view their own SSO tokens
CREATE POLICY "sso_tokens_select_own" ON sso_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- INSERT: Service role only (handled via API)
-- UPDATE: Service role only (marking as used)
-- DELETE: Service role only (cleanup)

-- Note: SSO tokens are managed by service role key and don't need user-level policies for INSERT/UPDATE/DELETE

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "users_select_own" ON users IS 'Users can view own data, coaches view clients, admins view all';
COMMENT ON POLICY "client_profiles_select" ON client_profiles IS 'Clients view own, coaches view their clients, admins view all';
COMMENT ON POLICY "progress_update" ON progress IS 'Clients and their coaches can update progress';
COMMENT ON POLICY "messages_select_own" ON messages IS 'Users view messages they sent or received';
