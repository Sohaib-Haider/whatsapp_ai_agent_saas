import { describe, expect, it, vi, beforeEach } from "vitest";
import { verifyWebhook, handleIncomingMessage, sendWhatsAppMessage } from "./webhooks/whatsapp";
import type { Request, Response } from "express";

/**
 * Tests for WhatsApp webhook integration
 */

describe("WhatsApp Webhook - Verification", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sendStatus: vi.fn(),
      json: vi.fn(),
    };
  });

  it("should reject verification without mode", async () => {
    mockReq = {
      query: {
        "hub.verify_token": "test-token",
        "hub.challenge": "test-challenge",
      },
    };

    await verifyWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
  });

  it("should reject verification without verify token", async () => {
    mockReq = {
      query: {
        "hub.mode": "subscribe",
        "hub.challenge": "test-challenge",
      },
    };

    await verifyWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
  });

  it("should reject verification with invalid mode", async () => {
    mockReq = {
      query: {
        "hub.mode": "invalid",
        "hub.verify_token": "test-token",
        "hub.challenge": "test-challenge",
      },
    };

    await verifyWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
  });

  it("should reject verification when business not found", async () => {
    mockReq = {
      query: {
        "hub.mode": "subscribe",
        "hub.verify_token": "test-token",
        "hub.challenge": "test-challenge",
        phone_number_id: "999999",
      },
    };

    await verifyWebhook(mockReq as Request, mockRes as Response);

    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
  });
});

describe("WhatsApp Webhook - Message Handling", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it("should acknowledge webhook immediately", async () => {
    mockReq = {
      body: {
        entry: [],
      },
    };

    await handleIncomingMessage(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ received: true });
  });

  it("should handle invalid payload gracefully", async () => {
    mockReq = {
      body: {
        invalid: "payload",
      },
    };

    await handleIncomingMessage(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("should handle webhook with no messages", async () => {
    mockReq = {
      body: {
        entry: [
          {
            changes: [
              {
                field: "messages",
                value: {
                  metadata: {
                    phone_number_id: "123456",
                  },
                  messages: [],
                },
              },
            ],
          },
        ],
      },
    };

    await handleIncomingMessage(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});

describe("WhatsApp API - Message Sending", () => {
  it("should construct correct API request", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const business = {
      id: 1,
      phoneNumberId: "123456789",
      accessToken: "test-token",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        messages: [{ id: "wamid.test-message-id" }],
      }),
    });

    const result = await sendWhatsAppMessage(business, "+1234567890", "Test message");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.facebook.com/v18.0/123456789/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      })
    );

    expect(result).toBe("wamid.test-message-id");
  });

  it("should handle API errors gracefully", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const business = {
      id: 1,
      phoneNumberId: "123456789",
      accessToken: "test-token",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          message: "Invalid token",
        },
      }),
    });

    const result = await sendWhatsAppMessage(business, "+1234567890", "Test message");

    expect(result).toBeNull();
  });

  it("should handle network errors", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const business = {
      id: 1,
      phoneNumberId: "123456789",
      accessToken: "test-token",
    };

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await sendWhatsAppMessage(business, "+1234567890", "Test message");

    expect(result).toBeNull();
  });
});
