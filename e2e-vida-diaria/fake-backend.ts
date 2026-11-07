// Local stand-in for the Supabase functions used by «Inglés para el día a día». It applies the SAME contract module as
// the Edge Functions (supabase/functions/_shared/vida-diaria.ts) to events signed like Stripe's test-mode webhooks,
// and serves paid modules/media from their server folders. Nothing here talks to Stripe or Supabase.
import { createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Page, Route } from '@playwright/test';
import {
  VD_PRODUCT, accessChangeFromEvent, accessStatus, applyAccessChange, applyPayment, canStartCheckout, decideModule,
  paymentFromEvent, planCheckout, vdPriceIds, type CheckoutState, type CourseAccessRow,
} from '../supabase/functions/_shared/vida-diaria';

// Paid content comes from the private package (VD_PREMIUM_DIR), never from this public repository.
export const PREMIUM = process.env.VD_PREMIUM_DIR ? path.resolve(process.env.VD_PREMIUM_DIR) : null;
export const API = 'http://127.0.0.1:54399';
const SECRET = 'whsec_e2e_test_only';
const PRICE = 'price_e2e_vida_diaria';
const DAY = 86_400;

export const USERS = { a: { id: '00000000-0000-4000-8000-00000000000a', email: 'ana.prueba@example.com' }, b: { id: '00000000-0000-4000-8000-00000000000b', email: 'otra.cuenta@example.com' } };

export class FakeBackend {
  rows = new Map<string, CourseAccessRow>();
  seen = new Set<string>();
  payments = new Map<string, string>();
  now = Math.floor(Date.now() / 1000);
  log: string[] = [];
  private n = 0;

  /** Stripe-style signed delivery → verify → contract → course_access row (like billing-webhook + apply_course_access). */
  deliver(type: string, user: string, sub: { status?: string; end?: number; cancel?: boolean }) {
    const end = sub.end ?? this.now + 30 * DAY;
    const object = type === 'invoice.paid'
      ? { parent: { subscription_details: { metadata: { user_id: user, product: VD_PRODUCT }, subscription: `sub_e2e_${user}` } },
          lines: { data: [{ period: { start: end - 30 * DAY, end }, pricing: { price_details: { price: PRICE } } }] } }
      : { id: `sub_e2e_${user}`, status: sub.status ?? 'active', customer: `cus_e2e_${user}`, cancel_at_period_end: sub.cancel ?? false,
          metadata: { user_id: user, product: VD_PRODUCT }, items: { data: [{ price: { id: PRICE }, current_period_start: end - 30 * DAY, current_period_end: end }] } };
    const event = { id: `evt_e2e_${++this.n}`, type, created: this.now, data: { object } };
    const payload = JSON.stringify(event);
    const header = `t=${this.now},v1=${createHmac('sha256', SECRET).update(`${this.now}.${payload}`).digest('hex')}`;
    const v1 = header.split(',')[1].slice(3);
    const expected = createHmac('sha256', SECRET).update(`${header.split(',')[0].slice(2)}.${payload}`).digest('hex');
    if (!timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) throw new Error('bad signature');
    const parsed = JSON.parse(payload);
    const payment = paymentFromEvent(parsed, vdPriceIds(PRICE));
    const change = payment ? null : accessChangeFromEvent(parsed, vdPriceIds(PRICE));
    if (payment) applyPayment(this.rows, this.seen, this.payments, payment);
    if (change) applyAccessChange(this.rows, this.seen, this.payments, change);
    this.log.push(`${type} ${user} ${sub.status ?? 'active'}${sub.cancel ? ' cancel_at_period_end' : ''}`);
  }

  row(user: string) { return this.rows.get(`${user}:${VD_PRODUCT}`) ?? null; }

  /** Stripe test checkout completed and paid: the two signed events, payment first (any order is valid). */
  subscribe(user: string, end = this.now + 30 * DAY) {
    this.deliver('invoice.paid', user, { end });
    this.deliver('customer.subscription.created', user, { end });
  }

