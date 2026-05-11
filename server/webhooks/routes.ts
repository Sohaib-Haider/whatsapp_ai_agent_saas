import type { Express } from "express";
import { verifyWebhook, handleIncomingMessage } from "./whatsapp";

/**
 * Register WhatsApp webhook routes with Express server
 */
export function registerWebhookRoutes(app: Express) {
  /**
   * GET /api/webhooks/whatsapp
   * Webhook verification endpoint for Meta's challenge-response
   */
  app.get("/api/webhooks/whatsapp", (req, res) => {
    verifyWebhook(req, res);
  });

  /**
   * POST /api/webhooks/whatsapp
   * Webhook endpoint for receiving incoming messages from WhatsApp
   */
  app.post("/api/webhooks/whatsapp", (req, res) => {
    handleIncomingMessage(req, res);
  });

  console.log("[Webhooks] WhatsApp webhook routes registered");
}
