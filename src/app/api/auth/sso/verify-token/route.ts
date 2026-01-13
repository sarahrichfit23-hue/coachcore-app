import { NextRequest, NextResponse } from "next/server";
import { verifySsoToken, getSsoCookieDomain } from "@/lib/auth/sso-token";
import { signAuthToken, buildAuthCookie } from "@/lib/auth/token";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/auth/sso/verify-token
 * Verify SSO token and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ssoToken = body?.token as string | undefined;

    if (!ssoToken) {
      return NextResponse.json(
        { success: false, error: "SSO token is required" },
        { status: 400 },
      );
    }

    // Verify and consume SSO token
    const ssoResult = await verifySsoToken(ssoToken);
    if (!ssoResult) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired SSO token" },
        { status: 401 },
      );
    }

    // Get user details from database (still using existing Prisma setup for user data)
    const user = await prisma.user.findUnique({
      where: { id: ssoResult.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 },
      );
    }

    // Validate role
    const role = user.role;
    if (role !== "ADMIN" && role !== "COACH" && role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Invalid user role" },
        { status: 403 },
      );
    }

    // Generate new auth token
    const authToken = await signAuthToken({
      userId: user.id,
      role,
      isPasswordChanged: user.isPasswordChanged,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });

    // Get SSO cookie domain for cross-subdomain support
    const cookieDomain = getSsoCookieDomain();

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        role,
        isPasswordChanged: user.isPasswordChanged,
        returnUrl: ssoResult.returnUrl,
      },
    });

    // Set auth cookie with domain if configured
    response.cookies.set(buildAuthCookie(authToken, { domain: cookieDomain }));

    return response;
  } catch (error) {
    console.error("SSO token verification failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify SSO token" },
      { status: 500 },
    );
  }
}

