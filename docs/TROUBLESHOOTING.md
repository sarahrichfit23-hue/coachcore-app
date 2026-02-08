# Troubleshooting Guide

This guide covers common issues and their solutions for the Coach Core application.

## Table of Contents

1. [Cannot Login - Database Connection Error](#cannot-login---database-connection-error)
2. [Port 6543 / PgBouncer Issues](#port-6543--pgbouncer-issues)
3. [Environment Variable Issues](#environment-variable-issues)
4. [Quick Fixes](#quick-fixes)

---

## Cannot Login - Database Connection Error

### Symptoms
- Cannot log in as any user (Admin, Coach, or Client)
- Error message: "Database connection error. Please try again."
- Application fails to start or crashes during authentication

### Root Cause
The `.env` file is missing or not properly configured. Without this file, the application cannot:
- Connect to the PostgreSQL database
- Initialize Supabase authentication
- Generate Prisma client properly

### Solution

**Step 1: Check if `.env` file exists**
```bash
ls -la .env
```

**Step 2: If missing, restore from backup**
```bash
# Option A: Restore from backup (if available)
cp .env.bak .env

# Option B: Create from example
cp .env.example .env
# Then edit .env with your actual credentials
```

**Step 3: Verify environment variables**
```bash
npm run check-env
```

**Step 4: Reinstall dependencies to regenerate Prisma client**
```bash
npm install
```

**Step 5: Start the application**
```bash
npm run dev
```

---

## Port 6543 / PgBouncer Issues

### Background
Supabase has deprecated port 6543 (PgBouncer pooler). All connections should now use port 5432 directly.

### Symptoms
- Connection errors mentioning port 6543
- "Can't reach database server" errors
- Authentication failures

### Solution

**Update your `.env` file to use port 5432:**

```env
# ❌ OLD - Don't use this
DATABASE_URL=postgresql://postgres:password@host:6543/postgres?pgbouncer=true

# ✅ NEW - Use this instead
DATABASE_URL=postgresql://postgres:password@host:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:password@host:5432/postgres?sslmode=require
```

**The application includes auto-fix logic** in `src/lib/db/prisma.ts` that will automatically convert port 6543 to 5432 if detected, but it's best to update your `.env` file directly.

### Verify the Fix

Run the environment checker:
```bash
npm run check-env
```

It will warn you if port 6543 is still present in your configuration.

---

## Environment Variable Issues

### Required Variables

These variables **must** be set for the application to work:

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
JWT_SECRET=<secure-random-string>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Platform
PLATFORM_NAME=Coach Core
```

### Optional but Recommended Variables

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (for notifications)
RESEND_API_KEY=<your-key>
EMAIL_FROM=noreply@yourdomain.com

# Cloudflare R2 (for file uploads)
R2_PUBLIC_URL=<your-r2-url>
R2_ENDPOINT=<your-endpoint>
R2_ACCESS_KEY_ID=<your-key>
R2_SECRET_ACCESS_KEY=<your-secret>
R2_BUCKET_NAME=<your-bucket>
```

### Generating a JWT Secret

Generate a secure JWT secret with:
```bash
openssl rand -hex 32
```

---

## Quick Fixes

### Reset Everything
If you're completely stuck, try this reset procedure:

```bash
# 1. Ensure .env file exists
cp .env.bak .env  # or cp .env.example .env

# 2. Clean install
rm -rf node_modules package-lock.json
npm install

# 3. Verify environment
npm run check-env

# 4. Regenerate Prisma client
npm run prisma:generate

# 5. Start fresh
npm run dev
```

### Common Checklist

Before reporting an issue, verify:
- [ ] `.env` file exists in the project root
- [ ] All required environment variables are set
- [ ] Database URLs use port 5432 (not 6543)
- [ ] `node_modules` and Prisma client are up to date
- [ ] No typos in environment variable names
- [ ] Database credentials are correct
- [ ] Database server is accessible

### Getting Help

If you're still stuck after trying these solutions:

1. Run `npm run check-env` and save the output
2. Check the application logs for specific error messages
3. Verify your Supabase project is active and accessible
4. Make sure you're using the correct database credentials from your Supabase dashboard

---

## Prevention

To prevent these issues in the future:

1. **Always backup your `.env` file** before making changes:
   ```bash
   cp .env .env.bak
   ```

2. **Use version control** (but never commit `.env` to git):
   - Keep `.env` in `.gitignore`
   - Commit `.env.example` with placeholder values
   - Document all required variables

3. **Run `npm run check-env`** regularly, especially:
   - Before deploying
   - After pulling new code
   - When setting up a new environment

4. **Keep dependencies updated**:
   ```bash
   npm install
   npm run prisma:generate
   ```

5. **Monitor Supabase announcements** for infrastructure changes like the port 6543 deprecation
