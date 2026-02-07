import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/token";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearAuthCookie());
  return response;
}
