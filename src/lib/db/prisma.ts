import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Auto-fix DATABASE_URL and DIRECT_URL if they use the old PgBouncer port 6543.
 * Supabase deprecated port 6543. Direct connections use port 5432.
 * We mutate process.env BEFORE Prisma reads it so the schema-level
 * `url = env("DATABASE_URL")` also picks up the corrected value.
 */
function fixSupabasePort(envKey: string) {
  const url = process.env[envKey];
  if (!url) return;
  if (!url.includes(":6543")) return;

  let fixed = url.replace(":6543", ":5432");
  fixed = fixed.replace(/[&?]pgbouncer=true/g, "");
  fixed = fixed.replace(/[&?]connection_limit=\d+/g, "");
  fixed = fixed.replace(/[?&]$/, "");

  process.env[envKey] = fixed;
  console.log(
    `[v0] Auto-fixed ${envKey}: port 6543 -> 5432`,
  );
}

// Fix env vars BEFORE anything else reads them
fixSupabasePort("DATABASE_URL");
fixSupabasePort("DIRECT_URL");

// Debug: log what Prisma will actually receive
console.log(
  "[v0] DATABASE_URL for Prisma:",
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace(
        /\/\/[^:]+:[^@]+@/,
        "//***:***@",
      )
    : "NOT SET",
);

/**
 * Create Prisma client with optimized settings for serverless environments
 */
function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
