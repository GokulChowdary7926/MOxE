/**
 * Live gifts & badges — Stripe-backed purchases when enabled, otherwise local ledger IDs (no PSP).
 *
 * Without Stripe: `purchaseId` is `local_badge_<uuid>` / `local_gift_<uuid>` (internal-only, not a payment).
 * Stripe: set `LIVE_STRIPE_ENABLED=true` and `STRIPE_SECRET_KEY`. Client creates a PaymentIntent
 * via `POST .../payment-intent`, pays with Stripe.js, then calls badges/gifts with `paymentIntentId`.
 */

import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { AppError } from '../utils/AppError';
import { getStripe } from '../utils/stripeClient';

export function isLiveStripePurchasesEnabled(): boolean {
  return (process.env.LIVE_STRIPE_ENABLED || '').toLowerCase().trim() === 'true' && !!getStripe();
}

/** Internal ledger id when Stripe is disabled (not a real payment provider id). */
export function localLedgerPurchaseId(kind: 'badge' | 'gift'): string {
  return `local_${kind}_${randomUUID()}`;
}

function currency(): string {
  return (process.env.STRIPE_CURRENCY || 'usd').toLowerCase().trim() || 'usd';
}

export async function createBadgePaymentIntent(params: {
  buyerId: string;
  liveId: string;
  tier: string;
  amount: number;
}): Promise<{ clientSecret: string | null; paymentIntentId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe is not configured (STRIPE_SECRET_KEY)', 503);
  const amountCents = Math.round(Number(params.amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new AppError('amount must be at least 0.50 in charge currency', 400);
  }
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency(),
    metadata: {
      kind: 'live_badge',
      liveId: params.liveId,
      buyerId: params.buyerId,
      tier: params.tier.toUpperCase(),
    },
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
}

export async function createGiftPaymentIntent(params: {
  giverId: string;
  liveId: string;
  giftType: string;
  amount: number;
}): Promise<{ clientSecret: string | null; paymentIntentId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe is not configured (STRIPE_SECRET_KEY)', 503);
  const amountCents = Math.round(Number(params.amount) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    throw new AppError('amount must be at least 0.50 in charge currency', 400);
  }
  const pi = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency(),
    metadata: {
      kind: 'live_gift',
      liveId: params.liveId,
      giverId: params.giverId,
      giftType: params.giftType.toUpperCase(),
    },
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
}

export async function assertBadgePaymentIntent(params: {
  paymentIntentId: string;
  buyerId: string;
  liveId: string;
  tier: string;
  amount: number;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe is not configured', 503);
  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (pi.status !== 'succeeded') {
    throw new AppError(`Payment not completed (status: ${pi.status})`, 402);
  }
  const md = pi.metadata || {};
  if (md.kind !== 'live_badge') throw new AppError('Invalid payment for live badge', 400);
  if (md.liveId !== params.liveId || md.buyerId !== params.buyerId) {
    throw new AppError('Payment does not match this live or buyer', 400);
  }
  if ((md.tier || '').toUpperCase() !== params.tier.toUpperCase()) {
    throw new AppError('Payment tier mismatch', 400);
  }
  const expectedCents = Math.round(Number(params.amount) * 100);
  if (pi.amount !== expectedCents) throw new AppError('Payment amount mismatch', 400);
  return pi.id;
}

export async function assertGiftPaymentIntent(params: {
  paymentIntentId: string;
  giverId: string;
  liveId: string;
  giftType: string;
  amount: number;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new AppError('Stripe is not configured', 503);
  const pi = await stripe.paymentIntents.retrieve(params.paymentIntentId);
  if (pi.status !== 'succeeded') {
    throw new AppError(`Payment not completed (status: ${pi.status})`, 402);
  }
  const md = pi.metadata || {};
  if (md.kind !== 'live_gift') throw new AppError('Invalid payment for live gift', 400);
  if (md.liveId !== params.liveId || md.giverId !== params.giverId) {
    throw new AppError('Payment does not match this live or giver', 400);
  }
  if ((md.giftType || '').toUpperCase() !== params.giftType.toUpperCase()) {
    throw new AppError('Payment gift type mismatch', 400);
  }
  const expectedCents = Math.round(Number(params.amount) * 100);
  if (pi.amount !== expectedCents) throw new AppError('Payment amount mismatch', 400);
  return pi.id;
}
