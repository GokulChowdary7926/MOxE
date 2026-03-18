import { getApiBase, getToken } from './api';

class PushClient {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidKey: string | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async init(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (this.registration) return true;

    this.registration = await navigator.serviceWorker.register('/service-worker.js');

    const res = await fetch(`${getApiBase().replace(/\/$/, '')}/push/vapid-public-key`);
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    if (!data.publicKey) return false;
    this.vapidKey = data.publicKey;
    return true;
  }

  private async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) return null;
    return this.registration.pushManager.getSubscription();
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const token = getToken();
    if (!token) return false;
    if (!this.registration || !this.vapidKey) {
      const ok = await this.init();
      if (!ok) return false;
    }
    const existing = await this.getSubscription();
    if (existing) await existing.unsubscribe().catch(() => {});

    const sub = await this.registration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey!),
    });

    const res = await fetch(`${getApiBase().replace(/\/$/, '')}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
    return res.ok;
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const token = getToken();
    if (!token) return false;
    const sub = await this.getSubscription();
    if (!sub) return true;

    const res = await fetch(`${getApiBase().replace(/\/$/, '')}/push/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe().catch(() => {});
    return res.ok;
  }

  async sendTest(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;
    const res = await fetch(`${getApiBase().replace(/\/$/, '')}/push/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return res.ok;
  }
}

export const pushClient = new PushClient();

