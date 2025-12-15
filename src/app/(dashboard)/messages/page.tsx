"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, MoreVertical, Loader } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Contact, ChatMessage } from "@/app/api/chat/types";
import { useSession } from "@/providers";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CoachCoreLoader } from "@/components/ui/loader";

// Fetch contacts
const fetchContacts = async (): Promise<Contact[]> => {
  const response = await fetch("/api/chat/contacts", {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch contacts");
  const data = await response.json();
  return data.data || [];
};

// Fetch messages with pagination
const fetchMessages = async ({
  userId,
  pageParam = 0,
}: {
  userId: string;
  pageParam?: number;
}): Promise<{ messages: ChatMessage[]; nextOffset: number | undefined }> => {
  const limit = 7;
  const response = await fetch(
    `/api/chat/messages?userId=${userId}&limit=${limit}&offset=${pageParam}`,
    {
      credentials: "include",
    },
  );
  if (!response.ok) throw new Error("Failed to fetch messages");
  const data = await response.json();
  const messages = data.data || [];
  return {
    messages,
    nextOffset: messages.length === limit ? pageParam + limit : undefined,
  };
};

// Send message
const sendMessage = async ({
  receiverId,
  content,
}: {
  receiverId: string;
  content: string;
}): Promise<ChatMessage> => {
  const response = await fetch("/api/chat/send", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ receiverId, content }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  const data = await response.json();
  return data.data;
};

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
    enabled: !!user,
  });

  // Fetch messages with infinite scroll
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingMessages,
  } = useInfiniteQuery({
    queryKey: ["messages", selectedContact?.id],
    queryFn: ({ pageParam = 0 }) =>
      fetchMessages({ userId: selectedContact!.id, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!selectedContact,
    initialPageParam: 0,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Optimistically update messages
      queryClient.setQueryData(
        ["messages", selectedContact?.id],
        (old: any) => {
          if (!old)
            return {
              pages: [{ messages: [newMessage], nextOffset: undefined }],
              pageParams: [0],
            };
          return {
            ...old,
            pages: old.pages.map((page: any, index: number) =>
              index === 0
                ? { ...page, messages: [newMessage, ...page.messages] }
                : page,
            ),
          };
        },
      );
      setMessageText("");
    },
  });

  // Flatten messages from all pages
  const allMessages = useMemo(() => {
    return messagesData?.pages.flatMap((page) => page.messages) || [];
  }, [messagesData]);

  const preferredContactId = searchParams.get("contactId");

  // Prefer contactId from URL, otherwise fall back to the first contact
  useEffect(() => {
    if (!contacts.length) return;

    const preferredContact = preferredContactId
      ? contacts.find((contact) => contact.id === preferredContactId)
      : null;

    if (preferredContact && preferredContact.id !== selectedContact?.id) {
      setSelectedContact(preferredContact);
      return;
    }

    if (!selectedContact) {
      setSelectedContact(contacts[0]);
      return;
    }

    const stillExists = contacts.some(
      (contact) => contact.id === selectedContact.id,
    );

    if (!stillExists) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, preferredContactId, selectedContact]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messagesContainerRef.current && allMessages.length > 0) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [allMessages]);

  // Handle scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const scrollHeight = element.scrollHeight;
      fetchNextPage().then(() => {
        // Maintain scroll position
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop =
              newScrollHeight - scrollHeight;
          }
        });
      });
    }
  };

  // Send message handler
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedContact) return;
    sendMessageMutation.mutate({
      receiverId: selectedContact.id,
      content: messageText,
    });
  };

  if (loadingContacts) {
    return <CoachCoreLoader loadingText="Loading your messages..." />;
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Not Authenticated
          </h1>
          <p className="text-gray-600">Please log in to access messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">
          {"Communicate with your "}
          {user?.role === "CLIENT"
            ? "coach"
            : user?.role === "COACH"
              ? "clients and admin"
              : "coaches"}
        </p>
      </div>

      {/* Messages Layout */}
      <div className="flex h-[calc(100vh-13rem)] gap-6 overflow-hidden">
        {/* Contacts Sidebar */}
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white lg:w-96">
          <div className="flex h-full flex-col">
            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No contacts available
                </div>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`flex w-full items-center gap-3 rounded-2xl border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 ${
                      selectedContact?.id === contact.id ? "bg-gray-50" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden text-left">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {contact.name}
                        </h3>
                        {contact.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(
                              contact.lastMessage.sentAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm text-gray-600">
                          {contact.lastMessage
                            ? (contact.lastMessage.isFromMe ? "You: " : "") +
                              contact.lastMessage.content
                            : "No messages yet"}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fcca56] text-xs font-medium text-gray-900">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedContact.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedContact.role}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </Button>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto bg-gray-50 p-6"
                onScroll={handleScroll}
              >
                <div className="flex min-h-full flex-col justify-end gap-4">
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="h-6 w-6 animate-spin text-[#fcca56]" />
                    </div>
                  )}
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="h-8 w-8 animate-spin text-[#fcca56]" />
                    </div>
                  ) : allMessages.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    allMessages
                      .slice()
                      .reverse()
                      .map((message, index) => {
                        const isMe = message.senderId === user?.id;
                        return (
                          <div
                            key={`${message.id}-${index}`}
                            className={`flex gap-3 ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {!isMe && (
                              <Avatar className="h-8 w-8 shrink-0 bg-[#fcca56]">
                                <AvatarFallback>
                                  {message.sender.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`flex flex-col ${
                                isMe ? "items-end" : "items-start"
                              }`}
                            >
                              <div
                                className={`rounded-3xl px-4 py-2 ${
                                  isMe
                                    ? "bg-[#fcca56] text-gray-900"
                                    : "bg-gray-200 text-gray-900"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                              <span className="mt-1 text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type something to send..."
                    className="h-12 flex-1 rounded-full border-gray-300 bg-white px-6"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="h-12 w-12 rounded-full bg-[#fcca56] text-gray-900 hover:bg-[#fbc041]"
                    size="icon"
                    disabled={
                      sendMessageMutation.isPending || !messageText.trim()
                    }
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Select a contact to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          Loading messages...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
