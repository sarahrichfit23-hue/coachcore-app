import { NextResponse, type NextRequest } from "next/server";
import { verifyAuthToken, type AppRole } from "@/lib/auth/token";

const PROTECTED_PREFIXES = ["/admin", "/coach", "/client"] as const;
const LOGIN_PATH = "/login";
const PUBLIC_AUTH_PATHS = ["/reset-password", "/forgot-password"] as const;

// Timeout for token verification in middleware (milliseconds)
const TOKEN_VERIFICATION_TIMEOUT_MS = 5000;

function getDashboardPath(role: AppRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin/";
    case "COACH":
      return "/coach/";
    case "CLIENT":
      return "/client/";
    default:
      return LOGIN_PATH;
  }
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Allow public auth paths (like /reset-password) to bypass all auth checks
  if (isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  // Verify token with timeout protection
  let session = null;
  if (token) {
    try {
      // Add a timeout to prevent middleware from hanging
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(
            "Token verification timeout in middleware for:",
            pathname,
          );
          resolve(null);
        }, TOKEN_VERIFICATION_TIMEOUT_MS);
      });

      const verifyPromise = verifyAuthToken(token);
      session = await Promise.race([verifyPromise, timeoutPromise]);

      // Clean up timeout if verification completed first
      clearTimeout(timeoutId!);
    } catch (error) {
      console.error("Token verification error in middleware:", error);
      session = null;
    }
  }

  const protectedRoute = isProtectedPath(pathname);

  // If on login page
  if (pathname === LOGIN_PATH) {
    // If they have a valid session, redirect to dashboard
    if (session) {
      return NextResponse.redirect(
        new URL(getDashboardPath(session.role), request.url),
      );
    }
    // If they have an invalid token, clear it
    if (token && !session) {
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.next();
  }

  // Block unauthenticated access to protected routes
  if (!session && protectedRoute) {
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    // Clear invalid token when redirecting to login
    if (token) {
      response.cookies.delete("token");
    }
    return response;
  }

  const isClientOnboardPath = pathname.startsWith("/client/onboard");
  const isCoachOnboardPath = pathname.startsWith("/coach/onboard");

  if (session?.role === "CLIENT") {
    if (!session.isPasswordChanged && protectedRoute && !isClientOnboardPath) {
      return NextResponse.redirect(new URL("/client/onboard", request.url));
    }

    if (session.isPasswordChanged && isClientOnboardPath) {
      return NextResponse.redirect(new URL("/client", request.url));
    }
  }

  if (session?.role === "COACH") {
    if (!session.isPasswordChanged && protectedRoute && !isCoachOnboardPath) {
      return NextResponse.redirect(new URL("/coach/onboard", request.url));
    }

    if (session.isPasswordChanged && isCoachOnboardPath) {
      return NextResponse.redirect(new URL("/coach", request.url));
    }
  }

  // Block cross-role access with custom 404
  if (session && protectedRoute) {
    const rolePrefix = `/${session.role.toLowerCase()}`;

    if (!pathname.startsWith(rolePrefix)) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/coach",
    "/coach/:path*",
    "/client",
    "/client/:path*",
    "/login",
    "/reset-password",
    "/forgot-password",
  ],
};
