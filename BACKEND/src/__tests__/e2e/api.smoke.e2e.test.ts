/**
 * HTTP smoke tests — no database required for /api/health/live and auth root.
 * Run: npm run test:e2e (separate Jest process so service-test mocks never shadow ../server).
 */
import request from 'supertest';
import { app } from '../../server';

describe('API smoke (E2E)', () => {
  it('GET /api/health/live returns alive', async () => {
    const res = await request(app).get('/api/health/live').expect(200);
    expect(res.body).toMatchObject({ status: 'alive' });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /api/auth returns auth service marker', async () => {
    const res = await request(app).get('/api/auth').expect(200);
    expect(res.body).toEqual({ service: 'auth' });
  });

  it('GET /api/health/ready returns JSON (200 or 503)', async () => {
    const res = await request(app).get('/api/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('checks');
    expect(res.body).toHaveProperty('status');
  });
});
