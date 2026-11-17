import { describe, it, expect } from "vitest";
import { adaptAiContext } from "./adapters";

describe("ai adapters", () => {
  it("adapts backend response from contract (GET /api/v1/ai/context/{task_id})", () => {
    // Exact fixture structure from FRONTEND_CONTRACT.md section 5.4 & 8
    const backendFixture = {
      summary: "Webhook callback idempotency and transaction handling.",
      findings: [
        "Concurrent callbacks within 50ms cause double balance increments",
        "Missing sha256 HMAC verification",
      ],
      relevantFiles: [
        {
          path: "app/api/v1/endpoints/payments.py",
          score: 0.95,
          reason: "Webhook callback endpoint with race condition",
        },
      ],
      approach: [
        "Use Redis distributed lock",
        "Enforce PostgreSQL SELECT FOR UPDATE",
      ],
    };

    const adapted = adaptAiContext(backendFixture);

    expect(adapted.summary).toBe("Webhook callback idempotency and transaction handling.");
    expect(adapted.findings).toHaveLength(2);
    expect(adapted.relevantFiles[0].path).toBe("app/api/v1/endpoints/payments.py");
    expect(adapted.relevantFiles[0].score).toBe(0.95);
    expect(adapted.approach).toHaveLength(2);
  });

  it("handles snake_case backend keys gracefully", () => {
    const snakeFixture = {
      summary: "Analysis",
      findings: ["Issue 1"],
      relevant_files: [
        {
          file_path: "src/index.ts",
          score: 0.8,
          description: "Main entry point",
        },
      ],
      approach: ["Fix issue"],
    };

    const adapted = adaptAiContext(snakeFixture);
    expect(adapted.relevantFiles[0].path).toBe("src/index.ts");
    expect(adapted.relevantFiles[0].reason).toBe("Main entry point");
  });
});
