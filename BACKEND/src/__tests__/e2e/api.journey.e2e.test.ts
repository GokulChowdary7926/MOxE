/**
 * Full-stack API journey: register → login → /accounts/me → /posts/feed.
 * Skips when DATABASE_URL is unset (e.g. CI without Postgres). Set DATABASE_URL locally to run.
 */
import request from 'supertest';
import { app, prisma } from '../../server';

const hasDb = Boolean(process.env.DATABASE_URL);

(hasDb ? describe : describe.skip)('E2E API journey (requires DATABASE_URL)', () => {
  const uniqueSuffix = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const mkUsername = (prefix: string) => `${prefix}_${uniqueSuffix()}`.slice(0, 30);
  const username = mkUsername('e2e');
  const password = 'testpass1';
  const displayName = 'E2E User';

  let token: string;

  afterAll(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

  it('POST /api/auth/register creates user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username, displayName, password, accountType: 'PERSONAL' })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.accountId).toBeTruthy();
    token = res.body.token as string;
  });

  it('POST /api/auth/login returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ loginId: username, password })
      .expect(200);
    expect(res.body.token).toBeTruthy();
    token = res.body.token as string;
  });

  it('GET /api/accounts/me returns account + capabilities', async () => {
    const res = await request(app)
      .get('/api/accounts/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.account).toBeDefined();
    expect(res.body.account.username).toBe(username);
    expect(res.body.capabilities).toBeDefined();
  });

  it('GET /api/posts/feed returns items + nextCursor', async () => {
    const res = await request(app)
      .get('/api/posts/feed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('nextCursor');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /api/commerce/catalog filters by minPrice and maxPrice', async () => {
    const sellerUsername = mkUsername('e2e_seller');

    const sellerReg = await request(app)
      .post('/api/auth/register')
      .send({
        username: sellerUsername,
        displayName: 'E2E Seller',
        password: 'testpass1',
        accountType: 'BUSINESS',
      })
      .expect(201);

    const sellerAccountId = String(sellerReg.body.accountId);

    const created = await Promise.all([
      prisma.product.create({
        data: {
          accountId: sellerAccountId,
          name: 'E2E Cheap',
          description: 'below range',
          price: 99,
          images: [],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          accountId: sellerAccountId,
          name: 'E2E Mid',
          description: 'within range',
          price: 250,
          images: [],
          isActive: true,
        },
      }),
      prisma.product.create({
        data: {
          accountId: sellerAccountId,
          name: 'E2E High',
          description: 'above range',
          price: 999,
          images: [],
          isActive: true,
        },
      }),
    ]);

    const mid = created[1];

    const res = await request(app)
      .get('/api/commerce/catalog')
      .query({ minPrice: 200, maxPrice: 500, q: 'E2E', limit: 60 })
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    const ids = (res.body.items as Array<{ id: string }>).map((x) => x.id);
    expect(ids).toContain(mid.id);
    expect(ids).not.toContain(created[0].id);
    expect(ids).not.toContain(created[2].id);
  });
});
