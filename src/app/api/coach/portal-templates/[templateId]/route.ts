import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";
import { Prisma } from "@prisma/client";
import { type DocumentTemplate } from "@/types";

// GET - Get a specific portal template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const { templateId } = await params;
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

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach profile not found" },
        { status: 404 },
      );
    }

    const template = await prisma.portalTemplate.findFirst({
      where: {
        id: templateId,
        coachId: coachProfile.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Get portal template error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch template" },
      { status: 500 },
    );
  }
}

// PUT - Update a portal template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const { templateId } = await params;
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

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach profile not found" },
        { status: 404 },
      );
    }

    const existingTemplate = await prisma.portalTemplate.findFirst({
      where: {
        id: templateId,
        coachId: coachProfile.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const description = (body?.description as string | undefined)?.trim();
    const document = body?.document as DocumentTemplate | undefined;

    const updateData: {
      name?: string;
      description?: string | null;
      document?: Prisma.InputJsonValue;
    } = {};

    if (name !== undefined) {
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Template name cannot be empty" },
          { status: 400 },
        );
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (document !== undefined) {
      if (!Array.isArray(document.sections)) {
        return NextResponse.json(
          { success: false, error: "Invalid document template" },
          { status: 400 },
        );
      }
      updateData.document = document as unknown as Prisma.InputJsonValue;
    }

    const updatedTemplate = await prisma.portalTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedTemplate });
  } catch (error) {
    console.error("Update portal template error", error);
    return NextResponse.json(
      { success: false, error: "Unable to update template" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a portal template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const { templateId } = await params;
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

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach profile not found" },
        { status: 404 },
      );
    }

    const existingTemplate = await prisma.portalTemplate.findFirst({
      where: {
        id: templateId,
        coachId: coachProfile.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 },
      );
    }

    await prisma.portalTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete portal template error", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete template" },
      { status: 500 },
    );
  }
}
