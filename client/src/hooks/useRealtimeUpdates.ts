import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Hook for polling real-time updates
 * Automatically fetches new conversations, messages, and escalations at intervals
 */

interface UseRealtimeUpdatesOptions {
  businessId: number;
  conversationId?: number;
  enabled?: boolean;
  pollInterval?: number; // milliseconds
}

export function useRealtimeUpdates({
  businessId,
  conversationId,
  enabled = true,
  pollInterval = 5000, // Default: 5 seconds
}: UseRealtimeUpdatesOptions) {
  const lastUpdateRef = useRef<number>(Date.now());

  // Polling queries
  const conversationUpdates = trpc.realtime.getConversationUpdates.useQuery(
    {
      businessId,
      sinceTimestamp: lastUpdateRef.current,
    },
    {
      enabled: enabled && !conversationId,
      refetchInterval: pollInterval,
    }
  );

  const messageUpdates = trpc.realtime.getMessageUpdates.useQuery(
    {
      conversationId: conversationId || 0,
      sinceTimestamp: lastUpdateRef.current,
    },
    {
      enabled: enabled && !!conversationId,
      refetchInterval: pollInterval,
    }
  );

  const escalationUpdates = trpc.realtime.getEscalations.useQuery(
    {
      businessId,
      sinceTimestamp: lastUpdateRef.current,
    },
    {
      enabled: enabled,
      refetchInterval: pollInterval * 2, // Check escalations less frequently
    }
  );

  const analyticsUpdates = trpc.realtime.getAnalyticsUpdates.useQuery(
    {
      businessId,
      sinceTimestamp: lastUpdateRef.current,
    },
    {
      enabled: enabled,
      refetchInterval: pollInterval * 3, // Check analytics less frequently
    }
  );

  // Update last poll timestamp on successful queries
  useEffect(() => {
    if (conversationUpdates.data?.timestamp) {
      lastUpdateRef.current = conversationUpdates.data.timestamp;
    }
  }, [conversationUpdates.data?.timestamp]);

  useEffect(() => {
    if (messageUpdates.data?.timestamp) {
      lastUpdateRef.current = messageUpdates.data.timestamp;
    }
  }, [messageUpdates.data?.timestamp]);

  return {
    conversationUpdates: conversationUpdates.data?.conversations || [],
    messageUpdates: messageUpdates.data?.messages || [],
    escalations: escalationUpdates.data?.escalations || [],
    analytics: analyticsUpdates.data,
    isLoading:
      conversationUpdates.isLoading ||
      messageUpdates.isLoading ||
      escalationUpdates.isLoading,
    isError:
      conversationUpdates.isError ||
      messageUpdates.isError ||
      escalationUpdates.isError,
  };
}
