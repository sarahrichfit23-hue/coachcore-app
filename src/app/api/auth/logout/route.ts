import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/token";

export async function POST(request: NextRequest) {
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(clearAuthCookie());
  return response;
}
