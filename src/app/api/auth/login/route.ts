import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";
import { type AppRole, signAuthToken, buildAuthCookie } from "@/lib/auth/token";

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
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

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

    // Debug: verify Supabase Auth result
    console.log("auth result", {
      ok: !error && !!data?.user,
      uid: data?.user?.id,
      email,
    });

    if (error || !data?.user) {
      // Single source of truth: Supabase Auth
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Ensure an app user record exists
    console.log("lookup app user", email);
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("creating app user", email);
      user = await prisma.user.create({
        data: {
          email,
          // Default to CLIENT role for auto-provisioned users
          // IMPORTANT: For ADMIN or COACH roles, users must be explicitly created via admin routes
          role: "CLIENT",
          isActive: true,
          isPasswordChanged: false, // Will be set to true after first password change
          name:
            data.user.user_metadata?.full_name ??
            data.user.email ??
            "Unnamed User",
          avatarUrl: data.user.user_metadata?.avatar_url ?? null,
          // IMPORTANT: do not set or require password here
        },
      });
    }

    // Debug: confirm user is ready
    console.log("app user ready", { id: user.id, role: user.role });

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Account is inactive" },
        { status: 403 },
      );
    }

    const role = toAppRole(user.role);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "User role is not supported" },
        { status: 403 },
      );
    }

    const token = await signAuthToken({
      userId: user.id,
      role,
      isPasswordChanged: user.isPasswordChanged,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, role, isPasswordChanged: user.isPasswordChanged },
    });

    response.cookies.set(buildAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Login failed with unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to login" },
      { status: 500 },
    );
  }
}
