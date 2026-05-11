import { generateGroqResponse } from "../_core/groq";
import * as db from "../db";

/**
 * AI Agent Engine
 * Generates contextual responses using LangChain with Groq API
 * Detects escalation keywords and manages conversation state
 */

const ESCALATION_KEYWORDS = [
  "human",
  "agent",
  "real person",
  "support",
  "talk to someone",
  "speak to",
  "representative",
  "manager",
  "supervisor",
  "help",
  "urgent",
];

/**
 * Check if message contains escalation keywords
 */
export function detectEscalation(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return ESCALATION_KEYWORDS.some((keyword) => lowerContent.includes(keyword));
}

/**
 * Generate AI response using Groq with full conversation history
 */
export async function generateAIResponse(
  businessId: number,
  conversationId: number,
  customerMessage: string
): Promise<string | null> {
  try {
    // Get business and conversation context
    const business = await db.getBusinessById(businessId);
    if (!business) {
      console.error("[AI Agent] Business not found");
      return null;
    }

    const conversation = await db.getConversationById(conversationId);
    if (!conversation) {
      console.error("[AI Agent] Conversation not found");
      return null;
    }

    // Get full conversation history (all messages, not just 20)
    const messages = await db.getMessagesByConversationId(conversationId, 1000);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(business);

    // Build conversation context (exclude current message)
    const conversationHistory = messages.map((msg) => ({
      role: msg.senderType === "customer" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Call Groq LLM with full history and current message
    const aiResponse = await generateGroqResponse(
      systemPrompt,
      conversationHistory,
      customerMessage
    );

    if (!aiResponse) {
      console.error("[AI Agent] No response from Groq LLM");
      return null;
    }

    // Add footer message
    const finalResponse = `${aiResponse}\n\nReply AGENT anytime to speak with our team.`;

    return finalResponse;
  } catch (error) {
    console.error("[AI Agent] Error generating response:", error);
    return null;
  }
}

/**
 * Build system prompt for AI agent
 */
function buildSystemPrompt(business: any): string {
  const basePrompt = `You are ${business.agentName}, a helpful customer support assistant for ${business.businessName}.`;

  const personaPrompt = business.agentPersona
    ? `\n\nYour personality and approach:\n${business.agentPersona}`
    : "";

  const systemPromptOverride = business.systemPrompt
    ? `\n\nSpecial instructions:\n${business.systemPrompt}`
    : "";

  const instructions = `

You are responding to customer inquiries via WhatsApp. Keep responses:
- Concise and friendly
- Professional yet approachable
- Helpful and solution-oriented
- Within 1-2 paragraphs

If you cannot help with something, offer to escalate to a human representative.`;

  return basePrompt + personaPrompt + systemPromptOverride + instructions;
}

/**
 * Process incoming message and handle AI response or escalation
 */
export async function processMessage(
  businessId: number,
  conversationId: number,
  customerMessage: string
): Promise<{
  shouldRespond: boolean;
  isEscalation: boolean;
  response?: string;
}> {
  try {
    // Check for escalation keywords
    const isEscalation = detectEscalation(customerMessage);

    if (isEscalation) {
      console.log("[AI Agent] Escalation detected in message");

      // Create escalation record
      await db.createEscalation({
        conversationId,
        businessId,
        reason: "Customer requested human support",
        triggerMessage: customerMessage,
      });

      // Update conversation status
      await db.updateConversation(conversationId, {
        aiEnabled: false,
        isEscalated: true,
        isWaitingForHuman: true,
      });

      return {
        shouldRespond: false,
        isEscalation: true,
      };
    }

    // Generate AI response
    const response = await generateAIResponse(businessId, conversationId, customerMessage);

    if (!response) {
      return {
        shouldRespond: false,
        isEscalation: false,
      };
    }

    return {
      shouldRespond: true,
      isEscalation: false,
      response,
    };
  } catch (error) {
    console.error("[AI Agent] Error processing message:", error);
    return {
      shouldRespond: false,
      isEscalation: false,
    };
  }
}
