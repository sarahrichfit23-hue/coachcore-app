# Coach Core – Production Deployment (Vercel)

This guide gets the app production-ready on Vercel in under a day.

## Prerequisites
- GitHub repo linked to Vercel
- Supabase project (Auth + Postgres) created
- Cloudflare R2 bucket configured
- Resend API key (recommended) or SMTP creds

## Environment Variables (Vercel → Settings → Environment Variables)
Set these for `Production` (and optionally `Preview`):

- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://app.yourdomain.com`)
- `DATABASE_URL`: Supabase Postgres connection string with `?sslmode=require`
- `SUPABASE_URL`: `https://<project-ref>.supabase.co`
- `SUPABASE_ANON_KEY`: Supabase anon key
- `JWT_SECRET`: Secure random hex (32+ chars). Generate: `openssl rand -hex 32`
- `RESEND_API_KEY`: Optional but recommended for email
- `EMAIL_FROM`: Email sender (e.g., `noreply@yourdomain.com`)
- `PLATFORM_NAME`: Display name (`Coach Core`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Optional SMTP fallback
- `R2_ENDPOINT`: `https://<id>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID`: Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY`: Cloudflare R2 secret
- `R2_BUCKET_NAME`: Your R2 bucket name
- `R2_PUBLIC_URL`: Public asset URL (e.g., `https://pub-xxxx.r2.dev`)
- `R2_CUSTOM_DOMAIN`: Optional custom domain for images (e.g., `cdn.yourdomain.com`)

## Vercel Project Settings
- Framework preset: Next.js
- Node version: 18 or 20
- Build Command: `npm run vercel-build`
- Install Command: default (`npm ci`)
- Output Directory: default

The `vercel-build` script runs `prisma migrate deploy` before building so your database schema is kept in sync.

## Supabase Auth Setup
- Enable email/password sign-in (Project → Auth → Providers)
- Set site URL to your production domain
- Create your admin user in Supabase Auth with your desired email
- Ensure a matching app record exists in `user` table with role `ADMIN` and `isActive=true`

## Database
Run your migrations automatically via Vercel build. If you need initial data:
- Use `prisma/seed.ts` locally or create records via Supabase SQL editor
- Avoid seeding sensitive passwords in production; rely on Supabase Auth

## Cloudflare R2
- Create bucket and public domain
- If using custom domain, add it to `R2_CUSTOM_DOMAIN`
- CORS: allow your app domain for GET (images)

## Health Check
Verify deployment after first build:
- `GET https://<your-app>/api/health` → `200` and `Database connection successful`

## Login Flow
- `/api/auth/login` uses Supabase Auth for password validation
- App issues a JWT cookie for role-based routing
- Cookies are `httpOnly`, `secure` in production, and `sameSite=lax`

## Troubleshooting
- `Database connection failed`: Confirm `DATABASE_URL` and `?sslmode=require`
- `Auth provider not configured`: Check `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Images not loading: Verify `R2_PUBLIC_URL` or `R2_CUSTOM_DOMAIN` and Next.js `images.remotePatterns`

## Deployment Steps Summary
1) Link repo in Vercel
2) Add env vars above
3) Set Build Command to `npm run vercel-build`
4) Deploy
5) Test `/api/health` and login

If you want, I can prepare the GitHub push and a checklist PR with these steps.
