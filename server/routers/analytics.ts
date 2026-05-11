import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

/**
 * Analytics and reporting.
 */

export const analyticsRouter = router({
  /**
   * Get analytics summary for a business.
   */
  getSummary: protectedProcedure
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
        const messages = await Promise.all(
          conversations.map((c) => db.getMessagesByConversationId(c.id, 1000))
        ).then((msgs) => msgs.flat());

        const escalations = await db.getEscalationsByBusinessId(input.businessId);

        const totalMessages = messages.length;
        const aiMessages = messages.filter((m) => m.senderType === "ai").length;
        const humanMessages = messages.filter((m) => m.senderType === "business").length;
        const activeConversations = conversations.filter((c) => c.lastMessageAt).length;
        const escalationCount = escalations.length;
        const aiResponseRate = totalMessages > 0 ? Math.round((aiMessages / totalMessages) * 100) : 0;

        return {
          totalMessages,
          aiMessages,
          humanMessages,
          activeConversations,
          escalationCount,
          aiResponseRate,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Analytics] Error fetching summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics summary",
        });
      }
    }),
});
