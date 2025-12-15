import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";

export async function GET() {
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

    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, totalPhases: true },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { success: false, error: "Client profile not found" },
        { status: 404 },
      );
    }

    let progress = await prisma.progress.findMany({
      where: { clientProfileId: clientProfile.id },
      orderBy: { phaseNumber: "asc" },
    });

    // Ensure placeholder rows exist for all phases
    if (progress.length < clientProfile.totalPhases) {
      const existing = new Set(progress.map((p) => p.phaseNumber));
      const toCreate = [] as { clientProfileId: string; phaseNumber: number }[];

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

    return NextResponse.json(
      {
        success: true,
        data: {
          totalPhases: clientProfile.totalPhases,
          phases,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Client get progress error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch progress" },
      { status: 500 },
    );
  }
}
