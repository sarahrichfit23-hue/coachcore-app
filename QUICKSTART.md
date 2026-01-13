# 🚀 Quick Start Guide for mycoachcore.com

Get your SSO-enabled CoachCore app running on **mycoachcore.com** with Supabase in 30 minutes.

## ⏱️ 30-Minute Setup

### Step 1: Supabase (10 minutes)

1. **Create project** at [supabase.com](https://supabase.com)
   - Name: `coachcore-production`
   - Region: Choose closest to users
   - Password: Save it!

2. **Run migrations** (SQL Editor):
   - Copy/paste: `supabase/migrations/20240101000000_initial_schema.sql` → RUN
   - Copy/paste: `supabase/migrations/20240101000001_rls_policies.sql` → RUN

3. **Create storage buckets** (Storage tab):
   - `avatars` (public)
   - `progress-photos` (private)
   - `documents` (private)

4. **Enable Realtime** (Database → Replication):
   - Check: `messages`, `progress`, `client_profiles`

5. **Copy API keys** (Settings → API):
   - Project URL
   - anon public key
   - service_role key

### Step 2: Vercel Configuration (5 minutes)

1. **Add domains** (Settings → Domains):
   ```
   mycoachcore.com
   portal.mycoachcore.com
   ```

2. **Set environment variables** (Settings → Environment Variables):
   ```bash
   NEXT_PUBLIC_APP_URL=https://mycoachcore.com
   NEXT_PUBLIC_PORTAL_URL=https://portal.mycoachcore.com
   SSO_COOKIE_DOMAIN=.mycoachcore.com
   NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   JWT_SECRET=[run: openssl rand -base64 32]
   NODE_ENV=production
   ```

### Step 3: Deploy (5 minutes)

```bash
# Build and deploy
npm run build
vercel --prod

# Or push to main branch if GitHub connected
git push origin main
```

### Step 4: DNS Setup (5 minutes)

Add this CNAME record to your DNS:
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
TTL: Auto
```

### Step 5: Test SSO (5 minutes)

1. Visit: https://mycoachcore.com
2. Login as coach
3. Click "Open Coach Portal"
4. Should redirect to https://portal.mycoachcore.com/sso/login
5. Should auto-login to portal

✅ **Done!** Your app is live with SSO.

---

## 🎯 What You Get

### Features Enabled
- ✅ Single Sign-On between main app and portal
- ✅ Supabase database with RLS security
- ✅ Real-time messaging
- ✅ Real-time progress tracking  
- ✅ Online presence indicators
- ✅ Secure file storage (ready to migrate)
- ✅ Coach/Client relationships
- ✅ Admin oversight

### Security
- ✅ Row Level Security on all tables
- ✅ HTTP-only secure cookies
- ✅ One-time use SSO tokens (5 min expiry)
- ✅ JWT validation
- ✅ HTTPS enforced

---

## 📝 Remaining Work

### High Priority (Do Next)
1. **Migrate API routes** to use Supabase instead of Prisma
   - Update all `/api/coach/*`
   - Update all `/api/client/*`
   - Update all `/api/admin/*`

2. **Migrate file storage** from Cloudflare R2 to Supabase Storage
   - Update upload endpoints
   - Use Supabase Storage SDK

### Medium Priority
3. **Remove Prisma dependencies**
   ```bash
   npm uninstall @prisma/client prisma
   ```

4. **Remove AWS SDK**
   ```bash
   npm uninstall @aws-sdk/client-s3
   ```

### Low Priority
5. **Optimize performance**
   - Add caching
   - Optimize queries
   - Add loading states

---

## 🔍 Quick Checks

### Is it working?

**Test 1: Database**
```bash
# Should see role_permissions data
curl https://[your-project].supabase.co/rest/v1/role_permissions \
  -H "apikey: [your-anon-key]"
```

**Test 2: SSO Flow**
1. Login at mycoachcore.com as coach
2. Open DevTools → Network
3. Click "Open Coach Portal"
4. Look for redirect to `/sso/login?token=...`
5. Check for auth cookie with domain `.mycoachcore.com`

**Test 3: Realtime**
```typescript
// In browser console at mycoachcore.com
const { supabase } = await import('./src/lib/supabase/client.ts');
supabase.channel('test').subscribe((status) => console.log(status));
// Should log: SUBSCRIBED
```

---

## 🐛 Common Issues

### Portal SSO not working?
```bash
# Check these:
1. SSO_COOKIE_DOMAIN has leading dot: .mycoachcore.com
2. Both domains added in Vercel
3. JWT_SECRET same across both
4. Environment variables deployed (redeploy after changes)
```

### Database queries failing?
```bash
# Check these:
1. Migrations ran successfully
2. RLS policies enabled
3. Using correct API keys
4. Service role key for admin operations
```

### Realtime not updating?
```bash
# Check these:
1. Replication enabled for tables
2. Browser has internet connection
3. Supabase project not paused
```

---

## 📚 Documentation

- **Full Setup**: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- **Migration Guide**: [docs/SUPABASE_MIGRATION.md](./docs/SUPABASE_MIGRATION.md)
- **SSO Details**: [docs/SSO_SETUP.md](./docs/SSO_SETUP.md)
- **Deployment**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Summary**: [SUPABASE_SUMMARY.md](./SUPABASE_SUMMARY.md)

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ https://mycoachcore.com loads
- ✅ https://portal.mycoachcore.com loads
- ✅ Can login as coach
- ✅ "Open Coach Portal" button appears
- ✅ Clicking portal button redirects and auto-logs in
- ✅ No console errors
- ✅ Can send messages (if enabled)
- ✅ Can upload files (after storage migration)

---

## 🎉 You're Done!

Your CoachCore app is now running on **mycoachcore.com** with:
- Supabase backend
- SSO between main app and portal
- Real-time features
- Secure RLS policies

Next steps: Migrate remaining API routes and file storage.

**Questions?** Check the docs folder or open an issue.

---

**Last Updated**: 2024-01-13  
**Version**: 1.0 - Supabase Migration  
**Domain**: mycoachcore.com
