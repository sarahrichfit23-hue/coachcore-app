/**
 * React hooks for Supabase Realtime integration
 * Easy-to-use hooks for real-time features in the portal
 */

import { useEffect, useState, useCallback } from 'react';
import {
  subscribeToMessages,
  subscribeToConversation,
  subscribeToClientProgress,
  subscribeToNewClients,
  trackPresence,
  unsubscribe,
  type MessagePayload,
  type ProgressPayload,
  type ClientProfilePayload,
} from '@/lib/supabase/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to receive real-time messages for current user
 */
export function useRealtimeMessages(userId: string | null) {
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = subscribeToMessages(
      userId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        if (!newMessage.is_read) {
          setUnreadCount((prev) => prev + 1);
        }
        // Optional: Play notification sound
        // new Audio('/notification.mp3').play();
      },
      (error) => {
        console.error('Message subscription error:', error);
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { messages, unreadCount, markAsRead };
}

/**
 * Hook for real-time conversation between two users
 */
export function useRealtimeConversation(
  userId: string | null,
  otherUserId: string | null
) {
  const [messages, setMessages] = useState<Array<MessagePayload & { direction: 'sent' | 'received' }>>([]);

  useEffect(() => {
    if (!userId || !otherUserId) return;

    const channel = subscribeToConversation(
      userId,
      otherUserId,
      (message, direction) => {
        setMessages((prev) => [...prev, { ...message, direction }]);
      },
      (error) => {
        console.error('Conversation subscription error:', error);
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [userId, otherUserId]);

  return messages;
}

/**
 * Hook to track client progress updates in real-time
 */
export function useRealtimeProgress(clientProfileId: string | null) {
  const [progress, setProgress] = useState<ProgressPayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clientProfileId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    const channel = subscribeToClientProgress(
      clientProfileId,
      (newProgress, event) => {
        if (event === 'INSERT') {
          setProgress((prev) => [...prev, newProgress]);
        } else if (event === 'UPDATE') {
          setProgress((prev) =>
            prev.map((p) => (p.id === newProgress.id ? newProgress : p))
          );
        }
      },
      (error) => {
        console.error('Progress subscription error:', error);
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [clientProfileId]);

  return { progress, isLoading };
}

/**
 * Hook to track new clients being added (for coaches)
 */
export function useRealtimeNewClients(coachId: string | null) {
  const [newClients, setNewClients] = useState<ClientProfilePayload[]>([]);

  useEffect(() => {
    if (!coachId) return;

    const channel = subscribeToNewClients(
      coachId,
      (client) => {
        setNewClients((prev) => [client, ...prev]);
        // Optional: Show toast notification
        // toast.success(`New client added: ${client.name}`);
      },
      (error) => {
        console.error('New clients subscription error:', error);
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [coachId]);

  return newClients;
}

/**
 * Hook to track online users (presence)
 */
export function usePresence(userId: string | null, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const presenceChannel = trackPresence(userId, userName, (presences) => {
      const userIds = Object.keys(presences);
      setOnlineUsers(userIds);
    });

    setChannel(presenceChannel);

    return () => {
      if (presenceChannel) {
        unsubscribe(presenceChannel);
      }
    };
  }, [userId, userName]);

  return { onlineUsers, channel };
}

/**
 * Hook to check if a specific user is online
 */
export function useUserOnlineStatus(targetUserId: string, currentUserId: string, currentUserName: string) {
  const { onlineUsers } = usePresence(currentUserId, currentUserName);
  const isOnline = onlineUsers.includes(targetUserId);
  
  return isOnline;
}
