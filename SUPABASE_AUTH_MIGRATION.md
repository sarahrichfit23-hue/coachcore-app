# Supabase Auth Migration Summary

## Overview
Successfully migrated the authentication system from local bcrypt-based password storage to Supabase Auth as the single source of truth for authentication.

## Changes Made

### 1. Login Route (`src/app/api/auth/login/route.ts`)
- ✅ Removed bcrypt import and password comparison
- ✅ Removed `ALLOW_LOCAL_PASSWORD_DEV` fallback logic
- ✅ Implemented auto-provisioning of `prisma.user` records on first login
- ✅ Default new users to CLIENT role (ADMIN/COACH must be created via admin routes)
- ✅ Better fallback handling for user name ("Unnamed User" instead of empty string)

### 2. Password Management
- ✅ Updated `src/lib/auth/change-password.ts` to use `supabase.auth.updateUser()`
- ✅ Removed bcrypt password hashing from change password flow
- ✅ Only update metadata (`isPasswordChanged`) in Prisma, not password field
- ✅ Verified `forgot-password`, `reset-password`, and `update-password` routes already use Supabase Auth correctly

### 3. User Creation Routes
- ✅ Updated `src/app/api/admin/create-coach/route.ts`:
  - Uses `supabase.auth.admin.createUser()` to create auth user
  - Sends password reset email instead of temporary password
  - Removed bcrypt and password generation
- ✅ Updated `src/app/api/coach/create-client/route.ts`:
  - Uses `supabase.auth.admin.createUser()` to create auth user
  - Sends password reset email instead of temporary password
  - Removed bcrypt and password generation

### 4. Database Schema (`prisma/schema.prisma`)
- ✅ Made `password` field optional (nullable)
- ✅ Added comment indicating field is deprecated
- ✅ Created migration `20260209063005_make_password_optional`
- ⚠️ Field kept for zero-downtime migration; can be dropped in future migration

### 5. Seed Script (`prisma/seed.ts`)
- ✅ Removed bcrypt import and password hashing
- ✅ Removed `password` field from user creation
- ✅ Added production safety check (`ALLOW_SEED` environment variable)
- ✅ Added warning that users must exist in Supabase Auth for login to work

### 6. Infrastructure
- ✅ Added `getSupabaseAdminClient()` in `src/lib/supabase.ts`
  - Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
  - Used for admin operations like creating users
- ✅ Created `buildPasswordResetUrl()` utility in `src/lib/auth/utils.ts`
  - Centralized password reset URL generation
  - Handles fallbacks for missing environment variables

## Environment Variables Required

### New Variables (Must be added)
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
Get this from: Supabase Dashboard → Settings → API → service_role key

### Existing Variables (Still required)
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=your_jwt_secret
```

### Variables to Remove (Optional cleanup)
```bash
ALLOW_LOCAL_PASSWORD_DEV=true  # No longer used
```

## Migration Steps for Production

### Step 1: Deploy Code Changes
1. Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables in Vercel/hosting platform
2. Keep `ALLOW_LOCAL_PASSWORD_DEV=false` (or remove it)
3. Deploy the updated code

### Step 2: Database Migration
The migration `20260209063005_make_password_optional` will run automatically on deploy:
```sql
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
```

### Step 3: Verify Existing Users
For each existing user in the database:
1. Check if they exist in Supabase Auth
2. If not, either:
   - Create them manually via Supabase Dashboard → Authentication → Users
   - Or run a script using `supabase.auth.admin.createUser()`
   - Or have them use "Forgot Password" to trigger password reset

### Step 4: Test Login Flow
1. Test login with existing user (should work if user exists in Supabase Auth)
2. Test new user creation via admin routes (should create in both places)
3. Test auto-provisioning (login with email that exists in Supabase but not in database)

### Step 5: Future Cleanup (Optional, after verification)
After confirming no code accesses the password field:
1. Create a new migration to drop the `password` column
2. Remove the field from Prisma schema completely

## Security Improvements
✅ Single source of truth for authentication (Supabase Auth)
✅ No password storage in application database
✅ Reduced attack surface (no bcrypt vulnerabilities)
✅ Better password reset flow (uses Supabase's secure email flow)
✅ Admin-only user creation (prevents privilege escalation)

## Testing Checklist
- [ ] Login with existing Supabase Auth user
- [ ] Login with new email (auto-provision test)
- [ ] Create new coach via admin route
- [ ] Create new client via coach route
- [ ] Change password flow
- [ ] Forgot password / reset password flow
- [ ] Verify seed script works with warning

## Rollback Plan
If issues are encountered:
1. The password field is still in the database (nullable)
2. Revert code changes to previous version
3. Users created in Supabase Auth will remain there
4. May need to manually sync any users created during the new version

## Notes
- The seed script now only creates database records, not Supabase Auth users
- Users must exist in both Supabase Auth AND the database to login
- Auto-provisioning handles the database record creation on first login
- Admin routes handle both Supabase Auth and database creation
- Password reset emails come from Supabase (configure in Supabase Dashboard → Authentication → Email Templates)

## Support
If login issues occur:
1. Check that user exists in Supabase Auth (Dashboard → Authentication → Users)
2. Check that user exists in database with matching email
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly for admin operations
4. Check Supabase logs for authentication errors
5. Verify email templates are configured in Supabase for password reset
