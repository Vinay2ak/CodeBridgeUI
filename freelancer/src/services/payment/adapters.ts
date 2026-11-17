import type { EscrowPayment, PaymentState } from "./types";

/**
 * Maps backend EscrowStatus enum (Contract section 7.4: "CREATED", "FUNDED", "HELD", "RELEASED", etc.)
 * or task escrow status ("funded", "held", "released") to frontend PaymentState
 */
export function adaptEscrowStatus(rawStatus?: string): PaymentState {
  const status = (rawStatus || "").toUpperCase();
  switch (status) {
    case "CREATED":
    case "AUTHORIZED":
    case "UNREQUESTED":
      return "authorized";
    case "FUNDED":
    case "HELD":
      return "held";
    case "RELEASE_PENDING":
    case "TESTED":
      return "tested";
    case "APPROVED":
      return "approved";
    case "RELEASED":
      return "released";
    default:
      return "held";
  }
}

/**
 * Adapts backend escrow payment response from GET /api/v1/payment/escrow/{task_id}
 */
export function adaptEscrowPayment(raw: any): EscrowPayment {
  if (!raw || typeof raw !== "object") {
    return {
      state: "held",
      amount: 5000,
      currency: "INR",
    };
  }

  const rawStatus = raw.status || raw.state || "HELD";
  const state = adaptEscrowStatus(rawStatus);

  const amount =
    typeof raw.reward === "number"
      ? raw.reward
      : typeof raw.amount === "number"
      ? raw.amount
      : 5000;

  return {
    state,
    amount,
    currency: "INR",
  };
}
