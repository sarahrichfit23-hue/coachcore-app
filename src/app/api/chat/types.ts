/**
 * Shared types for chat API endpoints
 */

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: UserSummary;
  receiver: UserSummary;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "COACH" | "CLIENT";
}

export interface Contact {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "COACH" | "CLIENT";
  lastMessage: {
    content: string;
    sentAt: string;
    isFromMe: boolean;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export interface UnreadMessagesSummary {
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  messageCount: number;
  lastMessageTime: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
