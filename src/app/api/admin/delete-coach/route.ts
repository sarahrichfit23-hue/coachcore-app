import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token";

export async function DELETE(request: NextRequest) {
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

    const { coachId } = (await request.json()) as { coachId?: string };

    if (!coachId) {
      return NextResponse.json(
        { success: false, error: "coachId is required" },
        { status: 400 },
      );
    }

    const coach = await prisma.user.findFirst({
      where: { id: coachId, role: "COACH" },
      include: {
        coachProfile: {
          include: {
            clients: {
              include: {
                user: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!coach || !coach.coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 },
      );
    }

    const clientUserIds = coach.coachProfile.clients
      .map((client) => client.user?.id)
      .filter(Boolean) as string[];

    const messageUserIds = [coach.id, ...clientUserIds];

    await prisma.$transaction(
      async (tx) => {
        if (messageUserIds.length > 0) {
          await tx.message.deleteMany({
            where: {
              OR: [
                { senderId: { in: messageUserIds } },
                { receiverId: { in: messageUserIds } },
              ],
            },
          });
        }

        if (clientUserIds.length > 0) {
          await tx.user.deleteMany({ where: { id: { in: clientUserIds } } });
        }

        await tx.user.delete({ where: { id: coach.id } });
      },
      {
        timeout: 15000,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete coach error", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete coach" },
      { status: 500 },
    );
  }
}
