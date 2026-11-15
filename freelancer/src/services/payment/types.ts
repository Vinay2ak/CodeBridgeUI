export type PaymentState = "authorized" | "held" | "tested" | "approved" | "released";

export interface EscrowPayment {
  state: PaymentState;
  amount: number;
  currency: "INR";
}

