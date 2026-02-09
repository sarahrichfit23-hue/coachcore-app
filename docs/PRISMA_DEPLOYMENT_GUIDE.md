# Prisma Schema Deployment Guide for Supabase

## ✅ Schema Validation Status

Your `prisma/schema.prisma` file is **VALID** and ready to be deployed! ✓

The schema has been validated using Prisma CLI v6.19.0 and contains no syntax errors or structural issues.

## 📋 Schema Overview

Your Prisma schema includes:

- **1 Enum**: Role (ADMIN, COACH, CLIENT)
- **7 Tables**:
  - `role_permissions` - Role-based permissions
  - `users` - User accounts
  - `coach_profiles` - Coach-specific data
  - `portal_templates` - Reusable templates for coaches
  - `client_profiles` - Client-specific data
  - `progress` - Client progress tracking
  - `messages` - Messaging system
- **Foreign Key Relationships**: Properly configured CASCADE deletes
- **Indexes**: Optimized for common query patterns

## 🚀 Option 1: Run `npx prisma db push` Locally (RECOMMENDED)

This is the **easiest and recommended** approach.

### Prerequisites

1. ✅ You already have Prisma installed (v6.19.0 in package.json)
2. ✅ Your `DATABASE_URL` is configured to point to Supabase
3. ✅ Your schema is valid

### Steps to Run Locally

```bash
# 1. Make sure you have a .env file with your Supabase DATABASE_URL
# Example .env:
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 2. Navigate to your project directory
cd /path/to/coachcore-app

# 3. Run the push command (this will create/update tables in your Supabase database)
npx prisma db push

# 4. Verify the push was successful
# You should see: "🚀 Your database is now in sync with your Prisma schema."
```

### What `npx prisma db push` Does

- Reads your `prisma/schema.prisma` file
- Connects to your database using `DATABASE_URL`
- Creates/updates tables, enums, indexes, and relationships
- Does NOT create migration files (unlike `prisma migrate`)
- Safe to run multiple times (idempotent)

### When to Run Locally

- ✅ **Development**: Run locally during development when you change the schema
- ✅ **First Time Setup**: Run once to initialize your Supabase database
- ✅ **Quick Prototyping**: Ideal for MVP/rapid development

### Troubleshooting

If you encounter issues:

```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# If empty, make sure your .env file exists and is loaded
cat .env | grep DATABASE_URL

# Verify you can connect to Supabase
npx prisma db execute --stdin <<< "SELECT 1;"

# Validate schema before pushing
npx prisma validate
```

## 🔄 Option 2: Run in CI/CD Pipeline

If you use Vercel, Netlify, or GitHub Actions, you can automate the push.

### For Vercel Deployment

Add to your build command in `package.json`:

```json
{
  "scripts": {
    "build": "prisma db push && next build"
  }
}
```

Or in Vercel project settings:

- Build Command: `npx prisma db push && npm run build`
- Install Command: `npm install`

Make sure `DATABASE_URL` is set in Vercel Environment Variables.

### For GitHub Actions

Create `.github/workflows/deploy-db.yml`:

