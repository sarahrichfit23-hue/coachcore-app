/**
 * Environment variable validation
 * Validates required environment variables on application startup
 * Prevents silent failures due to missing configuration
 */

const REQUIRED_ENV_VARS = ["JWT_SECRET", "DATABASE_URL"] as const;

const REQUIRED_PRODUCTION_ENV_VARS = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

// Constants for validation
const MIN_JWT_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRETS = ["your_hex_secret_here", "changeme"];
const VALID_DB_PROTOCOLS = ["postgresql://", "postgres://"];

interface ValidationResult {
  success: boolean;
  missing: string[];
  errors: string[];
}

/**
 * Validate that required environment variables are present and non-empty
 */
export function validateEnvVars(): ValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  // Check required vars for all environments
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === "") {
      missing.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Additional validation for JWT_SECRET
  if (process.env.JWT_SECRET) {
    const secret = process.env.JWT_SECRET;
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
      errors.push(
        `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long. Generate one with: openssl rand -hex 32`,
      );
    }
    if (PLACEHOLDER_SECRETS.includes(secret)) {
      errors.push(
        "JWT_SECRET appears to be a placeholder. Generate a secure secret with: openssl rand -hex 32",
      );
    }
  }

  // Additional validation for DATABASE_URL
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    const hasValidProtocol = VALID_DB_PROTOCOLS.some((protocol) =>
      dbUrl.startsWith(protocol),
    );
    if (!hasValidProtocol) {
      errors.push(
        `DATABASE_URL must be a valid PostgreSQL connection string starting with ${VALID_DB_PROTOCOLS.join(" or ")}`,
      );
    }
  }

  // Check production-specific vars in production environment
  if (process.env.NODE_ENV === "production") {
    for (const varName of REQUIRED_PRODUCTION_ENV_VARS) {
      const value = process.env[varName];
      if (!value || value.trim() === "") {
        missing.push(varName);
        errors.push(
          `Missing required production environment variable: ${varName}`,
        );
      }
    }
  }

  return {
    success: errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Validate environment variables and throw if any are missing or invalid
 * Should be called early in application startup
 */
export function requireValidEnv(): void {
  const result = validateEnvVars();

  if (!result.success) {
    const errorMessage = [
      "❌ Environment validation failed:",
      "",
      ...result.errors,
      "",
      "Please check your .env file and ensure all required variables are set.",
      "See .env.example for reference.",
    ].join("\n");

    console.error(errorMessage);
    throw new Error("Environment validation failed. Check logs for details.");
  }
}

/**
 * Log environment validation results (non-throwing)
 * Useful for startup checks without crashing the app
 */
export function logEnvValidation(): void {
  const result = validateEnvVars();

  if (!result.success) {
    console.warn("⚠️  Environment validation warnings:");
    result.errors.forEach((error) => console.warn(`  - ${error}`));
  } else {
    console.log("✓ Environment variables validated successfully");
  }
}
