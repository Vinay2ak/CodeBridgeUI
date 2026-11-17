import { describe, it, expect } from "vitest";
import { adaptEscrowPayment, adaptEscrowStatus } from "./adapters";

describe("payment adapters", () => {
  it("adapts task escrow response from contract section 5.8 & 8 (GET /api/v1/payment/escrow/{task_id})", () => {
    // Exact fixture from contract line 484 & 695
    const backendFixture = {
      status: "funded",
      reward: 4500.0,
      currency: "USD",
      fundedAt: "2026-11-17T12:00:00Z",
    };

    const adapted = adaptEscrowPayment(backendFixture);
    expect(adapted.state).toBe("held");
    expect(adapted.amount).toBe(4500.0);
    expect(adapted.currency).toBe("INR");
  });

  it("adapts formal uppercase backend escrow response", () => {
    const formalFixture = {
      id: "esc_1024",
      project_id: "proj_1024",
      amount: 5000,
      currency: "INR",
      status: "RELEASED",
    };

    const adapted = adaptEscrowPayment(formalFixture);
    expect(adapted.state).toBe("released");
    expect(adapted.amount).toBe(5000);
  });

  it("maps various backend statuses accurately", () => {
    expect(adaptEscrowStatus("CREATED")).toBe("authorized");
    expect(adaptEscrowStatus("FUNDED")).toBe("held");
    expect(adaptEscrowStatus("HELD")).toBe("held");
    expect(adaptEscrowStatus("RELEASE_PENDING")).toBe("tested");
    expect(adaptEscrowStatus("APPROVED")).toBe("approved");
    expect(adaptEscrowStatus("RELEASED")).toBe("released");
  });
});
