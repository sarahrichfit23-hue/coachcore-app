# Complete Supabase Setup Guide for CoachCore

This guide provides step-by-step instructions for setting up your CoachCore application with Supabase, including database, storage, auth, and real-time features.

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed
- Basic understanding of PostgreSQL and Next.js

## 🚀 Quick Start (5 Steps)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `coachcore-app` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier is fine for development

4. Wait 2-3 minutes for project creation

### Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Step 3: Configure Environment Variables

Create `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001

# SSO Configuration
SSO_COOKIE_DOMAIN=
JWT_SECRET=your-secure-secret-here

# Node environment
NODE_ENV=development
```

### Step 4: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Paste and click **RUN**
5. Wait for success message
6. Repeat for `supabase/migrations/20240101000001_rls_policies.sql`

**Alternative (using Supabase CLI):**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Step 5: Set Up Storage Buckets

1. In Supabase Dashboard, go to **Storage**
2. Create these buckets:

#### Bucket 1: `avatars`
- **Public**: Yes
- **File size limit**: 2MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Bucket 2: `progress-photos`
- **Public**: No (use RLS)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png`

#### Bucket 3: `documents`
- **Public**: No (use RLS)
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf, image/*, application/msword`

3. For each bucket, click **Policies** → **New policy**

**Avatars bucket policies:**
```sql
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Progress-photos bucket policies:**
```sql
-- Clients can upload to their own folder
CREATE POLICY "Clients upload own progress photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Clients can view own photos
CREATE POLICY "Clients view own progress photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Coaches can view their clients' photos
CREATE POLICY "Coaches view client progress photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND EXISTS (
    SELECT 1 FROM client_profiles cli
    JOIN coach_profiles cp ON cli.coach_id = cp.id
    WHERE cp.user_id = auth.uid()
      AND (storage.foldername(name))[1] = cli.user_id::text
  )
);
```

## 📦 Install Dependencies

```bash
# Remove old dependencies (if migrating from Prisma)
npm uninstall @prisma/client prisma @aws-sdk/client-s3

# Install Supabase
npm install @supabase/supabase-js @supabase/ssr

# Install (if not already present)
npm install jose # For JWT handling
```

## 🧪 Test Your Setup

Create a test file `test-supabase.ts`:

```typescript
import { supabaseAdmin } from './src/lib/supabase/server';

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('*');
    
    if (error) throw error;
    
    console.log('✅ Database connected successfully!');
    console.log('📊 Role permissions:', data);
    
    // Test storage
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    console.log('🪣 Storage buckets:', buckets?.map(b => b.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
```

Run it:
```bash
npx tsx test-supabase.ts
```

## 🔐 Enable Realtime (Optional but Recommended)

1. In Supabase Dashboard, go to **Database → Replication**
2. Enable replication for these tables:
   - ✅ `messages`
   - ✅ `progress`
   - ✅ `client_profiles`
3. Click **Save**

This enables real-time subscriptions for live updates.

## 🎨 Using Realtime in Your Components

```typescript
'use client';

import { useRealtimeMessages } from '@/hooks/use-realtime-messages';

export function MessageInbox({ userId }: { userId: string }) {
  const { messages, unreadCount } = useRealtimeMessages(userId);
  
  return (
    <div>
      <h2>Inbox ({unreadCount} unread)</h2>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## 📝 Common Operations

### Upload a File to Storage

```typescript
import { supabase } from '@/lib/supabase/client';

async function uploadAvatar(file: File, userId: string) {
  const fileName = `${userId}/avatar.png`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}
```

### Query Data with RLS

```typescript
import { supabaseAdmin } from '@/lib/supabase/server';

// Get coach's clients (RLS automatically filters)
async function getCoachClients(coachId: string) {
  const { data, error } = await supabaseAdmin
    .from('client_profiles')
    .select(`
      *,
      user:users(name, email),
      coach:coach_profiles(user:users(name))
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

### Subscribe to Real-time Updates

```typescript
import { subscribeToMessages } from '@/lib/supabase/realtime';

const channel = subscribeToMessages(
  userId,
  (newMessage) => {
    console.log('New message:', newMessage);
    // Update UI, play sound, etc.
  },
  (error) => {
    console.error('Subscription error:', error);
  }
);

// Cleanup
return () => {
  unsubscribe(channel);
};
```

## 🚨 Troubleshooting

### "relation does not exist" error
**Solution**: Run the migrations in the SQL Editor

### "JWT expired" or auth errors
**Solution**: Check that your `SUPABASE_SERVICE_ROLE_KEY` is correct and not the anon key

### RLS policy blocks query
**Solution**: Make sure you're using `supabaseAdmin` (service role) for server-side queries that need to bypass RLS

### Realtime not working
**Solution**: 
1. Enable replication for tables in Database → Replication
2. Check that the table/column you're subscribing to is enabled
3. Verify your anon key has proper permissions

### Storage upload fails
**Solution**: 
1. Check bucket policies
2. Verify file size limits
3. Confirm MIME type is allowed

## 📚 Next Steps

1. **Seed Data**: Create test users, coaches, and clients
2. **SSO Flow**: Test the portal SSO login
3. **API Migration**: Update all API routes to use Supabase
4. **Deploy**: Push to Vercel with environment variables

## 🔗 Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Migration Guide](./SUPABASE_MIGRATION.md)

## ✅ Verification Checklist

Before going to production, verify:

- [ ] All migrations ran successfully
- [ ] Storage buckets created with correct policies
- [ ] Environment variables set in Vercel
- [ ] RLS policies tested for each role
- [ ] Realtime subscriptions working
- [ ] File uploads working
- [ ] SSO flow tested
- [ ] Admin can create coaches
- [ ] Coaches can create clients
- [ ] Clients can upload progress photos
- [ ] Messaging works end-to-end

## 💡 Pro Tips

1. **Use Supabase Studio**: Built-in database browser at `supabase.com/dashboard/project/your-project/editor`
2. **Enable Database Webhooks**: Get notified of database changes
3. **Use Edge Functions**: Supabase Edge Functions for serverless API logic
4. **Monitor Usage**: Check Database → Usage to avoid hitting limits
5. **Backup Data**: Enable point-in-time recovery in production

---

🎉 **You're all set!** Your CoachCore app is now powered by Supabase with real-time capabilities, secure storage, and robust RLS policies.

Need help? Check the [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) for detailed migration instructions from Prisma.
