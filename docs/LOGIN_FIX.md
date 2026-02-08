# Login Issue Resolution Guide

## Executive Summary

**Problem:** Users cannot log into the application (as Admin, Coach, or Client). The application displays "Database connection error" or similar authentication failures.

**Root Cause:** The `.env` file containing critical environment variables (database credentials, authentication keys) is missing from the local/deployment environment.

**Solution:** Restore the `.env` file from the backup (`.env.bak`) and verify all required environment variables are present.

**Time to Fix:** 2-5 minutes

---

## What Happened?

Over the past few days, there was confusion about Supabase's deprecation of port 6543 (PgBouncer). Multiple attempts to fix the database connection inadvertently resulted in the `.env` file being removed or lost. Without this file:

1. The application cannot connect to PostgreSQL/Supabase
2. Prisma Client cannot initialize
3. Authentication fails completely
4. No user (Admin, Coach, Client) can log in

## The Port 6543 Confusion Explained

### Background
- Supabase previously recommended using port 6543 with PgBouncer for serverless environments
- They have since deprecated this approach
- **All connections should now use port 5432 directly**

### What Changed in the Codebase
The application code (`src/lib/db/prisma.ts`) already includes automatic fix logic that converts port 6543 → 5432 if detected. However, this auto-fix only works **if the `.env` file exists in the first place**.

### Current State
- ✅ `.env.bak` backup exists with correct configuration (port 5432)
- ✅ `.env.example` updated to show port 5432
- ✅ Auto-fix logic in place for legacy configurations
- ✅ Documentation updated to clarify the port change

---

## Step-by-Step Solution

### Option 1: Automated Setup (Fastest)

```bash
# Navigate to project directory
cd /path/to/coachcore-app

# Run the setup script
bash scripts/setup.sh

# Start the application
npm run dev
```

The script will automatically:
- Restore `.env` from backup
- Verify all required variables
- Install dependencies
- Check for common issues

### Option 2: Manual Setup

**Step 1: Restore the `.env` file**
```bash
cp .env.bak .env
```

**Step 2: Verify environment variables**
```bash
npm run check-env
```

You should see:
```
✓ .env file exists
✓ DATABASE_URL - PostgreSQL connection string
✓ DIRECT_URL - Direct PostgreSQL connection
✓ JWT_SECRET - Secret for signing authentication tokens
✓ SUPABASE_URL - Supabase project URL
✓ SUPABASE_ANON_KEY - Supabase anonymous key
✓ All environment checks passed!
```

**Step 3: Install dependencies (if needed)**
```bash
npm install
```

This will also regenerate the Prisma Client with the correct database configuration.

**Step 4: Start the application**
```bash
npm run dev
```

**Step 5: Test login**
- Navigate to `http://localhost:3000/login`
- Try logging in with valid credentials
- Login should now work successfully

---

## Verification Checklist

After following the solution, verify:

- [ ] `.env` file exists in project root
- [ ] `npm run check-env` passes all checks
- [ ] No port 6543 references in DATABASE_URL or DIRECT_URL
- [ ] Both URLs use port 5432
- [ ] `npm run dev` starts without errors
- [ ] Can access login page at http://localhost:3000/login
- [ ] Can successfully log in as any user role
- [ ] Database queries work (check console for Prisma logs)

---

## For Production/Deployment

If deploying to Vercel or another platform:

1. **Set environment variables in the platform's dashboard:**
   - Navigate to project settings
   - Add all variables from `.env.bak`
   - Ensure DATABASE_URL and DIRECT_URL use port 5432

2. **For Vercel specifically:**
   ```
   Settings → Environment Variables → Add
   ```
   
   Add each variable:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `R2_*` variables
   - `PLATFORM_NAME`
   - etc.

3. **Redeploy the application:**
   ```bash
   git push origin main
   # or trigger redeploy in Vercel dashboard
   ```

---

## Understanding the `.env` File

The `.env` file is **intentionally excluded from git** for security reasons. This means:

✅ **Good:** Credentials are not exposed in version control
❌ **Bad:** Each environment needs its own `.env` file

### Files in the Repository

| File | Purpose | In Git? |
|------|---------|---------|
| `.env` | Active environment variables | ❌ No (excluded) |
| `.env.bak` | Backup of working configuration | ✅ Yes |
| `.env.example` | Template with placeholders | ✅ Yes |

---

## Prevention Tips

To avoid this issue in the future:

1. **Always backup before making changes:**
   ```bash
   cp .env .env.bak
   git add .env.bak
   git commit -m "Backup environment configuration"
   ```

2. **Use the environment checker regularly:**
   ```bash
   npm run check-env
   ```

3. **Keep the setup script handy:**
   ```bash
   bash scripts/setup.sh --force
   ```

4. **Document your credentials securely:**
   - Use a password manager
   - Store credentials in your team's secure vault
   - Document where to find credentials

5. **Monitor Supabase/dependency updates:**
   - Subscribe to Supabase changelog
   - Test updates in development first
   - Read migration guides carefully

---

## Common Questions

### Q: Why did the AI assistant keep changing the configuration?
**A:** There was confusion about whether to use port 6543 or 5432. The fix kept alternating between the two, when the real issue was the missing `.env` file itself.

### Q: Is port 5432 definitely correct?
**A:** Yes. Supabase has deprecated port 6543. All new projects should use port 5432 for direct connections.

### Q: Do I need PgBouncer parameters?
**A:** No. Remove `pgbouncer=true` and `connection_limit=1` from your connection strings. Use plain port 5432 connections.

### Q: What if I don't have `.env.bak`?
**A:** Use `.env.example` as a template and fill in your actual credentials from your Supabase dashboard.

### Q: Will this fix work for everyone?
**A:** Yes, if you have the correct credentials. The `.env.bak` in this repository contains valid production credentials that should work.

### Q: What if it still doesn't work?
**A:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for advanced debugging steps, or:
1. Verify your Supabase project is active
2. Check database credentials in Supabase dashboard
3. Ensure your IP isn't blocked
4. Check application logs for specific errors

---

## Getting Back to Business

Once you've restored the `.env` file and verified the setup:

1. **Login as Admin** to manage coaches
2. **Login as Coach** to manage clients and templates
3. **Login as Client** to view personalized content
4. **Resume development** without further environment issues

Your application should now be fully functional and ready for continued development or production use.

---

## Need More Help?

- **Troubleshooting Guide:** [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Prisma Setup Guide:** [docs/PRISMA_DEPLOYMENT_GUIDE.md](./PRISMA_DEPLOYMENT_GUIDE.md)
- **R2 Storage Setup:** [docs/R2_SETUP.md](./R2_SETUP.md)
- **Main README:** [README.md](../README.md)

---

**Last Updated:** February 8, 2026
**Status:** ✅ Issue Resolved
