import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";

/**
 * GET /api/chat/messages?userId=<userId>&limit=50&offset=0
 * Fetch messages between the authenticated user and another user
 *
 * Query parameters:
 * - userId: string (required) - the other user to fetch messages with
 * - limit: number (optional, default 50) - number of messages to fetch
 * - offset: number (optional, default 0) - pagination offset
 *
 * Response: Array of messages (ordered by createdAt DESC)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAuthToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const otherUserId = searchParams.get("userId");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "15", 10),
      100,
    );
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    // Validate otherUserId
    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid userId parameter" },
        { status: 400 },
      );
    }

    // Verify other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    });

    if (!otherUser || !otherUser.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 404 },
      );
    }

    // Verify sender can communicate with this user
    // (same permission checks as in send endpoint)
    const sender = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        clientProfile: {
          select: {
            coachId: true,
            coach: {
              select: {
                userId: true,
              },
            },
          },
        },
        coachProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!sender) {
      return NextResponse.json(
        { success: false, error: "Sender not found" },
        { status: 404 },
      );
    }

    // Validate messaging permissions based on roles
    if (sender.role === "CLIENT") {
      if (otherUser.role !== "COACH") {
        return NextResponse.json(
          {
            success: false,
            error: "Clients can only fetch messages from their coach",
          },
          { status: 403 },
        );
      }
      const coachUserId = sender.clientProfile?.coach?.userId;
      if (!coachUserId || coachUserId !== otherUserId) {
        return NextResponse.json(
          {
            success: false,
            error: "This is not your coach",
          },
          { status: 403 },
        );
      }
    } else if (sender.role === "COACH") {
      if (otherUser.role === "CLIENT") {
        const coachId = sender.coachProfile?.id;
        if (!coachId) {
          return NextResponse.json(
            {
              success: false,
              error: "Coach profile not found",
            },
            { status: 403 },
          );
        }

        const isClientOfCoach = await prisma.clientProfile.findFirst({
          where: {
            coachId,
            userId: otherUserId,
          },
        });

        if (!isClientOfCoach) {
          return NextResponse.json(
            {
              success: false,
              error: "This client is not under your management",
            },
            { status: 403 },
          );
        }
      } else if (otherUser.role !== "ADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: "Coaches can only fetch messages from clients or admin",
          },
          { status: 403 },
        );
      }
    } else if (sender.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Invalid sender role" },
        { status: 403 },
      );
    }

    // Fetch messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: session.userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: session.userId,
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Mark messages as read if receiver is the authenticated user
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: messages,
        pagination: {
          limit,
          offset,
          total: messages.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
