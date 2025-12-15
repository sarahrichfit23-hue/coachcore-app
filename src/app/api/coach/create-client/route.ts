import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateSystemPassword } from "@/lib/auth/password";
import { verifyAuthToken } from "@/lib/auth/token";
import {
  cloneTemplateWithNewPageIds,
  DEFAULT_DOCUMENT_TEMPLATE,
} from "@/lib/document-template";
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

    if (session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const email = (body?.email as string | undefined)?.toLowerCase().trim();
    const rawPhases = body?.progressPhases ?? body?.progressTrackCount ?? 0;
    const progressPhases = Number(rawPhases);

    if (!name || !email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Name and valid email are required" },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(progressPhases) ||
      progressPhases < 1 ||
      progressPhases > 20
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Progress phases must be an integer between 1 and 20",
        },
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

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.userId },
      select: {
        id: true,
        template: true,
      },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach profile not found" },
        { status: 400 },
      );
    }

    // const coachTemplate = coachProfile.template as DocumentTemplate | null;
    // if (!coachTemplate) {
    //   return NextResponse.json(
    //     { success: false, error: "Coach template not configured" },
    //     { status: 400 }
    //   );
    // }

    const clientDocument = cloneTemplateWithNewPageIds(
      DEFAULT_DOCUMENT_TEMPLATE,
    );

    const rawPassword = generateSystemPassword();
    const hashedPassword = await hashPassword(rawPassword);

    await prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "CLIENT",
            isPasswordChanged: false,
            isActive: true,
          },
        });

        const createdClientProfile = await tx.clientProfile.create({
          data: {
            userId: createdUser.id,
            coachId: coachProfile.id,
            document: clientDocument as unknown as Prisma.InputJsonValue,
            totalPhases: progressPhases,
          },
        });

        const progressRows = Array.from(
          { length: progressPhases },
          (_, index) => ({
            clientProfileId: createdClientProfile.id,
            phaseNumber: index + 1,
          }),
        );

        await tx.progress.createMany({ data: progressRows });
      },
      {
        timeout: 15000,
      },
    );

    const emailConfig = getEmailConfig();
    if (!emailConfig.success) {
      return NextResponse.json(
        { success: false, error: emailConfig.error },
        { status: 500 },
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
        { status: 500 },
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
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Credentials sent to email" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Coach create client error", error);
    return NextResponse.json(
      { success: false, error: "Unable to create client" },
      { status: 500 },
    );
  }
}
