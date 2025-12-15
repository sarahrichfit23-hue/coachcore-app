import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/token";
import { NextRequest, NextResponse } from "next/server";

const USER_CACHE_TTL_MS = 30_000;

const userCache = new Map<string, { user: UserResponse; expiresAt: number }>();

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  isPasswordChanged: true,
  isActive: true,
} as const;

type UserResponse = Prisma.UserGetPayload<{ select: typeof userSelect }>;

async function getUserWithCache(userId: string): Promise<UserResponse | null> {
  const cached = userCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (user) {
    userCache.set(userId, { user, expiresAt: now + USER_CACHE_TTL_MS });
  } else {
    userCache.delete(userId);
  }

  return user ?? null; // Ensure the function can return null
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await getUserWithCache(session.userId);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/user/me
 * Update authenticated user's profile information
 *
 * Body: { name?: string, avatarUrl?: string }
 * Response: { success: true, data: user }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get request body
    const body = await request.json();
    const { name, avatarUrl } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (name !== undefined && name !== null) {
      updateData.name = name.trim();
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      updateData.avatarUrl = avatarUrl;
    }

    // Don't allow empty updates
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: userSelect,
    });

    userCache.set(session.userId, {
      user,
      expiresAt: Date.now() + USER_CACHE_TTL_MS,
    });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 },
    );
  }
}
