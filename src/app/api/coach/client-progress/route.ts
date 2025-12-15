import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
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

    if (session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 }
      );
    }

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { id: clientId, coach: { userId: session.userId } },
      select: {
        id: true,
        totalPhases: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    let progress = await prisma.progress.findMany({
      where: { clientProfileId: clientProfile.id },
      orderBy: { phaseNumber: "asc" },
    });

    if (progress.length < clientProfile.totalPhases) {
      const existing = new Set(progress.map((phase) => phase.phaseNumber));
      const toCreate: { clientProfileId: string; phaseNumber: number }[] = [];

      for (let phase = 1; phase <= clientProfile.totalPhases; phase++) {
        if (!existing.has(phase)) {
          toCreate.push({
            clientProfileId: clientProfile.id,
            phaseNumber: phase,
          });
        }
      }

      if (toCreate.length > 0) {
        await prisma.progress.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        progress = await prisma.progress.findMany({
          where: { clientProfileId: clientProfile.id },
          orderBy: { phaseNumber: "asc" },
        });
      }
    }

    const phases = progress.map((phase) => ({
      id: phase.id,
      phaseNumber: phase.phaseNumber,
      frontImage: phase.photo1Url,
      sideImage: phase.photo2Url,
      backImage: phase.photo3Url,
      isCompleted: phase.isCompleted,
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: clientProfile.id,
          userId: clientProfile.user.id,
          name: clientProfile.user.name,
          email: clientProfile.user.email,
        },
        totalPhases: clientProfile.totalPhases,
        phases,
      },
    });
  } catch (error) {
    console.error("Coach client progress error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch client progress" },
      { status: 500 }
    );
  }
}
