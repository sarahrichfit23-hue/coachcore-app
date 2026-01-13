import { SignJWT, jwtVerify, JWTPayload } from "jose";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

// SSO tokens are short-lived tokens used for single sign-on between main app and portal
const SSO_TOKEN_EXPIRY_SECONDS = 60 * 5; // 5 minutes

export interface SsoTokenPayload extends JWTPayload {
  userId: string;
  tokenId: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate a short-lived SSO token for portal access
 * Stores token in Supabase database
 */
export async function generateSsoToken(
  userId: string,
  returnUrl?: string,
): Promise<{ token: string; tokenId: string }> {
  const tokenId = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SSO_TOKEN_EXPIRY_SECONDS * 1000);

  // Store token in Supabase
  const { data, error } = await supabaseAdmin
    .from("sso_tokens")
    .insert({
      token: tokenId,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
      return_url: returnUrl || null,
      used: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating SSO token:", error);
    throw new Error("Failed to create SSO token");
  }

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

  return { token: jwt, tokenId: data.id };
}

/**
 * Verify and consume an SSO token (one-time use)
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

    // Get token from Supabase
    const { data: ssoRecord, error } = await supabaseAdmin
      .from("sso_tokens")
      .select("*")
      .eq("token", payload.tokenId)
      .single();

    if (error || !ssoRecord) {
      console.error("SSO token not found in database");
      return null;
    }

    // Validate token hasn't been used and hasn't expired
    if (ssoRecord.used) {
      console.error("SSO token already used");
      return null;
    }

    if (new Date(ssoRecord.expires_at) < new Date()) {
      console.error("SSO token expired");
      return null;
    }

    // Mark token as used (one-time use)
    await supabaseAdmin
      .from("sso_tokens")
      .update({ used: true })
      .eq("id", ssoRecord.id);

    return {
      userId: ssoRecord.user_id,
      returnUrl: ssoRecord.return_url,
    };
  } catch (error) {
    console.error("Invalid or expired SSO token", error);
    return null;
  }
}

/**
 * Cleanup expired SSO tokens
 */
export async function cleanupExpiredSsoTokens(): Promise<number> {
  const now = new Date().toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Delete expired tokens or used tokens older than 24 hours
  const { data, error } = await supabaseAdmin
    .from("sso_tokens")
    .delete()
    .or(`expires_at.lt.${now},and(used.eq.true,created_at.lt.${oneDayAgo})`)
    .select();

  if (error) {
    console.error("Error cleaning up SSO tokens:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Get the cookie domain for SSO
 */
export function getSsoCookieDomain(): string | undefined {
  const domain = process.env.SSO_COOKIE_DOMAIN;
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


