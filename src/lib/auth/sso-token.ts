import { SignJWT, jwtVerify, JWTPayload } from "jose";
import crypto from "crypto";

// SSO tokens are short-lived tokens used for single sign-on between main app and portal
const SSO_TOKEN_EXPIRY_SECONDS = 60 * 5; // 5 minutes

export interface SsoTokenPayload extends JWTPayload {
  userId: string;
  tokenId: string; // Reference to in-memory store for one-time use validation
}

interface SsoTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  returnUrl: string | null;
  createdAt: Date;
}

// In-memory token store (for production, consider Redis or similar)
const tokenStore = new Map<string, SsoTokenRecord>();

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate a short-lived SSO token for portal access
 * @param userId - User ID to generate token for
 * @param returnUrl - Optional URL to return to after SSO login
 * @returns SSO token string and database record ID
 */
export async function generateSsoToken(
  userId: string,
  returnUrl?: string,
): Promise<{ token: string; tokenId: string }> {
  // Generate a unique token ID
  const tokenId = crypto.randomBytes(32).toString("hex");
  const recordId = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + SSO_TOKEN_EXPIRY_SECONDS * 1000);

  // Create in-memory record for tracking and one-time use
  const record: SsoTokenRecord = {
    id: recordId,
    token: tokenId,
    userId,
    expiresAt,
    returnUrl: returnUrl || null,
    used: false,
    createdAt: new Date(),
  };

  tokenStore.set(tokenId, record);

  // Create JWT with the token ID
  const secret = getSecretKey();
  const jwt = await new SignJWT({
    userId,
    tokenId,
  } as SsoTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SSO_TOKEN_EXPIRY_SECONDS}s`)
    .sign(secret);

  return { token: jwt, tokenId: recordId };
}

/**
 * Verify and consume an SSO token (one-time use)
 * @param token - SSO token to verify
 * @returns User ID and return URL if valid, null otherwise
 */
export async function verifySsoToken(
  token: string,
): Promise<{ userId: string; returnUrl: string | null } | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify<SsoTokenPayload>(token, secret);

    if (!payload.userId || !payload.tokenId) {
      return null;
    }

    // Check in-memory store
    const record = tokenStore.get(payload.tokenId);

    if (!record) {
      console.error("SSO token not found in store");
      return null;
    }

    // Validate token hasn't been used and hasn't expired
    if (record.used) {
      console.error("SSO token already used");
      return null;
    }

    if (record.expiresAt < new Date()) {
      console.error("SSO token expired");
      // Clean up expired token
      tokenStore.delete(payload.tokenId);
      return null;
    }

    // Mark token as used (one-time use)
    record.used = true;
    tokenStore.set(payload.tokenId, record);

    // Schedule cleanup after 1 hour
    setTimeout(() => {
      tokenStore.delete(payload.tokenId);
    }, 60 * 60 * 1000);

    return {
      userId: record.userId,
      returnUrl: record.returnUrl,
    };
  } catch (error) {
    console.error("Invalid or expired SSO token", error);
    return null;
  }
}

/**
 * Cleanup expired SSO tokens (can be run periodically)
 */
export async function cleanupExpiredSsoTokens(): Promise<number> {
  const now = new Date();
  let count = 0;

  for (const [tokenId, record] of tokenStore.entries()) {
    // Remove expired tokens or used tokens older than 24 hours
    if (
      record.expiresAt < now ||
      (record.used &&
        record.createdAt.getTime() < now.getTime() - 24 * 60 * 60 * 1000)
    ) {
      tokenStore.delete(tokenId);
      count++;
    }
  }

  return count;
}

/**
 * Get the cookie domain for SSO
 * Returns the configured domain or undefined for same-origin
 */
export function getSsoCookieDomain(): string | undefined {
  const domain = process.env.SSO_COOKIE_DOMAIN;
  // Only return domain if it's set and we're not in development without a domain
  if (domain && domain.trim() !== "") {
    return domain.trim();
  }
  return undefined;
}

/**
 * Get the portal URL from environment
 */
export function getPortalUrl(): string {
  return process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3001";
}

/**
 * Get the main app URL from environment
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

