# Prisma Quick Start Guide

## TL;DR - Just Run This

```bash
# 1. Make sure you have your .env file with DATABASE_URL set
# 2. Run this single command:
npx prisma db push

# That's it! Your Supabase database is now ready.
```

## What This Does

✅ Creates all 7 tables in your Supabase database  
✅ Creates the Role enum (ADMIN, COACH, CLIENT)  
✅ Sets up all foreign key relationships  
✅ Creates all indexes for performance  
✅ Ready to use with your Next.js app  

## Quick Commands Reference

```bash
# Push schema to database (run after schema changes)
npx prisma db push

# Generate Prisma Client (run after schema changes)
npx prisma generate

# Open database GUI
npx prisma studio

# Validate schema
npx prisma validate

# Seed database (if you have seed data)
npm run seed
```

## Need More Info?

See the full guide: [PRISMA_DEPLOYMENT_GUIDE.md](./PRISMA_DEPLOYMENT_GUIDE.md)

## Your Schema Status

✅ **Schema is VALID**  
✅ **Ready to deploy**  
✅ **Contains 7 tables + 1 enum**  
✅ **All relationships configured correctly**  

## Environment Setup

Make sure your `.env` file has:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
```

Get your connection string from:  
Supabase Dashboard → Project Settings → Database → Connection String → URI

---

**That's all you need to know!** Run `npx prisma db push` and you're done. 🚀
