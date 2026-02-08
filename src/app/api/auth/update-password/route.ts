import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

interface UpdatePasswordBody {
  newPassword?: string;
  confirmPassword?: string;
  accessToken?: string;
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

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access token is required" },
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

    // Update password hash in our database
    const hashedPassword = await hashPassword(newPassword);
    try {
      const user = await prisma.user.update({
        where: { email: email.toLowerCase().trim() },
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
      console.error("Database update error:", dbError);
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
