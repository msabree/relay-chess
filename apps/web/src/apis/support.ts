import { api } from './http';

export type Plan = 'monthly' | 'yearly';

export interface Membership {
  active: boolean;
  plan?: Plan | null;
  /** renews on `until` (false once cancelled: perks end then) */
  renews?: boolean;
  until?: string;
  /** a renewal payment failed; Stripe is retrying */
  pastDue?: boolean;
  showOnWall: boolean;
  /** has a Stripe customer, so the billing portal works */
  canManage: boolean;
  since?: string;
}

export interface SupportStatus {
  /** card checkout switched on (Stripe configured) */
  enabled: boolean;
  /** signed-in players only; null if never a supporter */
  membership?: Membership | null;
}

export const getSupport = () => api.get<SupportStatus>('/support').then((r) => r.data);
/** Stripe Checkout URL for a plan. 409 if you're already a supporter. */
export const startCheckout = (plan: Plan) => api.post<{ url: string }>('/support/checkout', { plan }).then((r) => r.data.url);
/** Stripe's billing portal: change plan, card, cancel, receipts. */
export const openPortal = () => api.post<{ url: string }>('/support/portal').then((r) => r.data.url);
export const setShowOnWall = (showOnWall: boolean) => api.patch('/support/me', { showOnWall });
export const getSupporters = () => api.get<{ supporters: { id: string; username: string }[] }>('/supporters').then((r) => r.data.supporters);
