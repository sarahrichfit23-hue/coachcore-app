import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";

/**
 * POST /api/chat/send
 * Send a message between users (client->coach or coach->admin)
 *
 * Request body:
 * {
 *   receiverId: string,
 *   content: string
 * }
 *
 * Response: Created message object
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { receiverId, content } = body;

    // Validate input
    if (!receiverId || typeof receiverId !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid receiverId" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid content" },
        { status: 400 },
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty" },
        { status: 400 },
      );
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver || !receiver.isActive) {
      return NextResponse.json(
        { success: false, error: "Receiver not found or inactive" },
        { status: 404 },
      );
    }

    // Verify sender and receiver are different
    if (session.userId === receiverId) {
      return NextResponse.json(
        { success: false, error: "Cannot send message to yourself" },
        { status: 400 },
      );
    }

    // Validate messaging permissions based on roles
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

    // Check if sender and receiver can communicate
    // Client can only message their coach
    if (sender.role === "CLIENT") {
      if (receiver.role !== "COACH") {
        return NextResponse.json(
          {
            success: false,
            error: "Clients can only message their coach",
          },
          { status: 403 },
        );
      }
      // Verify the receiver is the client's coach (clientProfile.coachId points to CoachProfile)
      const coachUserId = sender.clientProfile?.coach?.userId;
      if (!coachUserId || coachUserId !== receiverId) {
        return NextResponse.json(
          {
            success: false,
            error: "This is not your coach",
          },
          { status: 403 },
        );
      }
    }
    // Coach can message their clients or admin
    else if (sender.role === "COACH") {
      if (receiver.role === "CLIENT") {
        // Verify the receiver is one of the coach's clients
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
            userId: receiverId,
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
      } else if (receiver.role !== "ADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: "Coaches can only message clients or admin",
          },
          { status: 403 },
        );
      }
    }
    // Admin can message anyone
    else if (sender.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Invalid sender role" },
        { status: 403 },
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.userId,
        receiverId,
        content: content.trim(),
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
    });

    return NextResponse.json(
      {
        success: true,
        data: message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
