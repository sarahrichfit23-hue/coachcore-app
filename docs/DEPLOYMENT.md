# Deployment Checklist for mycoachcore.com

This checklist covers deploying the SSO-enabled CoachCore app with Supabase to your production domain.

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run migration: `20240101000000_initial_schema.sql`
- [ ] Run migration: `20240101000001_rls_policies.sql`
- [ ] Create storage buckets:
  - [ ] `avatars` (public)
  - [ ] `progress-photos` (private with RLS)
  - [ ] `documents` (private with RLS)
- [ ] Enable Realtime for tables: `messages`, `progress`, `client_profiles`
- [ ] Copy Supabase URL and keys

### 2. Domain Configuration

#### Main App: mycoachcore.com
- [ ] Verify domain is connected to Vercel
- [ ] Ensure SSL certificate is active
- [ ] Test that https://mycoachcore.com loads

#### Portal: portal.mycoachcore.com
- [ ] Add subdomain to Vercel project
- [ ] Verify SSL certificate for subdomain
- [ ] Test that https://portal.mycoachcore.com will resolve

**DNS Records Needed:**
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
TTL: Auto
```

### 3. Environment Variables

Set these in Vercel → Settings → Environment Variables:

#### Production Variables
```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://mycoachcore.com
NEXT_PUBLIC_PORTAL_URL=https://portal.mycoachcore.com

# Supabase (from your Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Authentication
JWT_SECRET=[generate-with: openssl rand -base64 32]
AUTH_SECRET=[same-as-jwt-secret-or-different]

# SSO Configuration
SSO_COOKIE_DOMAIN=.mycoachcore.com

# Node Environment
NODE_ENV=production
```

**Important Notes:**
- ✅ `SSO_COOKIE_DOMAIN` MUST have the leading dot: `.mycoachcore.com`
- ✅ This allows cookies to be shared between `mycoachcore.com` and `portal.mycoachcore.com`
- ✅ Generate a strong `JWT_SECRET` for production (never use development secrets)
- ✅ Keep `SUPABASE_SERVICE_ROLE_KEY` secret (don't expose to frontend)

### 4. Vercel Deployment Configuration

#### Option A: Single Deployment (Recommended)
Deploy once and serve both domains:

1. **In Vercel Project Settings → Domains:**
   - Add `mycoachcore.com` (main domain)
   - Add `portal.mycoachcore.com` (subdomain)

2. **How it works:**
   - Same codebase serves both domains
   - `/coach` routes accessible from main domain
   - `/sso/login` portal route accessible from subdomain
   - SSO redirects between domains seamlessly

#### Option B: Separate Deployments
If you need separate deployments:

1. **Main App Deploy:**
   - Deploy to `mycoachcore.com`
   - Include all routes except portal-specific ones

2. **Portal Deploy:**
   - Deploy to `portal.mycoachcore.com`
   - Include portal routes and SSO login page

⚠️ **Both must share the same `JWT_SECRET` and `SSO_COOKIE_DOMAIN`**

## 🚀 Deployment Steps

### Step 1: Verify Local Build
```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build
npm run build

# Test production build locally
npm run start
```

### Step 2: Deploy to Vercel

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

**Via GitHub:**
1. Push code to GitHub
2. Connect repo to Vercel
3. Vercel auto-deploys on push to main branch

### Step 3: Configure Domains in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add domains:
   - Type: `mycoachcore.com` → Add
   - Type: `portal.mycoachcore.com` → Add
3. Vercel will provide DNS instructions if needed

### Step 4: Set Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable from the list above
3. Select environments: Production, Preview, Development
4. Click "Save"
5. Redeploy for changes to take effect

### Step 5: Test SSO Flow

1. **Login to main app:**
   - Go to https://mycoachcore.com
   - Login as a coach
   
2. **Test portal access:**
   - Click "Open Coach Portal" button in dashboard
   - Should redirect to https://portal.mycoachcore.com/sso/login?token=...
   - Should automatically log you in
   - Should redirect to portal dashboard

3. **Verify cookie sharing:**
   - Open browser DevTools → Application → Cookies
   - Check for cookie with domain `.mycoachcore.com`
   - Cookie should be accessible on both domains

## ✅ Post-Deployment Verification

### Security Checks
- [ ] HTTPS enabled on both domains
- [ ] Cookies are `HttpOnly` and `Secure`
- [ ] `SSO_COOKIE_DOMAIN` is `.mycoachcore.com` (with dot)
- [ ] Service role key not exposed in frontend
- [ ] JWT tokens expire properly (check 5-minute limit)

### Functionality Tests
- [ ] User registration works
- [ ] Login/logout works on main app
- [ ] Coach can access dashboard
- [ ] "Open Coach Portal" button appears
- [ ] Portal SSO redirect works
- [ ] Portal login succeeds automatically
- [ ] Can navigate portal after SSO login
- [ ] Session persists across both domains
- [ ] Logout clears session on both domains

### Supabase Integration Tests
- [ ] Database queries work (users, coaches, clients)
- [ ] RLS policies enforce correctly
- [ ] File uploads work (test avatar upload)
- [ ] Realtime updates work (test message)
- [ ] SSO tokens stored in `sso_tokens` table
- [ ] Expired tokens cleaned up

### Performance Tests
- [ ] Page load times acceptable (<3s)
- [ ] SSO redirect fast (<1s)
- [ ] No console errors
- [ ] Lighthouse score >80

## 🐛 Troubleshooting

### "Cookie not shared" - SSO fails after redirect

**Problem:** Portal shows "Invalid token" or user not logged in.

**Solutions:**
1. Check `SSO_COOKIE_DOMAIN` has leading dot: `.mycoachcore.com`
2. Verify both domains are subdomains of same root
3. Check cookies in DevTools (should show domain `.mycoachcore.com`)
4. Ensure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PORTAL_URL` are correct
5. Redeploy after changing environment variables

### "Token expired" errors

**Problem:** SSO token expired before use.

**Solution:**
- Tokens expire after 5 minutes (by design)
- User should click portal button again
- Check server time synchronization

### Portal not loading

**Problem:** `portal.mycoachcore.com` doesn't resolve.

**Solution:**
1. Check DNS propagation (can take up to 48 hours)
2. Verify CNAME record points to Vercel
3. Check Vercel domain configuration
4. Clear browser cache and try incognito

### Supabase connection errors

**Problem:** "Failed to connect to Supabase" or query errors.

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check anon key and service role key are correct
3. Verify RLS policies allow the operation
4. Check Supabase project is not paused (free tier)

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **DNS Checker**: https://dnschecker.org

## 🎉 Success Checklist

Your deployment is successful when:

- ✅ https://mycoachcore.com loads the main app
- ✅ https://portal.mycoachcore.com loads the portal
- ✅ Coach can login and access dashboard
- ✅ "Open Coach Portal" button works
- ✅ SSO redirects to portal automatically
- ✅ No console errors in browser
- ✅ Database queries return data
- ✅ File uploads work
- ✅ Realtime updates work

---

**Last Updated:** 2024-01-13  
**Domain:** mycoachcore.com  
**Stack:** Next.js + Supabase + Vercel
