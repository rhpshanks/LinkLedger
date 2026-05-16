export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export interface Card {
  id: string;
  label: string;
  last4: string;
  type: string;
  limit?: number;
  color?: string;
}

export interface Subscription {
  id: string;
  serviceName: string;
  url?: string;
  amount: number;
  cycle: BillingCycle;
  nextRenewalDate: string; // ISO date string
  categoryId?: string;
  currency?: string;
  cardId?: string;
}

export interface AlertPreference {
  advanceNoticeDays: number; // 7, 14, 30
  notifyInApp: boolean;
  notifyEmail: boolean;
}
