import { http } from '../../lib/http';
import { PaymentsSummary } from './types';

export const paymentApi = {
  getSummary: async (): Promise<PaymentsSummary> => {
    let raw: any = null;
    try {
      raw = await http.get<any>('/payment/summary');
    } catch {
      try {
        raw = await http.get<any>('/payments/summary');
      } catch {
        raw = null;
      }
    }

    return {
      currency: raw?.currency || 'USD',
      authorized: Number(raw?.authorized ?? raw?.total_spent ?? 0),
      held: Number(raw?.held ?? raw?.held_amount ?? raw?.total_escrow ?? 0),
      pendingRelease: Number(raw?.pendingRelease ?? raw?.pending_release ?? 0),
      released: Number(raw?.released ?? raw?.released_amount ?? 0),
      releasedThisMonth: Number(raw?.releasedThisMonth ?? raw?.released_amount ?? 0),
      items: Array.isArray(raw?.items) ? raw.items : [],
    };
  },
};

