import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth/token";

/**
 * GET /api/chat/contacts
 * Get list of users the authenticated user can message
 * For clients: returns their coach
 * For coaches: returns their clients and all admins
 * For admins: returns all coaches
 *
 * Response: Array of contact users with last message info
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await verifyAuthToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        clientProfile: {
          select: {
            coachId: true,
          },
        },
        coachProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let contacts: (typeof user)[] = [];

    if (user.role === "CLIENT") {
      // Client can only message their coach
      if (user.clientProfile?.coachId) {
        const coachProfile = await prisma.coachProfile.findUnique({
          where: { id: user.clientProfile.coachId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
              },
            },
          },
        });

        const coachUser = coachProfile?.user;
        if (coachUser && coachUser.isActive) {
          contacts.push(coachUser as typeof user);
        }
      }
    } else if (user.role === "COACH") {
      // Coach can message their clients and admins
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });

      if (coachProfile) {
        const clients = await prisma.clientProfile.findMany({
          where: { coachId: coachProfile.id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
              },
            },
          },
        });

        contacts = clients
          .filter((c) => c.user.isActive)
          .map((c) => c.user as typeof user);
      }

      // Add all active admins
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      contacts = [...contacts, ...(admins as (typeof user)[])];
    } else if (user.role === "ADMIN") {
      // Admin can message all coaches
      const coaches = await prisma.user.findMany({
        where: {
          role: "COACH",
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      contacts = coaches as (typeof user)[];
    }

    // Get last message info for each contact
    const contactsWithLastMessage = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              {
                senderId: session.userId,
                receiverId: contact.id,
              },
              {
                senderId: contact.id,
                receiverId: session.userId,
              },
            ],
          },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        });

        // Get unread count from this contact
        const unreadCount = await prisma.message.count({
          where: {
            senderId: contact.id,
            receiverId: session.userId,
            isRead: false,
          },
        });

        return {
          id: contact.id,
          email: contact.email,
          name: contact.name,
          role: contact.role,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                sentAt: lastMessage.createdAt.toISOString(),
                isFromMe: lastMessage.senderId === session.userId,
                isRead: lastMessage.isRead,
              }
            : null,
          unreadCount,
        };
      })
    );

    // Sort by last message time (most recent first)
    const sortedContacts = contactsWithLastMessage.sort((a, b) => {
      const timeA = a.lastMessage?.sentAt
        ? new Date(a.lastMessage.sentAt).getTime()
        : 0;
      const timeB = b.lastMessage?.sentAt
        ? new Date(b.lastMessage.sentAt).getTime()
        : 0;
      return timeB - timeA;
    });

    return NextResponse.json(
      {
        success: true,
        data: sortedContacts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
