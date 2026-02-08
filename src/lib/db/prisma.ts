import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Fix DATABASE_URL if it uses the old PgBouncer port 6543
 * Supabase deprecated port 6543 - direct connections use port 5432
 */
function getFixedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Auto-fix old PgBouncer port 6543 -> direct port 5432
  if (url.includes(":6543")) {
    url = url.replace(":6543", ":5432");
    // Remove pgbouncer params that don't apply to direct connections
    url = url.replace(/[&?]pgbouncer=true/g, "");
    url = url.replace(/[&?]connection_limit=\d+/g, "");
    // Clean up any trailing ? or &
    url = url.replace(/[?&]$/, "");
    console.warn("Auto-fixed DATABASE_URL: changed port 6543 -> 5432 (old PgBouncer port is deprecated)");
  }

  return url;
}

const fixedDatabaseUrl = getFixedDatabaseUrl();

/**
 * Validate critical environment variables
 * Warns but does not crash the app if variables are missing
 */
function validateEnvironment(): boolean {
  const errors: string[] = [];

  if (!fixedDatabaseUrl) {
    errors.push("DATABASE_URL is not defined");
  } else {
    if (
      !fixedDatabaseUrl.startsWith("postgresql://") &&
      !fixedDatabaseUrl.startsWith("postgres://")
    ) {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection string");
    }
  }

  if (!process.env.JWT_SECRET) {
    errors.push("JWT_SECRET is not defined");
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long");
  }

  if (errors.length > 0) {
    const errorMessage = [
      "Environment variables missing or invalid:",
      ...errors.map((e) => `  - ${e}`),
      "",
      "Please check your .env file or Vercel Vars. See .env.example for reference.",
    ].join("\n");
    console.warn(errorMessage);
    return false;
  }
  return true;
}

// Validate environment on startup (warn only, don't crash)
const isEnvValid = validateEnvironment();

/**
 * Create Prisma client with optimized settings for serverless environments
 */
function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: fixedDatabaseUrl || process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Initialize database connection with proper error handling
 * This ensures connection issues are caught early rather than on first query
 * Note: This is called asynchronously and doesn't block module initialization
 */
async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    // Log the error but don't crash the app immediately
    // Let individual requests handle connection failures gracefully
    if (process.env.NODE_ENV === "production") {
      // In production, log additional context
      console.error("DATABASE_URL present:", !!process.env.DATABASE_URL);
      console.error(
        "Connection string format:",
        process.env.DATABASE_URL?.substring(0, 20) + "...",
      );
    }
  }
}

// Initialize connection on startup (fire-and-forget is intentional)
// The connection will be established asynchronously and Prisma will handle
// connection retries on individual queries if this fails
void initializeDatabase();

// Ensure graceful shutdown with proper async handling
if (typeof process !== "undefined") {
  // Use SIGTERM/SIGINT for proper async cleanup instead of beforeExit
  const cleanup = async () => {
    try {
      await prisma.$disconnect();
      console.log("✓ Database disconnected");
    } catch (error) {
      console.error("Error disconnecting database:", error);
    }
  };

  process.on("SIGTERM", () => {
    cleanup().finally(() => process.exit(0));
  });

  process.on("SIGINT", () => {
    cleanup().finally(() => process.exit(0));
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
