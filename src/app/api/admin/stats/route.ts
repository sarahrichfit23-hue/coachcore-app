import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token";

type AdminStatKey = "totalCoaches" | "totalClients" | "totalAdmins";

type AdminStat = {
  key: AdminStatKey;
  title: string;
  value: number;
  description: string;
};

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

    const [coaches, clients, admins] = await Promise.all([
      prisma.user.count({ where: { role: "COACH", isActive: true } }),
      prisma.user.count({ where: { role: "CLIENT", isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN", isActive: true } }),
    ]);

    const data: AdminStat[] = [
      {
        key: "totalCoaches",
        title: "Total Coaches",
        value: coaches,
        description: "Active coaches in the system",
      },
      {
        key: "totalClients",
        title: "Total Clients",
        value: clients,
        description: "Clients across all coaches",
      },
      {
        key: "totalAdmins",
        title: "Admins",
        value: admins,
        description: "Active admin users",
      },
    ];

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Admin stats error", error);
    return NextResponse.json(
      { success: false, error: "Unable to load stats" },
      { status: 500 }
    );
  }
}
