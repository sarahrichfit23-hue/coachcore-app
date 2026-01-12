import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";
import { Prisma } from "@prisma/client";
import { createDocumentTemplateWithIds } from "@/lib/document-template";

// GET - List all portal templates for the coach
export async function GET(request: NextRequest) {
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

    const templates = await prisma.portalTemplate.findMany({
      where: { coachId: coachProfile.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("Get portal templates error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch templates" },
      { status: 500 },
    );
  }
}

// POST - Create a new portal template
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

    const body = await request.json();
    const name = (body?.name as string | undefined)?.trim();
    const description = (body?.description as string | undefined)?.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Template name is required" },
        { status: 400 },
      );
    }

    // Create a fresh document template with new IDs on the server side
    const document = createDocumentTemplateWithIds();

    const template = await prisma.portalTemplate.create({
      data: {
        coachId: coachProfile.id,
        name,
        description: description || null,
        document: document as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create portal template error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create template" },
      { status: 500 },
    );
  }
}
