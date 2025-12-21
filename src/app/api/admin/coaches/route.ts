import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
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

    // Optimized: fetch coaches and their client counts in parallel
    const [coaches, clientCounts] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "COACH",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          coachProfile: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      // Get all active clients grouped by coach in one query
      prisma.clientProfile.findMany({
        where: {
          user: {
            isActive: true,
          },
          coach: {
            user: {
              role: "COACH",
              isActive: true,
            },
          },
        },
        select: {
          id: true,
          coachId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Group clients by coach ID
    const clientsByCoach = new Map<string, typeof clientCounts>();
    for (const client of clientCounts) {
      const existing = clientsByCoach.get(client.coachId) || [];
      existing.push(client);
      clientsByCoach.set(client.coachId, existing);
    }

    const payload = coaches.map((coach) => {
      const coachProfileId = coach.coachProfile?.id;
      const coachClients = coachProfileId
        ? clientsByCoach.get(coachProfileId) || []
        : [];

      return {
        id: coach.id,
        name: coach.name,
        email: coach.email,
        totalClients: coachClients.length,
        clients: coachClients.map((client) => ({
          id: client.id,
          userId: client.user.id,
          name: client.user.name,
          email: client.user.email,
        })),
      };
    });

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error("Admin fetch coaches error", error);
    return NextResponse.json(
      { success: false, error: "Unable to load coaches" },
      { status: 500 },
    );
  }
}
