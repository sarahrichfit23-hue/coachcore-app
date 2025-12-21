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
        { status: 404 },
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

    // Get last message info and unread counts for all contacts in one query
    const contactIds = contacts.map((c) => c.id);

    // Fetch all last messages for contacts in parallel
    const [lastMessages, unreadCounts] = await Promise.all([
      // Get last message for each contact
      prisma.$queryRaw<
        Array<{
          contact_id: string;
          id: string;
          content: string;
          sender_id: string;
          created_at: Date;
          is_read: boolean;
        }>
      >`
        SELECT DISTINCT ON (contact_id) 
          CASE 
            WHEN m.sender_id = ${session.userId} THEN m.receiver_id
            ELSE m.sender_id
          END as contact_id,
          m.id, m.content, m.sender_id, m.created_at, m.is_read
        FROM messages m
        WHERE (m.sender_id = ${session.userId} AND m.receiver_id = ANY(${contactIds}::text[]))
           OR (m.receiver_id = ${session.userId} AND m.sender_id = ANY(${contactIds}::text[]))
        ORDER BY contact_id, m.created_at DESC
      `,
      // Get unread counts for all contacts
      prisma.message.groupBy({
        by: ["senderId"],
        where: {
          senderId: { in: contactIds },
          receiverId: session.userId,
          isRead: false,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Create maps for quick lookup
    const lastMessageMap = new Map(
      lastMessages.map((msg) => [msg.contact_id, msg]),
    );
    const unreadCountMap = new Map(
      unreadCounts.map((uc) => [uc.senderId, uc._count.id]),
    );

    const contactsWithLastMessage = contacts.map((contact) => {
      const lastMessage = lastMessageMap.get(contact.id);
      const unreadCount = unreadCountMap.get(contact.id) || 0;

      return {
        id: contact.id,
        email: contact.email,
        name: contact.name,
        role: contact.role,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              sentAt: lastMessage.created_at.toISOString(),
              isFromMe: lastMessage.sender_id === session.userId,
              isRead: lastMessage.is_read,
            }
          : null,
        unreadCount,
      };
    });

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
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
