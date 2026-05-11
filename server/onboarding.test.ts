import { describe, expect, it } from "vitest";
import { detectEscalation } from "./ai/agent";

describe("AI Agent - Escalation Detection", () => {
  it("should detect escalation keyword: human", () => {
    expect(detectEscalation("I need to speak with a human")).toBe(true);
  });

  it("should detect escalation keyword: agent", () => {
    expect(detectEscalation("Can I talk to an agent?")).toBe(true);
  });

  it("should detect escalation keyword: support", () => {
    expect(detectEscalation("I need customer support")).toBe(true);
  });

  it("should detect escalation keyword: manager", () => {
    expect(detectEscalation("I want to speak to a manager")).toBe(true);
  });

  it("should not detect escalation in normal message", () => {
    expect(detectEscalation("What are your business hours?")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(detectEscalation("I NEED A HUMAN")).toBe(true);
  });

  it("should detect escalation with partial matches", () => {
    expect(detectEscalation("Can someone help me urgently?")).toBe(true);
  });

  it("should handle empty string", () => {
    expect(detectEscalation("")).toBe(false);
  });
});
