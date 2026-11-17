import { request } from "../../lib/http";
import { env } from "../../lib/env";
import type { EscrowPayment } from "./types";
import { adaptEscrowPayment } from "./adapters";
import { MOCK_ESCROWS } from "../../mocks/data/tasks";

export const paymentApi = {
  async getEscrow(taskId: string): Promise<EscrowPayment> {
    try {
      // Contract line 484: /api/v1/payment/escrow/{task_id}
      let raw: any;
      try {
        raw = await request<any>(`/api/v1/payment/escrow/${taskId}`);
      } catch {
        raw = await request<any>(`/api/v1/payments/escrow/${taskId}`);
      }
      return adaptEscrowPayment(raw);
    } catch (err) {
      if (env.useMocks) {
        const fallback =
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
          };
        return adaptEscrowPayment(fallback);
      }
      throw err;
    }
  },
};
