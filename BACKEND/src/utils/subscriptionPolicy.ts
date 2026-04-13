/**
 * Temporary production policy:
 * do not block features behind subscription prompts.
 *
 * Set MOXE_ENFORCE_SUBSCRIPTION_GATING=true to re-enable normal gating.
 */
export function bypassSubscriptionGatingInProduction(): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  const enforce = (process.env.MOXE_ENFORCE_SUBSCRIPTION_GATING || '').toLowerCase().trim();
  return enforce !== 'true';
}

