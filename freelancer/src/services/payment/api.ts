import { request } from "../../lib/http";
import { EscrowPayment } from "./types";

export const paymentApi = {
  getEscrow(taskId: string): Promise<EscrowPayment> {
    return request<EscrowPayment>(`/payments/escrow/${taskId}`);
  },
};

