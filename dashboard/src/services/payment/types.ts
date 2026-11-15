export type PaymentState = 'authorized' | 'held' | 'release_pending' | 'released';

export interface Payment {
  id: string;
  projectTitle: string;
  amount: number;
  state: PaymentState;
}

export interface PaymentsSummary {
  currency: string;
  authorized: number;
  held: number;
  pendingRelease: number;
  released: number;
  releasedThisMonth: number;
  items: Payment[];
}

