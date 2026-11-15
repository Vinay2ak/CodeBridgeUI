import { request } from "../../lib/http";
import { EscrowPayment } from "./types";
import { MOCK_ESCROWS } from "../../mocks/data/tasks";

export const paymentApi = {
  async getEscrow(taskId: string): Promise<EscrowPayment> {
    try {
      return await request<EscrowPayment>(`/payments/escrow/${taskId}`);
    } catch {
      return (
        MOCK_ESCROWS[taskId] ||
        MOCK_ESCROWS[
          taskId === "task-1"
            ? "t1"
            : taskId === "task-2"
            ? "t2"
            : taskId === "task-3"
            ? "t3"
            : taskId
        ] || {
          state: "held",
          amount: 4500,
          currency: "INR",
        }
      );
    }
  },
};
