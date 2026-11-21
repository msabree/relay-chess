import type { Billing, BillingEvent, Plan, Sub } from './billing';
import type { Store, Supporter } from './store/types';

/**
 * Supporter memberships. Every feature stays free; supporters get cosmetic
 * thank-yous (blue check, extra board colors, arenas, a spot on the wall).
 *
 * Stripe is the source of truth. On every webhook we re-read the subscription
 * from Stripe and save what it says, so events arriving twice or out of order
 * do no harm. Active supporters are kept in memory for the check marks.
 */

/** Stripe retries failed renewals for a while: perks stay on through `past_due`. */
const LIVE = new Set(['active', 'trialing', 'past_due']);
/** A little slack so a renewal webhook arriving late never flickers the check off. */
const GRACE_MS = 2 * 24 * 60 * 60_000;
/** Events we act on. Others are acknowledged and ignored. */
export const EVENTS = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];

export function createSupporters(store: Store, billing: Billing | null, retired: ReadonlySet<string> = new Set(), now: () => number = Date.now) {
  /** playerId -> perks end (ms) and wall opt-in */
  const live = new Map<string, { until: number; showOnWall: boolean }>();
  const remember = (s: Pick<Supporter, 'playerId' | 'until' | 'showOnWall'>) => live.set(s.playerId, { until: s.until.getTime(), showOnWall: s.showOnWall });

  const ready = store.listSupporters().then(
    (all) => all.forEach(remember),
    (e) => console.error('could not load supporters', e),
  );

  async function apply(sub: Sub, playerHint: string | null) {
    const playerId = sub.playerId ?? playerHint;
    if (!playerId) return console.warn(`[stripe] subscription ${sub.id} has no player`);
    if (retired.has(playerId)) return; // account deleted; its cancel event lands here too
    const cur = await store.getSupporter(playerId);
    // An older, already-replaced subscription mustn't switch off a newer one.
    if (cur && cur.subscriptionId && cur.subscriptionId !== sub.id && !LIVE.has(sub.status) && cur.until.getTime() > now()) return;
    const until = new Date(LIVE.has(sub.status) ? sub.periodEnd + GRACE_MS : Math.min(sub.periodEnd, now()));
    const patch = { customerId: sub.customerId, subscriptionId: sub.id, plan: sub.plan, status: sub.status, until, cancelAtPeriodEnd: sub.cancelAtPeriodEnd };
    await store.saveSupporter(playerId, patch);
    remember({ playerId, until, showOnWall: cur?.showOnWall ?? false });
  }

  return {
    enabled: !!billing,
    ready,

    isSupporter: (playerId: string) => (live.get(playerId)?.until ?? 0) > now(),

    /** Active supporters who chose to be on the public list. */
    wall: () => [...live].filter(([, s]) => s.until > now() && s.showOnWall).map(([id]) => id),

    async status(playerId: string) {
      const s = await store.getSupporter(playerId);
      if (!s || s.until.getTime() <= now()) return s ? { active: false as const, showOnWall: s.showOnWall, canManage: !!s.customerId } : null;
      return {
        active: true as const,
        plan: s.plan,
        // the real renewal or end date, without our grace
        renews: !s.cancelAtPeriodEnd && s.status !== 'past_due',
        until: new Date(LIVE.has(s.status) ? s.until.getTime() - GRACE_MS : s.until.getTime()),
        pastDue: s.status === 'past_due',
        showOnWall: s.showOnWall,
        canManage: !!s.customerId,
        since: s.since,
      };
    },

    async checkout(playerId: string, plan: Plan, email: string | undefined, returnUrl: string) {
      if (!billing) throw new Error('billing off');
      const cur = await store.getSupporter(playerId);
      if (cur && cur.until.getTime() > now()) return { already: true as const };
      const url = await billing.checkout({ plan, playerId, email, customerId: cur?.customerId || undefined, returnUrl });
      return { url };
    },

    async portal(playerId: string, returnUrl: string) {
      const cur = await store.getSupporter(playerId);
      if (!billing || !cur?.customerId) return null;
      return billing.portal(cur.customerId, returnUrl);
    },

    async setShowOnWall(playerId: string, showOnWall: boolean) {
      const cur = await store.getSupporter(playerId);
      if (!cur) return false;
      await store.saveSupporter(playerId, { showOnWall });
      remember({ playerId, until: cur.until, showOnWall });
      return true;
    },

    /** Check a webhook's signature and read it. Throws if it isn't from Stripe. */
    verify(rawBody: Buffer, signature: string): BillingEvent {
      if (!billing) throw new Error('billing off');
      return billing.event(rawBody, signature);
    },

    /** A verified Stripe event. */
    async handle(e: BillingEvent) {
      if (!billing || !EVENTS.includes(e.type) || !e.subscriptionId) return;
      await apply(await billing.subscription(e.subscriptionId), e.playerId);
    },

    /** Account deleted: end the membership now and forget it. Any of the account's player ids. */
    async remove(playerIds: string[]) {
      for (const id of playerIds) {
        const cur = await store.getSupporter(id);
        if (!cur) continue;
        if (billing && cur.subscriptionId && LIVE.has(cur.status)) {
          await billing.cancel(cur.subscriptionId).catch((e) => console.error(`[stripe] could not cancel ${cur.subscriptionId}`, e));
        }
        await store.deleteSupporter(id);
        live.delete(id);
      }
    },
  };
}

export type Supporters = ReturnType<typeof createSupporters>;
