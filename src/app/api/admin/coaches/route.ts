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

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const coaches = await prisma.user.findMany({
      where: {
        role: "COACH",
        isActive: true,
      },
      orderBy: { name: "asc" },
      include: {
        coachProfile: {
          include: {
            clients: {
              orderBy: { createdAt: "desc" },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const payload = coaches.map((coach) => {
      const activeClients = (coach.coachProfile?.clients ?? []).filter(
        (client) => client.user?.isActive
      );

      return {
        id: coach.id,
        name: coach.name,
        email: coach.email,
        totalClients: activeClients.length,
        clients: activeClients.map((client) => ({
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
      { status: 500 }
    );
  }
}
