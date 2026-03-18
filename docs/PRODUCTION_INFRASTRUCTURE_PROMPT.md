# Cursor AI Prompt: Wire Up Production Infrastructure for MOxE

Use this prompt when you want Cursor AI (or another assistant) to help you connect MOxE to real production infrastructure using PostgreSQL + Prisma and external services (SMS, email, storage, payments, push, search).

The recommended provider mix for MOxE is **Option B (Render + Twilio + SendGrid + S3 + Stripe + Algolia + FCM/Web Push)**. The full step‑by‑step instructions, including environment variables, Prisma setup, Twilio/SMS service, SendGrid email service, S3+CloudFront storage, Stripe payments and webhooks, push notifications (VAPID), and deployment configs for Render (backend) and Vercel (frontend), are captured in the long prompt from your last message.

**How to use this file:**

1. When you are ready to wire up or adjust production infra, open this file and paste the full prompt into Cursor as your instruction context.
2. Choose your actual providers (e.g. Render Postgres, Twilio, SendGrid, S3+CloudFront, Stripe) and fill in real credentials in `BACKEND/.env.production` and deployment dashboards (Render, Vercel, etc.).
3. Run through the phases in order:
   - Phase 1: Database setup (Render Postgres + Prisma migrations + seed + `/api/health`).
   - Phase 2: SMS via Twilio (`sms.service.ts`, phone verification).
   - Phase 3: Email via SendGrid (`email.service.ts`, verification + password reset).
   - Phase 4: Storage via S3 + CloudFront (`storage.service.ts`, `upload.routes.ts`).
   - Phase 5: Payments via Stripe (`payment.service.ts`, Stripe webhook route).
   - Phase 6: Push notifications (Web Push VAPID keys + `push.service.ts` + routes).
   - Phase 7: Optional search (Algolia or Postgres full‑text).
   - Phase 8–10: Deployment configs (Render, Vercel), verification script, monitoring/logging.
4. Keep all real secrets only in environment variables (Render/Vercel dashboards or `.env.production`), never in code or committed files.

This file exists as a **pointer and summary** so MOxE’s production wiring plan lives in the repo and can be reused whenever you spin up a new environment.