  checkouts = new Map<string, CheckoutState>();
  sessionsCreated = 0;
  portalCustomers: string[] = [];

  async install(page: Page) {
    await page.route(`${API}/**`, (route) => this.handle(route));
  }

  private userOf(route: Route) {
    const token = route.request().headers()['authorization']?.replace(/^Bearer\s+/i, '') ?? '';
    return Object.values(USERS).find((u) => token === `token-${u.id}`) ?? null;
  }

  private async handle(route: Route) {
    const req = route.request();
    const url = new URL(req.url());
    const cors = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4174', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const json = (status: number, body: unknown) => route.fulfill({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!url.pathname.startsWith('/functions/v1/')) return json(404, { error: 'not_found' });
    const user = this.userOf(route);
    if (!user) return json(401, { error: 'sign_in' });
    const body = JSON.parse(req.postData() ?? '{}');
    const row = this.row(user.id);
    const nowMs = this.now * 1000;
    const fn = url.pathname.split('/').pop();
    if (fn === 'billing-checkout') {
      if (body.product !== VD_PRODUCT) return json(400, { error: 'invalid_product' });
      if (!canStartCheckout(row, nowMs)) return json(409, { error: 'already_active' });
      const plan = planCheckout(user.id, this.checkouts.get(user.id) ?? null, nowMs);
      if (plan.action === 'create') {
        this.sessionsCreated++;
        this.checkouts.set(user.id, { attempt: plan.attempt, session_id: `cs_e2e_${this.sessionsCreated}`, url: 'http://127.0.0.1:4174/vida-diaria/?pago=ok', expires_at: new Date(nowMs + 3600_000).toISOString() });
      }
      // Stripe test checkout completes → invoice.paid and subscription.created are delivered signed to the webhook.
      this.subscribe(user.id);
      return json(200, { url: 'http://127.0.0.1:4174/vida-diaria/?pago=ok' });
    }
    if (fn !== 'vida-diaria') return json(404, { error: 'not_found' });
    if (body.action === 'status') return json(200, accessStatus(row, nowMs));
    if (body.action === 'portal') {
      if (!row?.stripe_customer_id) return json(404, { error: 'no_customer' });
      this.portalCustomers.push(row.stripe_customer_id);
      return json(200, { url: 'http://127.0.0.1:4174/vida-diaria/#/' });
    }
    const decision = decideModule(body.module, row, nowMs);
    if (decision === 'unknown_module') return json(404, { error: decision });
    if (decision === 'payment_required') return json(402, { error: decision });
    if (decision === 'sample') return json(400, { error: 'public_sample' });
    if (body.action === 'module') {
      return json(200, { module: JSON.parse(fs.readFileSync(path.join(PREMIUM!, 'modules', `${body.module}.json`), 'utf8')) });
    }
    if (body.action === 'media') {
      const ext = body.kind === 'es' ? '.es.vtt' : body.kind === 'en' ? '.en.vtt' : '.mp4';
      const file = path.join(PREMIUM!, 'media', `dia-${body.module}-${body.source === 'flow' ? 'flow' : 'capitulo'}${ext}`);
      if (!fs.existsSync(file)) return json(404, { error: 'media_missing' });
      return route.fulfill({ status: 200, headers: { ...cors, 'Content-Type': ext === '.mp4' ? 'video/mp4' : 'text/vtt' }, body: fs.readFileSync(file) });
    }
    return json(400, { error: 'invalid_action' });
  }
}

/** A signed-in Supabase session in the browser (what supabase-js keeps after the email code). */
export async function signIn(page: Page, user: { id: string; email: string }) {
  const session = {
    access_token: `token-${user.id}`, refresh_token: 'e2e-refresh', token_type: 'bearer', expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
  await page.addInitScript((s) => localStorage.setItem('sb-127-auth-token', s), JSON.stringify(session));
}
