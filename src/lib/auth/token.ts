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
    
    // Validate required fields in payload
    if (
      !payload.userId ||
      (payload.role !== "ADMIN" &&
        payload.role !== "COACH" &&
        payload.role !== "CLIENT") ||
      typeof payload.isPasswordChanged !== "boolean"
    ) {
      console.warn("Invalid token payload structure:", {
        hasUserId: !!payload.userId,
        role: payload.role,
        hasIsPasswordChanged: typeof payload.isPasswordChanged === "boolean",
      });
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
    // Log detailed error information for debugging
    if (error instanceof Error) {
      // Don't log the full token for security reasons
      const tokenPreview = token.substring(0, 20) + "...";
      console.error("Token verification failed:", {
        message: error.message,
        tokenPreview,
        error: error.name,
      });
    } else {
      console.error("Token verification failed with unknown error:", error);
    }
    return null;
  }
}

export function buildAuthCookie(token: string) {
  // Determine if we should use secure cookies
  // In production, always use secure unless explicitly disabled
  // This handles both direct HTTPS and reverse proxy scenarios (like Vercel)
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const isHttps = appUrl.startsWith("https://");

  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    // Use secure cookies in production or when explicitly using HTTPS
    secure: isProduction || isHttps,
    // Use 'lax' for better compatibility while maintaining security
    // This allows cookies to be sent on same-site navigations and top-level GET requests
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_EXPIRY_SECONDS,
  };
}

export function clearAuthCookie() {
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const isHttps = appUrl.startsWith("https://");

  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction || isHttps,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
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
