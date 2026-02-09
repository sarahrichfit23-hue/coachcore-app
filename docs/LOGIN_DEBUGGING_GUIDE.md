# Login Debugging Guide

## Overview

This guide helps diagnose and fix login issues in the Coach Core application, particularly in production environments like Vercel.

## Recent Fixes Applied

The following critical issues have been identified and fixed:

### 1. Environment Variable Validation

**Problem**: App would start without critical environment variables, causing silent failures during login.

**Fix**: Added startup validation in `src/lib/db/prisma.ts` that:

- Validates `DATABASE_URL` is set and properly formatted
- Validates `JWT_SECRET` is set and has at least 32 characters
- Throws clear errors on startup if validation fails

**How to verify**: Check your Vercel build logs. You should see `✓ Database connected successfully` or clear error messages about missing env vars.

### 2. Cookie Security Configuration

**Problem**: Cookies were only marked `secure` based on `NODE_ENV`, which could fail in reverse proxy scenarios.

**Fix**: Updated `buildAuthCookie()` in `src/lib/auth/token.ts` to:

- Check both `NODE_ENV === "production"` AND `NEXT_PUBLIC_APP_URL` starts with `https://`
- Properly handles Vercel's reverse proxy setup

**How to verify**: Check browser DevTools → Application → Cookies. The `token` cookie should have:

- `HttpOnly`: ✓
- `Secure`: ✓ (in production)
- `SameSite`: Lax

### 3. Login Race Condition

**Problem**: After successful login, query invalidation was fire-and-forget, causing redirect before session sync completed.

**Fix**: Modified `src/app/(auth)/login/page.tsx` to:

- `await refetchSession()` - ensures session is fetched
- `await queryClient.invalidateQueries()` - ensures all queries are invalidated before redirect

**How to verify**: Login should not redirect back to login page after successful authentication.

### 4. Middleware Timeout Protection

**Problem**: Token verification in middleware could hang indefinitely on slow database connections (cold starts).

**Fix**: Added 5-second timeout to token verification in `src/middleware.ts`:

```typescript
const timeoutPromise = new Promise<null>((resolve) =>
  setTimeout(() => {
    console.warn("Token verification timeout in middleware");
    resolve(null);
  }, 5000),
);
const session = await Promise.race([verifyAuthToken(token), timeoutPromise]);
```

**How to verify**: Check Vercel function logs for "Token verification timeout" warnings.

### 5. Improved Error Handling & Logging

**Changes**:

- **Login API** (`src/app/api/auth/login/route.ts`): Returns specific error codes (503 for DB errors, 401 for invalid credentials)
- **User API** (`src/app/api/user/me/route.ts`): Separates database errors from authentication errors
- **Session Provider** (`src/providers/session-provider.tsx`): Better error parsing and user feedback

**How to verify**: Check browser console and Vercel function logs for detailed error messages.

## Common Login Issues & Solutions

### Issue: "Invalid credentials" but password is correct

**Possible Causes**:

1. Database connection issue
2. User account is inactive
3. Password hash mismatch

**Debugging Steps**:

```bash
# Check Vercel logs for:
"Database error during login"
"Login attempt for invalid/inactive user"
```

**Solution**:

- Verify `DATABASE_URL` in Vercel environment variables
- Check database connection from Vercel (use `/api/health` endpoint)
- Verify user's `isActive` field is `true` in database

### Issue: Logged in but immediately redirected back to login

**Possible Causes**:

1. Cookie not being set properly
2. Session fetch failing after login
3. Race condition in query invalidation

**Debugging Steps**:

```bash
# Check browser DevTools → Network tab:
# 1. Login request should return 200 with Set-Cookie header
# 2. Next request should include Cookie header
# 3. /api/user/me should return 200 (not 401)
```

**Solution**:

- Verify `NEXT_PUBLIC_APP_URL` uses `https://` in production
- Check Vercel logs for "Session fetch failed" errors
- Ensure `JWT_SECRET` is properly set (min 32 chars)

### Issue: "Session expired" on page load

**Possible Causes**:

1. JWT token expired (7 days default)
2. JWT_SECRET changed between deployments
3. Token verification failing

**Debugging Steps**:

