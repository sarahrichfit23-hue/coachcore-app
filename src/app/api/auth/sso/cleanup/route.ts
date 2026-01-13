import { NextResponse } from "next/server";
import { cleanupExpiredSsoTokens } from "@/lib/auth/sso-token";

export const runtime = "nodejs";

/**
 * POST /api/auth/sso/cleanup
 * Cleanup expired SSO tokens (internal/admin only)
 * Can be called periodically via cron or manually
 */
export async function POST() {
  try {
    const count = await cleanupExpiredSsoTokens();
    
    return NextResponse.json({
      success: true,
      data: {
        deletedCount: count,
      },
    });
  } catch (error) {
    console.error("SSO token cleanup failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to cleanup SSO tokens" },
      { status: 500 },
    );
  }
}
