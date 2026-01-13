import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/token";
import { generateSsoToken, getPortalUrl } from "@/lib/auth/sso-token";

export const runtime = "nodejs";

/**
 * POST /api/auth/sso/generate-token
 * Generate an SSO token for portal access
 * Requires active session cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAuthToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    // Only COACH role can access portal
    if (session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Portal access is only available for coaches" },
        { status: 403 },
      );
    }

    // Get return URL from request body (optional)
    const body = await request.json().catch(() => ({}));
    const returnUrl = body?.returnUrl as string | undefined;

    // Generate SSO token
    const { token: ssoToken } = await generateSsoToken(
      session.userId,
      returnUrl,
    );

    // Build portal redirect URL
    const portalUrl = getPortalUrl();
    const redirectUrl = new URL("/sso/login", portalUrl);
    redirectUrl.searchParams.set("token", ssoToken);
    if (returnUrl) {
      redirectUrl.searchParams.set("return", returnUrl);
    }

    return NextResponse.json({
      success: true,
      data: {
        redirectUrl: redirectUrl.toString(),
        token: ssoToken,
      },
    });
  } catch (error) {
    console.error("SSO token generation failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to generate SSO token" },
      { status: 500 },
    );
  }
}
