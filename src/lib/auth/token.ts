import { jwtVerify, SignJWT, JWTPayload } from "jose";
import { cookies } from "next/headers";

export type AppRole = "ADMIN" | "COACH" | "CLIENT";

export interface AuthTokenPayload extends JWTPayload {
  userId: string;
  role: AppRole;
  isPasswordChanged: boolean;
  email: string;
  name: string;
}

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const AUTH_COOKIE_NAME = "token";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(
  payload: AuthTokenPayload,
): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`)
    .sign(secret);
}

export async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify<AuthTokenPayload>(token, secret);
    if (
      !payload.userId ||
      (payload.role !== "ADMIN" &&
        payload.role !== "COACH" &&
        payload.role !== "CLIENT") ||
      typeof payload.isPasswordChanged !== "boolean"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
      isPasswordChanged: payload.isPasswordChanged,
      name: payload.name,
      email: payload.email,
    };
  } catch (error) {
    console.error("Invalid or expired token", error);
    return null;
  }
}

export function buildAuthCookie(token: string, options?: { domain?: string }) {
  const cookieOptions: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_EXPIRY_SECONDS,
  };

  // Add domain if provided (for cross-subdomain SSO)
  if (options?.domain) {
    cookieOptions.domain = options.domain;
  }

  return cookieOptions;
}

export function clearAuthCookie(options?: { domain?: string }) {
  const cookieOptions: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };

  // Add domain if provided (for cross-subdomain SSO)
  if (options?.domain) {
    cookieOptions.domain = options.domain;
  }

  return cookieOptions;
}

/**
 * Get the current user session from cookies
 * Server-side only - use in Server Components or Server Actions
 */
export async function getSession(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token ? await verifyAuthToken(token) : null;
}
