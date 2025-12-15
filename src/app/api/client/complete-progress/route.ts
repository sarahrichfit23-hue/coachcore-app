import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const phaseId = body?.phaseId as string | undefined;

    if (!phaseId) {
      return NextResponse.json(
        { success: false, error: "phaseId is required" },
        { status: 400 },
      );
    }

    const phase = await prisma.progress.findUnique({
      where: { id: phaseId },
      select: {
        id: true,
        clientProfile: { select: { userId: true } },
        photo1Url: true,
        photo2Url: true,
        photo3Url: true,
      },
    });

    if (!phase) {
      return NextResponse.json(
        { success: false, error: "Progress phase not found" },
        { status: 404 },
      );
    }

    if (phase.clientProfile.userId !== session.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (!phase.photo1Url || !phase.photo2Url || !phase.photo3Url) {
      return NextResponse.json(
        { success: false, error: "Upload all photos before saving" },
        { status: 400 },
      );
    }

    const updated = await prisma.progress.update({
      where: { id: phaseId },
      data: { isCompleted: true },
      select: {
        id: true,
        phaseNumber: true,
        photo1Url: true,
        photo2Url: true,
        photo3Url: true,
        isCompleted: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          phaseNumber: updated.phaseNumber,
          frontImage: updated.photo1Url,
          sideImage: updated.photo2Url,
          backImage: updated.photo3Url,
          isCompleted: updated.isCompleted,
          updatedAt: updated.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Complete progress error", error);
    return NextResponse.json(
      { success: false, error: "Unable to save progress" },
      { status: 500 },
    );
  }
}
