import Stripe from 'stripe';
import type { Config } from './config';

/**
 * Stripe, kept behind a small interface so tests can use a fake. Supporters
 * pay with Stripe Checkout (subscription mode), manage or cancel in Stripe's
 * Customer Portal, and Stripe tells us about changes through the webhook.
 */

export type Plan = 'monthly' | 'yearly';

/** The parts of a Stripe subscription we use. */
export interface Sub {
  id: string;
  customerId: string;
  /** set on the subscription at checkout (subscription_data.metadata) */
  playerId: string | null;
  status: string;
  plan: Plan | null;
  /** end of the paid period, in ms */
  periodEnd: number;
  cancelAtPeriodEnd: boolean;
}

/** What a webhook event tells us: which subscription to re-read, and who it's for. */
export interface BillingEvent {
  id: string;
  type: string;
  subscriptionId: string | null;
  /** checkout.session.completed only: the player who paid (client_reference_id) */
  playerId: string | null;
}

export interface Billing {
  checkout(opts: { plan: Plan; playerId: string; email?: string; customerId?: string; returnUrl: string }): Promise<string>;
  portal(customerId: string, returnUrl: string): Promise<string>;
  /** Check the signature and read the event. Throws if it isn't from Stripe. */
  event(rawBody: Buffer, signature: string): BillingEvent;
  subscription(id: string): Promise<Sub>;
  /** Cancel right away (account deleted). */
  cancel(subscriptionId: string): Promise<void>;
}

/** Stripe's billing, or null when the keys aren't set (supporting is then switched off). */
export function stripeBilling(config: Config): Billing | null {
  const { STRIPE_SECRET_KEY: key, STRIPE_WEBHOOK_SECRET: whsec, STRIPE_PRICE_MONTHLY: monthly, STRIPE_PRICE_YEARLY: yearly } = config;
  if (!key || !whsec || !monthly || !yearly) return null;
  const stripe = new Stripe(key);
  const prices: Record<Plan, string> = { monthly, yearly };
  const planOf = (priceId?: string): Plan | null => (priceId === monthly ? 'monthly' : priceId === yearly ? 'yearly' : null);
  const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : (v?.id ?? null));

  return {
    async checkout({ plan, playerId, email, customerId, returnUrl }) {
      const s = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: prices[plan], quantity: 1 }],
        client_reference_id: playerId,
        subscription_data: { metadata: { playerId } },
        ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
        allow_promotion_codes: true,
        success_url: `${returnUrl}?thanks=1`,
        cancel_url: returnUrl,
      });
      if (!s.url) throw new Error('checkout session has no url');
      return s.url;
    },

    async portal(customerId, returnUrl) {
      const s = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
      return s.url;
    },

    event(rawBody, signature) {
      const e = stripe.webhooks.constructEvent(rawBody, signature, whsec);
      const obj = e.data.object as { object?: string; id?: string; subscription?: unknown; client_reference_id?: string | null };
      if (obj.object === 'subscription') return { id: e.id, type: e.type, subscriptionId: obj.id ?? null, playerId: null };
      if (obj.object === 'checkout.session') {
        return { id: e.id, type: e.type, subscriptionId: idOf(obj.subscription as string | { id: string } | null), playerId: obj.client_reference_id ?? null };
      }
      return { id: e.id, type: e.type, subscriptionId: null, playerId: null };
    },

    async subscription(id) {
      const s = await stripe.subscriptions.retrieve(id);
      const item = s.items.data[0];
      // Newer API versions keep the period on the item; older ones on the subscription.
      const end = item?.current_period_end ?? (s as unknown as { current_period_end?: number }).current_period_end ?? 0;
      return {
        id: s.id,
        customerId: idOf(s.customer)!,
        playerId: s.metadata?.playerId || null,
        status: s.status,
        plan: planOf(item?.price.id),
        periodEnd: end * 1000,
        cancelAtPeriodEnd: s.cancel_at_period_end || !!s.cancel_at,
      };
    },

    async cancel(subscriptionId) {
      await stripe.subscriptions.cancel(subscriptionId);
    },
  };
}
