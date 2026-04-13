import Stripe from 'stripe';

let stripeSingleton: Stripe | null | undefined;

/** Stripe client when `STRIPE_SECRET_KEY` is set (shared by commerce, live purchases, etc.). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (stripeSingleton === undefined) {
    stripeSingleton = new Stripe(key, { apiVersion: '2023-10-16', typescript: true });
  }
  return stripeSingleton;
}
