/**
 * Groq LLM Integration
 * Wrapper for Groq API calls with proper configuration
 * Uses the built-in invokeLLM helper which is pre-configured with Groq
 */

import { invokeLLM } from "./llm";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Call Groq LLM with conversation history
 * The invokeLLM helper is pre-configured with Groq API credentials
 */
export async function callGroqLLM(messages: GroqMessage[]): Promise<string | null> {
  try {
    console.log("[Groq] Calling LLM with", messages.length, "messages");

    const response = await invokeLLM({
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const messageContent = response.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.error("[Groq] No response content from LLM");
      return null;
    }

    // Ensure content is a string (not array of content objects)
    const content = typeof messageContent === "string" ? messageContent : null;

    if (!content) {
      console.error("[Groq] Response content is not a string");
      return null;
    }

    console.log("[Groq] LLM response received, length:", content.length);
    return content;
  } catch (error) {
    console.error("[Groq] Error calling LLM:", error);
    return null;
  }
}

/**
 * Generate AI response using Groq with full conversation context
 * Includes system prompt, conversation history, and current message
 */
export async function generateGroqResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  currentMessage: string
): Promise<string | null> {
  try {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: currentMessage,
      },
    ];

    return await callGroqLLM(messages);
  } catch (error) {
    console.error("[Groq] Error generating response:", error);
    return null;
  }
}
