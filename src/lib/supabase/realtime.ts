/**
 * Supabase Realtime Integration for Portal UI
 * Provides real-time updates for messages, progress, and client changes
 */

import { supabase } from './client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type MessagePayload = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
};

export type ProgressPayload = {
  id: string;
  client_profile_id: string;
  phase_number: number;
  photo1_url: string | null;
  photo2_url: string | null;
  photo3_url: string | null;
  is_completed: boolean;
  updated_at: string;
};

export type ClientProfilePayload = {
  id: string;
  user_id: string;
  coach_id: string;
  document: any;
  total_phases: number;
  updated_at: string;
};

// =====================================================
// MESSAGES REALTIME SUBSCRIPTION
// =====================================================

/**
 * Subscribe to new messages for a specific user
 * Automatically receives new messages in real-time
 */
export function subscribeToMessages(
  userId: string,
  onNewMessage: (message: MessagePayload) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        if (payload.new) {
          onNewMessage(payload.new);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        if (payload.new) {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to messages');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Message subscription error:', err);
        onError?.(new Error('Failed to subscribe to messages'));
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Message subscription timed out');
        onError?.(new Error('Message subscription timed out'));
      }
    });

  return channel;
}

/**
 * Subscribe to conversation between two users
 * Useful for real-time chat interface
 */
export function subscribeToConversation(
  userId: string,
  otherUserId: string,
  onMessage: (message: MessagePayload, direction: 'sent' | 'received') => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversation:${userId}:${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId},receiver_id=eq.${otherUserId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        if (payload.new) {
          onMessage(payload.new, 'sent');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${otherUserId},receiver_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
        if (payload.new) {
          onMessage(payload.new, 'received');
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to conversation');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Conversation subscription error:', err);
        onError?.(new Error('Failed to subscribe to conversation'));
      }
    });

  return channel;
}

// =====================================================
// PROGRESS REALTIME SUBSCRIPTION
// =====================================================

/**
 * Subscribe to progress updates for a specific client
 * Coaches can monitor client progress in real-time
 */
export function subscribeToClientProgress(
  clientProfileId: string,
  onProgressUpdate: (progress: ProgressPayload, event: 'INSERT' | 'UPDATE') => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`progress:${clientProfileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'progress',
        filter: `client_profile_id=eq.${clientProfileId}`,
      },
      (payload: RealtimePostgresChangesPayload<ProgressPayload>) => {
        if (payload.new) {
          onProgressUpdate(payload.new, 'INSERT');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'progress',
        filter: `client_profile_id=eq.${clientProfileId}`,
      },
      (payload: RealtimePostgresChangesPayload<ProgressPayload>) => {
        if (payload.new) {
          onProgressUpdate(payload.new, 'UPDATE');
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to client progress');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Progress subscription error:', err);
        onError?.(new Error('Failed to subscribe to progress'));
      }
    });

  return channel;
}

/**
 * Subscribe to all progress updates for all clients of a coach
 * Useful for dashboard views showing multiple clients
 */
export function subscribeToCoachClientsProgress(
  coachId: string,
  onProgressUpdate: (progress: ProgressPayload, clientProfileId: string) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`coach-progress:${coachId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'progress',
      },
      async (payload: RealtimePostgresChangesPayload<ProgressPayload>) => {
        if (payload.new) {
          // Verify this progress belongs to one of coach's clients
          const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('id, coach_id')
            .eq('id', payload.new.client_profile_id)
            .eq('coach_id', coachId)
            .single();

          if (clientProfile) {
            onProgressUpdate(payload.new, payload.new.client_profile_id);
          }
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to coach clients progress');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Coach progress subscription error:', err);
        onError?.(new Error('Failed to subscribe to coach progress'));
      }
    });

  return channel;
}

// =====================================================
// CLIENT PROFILE REALTIME SUBSCRIPTION
// =====================================================

/**
 * Subscribe to client profile updates
 * Useful for coaches monitoring client document changes
 */
export function subscribeToClientProfile(
  clientProfileId: string,
  onUpdate: (profile: ClientProfilePayload) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`client-profile:${clientProfileId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'client_profiles',
        filter: `id=eq.${clientProfileId}`,
      },
      (payload: RealtimePostgresChangesPayload<ClientProfilePayload>) => {
        if (payload.new) {
          onUpdate(payload.new);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to client profile');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Client profile subscription error:', err);
        onError?.(new Error('Failed to subscribe to client profile'));
      }
    });

  return channel;
}

/**
 * Subscribe to new clients for a coach
 * Notifies when new clients are added
 */
export function subscribeToNewClients(
  coachId: string,
  onNewClient: (client: ClientProfilePayload) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`new-clients:${coachId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'client_profiles',
        filter: `coach_id=eq.${coachId}`,
      },
      (payload: RealtimePostgresChangesPayload<ClientProfilePayload>) => {
        if (payload.new) {
          onNewClient(payload.new);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to new clients');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ New clients subscription error:', err);
        onError?.(new Error('Failed to subscribe to new clients'));
      }
    });

  return channel;
}

// =====================================================
// PRESENCE (ONLINE STATUS)
// =====================================================

/**
 * Track user presence (online/offline status)
 * Useful for showing who's online in messaging
 */
export function trackPresence(
  userId: string,
  userName: string,
  onPresenceChange: (presences: Record<string, any>) => void
): RealtimeChannel {
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onPresenceChange(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 User joined:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 User left:', key, leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          online_at: new Date().toISOString(),
        });
      }
    });

  return channel;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await supabase.removeChannel(channel);
  console.log('🔌 Unsubscribed from channel');
}

/**
 * Unsubscribe from all channels
 */
export async function unsubscribeAll(): Promise<void> {
  await supabase.removeAllChannels();
  console.log('🔌 Unsubscribed from all channels');
}

/**
 * Get all active subscriptions
 */
export function getActiveChannels(): RealtimeChannel[] {
  return supabase.getChannels();
}

// =====================================================
// REACT HOOKS (USAGE EXAMPLES)
// =====================================================

/*
// Usage in React components:

import { useEffect, useState } from 'react';
import { subscribeToMessages, unsubscribe } from '@/lib/supabase/realtime';

export function useRealtimeMessages(userId: string) {
  const [messages, setMessages] = useState<MessagePayload[]>([]);

  useEffect(() => {
    const channel = subscribeToMessages(
      userId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        // Play notification sound
        new Audio('/notification.mp3').play();
      },
      (error) => {
        console.error('Message subscription error:', error);
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [userId]);

  return messages;
}

// Example: Real-time progress tracking
export function useRealtimeProgress(clientProfileId: string) {
  const [progress, setProgress] = useState<ProgressPayload[]>([]);

  useEffect(() => {
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
      }
    );

    return () => {
      unsubscribe(channel);
    };
  }, [clientProfileId]);

  return progress;
}

// Example: Online presence
export function usePresence(userId: string, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const channel = trackPresence(userId, userName, (presences) => {
      const userIds = Object.keys(presences);
      setOnlineUsers(userIds);
    });

    return () => {
      unsubscribe(channel);
    };
  }, [userId, userName]);

  return onlineUsers;
}
*/
