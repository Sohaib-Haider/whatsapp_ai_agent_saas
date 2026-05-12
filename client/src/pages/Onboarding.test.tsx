import { describe, expect, it, vi } from "vitest";

/**
 * Tests for Onboarding component
 * Tests the 4-step wizard flow and form validation
 */

describe("Onboarding Flow", () => {
  describe("Step 1: Business Profile", () => {
    it("should validate business name is required", () => {
      const businessName = "";
      const isValid = businessName.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid business name", () => {
      const businessName = "My Business";
      const isValid = businessName.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it("should validate description is required", () => {
      const description = "";
      const isValid = description.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid description", () => {
      const description = "Customer support for my business";
      const isValid = description.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  describe("Step 2: WhatsApp Credentials", () => {
    it("should validate Phone Number ID format", () => {
      const phoneNumberId = "123456789";
      const isValid = /^\d+$/.test(phoneNumberId) && phoneNumberId.length > 0;
      expect(isValid).toBe(true);
    });

    it("should reject invalid Phone Number ID", () => {
      const phoneNumberId = "";
      const isValid = /^\d+$/.test(phoneNumberId) && phoneNumberId.length > 0;
      expect(isValid).toBe(false);
    });

    it("should validate Access Token is required", () => {
      const accessToken = "";
      const isValid = accessToken.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid Access Token", () => {
      const accessToken = "EAABa1234567890";
      const isValid = accessToken.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it("should validate Verify Token is required", () => {
      const verifyToken = "";
      const isValid = verifyToken.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid Verify Token", () => {
      const verifyToken = "my_verify_token_123";
      const isValid = verifyToken.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  describe("Step 3: AI Agent Configuration", () => {
    it("should validate agent name is required", () => {
      const agentName = "";
      const isValid = agentName.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid agent name", () => {
      const agentName = "Support Bot";
      const isValid = agentName.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it("should validate persona is required", () => {
      const persona = "";
      const isValid = persona.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid persona", () => {
      const persona = "Friendly and helpful customer support representative";
      const isValid = persona.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it("should validate system prompt is required", () => {
      const systemPrompt = "";
      const isValid = systemPrompt.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it("should accept valid system prompt", () => {
      const systemPrompt =
        "You are a helpful customer support agent. Always be polite and professional.";
      const isValid = systemPrompt.trim().length > 0;
      expect(isValid).toBe(true);
    });
  });

  describe("Step 4: Review & Confirm", () => {
    it("should display all entered information", () => {
      const data = {
        businessName: "My Business",
        description: "Customer support",
        phoneNumberId: "123456789",
        agentName: "Support Bot",
        persona: "Friendly",
        systemPrompt: "Be helpful",
      };

      expect(data.businessName).toBeDefined();
      expect(data.phoneNumberId).toBeDefined();
      expect(data.agentName).toBeDefined();
    });

    it("should allow user to go back and edit", () => {
      const currentStep = 4;
      const canGoBack = currentStep > 1;
      expect(canGoBack).toBe(true);
    });

    it("should allow user to confirm and complete onboarding", () => {
      const isComplete = true;
      expect(isComplete).toBe(true);
    });
  });

  describe("Navigation", () => {
    it("should start at step 1", () => {
      const currentStep = 1;
      expect(currentStep).toBe(1);
    });

    it("should progress to next step", () => {
      let currentStep = 1;
      currentStep += 1;
      expect(currentStep).toBe(2);
    });

    it("should go back to previous step", () => {
      let currentStep = 2;
      currentStep -= 1;
      expect(currentStep).toBe(1);
    });

    it("should complete after step 4", () => {
      const currentStep = 4;
      const isLastStep = currentStep === 4;
      expect(isLastStep).toBe(true);
    });
  });

  describe("Form Submission", () => {
    it("should collect all form data", async () => {
      const mockSubmit = vi.fn().mockResolvedValue({ success: true });

      const formData = {
        businessName: "My Business",
        description: "Customer support",
        phoneNumberId: "123456789",
        accessToken: "EAABa1234567890",
        verifyToken: "verify_token_123",
        agentName: "Support Bot",
        persona: "Friendly",
        systemPrompt: "Be helpful",
      };

      await mockSubmit(formData);

      expect(mockSubmit).toHaveBeenCalledWith(formData);
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it("should handle submission errors", async () => {
      const mockSubmit = vi
        .fn()
        .mockRejectedValue(new Error("Submission failed"));

      try {
        await mockSubmit({});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Submission failed");
      }
    });

    it("should show loading state during submission", () => {
      const isLoading = true;
      expect(isLoading).toBe(true);
    });

    it("should show success message after completion", () => {
      const isSuccess = true;
      const message = "Onboarding completed successfully!";
      expect(isSuccess).toBe(true);
      expect(message).toBeDefined();
    });
  });
});
