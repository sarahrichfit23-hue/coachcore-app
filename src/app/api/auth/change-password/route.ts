import { NextRequest } from "next/server";
import { handlePasswordChange } from "@/lib/auth/change-password";

export async function POST(request: NextRequest) {
  return handlePasswordChange(request);
}
