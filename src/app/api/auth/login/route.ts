import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
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
      console.warn("Login attempt with missing credentials");
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user by email
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("Database error during login:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Database connection error. Please try again.",
        },
        { status: 503 },
      );
    }

    if (!user || !user.isActive) {
      console.warn("Login attempt for invalid/inactive user:", email);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      console.warn("Login attempt with invalid password for user:", email);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 },
      );
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

    console.log("Successful login for user:", email, "role:", role);

    return response;
  } catch (error) {
    console.error("Login failed with unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to login" },
      { status: 500 },
    );
  }
}
