# Migration Guide: Prisma + Cloudflare → Supabase

This guide walks through migrating the CoachCore application from Prisma/PostgreSQL/Cloudflare R2 to Supabase (database + storage + auth).

## Overview

**From:**
- Prisma ORM + PostgreSQL
- Cloudflare R2 for file storage
- Custom JWT auth implementation

**To:**
- Supabase Database (PostgreSQL with REST API)
- Supabase Storage (file uploads)
- Supabase Auth (with JWT)

## Step 1: Install Supabase Dependencies

```bash
# Remove old dependencies
npm uninstall @prisma/client prisma @aws-sdk/client-s3

# Install Supabase
npm install @supabase/supabase-js @supabase/ssr
```

## Step 2: Environment Variables

Update `.env` file:

```bash
# Remove these:
# DATABASE_URL
# R2_ENDPOINT
# R2_ACCESS_KEY_ID
# R2_SECRET_ACCESS_KEY
# R2_BUCKET_NAME
# R2_PUBLIC_URL

# Add Supabase:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Keep these:
JWT_SECRET=your-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
SSO_COOKIE_DOMAIN=
```

## Step 3: Database Schema Migration

### 3.1 Export Prisma Schema to SQL

The current Prisma schema needs to be converted to Supabase SQL migrations.

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'COACH', 'CLIENT');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'CLIENT',
  is_password_changed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  token TEXT UNIQUE,
  token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach profiles
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template JSONB,
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client profiles
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  document JSONB,
  total_phases INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal templates
CREATE TABLE portal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL,
  photo1_url TEXT,
  photo2_url TEXT,
  photo3_url TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_profile_id, phase_number)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO tokens (for portal access)
CREATE TABLE sso_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  return_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_client_profiles_coach ON client_profiles(coach_id);
CREATE INDEX idx_portal_templates_coach ON portal_templates(coach_id);
CREATE INDEX idx_progress_client ON progress(client_profile_id);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at);
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX idx_sso_tokens_token ON sso_tokens(token, expires_at);
CREATE INDEX idx_sso_tokens_user ON sso_tokens(user_id, created_at);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_templates_updated_at BEFORE UPDATE ON portal_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Row Level Security (RLS) Policies

Create `supabase/migrations/002_rls_policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Coach profiles policies
CREATE POLICY "Coaches can view own profile" ON coach_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Coaches can update own profile" ON coach_profiles
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Client profiles policies  
CREATE POLICY "Clients can view own profile" ON client_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Coaches can view their clients" ON client_profiles
  FOR SELECT USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id::text = auth.uid()::text
    )
  );

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- Admin bypass (optional, for service role)
-- Service role key bypasses RLS automatically
```

## Step 4: Create Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

## Step 5: Update Authentication

Replace Prisma user lookups with Supabase:

**Before (Prisma):**
```typescript
const user = await prisma.user.findUnique({ where: { email } });
```

**After (Supabase):**
```typescript
const { data: user } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('email', email)
  .single();
```

## Step 6: Update File Storage

Replace Cloudflare R2 with Supabase Storage:

**Before (R2):**
```typescript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({ /* config */ });
await client.send(new PutObjectCommand({ /* params */ }));
```

**After (Supabase Storage):**
```typescript
const { data, error } = await supabase.storage
  .from('progress-photos')
  .upload(`${userId}/${filename}`, file);

const { data: publicURL } = supabase.storage
  .from('progress-photos')
  .getPublicUrl(data.path);
```

## Step 7: Migration Checklist

- [ ] Install Supabase dependencies
- [ ] Update environment variables
- [ ] Run SQL migrations in Supabase
- [ ] Create storage buckets in Supabase
- [ ] Replace Prisma client calls with Supabase
- [ ] Replace R2 file uploads with Supabase Storage
- [ ] Update authentication to use Supabase
- [ ] Test all API endpoints
- [ ] Remove Prisma and AWS SDK dependencies
- [ ] Update documentation

## Step 8: Supabase Storage Setup

1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - `avatars` (for user avatars)
   - `progress-photos` (for client progress photos)
   - `documents` (for document attachments)

3. Set bucket policies to public or private as needed

## Step 9: Testing

After migration:
1. Test user registration and login
2. Test file uploads
3. Test coach/client relationships
4. Test messaging system
5. Test progress tracking
6. Test SSO flow

## Benefits of Supabase

✅ No need for separate ORM (Prisma)
✅ Built-in auth with JWT
✅ Built-in storage
✅ Real-time subscriptions (optional)
✅ Automatic API generation
✅ Row Level Security for data isolation
✅ Better integration with Next.js
✅ Simpler deployment

## Notes

- Supabase uses PostgreSQL under the hood (same as before)
- UUID instead of CUID for IDs
- RLS provides automatic security at database level
- Service role key bypasses RLS (use for admin operations)
- Anon key respects RLS (use for client-side operations)
