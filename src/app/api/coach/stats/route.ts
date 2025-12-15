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

    const [totalClients, activeClients, totalProgressEntries, unreadMessages] =
      await prisma.$transaction([
        prisma.clientProfile.count({ where: { coachId: coachProfile.id } }),
        prisma.clientProfile.count({
          where: { coachId: coachProfile.id, user: { isActive: true } },
        }),
        prisma.progress.count({
          where: { clientProfile: { coachId: coachProfile.id } },
        }),
        prisma.message.count({
          where: {
            receiverId: session.userId,
            isRead: false,
          },
        }),
      ]);

    const rawStats = [
      {
        key: "totalClients" as const,
        title: "Total Clients",
        value: totalClients,
        description: "Clients under your coaching",
      },
      {
        key: "activeClients" as const,
        title: "Active Clients",
        value: activeClients,
        description: "Currently active accounts",
      },
      {
        key: "totalProgressEntries" as const,
        title: "Progress Entries",
        value: totalProgressEntries,
        description: "Phases logged across clients",
      },
      {
        key: "unreadMessages" as const,
        title: "Unread Messages",
        value: unreadMessages,
        description: "Conversations awaiting replies",
      },
    ];

    const prioritized = rawStats
      .filter((stat) => stat.value > 0)
      .concat(rawStats.filter((stat) => stat.value === 0))
      .slice(0, 3);

    return NextResponse.json({ success: true, data: prioritized });
  } catch (error) {
    console.error("Coach stats error", error);
    return NextResponse.json(
      { success: false, error: "Unable to load stats" },
      { status: 500 },
    );
  }
}
