import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateSystemPassword } from "@/lib/auth/password";
import { verifyAuthToken } from "@/lib/auth/token";
import { createDocumentTemplateWithIds } from "@/lib/document-template";
import { sendEmail, getEmailConfig } from "@/lib/email/sendEmail";
import { renderOnboardingTemplate } from "@/lib/email/templates";
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
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const email = (body?.email as string | undefined)?.toLowerCase().trim();

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Name and valid email are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const rawPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(rawPassword);

    const template = createDocumentTemplateWithIds();

    await prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
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
      }
    );

    const emailConfig = getEmailConfig();
    if (!emailConfig.success) {
      return NextResponse.json(
        { success: false, error: emailConfig.error },
        { status: 500 }
      );
    }

    const onboardingUrl = new URL("/login", request.url).toString();
    const compiledTemplate = await renderOnboardingTemplate({
      clientName: name,
      clientEmail: email,
      tempPassword: rawPassword,
      setPasswordUrl: onboardingUrl,
      platformName: emailConfig.data.platformName,
    });

    if (!compiledTemplate.success) {
      return NextResponse.json(
        { success: false, error: compiledTemplate.error },
        { status: 500 }
      );
    }

    const emailResult = await sendEmail({
      to: email,
      subject: `${emailConfig.data.platformName} | Complete your onboarding`,
      html: compiledTemplate.data,
      config: emailConfig.data,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Credentials sent to email" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin create coach error", error);
    return NextResponse.json(
      { success: false, error: "Unable to create coach" },
      { status: 500 }
    );
  }
}