```yaml
name: Deploy Database Schema

on:
  push:
    branches: [main]
    paths:
      - "prisma/schema.prisma"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm install
      - run: npx prisma db push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## 📝 Option 3: Run SQL Manually in Supabase SQL Editor

If you prefer to run SQL directly or cannot use `npx prisma db push`, you can use the generated SQL below.

### Steps

1. Open your Supabase project dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Create a new query
4. Copy and paste the SQL below
5. Click **RUN** to execute

### ⚠️ Important Notes Before Running SQL

- This SQL is **generated automatically** from your Prisma schema
- It assumes a **clean database** (no existing tables)
- If you already have tables, you may need to modify the SQL
- **Foreign keys** require tables to be created in the correct order (already done below)
- Prisma Client will still work after manual SQL creation

### Generated SQL for Supabase

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'CLIENT');

-- CreateTable: role_permissions
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "isPasswordChanged" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "token" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: coach_profiles
CREATE TABLE "coach_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" JSONB,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: portal_templates
CREATE TABLE "portal_templates" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "document" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: client_profiles
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "document" JSONB,
    "totalPhases" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: progress
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "clientProfileId" TEXT NOT NULL,
    "phaseNumber" INTEGER NOT NULL,
    "photo1Url" TEXT,
    "photo2Url" TEXT,
    "photo3Url" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: messages
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_key" ON "role_permissions"("role");
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_token_key" ON "users"("token");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "coach_profiles_userId_key" ON "coach_profiles"("userId");

-- CreateIndex
CREATE INDEX "portal_templates_coachId_idx" ON "portal_templates"("coachId");
CREATE INDEX "portal_templates_coachId_createdAt_idx" ON "portal_templates"("coachId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_userId_key" ON "client_profiles"("userId");
CREATE INDEX "client_profiles_coachId_idx" ON "client_profiles"("coachId");
CREATE INDEX "client_profiles_coachId_createdAt_idx" ON "client_profiles"("coachId", "createdAt");

-- CreateIndex
CREATE INDEX "progress_clientProfileId_idx" ON "progress"("clientProfileId");
CREATE UNIQUE INDEX "progress_clientProfileId_phaseNumber_key" ON "progress"("clientProfileId", "phaseNumber");

-- CreateIndex
CREATE INDEX "messages_senderId_createdAt_idx" ON "messages"("senderId", "createdAt");
CREATE INDEX "messages_receiverId_createdAt_idx" ON "messages"("receiverId", "createdAt");
CREATE INDEX "messages_receiverId_isRead_idx" ON "messages"("receiverId", "isRead");

-- AddForeignKey
ALTER TABLE "coach_profiles" ADD CONSTRAINT "coach_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portal_templates" ADD CONSTRAINT "portal_templates_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_coachId_fkey"
    FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "progress" ADD CONSTRAINT "progress_clientProfileId_fkey"
    FOREIGN KEY ("clientProfileId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Verifying Manual SQL Execution

After running the SQL, verify in Supabase:

1. Go to **Table Editor** in Supabase dashboard
2. You should see all 7 tables listed
3. Check table structure matches your schema

Then in your app:

```bash
# Generate Prisma Client to match your database
npx prisma generate

# Your app should now work with the database
npm run dev
```

## 🔍 Comparison: `prisma db push` vs Manual SQL

| Feature            | `npx prisma db push` | Manual SQL in Supabase                 |
| ------------------ | -------------------- | -------------------------------------- |
| Ease of use        | ✅ Very easy         | ⚠️ Requires SQL knowledge              |
| Accuracy           | ✅ 100% accurate     | ⚠️ Risk of copy-paste errors           |
| Future updates     | ✅ Easy to re-run    | ❌ Must regenerate SQL each time       |
| Migration history  | ❌ No history        | ❌ No history                          |
| Prisma Client sync | ✅ Automatic         | ⚠️ Must run `prisma generate` manually |
| **Recommendation** | ⭐ **RECOMMENDED**   | Use only if push fails                 |

## 📚 Additional Resources

### Useful Prisma Commands

```bash
# Validate your schema
npx prisma validate

# Generate Prisma Client (after schema changes)
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Check database/schema differences
npx prisma db pull

# Format your schema file
npx prisma format
```

### Getting Your Supabase DATABASE_URL

1. Log in to your Supabase project: https://app.supabase.com
2. Go to **Project Settings** → **Database**
3. Scroll to **Connection String** → **URI**
4. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`)
5. Add to your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   ```

### Security Note

⚠️ **Never commit your `.env` file to Git!**

Your `.gitignore` should already include:

```
.env
.env.local
.env*.local
```

## 🎯 Recommended Next Steps

1. ✅ **Run `npx prisma db push` locally** (Option 1 - easiest)
2. ✅ **Verify tables in Supabase** (check Table Editor)
3. ✅ **Run seed script** (if you have one): `npm run seed`
4. ✅ **Test your app**: `npm run dev`
5. ✅ **Set up automated push in CI** (for production)

## ❓ FAQ

**Q: Do I need to run this more than once?**
A: Yes, every time you change `prisma/schema.prisma`, you should run `npx prisma db push` to sync the changes to your database.

**Q: What's the difference between `db push` and `migrate`?**
A:

- `db push` is for rapid development, no migration history
- `migrate` creates versioned migration files, better for production
- For MVP/early stage, `db push` is perfect

**Q: Will this delete my existing data?**
A: No, `prisma db push` is smart and only adds/modifies tables. However, if you change column types or remove columns, data could be affected. Always backup before major changes.

**Q: Can I use Prisma Studio with Supabase?**
A: Yes! Just run `npx prisma studio` and it will open a GUI to view/edit your Supabase data.

**Q: My DATABASE_URL is not working**
A: Common issues:

- Wrong password (check Supabase dashboard)
- Wrong project reference
- Missing `postgres` at the end of URL
- Network/firewall issues (ensure Supabase allows connections)

## 📞 Need Help?

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
