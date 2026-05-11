import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Conversation and messaging management.
 */

export const conversationsRouter = router({
  /**
   * Get all conversations for a business.
   */
  getConversations: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verify business ownership
        const business = await db.getBusinessById(input.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this business",
          });
        }

        const conversations = await db.getConversationsByBusinessId(input.businessId);
        return conversations;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error fetching conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversations",
        });
      }
    }),

  /**
   * Get a specific conversation with full message history.
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify business ownership
        const business = await db.getBusinessById(conversation.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation",
          });
        }

        const messages = await db.getMessagesByConversationId(input.conversationId, 100);

        return {
          ...conversation,
          messages,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error fetching conversation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch conversation",
        });
      }
    }),

  /**
   * Toggle AI enabled/disabled for a conversation.
   */
  toggleAI: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        aiEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify business ownership
        const business = await db.getBusinessById(conversation.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation",
          });
        }

        await db.updateConversation(input.conversationId, {
          aiEnabled: input.aiEnabled,
          isWaitingForHuman: !input.aiEnabled,
        });

        return {
          success: true,
          message: `AI ${input.aiEnabled ? "enabled" : "disabled"} for this conversation`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error toggling AI:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle AI",
        });
      }
    }),

  /**
   * Send a message from the business (human reply).
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify business ownership
        const business = await db.getBusinessById(conversation.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation",
          });
        }

        // Create message
        const message = await db.createMessage({
          conversationId: input.conversationId,
          businessId: conversation.businessId,
          senderType: "business",
          content: input.content,
        });

        // Update conversation last message time
        await db.updateConversation(input.conversationId, {
          lastMessageAt: new Date(),
          isWaitingForHuman: false,
        });

        return {
          success: true,
          messageId: message.id,
          message: "Message sent successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error sending message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message",
        });
      }
    }),

  /**
   * Mark conversation as read.
   */
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Verify business ownership
        const business = await db.getBusinessById(conversation.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this conversation",
          });
        }

        await db.updateConversation(input.conversationId, {
          unreadCount: 0,
        });

        return {
          success: true,
          message: "Conversation marked as read",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error marking as read:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark as read",
        });
      }
    }),

  /**
   * Get escalated conversations waiting for human response.
   */
  getEscalatedConversations: protectedProcedure
    .input(z.object({ businessId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verify business ownership
        const business = await db.getBusinessById(input.businessId);
        if (!business || business.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this business",
          });
        }

        const conversations = await db.getConversationsByBusinessId(input.businessId);
        const escalated = conversations.filter((c) => c.isWaitingForHuman);

        return escalated;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Conversations] Error fetching escalated conversations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch escalated conversations",
        });
      }
    }),
});
