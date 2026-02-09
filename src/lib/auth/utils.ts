/**
 * Build a password reset redirect URL for use with Supabase Auth
 * @param request - Next.js request object to get the origin
 * @returns Full URL to the reset password page
 */
export function buildPasswordResetUrl(request: Request): string {
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  // Try to use configured app URL first
  if (envAppUrl) {
    try {
      const url = new URL(envAppUrl);
      return `${url.origin}/reset-password`;
    } catch (error) {
      console.warn(
        "Invalid NEXT_PUBLIC_APP_URL, falling back to request origin:",
        {
          envAppUrl,
          error,
        },
      );
    }
  }

  // Fallback to request origin
  try {
    const url = new URL(request.url);
    return `${url.origin}/reset-password`;
  } catch (error) {
    console.error("Failed to build password reset URL:", error);
    // Last resort fallback
    return "https://www.coachcoreportal.com/reset-password";
  }
}
