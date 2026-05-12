import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { businesses, conversations } from "../../drizzle/schema";

/**
 * Send escalation notification to business owner
 * Called when a conversation is escalated (customer needs human support)
 */

export async function notifyEscalation(
  conversationId: number,
  businessId: number,
  customerName: string,
  customerPhone: string,
  escalationReason: string
) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Escalation] Database not available for notification");
      return false;
    }

    // Get business details
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business || !business[0]) {
      console.warn("[Escalation] Business not found:", businessId);
      return false;
    }

    const businessName = business[0].businessName;

    // Get conversation details
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation || !conversation[0]) {
      console.warn("[Escalation] Conversation not found:", conversationId);
      return false;
    }

    // Prepare notification
    const title = `🚨 Escalation: ${customerName}`;
    const content = `Customer ${customerName} (${customerPhone}) from ${businessName} needs human support.\n\nReason: ${escalationReason}\n\nPlease respond to this conversation as soon as possible.`;

    // Send notification to owner
    const success = await notifyOwner({
      title,
      content,
    });

    if (success) {
      console.log(
        `[Escalation] Notification sent for conversation ${conversationId}`
      );
    } else {
      console.warn(
        `[Escalation] Failed to send notification for conversation ${conversationId}`
      );
    }

    return success;
  } catch (error) {
    console.error("[Escalation] Error sending notification:", error);
    return false;
  }
}

/**
 * Send batch escalation summary to owner
 * Called periodically to summarize all pending escalations
 */

export async function notifyEscalationSummary(businessId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Escalation] Database not available for summary");
      return false;
    }

    // Get pending escalations
    const escalations = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.businessId, businessId),
          eq(conversations.isWaitingForHuman, true)
        )
      )
      .orderBy(conversations.updatedAt);

    if (!escalations || escalations.length === 0) {
      return true; // No escalations to report
    }

    // Prepare summary
    const title = `📊 Escalation Summary: ${escalations.length} conversations waiting`;
    const customerList = escalations
      .slice(0, 5)
      .map(
        (c) =>
          `• ${c.customerName || c.customerPhoneNumber || "Unknown"}` 
      )
      .join("\n");
    const moreText =
      escalations.length > 5
        ? `\n... and ${escalations.length - 5} more`
        : "";

    const pluralS = escalations.length === 1 ? "" : "s";
    const content = `You have ${escalations.length} conversation${pluralS} waiting for human support:\n\n${customerList}${moreText}`;

    // Send summary notification
    const success = await notifyOwner({
      title,
      content,
    });

    if (success) {
      const pluralS = escalations.length === 1 ? "" : "s";
      console.log(
        `[Escalation] Summary sent for ${escalations.length} escalation${pluralS}`
      );
    }

    return success;
  } catch (error) {
    console.error("[Escalation] Error sending summary:", error);
    return false;
  }
}
