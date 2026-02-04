import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Validate critical environment variables
 */
function validateEnvironment() {
  const errors: string[] = [];

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not defined");
  } else {
    const dbUrl = process.env.DATABASE_URL;
    if (
      !dbUrl.startsWith("postgresql://") &&
      !dbUrl.startsWith("postgres://")
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
      "❌ Critical environment variables are missing or invalid:",
      ...errors.map((e) => `  - ${e}`),
      "",
      "Please check your .env file. See .env.example for reference.",
    ].join("\n");
    console.error(errorMessage);
    throw new Error("Environment validation failed");
  }
}

// Validate environment on startup
validateEnvironment();

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
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Initialize database connection with proper error handling
 * This ensures connection issues are caught early rather than on first query
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

// Initialize connection on startup
initializeDatabase();

// Ensure graceful shutdown
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
