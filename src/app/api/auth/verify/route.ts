import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/token";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, data: payload });
}
