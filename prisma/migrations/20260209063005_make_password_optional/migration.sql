-- AlterTable
-- Make password column optional (nullable)
-- This is step 1 of 2-step migration to remove password column
-- Step 2 (dropping column) will be done after confirming no code uses it
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
