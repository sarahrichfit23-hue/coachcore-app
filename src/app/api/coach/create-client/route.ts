import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { verifyAuthToken } from "@/lib/auth/token";
import { buildPasswordResetUrl } from "@/lib/auth/utils";
import {
  cloneTemplateWithNewPageIds,
  DEFAULT_DOCUMENT_TEMPLATE,
  isValidDocumentTemplate,
} from "@/lib/document-template";
import { Prisma } from "@prisma/client";
import { type DocumentTemplate } from "@/types";

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
    const templateId = (body?.templateId as string | undefined)?.trim();

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

    // Determine which template to use
    let templateToUse: DocumentTemplate;

    if (templateId) {
      // Use the selected portal template
      const portalTemplate = await prisma.portalTemplate.findFirst({
        where: {
          id: templateId,
          coachId: coachProfile.id,
        },
      });

      if (!portalTemplate) {
        return NextResponse.json(
          { success: false, error: "Selected template not found" },
          { status: 404 },
        );
      }

      // Validate the template document structure
      if (!isValidDocumentTemplate(portalTemplate.document)) {
        return NextResponse.json(
          {
            success: false,
            error: "Template document is corrupted or invalid",
          },
          { status: 500 },
        );
      }

      templateToUse = portalTemplate.document as DocumentTemplate;
    } else {
      // Use the default template
      templateToUse = DEFAULT_DOCUMENT_TEMPLATE;
    }

    const clientDocument = cloneTemplateWithNewPageIds(templateToUse);

    // Create user in Supabase Auth
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Auth provider not configured" },
        { status: 500 },
      );
    }

    // Create user in Supabase Auth and send email invite
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
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

    await prisma.$transaction(
      async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name,
            email,
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

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: buildPasswordResetUrl(request),
      },
    );

    if (resetError) {
      console.warn("Failed to send password reset email:", resetError);
      // Don't fail the request - user was created successfully
    }

    return NextResponse.json(
      { success: true, message: "Client created. Password reset email sent." },
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
