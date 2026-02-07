import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";
import { type AppRole, signAuthToken, buildAuthCookie } from "@/lib/auth/token";
import bcrypt from "bcrypt";

function toAppRole(role: string): AppRole | null {
  const normalized = role.toUpperCase();
  if (
    normalized === "ADMIN" ||
    normalized === "COACH" ||
    normalized === "CLIENT"
  ) {
    return normalized as AppRole;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email as string | undefined)?.toLowerCase().trim();
    const password = body?.password as string | undefined;

    if (!email || !password) {
      console.warn("Login attempt with missing credentials");
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Authenticate with Supabase Auth (handles password hashing)
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Auth provider not configured" },
        { status: 500 },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Optional dev-only fallback: allow local password check if Supabase auth fails
    if (error || !data?.user) {
      const allowLocal = process.env.ALLOW_LOCAL_PASSWORD_DEV === "true";
      if (!allowLocal) {
        console.warn("Supabase auth failed for:", email, error?.message);
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 },
        );
      }
    }

    // Look up app-specific user record for role and flags
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("Database error during app user lookup:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error. Please try again.",
        },
        { status: 503 },
      );
    }

    if (!user || !user.isActive) {
      console.warn("Login attempt for invalid/inactive app user:", email);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // If Supabase auth failed but dev fallback is enabled, verify password against local hash
    if ((error || !data?.user) && process.env.ALLOW_LOCAL_PASSWORD_DEV === "true") {
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 },
        );
      }
    }

    const role = toAppRole(user.role);

    if (!role) {
      console.error(
        "User has unsupported role:",
        user.role,
        "for user:",
        email,
      );
      return NextResponse.json(
        { success: false, error: "User role is not supported" },
        { status: 403 },
      );
    }

    // Sign JWT token
    let token;
    try {
      token = await signAuthToken({
        userId: user.id,
        role,
        isPasswordChanged: user.isPasswordChanged,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });
    } catch (tokenError) {
      console.error("Failed to sign auth token:", tokenError);
      return NextResponse.json(
        { success: false, error: "Authentication token generation failed" },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        role,
        isPasswordChanged: user.isPasswordChanged,
      },
    });

    response.cookies.set(buildAuthCookie(token));

    console.log("Successful Supabase login for user:", email, "role:", role);

    return response;
  } catch (error) {
    console.error("Login failed with unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to login" },
      { status: 500 },
    );
  }
}
