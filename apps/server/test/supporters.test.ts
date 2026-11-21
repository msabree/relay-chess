import Stripe from 'stripe';
import { afterEach, describe, expect, it } from 'vitest';
import { stripeBilling, type Billing, type Sub } from '../src/billing';
import { loadConfig } from '../src/config';
import { roomOf, SECRET, sleep, startServer } from './helpers';

const WHSEC = 'whsec_test_secret';
const DAY = 24 * 60 * 60_000;
const stripe = new Stripe('sk_test_fake');

/** Real Stripe signature checks; everything else in memory. */
function fakeBilling() {
  const real = stripeBilling(
    loadConfig({ AUTH_SECRET: SECRET, STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: WHSEC, STRIPE_PRICE_MONTHLY: 'price_m', STRIPE_PRICE_YEARLY: 'price_y' }),
  )!;
  const subs = new Map<string, Sub>();
  const calls: { checkout: unknown[]; portal: string[]; cancel: string[] } = { checkout: [], portal: [], cancel: [] };
  const billing: Billing = {
    async checkout(o) {
      calls.checkout.push(o);
      return `https://checkout.stripe.test/${o.plan}`;
    },
    async portal(customerId) {
      calls.portal.push(customerId);
      return `https://billing.stripe.test/${customerId}`;
    },
    event: (raw, sig) => real.event(raw, sig),
    async subscription(id) {
      const s = subs.get(id);
      if (!s) throw new Error('no such subscription');
      return s;
    },
    async cancel(id) {
      calls.cancel.push(id);
      const s = subs.get(id);
      if (s) subs.set(id, { ...s, status: 'canceled' });
    },
  };
  return { billing, subs, calls };
}

