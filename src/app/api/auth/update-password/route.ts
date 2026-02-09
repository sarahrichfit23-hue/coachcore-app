import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

interface UpdatePasswordBody {
  newPassword?: string;
  confirmPassword?: string;
  accessToken?: string;
  refreshToken?: string;
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdatePasswordBody;
    const newPassword = body?.newPassword?.trim();
    const confirmPassword = body?.confirmPassword?.trim();
    const accessToken = body?.accessToken?.trim();
    const refreshToken = body?.refreshToken?.trim();

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

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { success: false, error: "Reset link is missing required tokens" },
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

    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError || !sessionData?.session) {
      console.error("Failed to establish session from reset tokens:", {
        message: sessionError?.message,
      });
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 401 },
      );
    }

    // Get user from the access token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      console.error("Failed to get user from token:", userError?.message);
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 401 },
      );
    }

    const email = userData.user.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 },
      );
    }

    // Update password in Supabase Auth
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

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true },
      });

      if (!existingUser) {
        console.warn("Password reset for missing app user:", normalizedEmail);
        return NextResponse.json(
          {
            success: false,
            error:
              "We couldn't find your account in our database. Please contact support.",
          },
          { status: 404 },
        );
      }

      const user = await updatePasswordWithRetry(existingUser.id, newPassword);

      return NextResponse.json(
        {
          success: true,
          message: "Password updated successfully",
          data: {
            email: user.email,
          },
        },
        { status: 200 },
      );
    } catch (dbError) {
      const prismaError =
        dbError instanceof Prisma.PrismaClientKnownRequestError
          ? { code: dbError.code, message: dbError.message }
          : undefined;
      console.error("Database update error:", { dbError, prismaError });
      return NextResponse.json(
        {
          success: false,
          error:
            "Password updated in auth system but failed to sync with database. Please contact support.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update password" },
      { status: 500 },
    );
  }
}

async function updatePasswordWithRetry(userId: string, newPassword: string) {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      return await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isPasswordChanged: true,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });
    } catch (error) {
      lastError = error;

      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P1001", "P1002", "P1003", "P1017"].includes(error.code);

      if (!retryable || attempt === maxAttempts) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 200));
    }
  }

  throw lastError;
}
