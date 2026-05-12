import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { conversations, messages } from "../../drizzle/schema";

/**
 * Real-time updates router for polling-based conversation and message updates
 * Clients poll these endpoints to get latest conversation/message data
 */

export const realtimeRouter = router({
  /**
   * Get conversations updated since a given timestamp
   * Used for polling to detect new/updated conversations
   */
  getConversationUpdates: protectedProcedure
    .input(
      z.object({
        businessId: z.number(),
        sinceTimestamp: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user owns this business
      const business = await db
        .select()
        .from(conversations)
        .where(and(eq(conversations.businessId, input.businessId)))
        .limit(1);

      if (!business) {
        throw new Error("Business not found or unauthorized");
      }

      const since = input.sinceTimestamp || Date.now() - 60000; // Default: last 1 minute

      // Get updated conversations
      const updates = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.businessId, input.businessId),
            gt(conversations.updatedAt, new Date(since))
          )
        )
        .orderBy(conversations.updatedAt);

      return {
        conversations: updates,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get new messages for a conversation since a given timestamp
   * Used for polling to detect new messages in active thread
   */
  getMessageUpdates: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        sinceTimestamp: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const since = input.sinceTimestamp || Date.now() - 30000; // Default: last 30 seconds

      // Get new messages
      const updates = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            gt(messages.createdAt, new Date(since))
          )
        )
        .orderBy(messages.createdAt);

      return {
        messages: updates,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get escalated conversations for a business
   * Used for polling to detect new escalations
   */
  getEscalations: protectedProcedure
    .input(
      z.object({
        businessId: z.number(),
        sinceTimestamp: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const since = input.sinceTimestamp || Date.now() - 60000;

      // Get escalated conversations
      const escalations = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.businessId, input.businessId),
            eq(conversations.isWaitingForHuman, true),
            gt(conversations.updatedAt, new Date(since))
          )
        )
        .orderBy(conversations.updatedAt);

      return {
        escalations,
        count: escalations.length,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get analytics updates for a business
   * Used for polling to update dashboard metrics
   */
  getAnalyticsUpdates: protectedProcedure
    .input(
      z.object({
        businessId: z.number(),
        sinceTimestamp: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const since = input.sinceTimestamp || Date.now() - 300000; // Default: last 5 minutes

      // Get message count since timestamp
      const messageCount = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.businessId, input.businessId),
            gt(messages.createdAt, new Date(since))
          )
        );

      // Get active conversations (where AI is enabled)
      const activeConversations = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.businessId, input.businessId),
            eq(conversations.aiEnabled, true)
          )
        );

      // Get escalations
      const escalations = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.businessId, input.businessId),
            eq(conversations.isWaitingForHuman, true)
          )
        );

      // Calculate AI response rate
      const aiMessages = messageCount.filter((m) => m.senderType === "ai");
      const aiResponseRate =
        messageCount.length > 0
          ? Math.round((aiMessages.length / messageCount.length) * 100)
          : 0;

      return {
        totalMessages: messageCount.length,
        activeConversations: activeConversations.length,
        aiResponseRate,
        escalationCount: escalations.length,
        timestamp: Date.now(),
      };
    }),
});
