# MOxE Production Deployment Checklist

## Pre-Deployment
- [ ] All critical env vars configured in `BACKEND/.env.production`
- [ ] All critical env vars configured in `FRONTEND/.env.production`
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Seed script run if needed (`npm run prisma:seed`)
- [ ] Backend TypeScript passes (`npx tsc --noEmit` in `BACKEND`)
- [ ] Frontend TypeScript passes (`npx tsc --noEmit` in `FRONTEND`)
- [ ] Frontend build succeeds (`npm run build` in `FRONTEND`)

## Infrastructure
- [ ] PostgreSQL database provisioned and reachable from backend
- [ ] Render Web Service created from `render.yaml`
- [ ] Vercel project configured from `vercel.json`
- [ ] Twilio credentials set (if SMS enabled)
- [ ] SendGrid credentials set (if email enabled)
- [ ] Stripe keys + webhook secret set (if payments enabled)
- [ ] AWS S3 + CDN config set (if external storage enabled)
- [ ] Algolia keys + indices set (if search enabled)
- [ ] Sentry DSNs configured (backend + frontend) if monitoring desired

## Application Health
- [ ] Backend `/health` returns 200 in production
- [ ] Core routes load without errors:
  - [ ] `/` Home
  - [ ] `/feed`
  - [ ] `/profile`
  - [ ] `/messages`
  - [ ] `/explore`
  - [ ] `/notifications`
  - [ ] `/job/track`, `/job/flow`, `/job/status`, `/job/build`
  - [ ] `/commerce`
  - [ ] `/settings`

## External Integrations
- [ ] Test SMS verification flow in production
- [ ] Test email verification in production
- [ ] Test at least one Stripe checkout flow (in test mode)
- [ ] Test file uploads and confirm files are accessible via CDN/base URL
- [ ] Test push notifications (if VAPID keys configured)
- [ ] Test search requests against Algolia (if enabled)

## Monitoring & Logging
- [ ] Backend logs visible (Render dashboard or log sink)
- [ ] Sentry receiving backend error events
- [ ] Sentry receiving frontend error events
- [ ] Alerting rules configured in Sentry (for critical errors)

## Security
- [ ] HTTPS enforced on frontend + backend
- [ ] JWT secret is strong and stored only in env
- [ ] CORS configured correctly for production domain(s)
- [ ] Rate limiting active on `/api`
- [ ] No sensitive secrets in Git repo

## Final Steps
- [ ] Run `scripts/verify-production.sh` and ensure all checks pass
- [ ] Tag the release in Git (e.g. `v1.0.0`)
- [ ] Monitor logs and Sentry for 24–48h after first production deploy

