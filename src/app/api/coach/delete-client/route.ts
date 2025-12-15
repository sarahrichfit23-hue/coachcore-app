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

    if (session.role !== "COACH") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { clientId } = (await request.json()) as { clientId?: string };

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "clientId is required" },
        { status: 400 },
      );
    }

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { id: clientId, coach: { userId: session.userId } },
      select: { id: true, userId: true },
    });

    if (!clientProfile) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 },
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.message.deleteMany({
          where: {
            OR: [
              { senderId: clientProfile.userId },
              { receiverId: clientProfile.userId },
            ],
          },
        });

        await tx.progress.deleteMany({
          where: { clientProfileId: clientProfile.id },
        });

        await tx.clientProfile.delete({
          where: { id: clientProfile.id },
        });

        await tx.user.delete({
          where: { id: clientProfile.userId },
        });
      },
      {
        timeout: 15000, // 15 seconds
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coach delete client error", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete client" },
      { status: 500 },
    );
  }
}