```bash
# Check Vercel logs for:
"Token verification failed"
"Invalid token payload structure"
```

**Solution**:

- Don't change `JWT_SECRET` in production (will invalidate all sessions)
- Check token expiry time in `src/lib/auth/token.ts` (default: 7 days)
- Verify JWT_SECRET hasn't been corrupted

### Issue: Random logouts / intermittent failures

**Possible Causes**:

1. Database connection pool exhaustion
2. Cold start timeouts
3. Middleware timeout

**Debugging Steps**:

```bash
# Check Vercel logs for:
"Token verification timeout in middleware"
"Failed to connect to database"
"Database connection error"
```

**Solution**:

- Increase database connection pool size (see Prisma config)
- Enable Vercel function warm-up (Professional plan)
- Consider using Prisma Accelerate for connection pooling

## Vercel-Specific Checklist

### Required Environment Variables

Ensure these are set in Vercel Project Settings → Environment Variables:

```bash
# Required for all environments
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<at least 32 characters>
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Required for production
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...

# Optional but recommended
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=...
```

### Vercel Function Logs

To view detailed logs:

1. Go to Vercel Dashboard → Your Project
2. Click "Functions" tab
3. Click on any function to see logs
4. Look for error messages with these prefixes:
   - `❌` - Critical errors
   - `⚠️` - Warnings
   - `✓` - Success messages

### Build Logs

Check Vercel build logs for:

```bash
✓ Database connected successfully
❌ Critical environment variables are missing
```

## Testing After Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### 2. Manual Login Test

1. Open incognito/private browser window
2. Navigate to `/login`
3. Open DevTools → Console & Network tabs
4. Enter credentials and click "Sign In"
5. Watch for:
   - Network: `POST /api/auth/login` returns 200
   - Network: Cookie is set in response
   - Console: No errors
   - Result: Redirect to dashboard

### 3. Session Persistence Test

1. After logging in, refresh the page
2. You should remain logged in
3. Check `/api/user/me` in Network tab returns 200

### 4. Cookie Security Test

1. Open DevTools → Application → Cookies
2. Find `token` cookie
3. Verify:
   - `HttpOnly`: ✓
   - `Secure`: ✓ (production only)
   - `SameSite`: Lax
   - Has expiration (7 days from now)

## Performance Monitoring

### Key Metrics to Monitor

1. **Login Response Time**
   - Target: < 1 second
   - Check: Vercel Analytics → Functions → `/api/auth/login`

2. **Session Fetch Time**
   - Target: < 500ms
   - Check: Vercel Analytics → Functions → `/api/user/me`

3. **Middleware Execution Time**
   - Target: < 200ms
   - Check: Vercel Function Logs for timeout warnings

4. **Database Query Time**
   - Target: < 100ms
   - Check: Enable Prisma query logging in development

## Getting Help

If issues persist after applying these fixes:

1. **Collect Logs**:
   - Vercel build logs
   - Vercel function logs (specifically `/api/auth/login` and `/api/user/me`)
   - Browser console errors
   - Browser network tab (HAR file export)

2. **Check Environment**:
   - Verify all required env vars are set
   - Verify JWT_SECRET length (should be 64+ characters)
   - Verify DATABASE_URL includes `?sslmode=require`

3. **Test Locally**:

   ```bash
   # Copy production env vars to .env.local
   npm run dev
   # Test login flow
   ```

4. **Database Health**:
   ```bash
   # Test database connection
   npx prisma db pull
   # Should succeed without errors
   ```

## Debugging Commands

```bash
# Check environment variables (local)
npm run dev
# Look for: "❌ Critical environment variables are missing"

# Test database connection
npx prisma studio
# Opens database GUI - should connect without errors

# Check TypeScript errors
npm run typecheck

# Check linting errors
npm run lint

# Production build test
npm run build
# Should complete without errors
```

## Security Notes

⚠️ **Never log sensitive information**:

- Full JWT tokens (only log first 20 chars)
- Passwords (never log)
- Full DATABASE_URL (only log first 20 chars)
- API keys

✓ **Safe to log**:

- Email addresses (for debugging)
- User IDs
- Roles
- Timestamps
- Error messages (without sensitive data)
