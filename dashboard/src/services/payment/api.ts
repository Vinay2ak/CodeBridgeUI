import { http } from '../../lib/http';
import { PaymentsSummary } from './types';
import { adaptPaymentsSummary } from './adapters';

export const paymentApi = {
  getSummary: async (): Promise<PaymentsSummary> => {
    let raw: any = null;
    try {
      raw = await http.get<any>('/api/v1/payment/summary');
    } catch {
      try {
        raw = await http.get<any>('/api/v1/payments/summary');
      } catch {
        raw = null;
      }
    }

    return adaptPaymentsSummary(raw);
  },
};