/** Send a signed webhook, like Stripe does. */
async function webhook(url: string, type: string, object: object, secret = WHSEC) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, object: 'event', type, data: { object } });
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const res = await fetch(`${url}/stripe/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': sig }, body: payload });
  return res.status;
}

let t: Awaited<ReturnType<typeof startServer>>;
afterEach(async () => t?.stop());

describe('supporters', () => {
  it('is off without Stripe keys', async () => {
    t = await startServer({ billing: null });
    const me = await t.signIn('ann@example.com');
    expect((await t.api('/support')).body).toEqual({ enabled: false });
    expect((await t.api('/support/checkout', { method: 'POST', token: me.token, json: { plan: 'monthly' } })).status).toBe(503);
    expect((await fetch(`${t.url}/stripe/webhook`, { method: 'POST', body: '{}' })).status).toBe(404);
  });

  it('checkout is for signed-in players only', async () => {
    const f = fakeBilling();
    t = await startServer({ billing: f.billing });
    const g = await t.guest();
    expect((await t.api('/support/checkout', { method: 'POST', token: g.token, json: { plan: 'monthly' } })).body).toEqual({ error: 'sign-in-required' });
    expect((await t.api('/support/checkout', { method: 'POST', json: { plan: 'monthly' } })).status).toBe(401);
    const me = await t.signIn('ann@example.com');
    expect((await t.api('/support/checkout', { method: 'POST', token: me.token, json: { plan: 'weekly' } })).status).toBe(400);
    const r = await t.api('/support/checkout', { method: 'POST', token: me.token, json: { plan: 'yearly' } });
    expect(r.body).toEqual({ url: 'https://checkout.stripe.test/yearly' });
    expect(f.calls.checkout[0]).toMatchObject({ plan: 'yearly', playerId: me.user.id, email: 'ann@example.com', returnUrl: 'http://localhost:3000/support' });
    expect((await t.api('/support', { token: me.token })).body).toEqual({ enabled: true, membership: null });
  });

  it('rejects webhooks without a valid signature', async () => {
    const f = fakeBilling();
    t = await startServer({ billing: f.billing });
    expect(await webhook(t.url, 'customer.subscription.updated', { object: 'subscription', id: 'sub_1' }, 'whsec_wrong')).toBe(400);
    expect((await fetch(`${t.url}/stripe/webhook`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status).toBe(400);
  });

  it('a paid checkout makes you a supporter everywhere; cancelling ends it', async () => {
    const f = fakeBilling();
    t = await startServer({ billing: f.billing });
    const me = await t.signIn('ann@example.com');
    const periodEnd = Date.now() + 30 * DAY;
    f.subs.set('sub_1', { id: 'sub_1', customerId: 'cus_1', playerId: me.user.id, status: 'active', plan: 'monthly', periodEnd, cancelAtPeriodEnd: false });

    expect(await webhook(t.url, 'checkout.session.completed', { object: 'checkout.session', id: 'cs_1', subscription: 'sub_1', client_reference_id: me.user.id })).toBe(200);
    // the same event again, and a created event: still one membership
    expect(await webhook(t.url, 'checkout.session.completed', { object: 'checkout.session', id: 'cs_1', subscription: 'sub_1', client_reference_id: me.user.id })).toBe(200);
    expect(await webhook(t.url, 'customer.subscription.created', { object: 'subscription', id: 'sub_1' })).toBe(200);
    expect(t.store.supporters.size).toBe(1);

    const status = (await t.api('/support', { token: me.token })).body;
    expect(status.membership).toMatchObject({ active: true, plan: 'monthly', renews: true, showOnWall: false, canManage: true });
    expect(new Date(status.membership.until).getTime()).toBe(periodEnd);
    expect((await t.api('/me', { token: me.token })).body.user).toMatchObject({ verified: true, supporter: true });
    expect((await t.api(`/players/${me.user.id}`)).body.player).toMatchObject({ verified: true, supporter: true });

    // can't buy twice; manage in the portal instead
    expect((await t.api('/support/checkout', { method: 'POST', token: me.token, json: { plan: 'yearly' } })).status).toBe(409);
    expect((await t.api('/support/portal', { method: 'POST', token: me.token })).body).toEqual({ url: 'https://billing.stripe.test/cus_1' });

    // the wall is opt-in
    expect((await t.api('/supporters')).body.supporters).toEqual([]);
    expect((await t.api('/support/me', { method: 'PATCH', token: me.token, json: { showOnWall: true } })).body).toEqual({ ok: true });
    expect((await t.api('/supporters')).body.supporters).toEqual([{ id: me.user.id, username: me.user.username }]);

    // cancel in the portal: perks stay until the period ends
    f.subs.set('sub_1', { ...f.subs.get('sub_1')!, cancelAtPeriodEnd: true });
    await webhook(t.url, 'customer.subscription.updated', { object: 'subscription', id: 'sub_1' });
    expect((await t.api('/support', { token: me.token })).body.membership).toMatchObject({ active: true, renews: false });

    // period over: Stripe deletes the subscription
    f.subs.set('sub_1', { ...f.subs.get('sub_1')!, status: 'canceled', periodEnd: Date.now() - 1000 });
    await webhook(t.url, 'customer.subscription.deleted', { object: 'subscription', id: 'sub_1' });
    expect((await t.api('/support', { token: me.token })).body.membership).toMatchObject({ active: false, canManage: true });
    expect((await t.api('/me', { token: me.token })).body.user.supporter).toBeUndefined();
    expect((await t.api('/supporters')).body.supporters).toEqual([]);
  });

  it('shows the blue check in games and chat', async () => {
    const f = fakeBilling();
    t = await startServer({ billing: f.billing });
    const me = await t.signIn('ann@example.com');
    f.subs.set('sub_1', { id: 'sub_1', customerId: 'cus_1', playerId: me.user.id, status: 'active', plan: 'yearly', periodEnd: Date.now() + 365 * DAY, cancelAtPeriodEnd: false });
    await webhook(t.url, 'customer.subscription.created', { object: 'subscription', id: 'sub_1' });

    const s = await t.client(me.token);
    const created = await s.emitWithAck('room:create', { timeControl: 'untimed' });
    if (!created.ok) throw new Error(created.error);
    const joined = await s.emitWithAck('room:join', { roomId: created.roomId });
    if (!joined.ok) throw new Error(joined.error);
    const seated = [...joined.room.game.teams.w, ...joined.room.game.teams.b, ...joined.room.spectators].find((p) => p.id === me.user.id);
    expect(seated).toMatchObject({ verified: true, supporter: true });
    expect(await s.emitWithAck('chat:send', { roomId: created.roomId, text: 'hi' })).toMatchObject({ ok: true });
    await sleep(30);
    expect(roomOf(s, created.roomId)!.chat.at(-1)).toMatchObject({ text: 'hi', verified: true, supporter: true });
  });

  it('deleting the account cancels the membership', async () => {
    const f = fakeBilling();
    t = await startServer({ billing: f.billing });
    const me = await t.signIn('ann@example.com');
    f.subs.set('sub_1', { id: 'sub_1', customerId: 'cus_1', playerId: me.user.id, status: 'active', plan: 'monthly', periodEnd: Date.now() + 30 * DAY, cancelAtPeriodEnd: false });
    await webhook(t.url, 'customer.subscription.created', { object: 'subscription', id: 'sub_1' });
    expect((await t.api('/account', { method: 'DELETE', token: me.session })).status).toBe(200);
    expect(f.calls.cancel).toEqual(['sub_1']);
    expect(t.store.supporters.size).toBe(0);
    // Stripe's "deleted" event afterwards doesn't bring it back
    await webhook(t.url, 'customer.subscription.deleted', { object: 'subscription', id: 'sub_1' });
    expect(t.store.supporters.size).toBe(0);
  });
});
