import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token";
import {
  findPageById,
  updatePageHidden,
  updatePageJson,
} from "@/lib/document-template";
import { type DocumentContent, type DocumentTemplate } from "@/types";

function parseDocumentTemplate(doc: unknown): DocumentTemplate | null {
  if (!doc || typeof doc !== "object") return null;
  const template = doc as DocumentTemplate;
  if (!Array.isArray(template.sections)) return null;
  return template;
}

function ensureDocumentContent(value: unknown): DocumentContent {
  return (value && typeof value === "object" ? value : {}) as DocumentContent;
}

async function getAuthorizedClientDocument(
  clientId: string,
  coachUserId: string,
) {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId: coachUserId },
    select: { id: true },
  });

  if (!coachProfile) return null;

  return prisma.clientProfile.findFirst({
    where: { id: clientId, coachId: coachProfile.id },
    select: {
      id: true,
      document: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId } = await params;
    const token = _request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAuthToken(token);
    if (!session || session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const client = await getAuthorizedClientDocument(clientId, session.userId);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    const document = parseDocumentTemplate(client.document);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        document,
        client: {
          id: client.id,
          name: client.user.name,
          email: client.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Coach get client document error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch document" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId } = await params;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAuthToken(token);
    if (!session || session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const pageId = (body?.pageId as string | undefined)?.trim();
    const hidden = body?.hidden as boolean | undefined;

    if (!pageId || typeof hidden !== "boolean") {
      return NextResponse.json(
        { success: false, error: "pageId and hidden are required" },
        { status: 400 },
      );
    }

    const client = await getAuthorizedClientDocument(clientId, session.userId);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    const document = parseDocumentTemplate(client.document);
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    const updated = updatePageHidden(document, pageId, hidden);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 },
      );
    }

    await prisma.clientProfile.update({
      where: { id: client.id },
      data: { document: updated as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      success: true,
      data: { document: updated },
    });
  } catch (error) {
    console.error("Coach update page hidden error", error);
    return NextResponse.json(
      { success: false, error: "Unable to update page" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    const { clientId } = await params;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAuthToken(token);
    if (!session || session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const pageId = (body?.pageId as string | undefined)?.trim();
    const json = ensureDocumentContent(body?.json);

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: "pageId is required" },
        { status: 400 },
      );
    }

    const client = await getAuthorizedClientDocument(clientId, session.userId);

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    const document = parseDocumentTemplate(client.document);
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    const updated = updatePageJson(document, pageId, json);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Page not found" },
        { status: 404 },
      );
    }

    await prisma.clientProfile.update({
      where: { id: client.id },
      data: { document: updated as unknown as Prisma.InputJsonValue },
    });

    const updatedPage = findPageById(updated, pageId);

    return NextResponse.json({
      success: true,
      data: {
        document: updated,
        page: updatedPage?.page,
      },
    });
  } catch (error) {
    console.error("Coach save page error", error);
    return NextResponse.json(
      { success: false, error: "Unable to save page" },
      { status: 500 },
    );
  }
}
