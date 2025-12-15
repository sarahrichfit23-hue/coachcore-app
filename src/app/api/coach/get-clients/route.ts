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

    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { success: false, error: "Coach profile not found" },
        { status: 404 }
      );
    }

    const clients = await prisma.clientProfile.findMany({
      where: { coachId: coachProfile.id },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = clients.map((client) => ({
      id: client.id,
      userId: client.user.id,
      name: client.user.name,
      email: client.user.email,
      createdAt: client.createdAt,
      status: client.user.isActive ? "Active" : "Inactive",
      hasPortal: false,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Coach get clients error", error);
    return NextResponse.json(
      { success: false, error: "Unable to fetch clients" },
      { status: 500 }
    );
  }
}
