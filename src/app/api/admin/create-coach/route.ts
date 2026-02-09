import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { verifyAuthToken } from "@/lib/auth/token";
import { createDocumentTemplateWithIds } from "@/lib/document-template";
import { Prisma } from "@prisma/client";

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

export async function POST(request: NextRequest) {
  try {
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
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const email = (body?.email as string | undefined)?.toLowerCase().trim();

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Name and valid email are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create user in Supabase Auth
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Auth provider not configured" },
        { status: 500 },
      );
    }

    // Create user in Supabase Auth and send email invite
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (authError || !authUser?.user) {
      console.error("Failed to create user in Supabase Auth:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create authentication account" },
        { status: 500 },
      );
    }

    const template = createDocumentTemplateWithIds();

    await prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
            role: "COACH",
            isPasswordChanged: false,
            isActive: true,
          },
        });
        await tx.coachProfile.create({
          data: {
            userId: createdUser.id,
            isProfileComplete: false,
            template: template as unknown as Prisma.InputJsonValue,
          },
        });
      },
      {
        timeout: 15000,
      },
    );

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/reset-password`,
    });

    if (resetError) {
      console.warn("Failed to send password reset email:", resetError);
      // Don't fail the request - user was created successfully
    }

    return NextResponse.json(
      { success: true, message: "Coach created. Password reset email sent." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin create coach error", error);
    return NextResponse.json(
      { success: false, error: "Unable to create coach" },
      { status: 500 },
    );
  }
}
