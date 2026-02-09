import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";
import {
  buildAuthCookie,
  getSession,
  signAuthToken,
  type AppRole,
} from "@/lib/auth/token";

interface ResetPasswordBody {
  newPassword?: string;
  confirmPassword?: string;
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  return null;
}

export async function handlePasswordChange(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ResetPasswordBody;
    const newPassword = body?.newPassword?.trim();
    const confirmPassword = body?.confirmPassword?.trim();

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirmation are required" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: passwordError },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 },
      );
    }

    // Update password in Supabase Auth
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Auth provider not configured" },
        { status: 500 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Supabase password update error:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Failed to update password" },
        { status: 500 },
      );
    }

    // Update metadata in Prisma (do not update password field)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPasswordChanged: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isPasswordChanged: true,
      },
    });

    const role = updatedUser.role as AppRole;
    const token = await signAuthToken({
      userId: updatedUser.id,
      role,
      isPasswordChanged: updatedUser.isPasswordChanged,
      name: updatedUser.name,
      email: updatedUser.email,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          role,
          isPasswordChanged: updatedUser.isPasswordChanged,
        },
      },
      { status: 200 },
    );

    response.cookies.set(buildAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Password change error", error);
    return NextResponse.json(
      { success: false, error: "Unable to change password" },
      { status: 500 },
    );
  }
}
