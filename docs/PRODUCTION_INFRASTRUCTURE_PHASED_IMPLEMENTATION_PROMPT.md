# Cursor AI Prompt: Implement Production Infrastructure (Phase by Phase)

This document captures a **phase-by-phase implementation prompt** for wiring MOxE’s production infrastructure, building on `docs/PRODUCTION_INFRASTRUCTURE_PROMPT.md`.

It breaks the work into concrete phases:

- Phase 1: Database (PostgreSQL + Prisma)
- Phase 2: SMS (Twilio)
- Phase 3: Email (SendGrid)
- Phase 4: Storage (S3 + CloudFront)
- Phase 5: Payments (Stripe)
- Phase 6: Push Notifications (Web Push)
- Phase 7: Search (Algolia) – optional
- Phase 8: Deployment Configuration
- Phase 9: Monitoring
- Phase 10: Final Verification

The body of your last message contains detailed code and command templates for:

- Creating `BACKEND/scripts/deploy-db.sh` for migrations.
- Adding a `prisma/seed.ts` script and wiring `"db:deploy"` / `"seed"` npm scripts.
- Adding `/api/health` and `/api/health/detailed` routes for DB and app health.
- Implementing `sms.service.ts` and updating `auth.routes.ts` for Twilio-based phone verification.
- Implementing `email.service.ts` and `email.routes.ts` for SendGrid email verification and password reset.
- Implementing `storage.service.ts` and `upload.routes.ts` for S3 + CloudFront file handling.
- Implementing `payment.service.ts`, `webhook.routes.ts`, and `payment.routes.ts` for Stripe checkout, subscriptions, and webhooks.

### How to use this file

1. When you are ready to **implement or adjust** production infra, open this file and paste the prompt content into Cursor as your instruction context.
2. Execute phases **sequentially**, committing after each major phase:
   - Set appropriate values in `BACKEND/.env.production`.
   - Add or adjust the services/routes exactly as described.
   - Run the provided commands (migrations, seeds, health checks, curl tests).
3. Keep all secret keys (DB, Twilio, SendGrid, Stripe, AWS, etc.) in environment variables (Render/Vercel dashboards or `.env.production`), never in committed code.
4. Use the health routes and curl examples to verify connectivity after each phase before moving on.

This file is a **guide/prompt container**, not executable code. Always adapt table names, Prisma models, and route wiring to the current schema in `BACKEND/prisma/schema.prisma` and existing Express app structure before applying changes.

