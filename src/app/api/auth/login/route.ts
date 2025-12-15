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
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.password);

    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const role = toAppRole(user.role);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "User role is not supported" },
        { status: 403 }
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
      data: {
        id: user.id,
        role,
        isPasswordChanged: user.isPasswordChanged,
      },
    });

    response.cookies.set(buildAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { success: false, error: "Unable to login" },
      { status: 500 }
    );
  }
}
