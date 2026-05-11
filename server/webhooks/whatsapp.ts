import type { Request, Response } from "express";
import * as db from "../db";
import { processMessage } from "../ai/agent";

/**
 * WhatsApp Webhook Handler
 * Receives incoming messages from Meta's WhatsApp Cloud API
 * Handles webhook verification and message routing
 */

/**
 * Verify webhook endpoint (Meta's challenge-response verification)
 */
export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const phoneNumberId = req.query["phone_number_id"] as string;

  // Validate webhook verification
  if (mode !== "subscribe") {
    console.warn("[WhatsApp Webhook] Invalid mode:", mode);
    res.sendStatus(403);
    return;
  }

  if (!token) {
    console.warn("[WhatsApp Webhook] No verify token provided");
    res.sendStatus(403);
    return;
  }

  // Find business and verify token matches
  try {
    let business = null;

    // If phone number ID is provided, use it to find business
    if (phoneNumberId) {
      business = await findBusinessByPhoneNumberId(phoneNumberId);
    }

    // Verify token matches business verify token
    if (business && business.verifyToken === token) {
      console.log("[WhatsApp Webhook] Verification successful for business:", business.id);
      res.status(200).send(challenge);
      return;
    }

    // If no business found or token mismatch, reject
    console.warn("[WhatsApp Webhook] Verification failed: token mismatch or business not found");
    res.sendStatus(403);
  } catch (error) {
    console.error("[WhatsApp Webhook] Verification error:", error);
    res.sendStatus(403);
  }
}

/**
 * Handle incoming messages from WhatsApp
 */
export async function handleIncomingMessage(req: Request, res: Response) {
  try {
    const body = req.body;

    // Acknowledge receipt immediately
    res.status(200).json({ received: true });

    // Parse webhook payload
    if (!body.entry || !Array.isArray(body.entry)) {
      console.warn("[WhatsApp Webhook] Invalid payload structure");
      return;
    }

    for (const entry of body.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        if (!value.messages || !Array.isArray(value.messages)) continue;

        // Extract business phone number ID to route to correct tenant
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) {
          console.warn("[WhatsApp Webhook] No phone number ID in webhook");
          continue;
        }

        // Find business by phone number ID (multi-tenant routing)
        const business = await findBusinessByPhoneNumberId(phoneNumberId);
        if (!business) {
          console.warn(`[WhatsApp Webhook] No business found for phone number ID: ${phoneNumberId}`);
          continue;
        }

        console.log(
          `[WhatsApp Webhook] Routing message to business: ${business.businessName} (ID: ${business.id})`
        );

        // Process each message
        for (const message of value.messages) {
          await processIncomingMessage(business, message, value);
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook:", error);
    // Still return 200 to avoid retries
  }
}

/**
 * Find business by WhatsApp phone number ID
 */
async function findBusinessByPhoneNumberId(phoneNumberId: string) {
  try {
    // Query database for business with matching phone number ID
    // Note: In production, add a database index on phoneNumberId for performance
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.warn("[WhatsApp] Database not available");
      return null;
    }

    const { businesses } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const result = await dbInstance
      .select()
      .from(businesses)
      .where(eq(businesses.phoneNumberId, phoneNumberId))
      .limit(1);

    if (result && result.length > 0) {
      return result[0];
    }

    console.warn(`[WhatsApp] No business found for phone number ID: ${phoneNumberId}`);
    return null;
  } catch (error) {
    console.error("[WhatsApp] Error finding business by phone number ID:", error);
    return null;
  }
}

/**
 * Process incoming message and route to AI or store for human review
 */
async function processIncomingMessage(business: any, message: any, webhookValue: any) {
  try {
    const customerPhoneNumber = message.from;
    const messageId = message.id;
    const timestamp = message.timestamp;
    const messageContent = extractMessageContent(message);

    if (!messageContent) {
      console.warn("[WhatsApp] Could not extract message content");
      return;
    }

    // Find or create conversation
    let conversation = await db.getConversationByPhoneAndBusiness(
      business.id,
      customerPhoneNumber
    );

    if (!conversation) {
      conversation = await db.createConversation({
        businessId: business.id,
        customerPhoneNumber,
        customerName: webhookValue.contacts?.[0]?.profile?.name,
      });
    }

    // Store incoming message
    const storedMessage = await db.createMessage({
      conversationId: conversation.id,
      businessId: business.id,
      whatsappMessageId: messageId,
      senderType: "customer",
      content: messageContent,
    });

    // Update conversation metadata
    await db.updateConversation(conversation.id, {
      lastMessageAt: new Date(parseInt(timestamp) * 1000),
      unreadCount: (conversation.unreadCount || 0) + 1,
    });

    console.log(
      `[WhatsApp] Message received from ${customerPhoneNumber} in conversation ${conversation.id}`
    );

    // If AI is enabled, process the message for AI response
    if (conversation.aiEnabled && business.aiEnabled) {
      console.log(`[WhatsApp] AI processing enabled for conversation ${conversation.id}`);

      // Process message with AI agent (escalation detection, response generation)
      const result = await processMessage(business.id, conversation.id, messageContent);

      if (result.isEscalation) {
        console.log(`[WhatsApp] Escalation detected in conversation ${conversation.id}`);
        // Conversation has been marked as waiting for human
      } else if (result.shouldRespond && result.response) {
        // Send AI response back to customer
        console.log(`[WhatsApp] Sending AI response to ${customerPhoneNumber}`);
        const responseMessageId = await sendWhatsAppMessage(
          business,
          customerPhoneNumber,
          result.response
        );

        if (responseMessageId) {
          // Store AI response message
          await db.createMessage({
            conversationId: conversation.id,
            businessId: business.id,
            whatsappMessageId: responseMessageId,
            senderType: "ai",
            content: result.response,
          });
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp] Error processing incoming message:", error);
  }
}

/**
 * Extract message content from WhatsApp message object
 */
function extractMessageContent(message: any): string | null {
  if (message.type === "text" && message.text?.body) {
    return message.text.body;
  }

  if (message.type === "image" && message.image?.caption) {
    return `[Image] ${message.image.caption}`;
  }

  if (message.type === "document" && message.document?.filename) {
    return `[Document] ${message.document.filename}`;
  }

  if (message.type === "audio") {
    return "[Audio message]";
  }

  if (message.type === "video") {
    return "[Video message]";
  }

  return null;
}

/**
 * Send message via WhatsApp API
 */
export async function sendWhatsAppMessage(
  business: any,
  phoneNumber: string,
  content: string
): Promise<string | null> {
  try {
    // Use Meta Graph API v18.0 endpoint for WhatsApp
    // Note: The correct endpoint is graph.instagram.com for WhatsApp Business API
    // Construct the WhatsApp API endpoint
    const url = `https://graph.instagram.com/v18.0/${business.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "text",
      text: {
        body: content,
      },
    };

    console.log(`[WhatsApp API] Sending message to ${phoneNumber} via business ${business.id}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${business.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp API] Error sending message:", error);
      return null;
    }

    const result = await response.json();
    const messageId = result.messages?.[0]?.id;

    if (messageId) {
      console.log(`[WhatsApp API] Message sent successfully with ID: ${messageId}`);
    }

    return messageId || null;
  } catch (error) {
    console.error("[WhatsApp API] Error:", error);
    return null;
  }
}
