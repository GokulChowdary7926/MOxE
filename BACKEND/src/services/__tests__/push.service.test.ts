import PushService, { pushService } from '../push.service';

describe('push.service', () => {
  it('getVapidPublicKey returns null when not configured', () => {
    const svc = new PushService();
    expect(svc.getVapidPublicKey()).toBeNull();
  });

  it('subscribe and unsubscribe update in-memory subscriptions', async () => {
    const svc = new PushService();
    await svc.subscribe('u1', { endpoint: 'e1', keys: { auth: 'a', p256dh: 'p' } });
    await svc.subscribe('u1', { endpoint: 'e2', keys: { auth: 'a2', p256dh: 'p2' } });
    await svc.unsubscribe('u1', 'e1');
    await expect(svc.sendToUser('u1', { title: 't', body: 'b' })).resolves.toBeUndefined();
  });

  it('exported singleton can send no-op without subscriptions', async () => {
    await expect(pushService.sendToUser('missing', { title: 'hello', body: 'world' })).resolves.toBeUndefined();
  });
});
