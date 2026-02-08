# Quick Reference: Login Issue Fix

## The Problem
- ❌ Cannot login as any user (Admin, Coach, Client)
- ❌ "Database connection error" message
- ❌ App won't start properly

## The Solution (30 seconds)
```bash
cp .env.bak .env
npm install
npm run dev
```

That's it! Your app should now work.

## Why It Happened
The `.env` file (containing database credentials and API keys) was missing. This happened during attempts to fix the port 6543 → 5432 migration.

## Port Confusion Explained
- ❌ OLD: Supabase used port 6543 (PgBouncer) - now deprecated
- ✅ NEW: Supabase uses port 5432 (direct) - current standard
- ✅ Your `.env.bak` already has the correct port 5432 configuration

## Need More Help?

| Issue | Guide |
|-------|-------|
| Can't login / Database errors | [LOGIN_FIX.md](./LOGIN_FIX.md) |
| General troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| Automated setup | Run `bash scripts/setup.sh` |
| Environment check | Run `npm run check-env` |

## For Production/Vercel

Set these in your Vercel dashboard (Settings → Environment Variables):

```
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres?sslmode=require
JWT_SECRET=<your-secret-from-env-bak>
SUPABASE_URL=<your-url-from-env-bak>
SUPABASE_ANON_KEY=<your-key-from-env-bak>
```

Copy the values from `.env.bak` in this repo.

## Still Not Working?

1. Check `.env` file exists: `ls -la .env`
2. Verify configuration: `npm run check-env`
3. See detailed guide: [LOGIN_FIX.md](./LOGIN_FIX.md)
4. Check troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Status: ✅ FIXED
Last Updated: February 8, 2026
