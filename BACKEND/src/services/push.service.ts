interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Schema-safe, dependency-light push service.
 * Keeps subscriptions in memory and logs notifications instead of calling
 * an external push provider. API surface matches routes for now.
 */
class PushService {
  private subscriptions = new Map<string, PushSubscription[]>();

  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  async subscribe(userId: string, subscription: PushSubscription): Promise<void> {
    const existing = this.subscriptions.get(userId) || [];
    const deduped = existing.filter((s) => s.endpoint !== subscription.endpoint);
    deduped.push(subscription);
    this.subscriptions.set(userId, deduped);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    const existing = this.subscriptions.get(userId) || [];
    this.subscriptions.set(
      userId,
      existing.filter((s) => s.endpoint !== endpoint),
    );
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const subs = this.subscriptions.get(userId) || [];
    if (!subs.length) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[Push MOCK] No subscriptions for user, skipping', { userId });
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[Push MOCK] Would send notification', {
        userId,
        payload,
        subscriptionCount: subs.length,
      });
    }
  }
}

export const pushService = new PushService();

export default PushService;

