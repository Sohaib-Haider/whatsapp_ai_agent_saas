import { getDb } from "../db";
import { messages } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * WhatsApp 24-hour messaging window enforcement
 * Businesses can only send messages within 24 hours of receiving a customer message
 * After 24 hours, they must use message templates
 */

export async function isWithin24HourWindow(
  conversationId: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Messaging Window] Database not available");
      return false;
    }

    // Get the last customer message
    const lastCustomerMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderType, "customer")
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (!lastCustomerMessage || lastCustomerMessage.length === 0) {
      // No customer message yet, allow sending
      return true;
    }

    const lastMessageTime = lastCustomerMessage[0].createdAt.getTime();
    const now = Date.now();
    const hoursSinceLastMessage = (now - lastMessageTime) / (1000 * 60 * 60);

    // Within 24-hour window
    if (hoursSinceLastMessage <= 24) {
      return true;
    }

    // Outside 24-hour window
    console.log(
      `[Messaging Window] Conversation ${conversationId} is outside 24-hour window (${hoursSinceLastMessage.toFixed(1)} hours)`
    );
    return false;
  } catch (error) {
    console.error("[Messaging Window] Error checking window:", error);
    // Fail open - allow sending if check fails
    return true;
  }
}

/**
 * Get time remaining in 24-hour window
 * Returns milliseconds until window closes, or 0 if already closed
 */

export async function getTimeRemainingInWindow(
  conversationId: number
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      return 0;
    }

    const lastCustomerMessage = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderType, "customer")
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (!lastCustomerMessage || lastCustomerMessage.length === 0) {
      // No customer message, window not started
      return 0;
    }

    const lastMessageTime = lastCustomerMessage[0].createdAt.getTime();
    const windowCloseTime = lastMessageTime + 24 * 60 * 60 * 1000; // 24 hours in ms
    const now = Date.now();

    if (now >= windowCloseTime) {
      return 0; // Window closed
    }

    return windowCloseTime - now;
  } catch (error) {
    console.error("[Messaging Window] Error calculating time:", error);
    return 0;
  }
}

/**
 * Format remaining time for display
 */

export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "Window closed";
  }

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor(
    (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}
