-- =====================================================
-- COACHCORE DATABASE SCHEMA - SUPABASE MIGRATION
-- Optimized for Supabase with UUID, JSONB, and proper indexing
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'COACH', 'CLIENT');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (core authentication and user data)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- bcrypt hashed
  name TEXT NOT NULL,
  role user_role DEFAULT 'CLIENT' NOT NULL,
  is_password_changed BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  avatar_url TEXT,
  
  -- Legacy token fields (can be deprecated in favor of Supabase Auth)
  token TEXT UNIQUE,
  token_expiry TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Coach profiles (extended coach-specific data)
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Template document stored as JSONB for flexible structure
  template JSONB,
  
  is_profile_complete BOOLEAN DEFAULT false NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Portal templates (reusable templates created by coaches)
CREATE TABLE portal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  document JSONB NOT NULL, -- Template structure
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT portal_templates_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200)
);

-- Client profiles (clients belonging to coaches)
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  
  -- Personalized document (copied from coach template)
  document JSONB,
  
  -- Number of phases for progress tracking
  total_phases INTEGER DEFAULT 3 NOT NULL CHECK (total_phases >= 1 AND total_phases <= 50),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Progress tracking (client physique photos per phase)
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1),
  
  -- Photo URLs stored in Supabase Storage
  photo1_url TEXT, -- front
  photo2_url TEXT, -- side
  photo3_url TEXT, -- back
  
  is_completed BOOLEAN DEFAULT false NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Each client can only have one progress record per phase
  UNIQUE(client_profile_id, phase_number)
);

-- Messages (coach-client and coach-admin communication)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  is_read BOOLEAN DEFAULT false NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent self-messaging
  CONSTRAINT no_self_messaging CHECK (sender_id != receiver_id)
);

-- Role permissions (for role-based authorization scopes)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SSO tokens (for single sign-on between main app and portal)
CREATE TABLE sso_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  return_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure expiry is in the future when created
  CONSTRAINT sso_tokens_expiry_future CHECK (expires_at > created_at)
);

-- =====================================================
-- INDEXES (Optimized for common query patterns)
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email_trgm ON users USING gin(email gin_trgm_ops);
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true;
CREATE INDEX idx_users_active_created ON users(is_active, created_at DESC);

-- Coach profiles indexes
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
CREATE INDEX idx_coach_profiles_complete ON coach_profiles(is_profile_complete);

-- Client profiles indexes
CREATE INDEX idx_client_profiles_coach_id ON client_profiles(coach_id);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_coach_created ON client_profiles(coach_id, created_at DESC);

-- Portal templates indexes
CREATE INDEX idx_portal_templates_coach_id ON portal_templates(coach_id);
CREATE INDEX idx_portal_templates_coach_created ON portal_templates(coach_id, created_at DESC);

-- Progress indexes
CREATE INDEX idx_progress_client_profile ON progress(client_profile_id);
CREATE INDEX idx_progress_client_phase ON progress(client_profile_id, phase_number);
CREATE INDEX idx_progress_completed ON progress(is_completed) WHERE is_completed = false;

-- Messages indexes
CREATE INDEX idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX idx_messages_sender_created ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);

-- SSO tokens indexes
CREATE INDEX idx_sso_tokens_token ON sso_tokens(token) WHERE used = false;
CREATE INDEX idx_sso_tokens_user_created ON sso_tokens(user_id, created_at DESC);
CREATE INDEX idx_sso_tokens_expires ON sso_tokens(expires_at) WHERE used = false;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at 
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at 
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_templates_updated_at 
  BEFORE UPDATE ON portal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at 
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at 
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_coach_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT id FROM coach_profiles WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_client_coach_user_id(client_user_uuid UUID)
RETURNS UUID AS $$
  SELECT cp.user_id 
  FROM client_profiles cli
  JOIN coach_profiles cp ON cli.coach_id = cp.id
  WHERE cli.user_id = client_user_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_coach_of_client(coach_user_uuid UUID, client_profile_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM client_profiles cli
    JOIN coach_profiles cp ON cli.coach_id = cp.id
    WHERE cli.id = client_profile_uuid 
      AND cp.user_id = coach_user_uuid
  );
$$ LANGUAGE sql STABLE;

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO role_permissions (role, scopes) VALUES
  ('ADMIN', ARRAY['/admin/*', '/coach/*', '/client/*', '/api/admin/*']),
  ('COACH', ARRAY['/coach/*', '/api/coach/*', '/messages', '/settings']),
  ('CLIENT', ARRAY['/client/*', '/api/client/*', '/messages', '/settings'])
ON CONFLICT (role) DO NOTHING;
