# Single Sign-On (SSO) Setup Guide

This guide explains how to configure and use the Single Sign-On (SSO) feature to enable seamless login between the main CoachCore app and the Coach Portal.

## Overview

The SSO implementation allows coaches to access the portal without re-entering credentials. It uses:
- Short-lived SSO tokens (5 minutes)
- JWT-based authentication
- Shared HTTP-only cookies for cross-subdomain support
- One-time use tokens for security
- **In-memory token storage** (no database required for SSO tokens)

## Architecture

```
Main App (app.coachcore.com)
    ↓
  Generate SSO Token (stored in memory)
    ↓
  Redirect to Portal with Token
    ↓
Portal (portal.coachcore.com)
    ↓
  Verify SSO Token (check memory store)
    ↓
  Create Session Cookie
    ↓
  Redirect to Portal Dashboard
```

## Setup Instructions

### Option A: Same Domain (Development)

For local development where both apps run on `localhost`:

1. **Environment Variables** (`.env`):
```bash
# Main app runs on port 3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Portal runs on port 3001 (or same app with /portal routes)
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
# Leave SSO_COOKIE_DOMAIN empty for localhost
SSO_COOKIE_DOMAIN=
JWT_SECRET=your-secure-secret-here
```

2. **Start Both Apps**:
```bash
# Terminal 1 - Main App
npm run dev

# Terminal 2 - Portal (if separate deployment)
cd ../portal
PORT=3001 npm run dev

# OR: Use same codebase for both (recommended)
# Portal routes are already included in this app
npm run dev
```

### Option B: Subdomains (Production)

For production with subdomains like `app.coachcore.com` and `portal.coachcore.com`:

1. **Environment Variables** (`.env`):
```bash
NEXT_PUBLIC_APP_URL=https://app.coachcore.com
NEXT_PUBLIC_PORTAL_URL=https://portal.coachcore.com
# Root domain for cookie sharing
SSO_COOKIE_DOMAIN=.coachcore.com
JWT_SECRET=your-secure-production-secret
```

2. **DNS Configuration**:
   - Set up A/CNAME records for both subdomains pointing to your hosting
   - Ensure SSL certificates are valid for both subdomains

3. **Deploy Both Apps**:
   - Deploy main app to `app.coachcore.com`
   - Deploy portal to `portal.coachcore.com` (or use same deployment with routing)

## Token Storage

**Important**: SSO tokens are stored **in-memory** (not in a database). This means:

✅ **Advantages**:
- No database migrations needed for SSO
- Fast token verification
- Automatic cleanup with app restart
- Simple implementation

⚠️ **Considerations**:
- Tokens are lost on app restart (users need to re-authenticate)
- Not shared across multiple server instances
- For production with multiple instances, consider upgrading to Redis

### Upgrading to Redis (Optional for Production)

For multi-instance deployments, replace the in-memory Map with Redis:

```typescript
// In src/lib/auth/sso-token.ts
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Replace tokenStore.set() with redis.setex()
// Replace tokenStore.get() with redis.get()
```

## API Endpoints

### Generate SSO Token
**POST** `/api/auth/sso/generate-token`

Generates a short-lived SSO token for the authenticated coach.

**Request**:
```json
{
  "returnUrl": "/optional-path-to-return-to"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "redirectUrl": "http://portal.coachcore.com/sso/login?token=...",
    "token": "eyJhbGc..."
  }
}
```

### Verify SSO Token
**POST** `/api/auth/sso/verify-token`

Verifies an SSO token and creates a session.

**Request**:
```json
{
  "token": "eyJhbGc..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "clx...",
    "role": "COACH",
    "isPasswordChanged": true,
    "returnUrl": "/dashboard"
  }
}
```

### Cleanup Expired Tokens
**POST** `/api/auth/sso/cleanup`

Removes expired and used tokens from memory.

## Usage

### In the Coach Dashboard

The "Open Coach Portal" button is available in the coach dashboard header:

```tsx
import { PortalAccessButton } from "@/components/dashboard/coach/portal-access-button";

// In your component
<PortalAccessButton />
```

### Manual SSO Flow

1. Coach clicks "Open Coach Portal" button
2. Frontend calls `/api/auth/sso/generate-token`
3. User is redirected to portal with SSO token
4. Portal calls `/api/auth/sso/verify-token`
5. Session cookie is created
6. User is redirected to portal dashboard

## Security Features

1. **Short-lived tokens**: Tokens expire after 5 minutes
2. **One-time use**: Each token can only be used once
3. **HTTP-only cookies**: Session cookies cannot be accessed via JavaScript
4. **Secure cookies**: In production, cookies are only sent over HTTPS
5. **Role-based access**: Only COACH role can generate portal tokens
6. **In-memory isolation**: Tokens are isolated per server instance
7. **Auto-cleanup**: Expired tokens are automatically cleaned up

## Troubleshooting

### Cookie not shared between domains

**Problem**: User is not logged in after SSO redirect.

**Solution**:
- Verify `SSO_COOKIE_DOMAIN` is set to the root domain (e.g., `.coachcore.com`)
- Ensure both apps are on subdomains of the same root domain
- Check browser developer tools → Application → Cookies to verify domain

### Token expired error

**Problem**: "Invalid or expired SSO token" error.

**Solution**:
- Tokens expire after 5 minutes; this is normal for security
- Generate a new token and try again
- Check server time synchronization if issue persists

### Token not found after app restart

**Problem**: SSO fails after server restart.

**Solution**:
- This is expected behavior with in-memory storage
- Users simply need to click "Open Portal" again
- For production, consider upgrading to Redis for persistent storage

### CORS errors

**Problem**: Cross-origin request blocked.

**Solution**:
- Verify `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PORTAL_URL` are correct
- Check that requests are made to the correct origins
- For production, ensure proper CORS headers are configured

### Token already used

**Problem**: "SSO token already used" error.

**Solution**:
- Tokens are single-use for security
- Generate a new token for each portal access
- Check for duplicate requests or page reloads

## Periodic Maintenance

Set up a cron job or scheduled task to clean up expired tokens from memory:

```bash
# Example: Hourly cleanup
0 * * * * curl -X POST https://app.coachcore.com/api/auth/sso/cleanup
```

Or use Vercel Cron Jobs:

```json
{
  "crons": [
    {
      "path": "/api/auth/sso/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Testing

### Local Testing

1. Start the app on port 3000
2. Login as a coach
3. Click "Open Coach Portal" in the dashboard header
4. Verify you're redirected to `/sso/login` with a token
5. Verify the portal page loads and you're logged in

### Production Testing

1. Deploy the app to your domain(s)
2. Verify environment variables are correct
3. Test SSO flow end-to-end
4. Check browser cookies to confirm proper domain setting
5. Test token expiration by waiting 5+ minutes

## Additional Notes

- SSO tokens are ephemeral and stored only in server memory
- The same codebase includes both main app and portal routes
- Portal-specific routes are under `/sso/*` and `/(portal)/*`
- No database migrations are required for SSO functionality
- Consider rate limiting the token generation endpoint in production
- For horizontal scaling, upgrade to Redis or similar distributed cache
