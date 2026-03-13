# MOxE Production Readiness Checklist

What’s needed to **fully finish** MOxE for production. Use this as a single source of truth and tick off items as you complete them.

---

## 1. Replace stubs and mock data

### 1.1 Stub pages (replace with real UIs)
- **Audio** (`/audio/stub`) – Currently `StubSetting`. Build a real Audio page (e.g. saved audio / music) or remove the route.
- **Crossposting** (`/settings/crossposting`) – Stub. Implement crossposting settings or remove.
- **Time management** (`/time-management`) – Stub. Implement screen time / usage or remove.

### 1.2 Features still using mocks (wire to backend)
- **Home feed** – Uses `mockPosts`, `mockStories` when API returns empty. Ensure feed API is primary; use mocks only as dev fallback.
- **Explore** – Uses `mockPosts` for grid. Wire to explore/search API.
- **Notifications** – Falls back to `mockNotifications` / `mockUsers`. Wire fully to `/notifications` API.
- **Profile** (other users) – Uses `mockUsers` for follow state. Use real profile/follow APIs.
- **Blocked / Restricted / Muted lists** – Use `mockUsers` and local state. Wire to backend block/restrict/mute APIs.
- **Close Friends list** – Local state + `mockUsers`. Wire to `GET/POST/DELETE /api/close-friends`.
- **Close Friends Add** – “Done” only navigates back; selected users are not saved. Call `POST /api/close-friends` with `friendId` for each selected user.
- **Archive** (profile archive) – Uses `mockPosts`. Wire to `GET /api/posts/archived` and optionally `POST /api/posts/:postId/archive` (and unarchive).
- **Watch history** – Uses `mockReels` and `mockPosts`. Wire to your activity/watch-history API when it exists.
- **Messages** – Partially wired; ensure all threads and DMs use real API.
- **Map** (nearby, SOS, proximity) – Uses mock data where applicable; connect to real location/alert APIs.
- **Search / Hashtag / Location** – Use real search and discovery APIs.

### 1.3 Auth and account
- **Forgot password** – Comment says “Stub: connect your backend”. Implement backend (e.g. send reset link via email/SMS) and call it from the frontend.

---

## 2. Backend gaps

- **Password reset** – Add endpoints (e.g. request reset, verify token, set new password) and optional Twilio/email integration.
- **Close Friends** – Backend exists (`/api/close-friends`). Ensure frontend uses it everywhere (list, add, remove).
- **Post archive** – Backend has `GET /api/posts/archived`, `POST /api/posts/:postId/archive`, `POST /api/posts/:postId/unarchive`. Archive page and profile “Archive” should call these.
- **Story archive** – Backend has `/api/archive` (story archive). Already used by Story Archive and Manage Highlights. Ensure cron for `runArchiveJob` is set in production.
- **Rate limiting / security** – Confirm production limits (auth, API, uploads) and CORS for your frontend origin.
- **Env and secrets** – No `.env` in FRONTEND. Add `FRONTEND/.env.example` with `VITE_API_URL=https://api.yourdomain.com` (and any other `VITE_*` vars) for production builds.

---

## 3. Frontend configuration and build

- **Single API base** – Many files use `import.meta.env.VITE_API_URL || 'http://localhost:5007/api'`. Prefer one shared `getApiBase()` from `services/api.ts` everywhere so production only needs `VITE_API_URL` set.
- **Production env** – Create `FRONTEND/.env.production` (or CI env) with `VITE_API_URL` pointing to your production API. Do not commit secrets.
- **Build and preview** – Run `npm run build` and `npm run preview`; fix any broken routes or missing assets.

---

## 4. Consistency and polish

- **UI consistency** – Core flows (Home, Explore, Saved, Archive, Watch history, Close Friends) use the dark layout and design system. Apply the same pattern to remaining screens (Notifications, Activity, Settings sub-pages, Job sub-pages) where needed.
- **Select mode** – “Select” on Saved / Watch history / Archive is wired for UI only. Implement bulk actions (e.g. unsave, delete from history, unarchive) if required.
- **Filter dropdowns** – “Newest to oldest”, “All dates”, “All content types” are UI-only. Hook to real query params and API filters when available.
- **Error and loading** – Ensure all API-driven pages show loading states and user-friendly errors (and retry where appropriate).
- **401 handling** – Centralize “token expired” / 401: clear token and redirect to login (e.g. in `fetchApi` or an axios interceptor).

---

## 5. Testing and quality

- **Backend** – You have tests under `BACKEND/src/services/__tests__/`. Keep running `npm test`; add tests for new or critical endpoints (auth, payments, close friends, archive).
- **Frontend** – No frontend test suite found. Consider adding a small set of tests (e.g. login flow, critical pages) with React Testing Library + Vitest.
- **E2E** – Optional but recommended for signup, login, post creation, and one paid flow if you have payments.

---

## 6. Deployment and ops

- **Backend** – Set `NODE_ENV=production`, use a process manager (e.g. PM2). Configure DB (e.g. PostgreSQL), run migrations, set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, and optional Twilio/Stripe/AWS env vars.
- **Frontend** – Serve built static files (e.g. Nginx, Vercel, Netlify) with `VITE_API_URL` pointing to the production API. Ensure SPA fallback for client-side routes.
- **Cron** – If you use the story archive job, call the archive cron endpoint (with `X-Cron-Secret`) on a schedule (e.g. every hour).
- **Monitoring** – Add error tracking (e.g. Sentry) and basic health checks for the API.

---

## 7. Optional but recommended

- **Analytics** – Events for key actions (signup, login, post, follow, share).
- **Performance** – Lazy-load heavy routes (e.g. Job, Commerce, Ads); optimize images and bundles.
- **Accessibility** – Keyboard navigation, focus order, and ARIA where it improves screen-reader support.
- **Documentation** – Short README per app (FRONTEND, BACKEND) with how to run, build, and set env vars for production.

---

## Quick reference: APIs to wire from frontend

| Feature           | Backend route / behavior                     | Frontend status              |
|------------------|-----------------------------------------------|-----------------------------|
| Close Friends    | `GET/POST/DELETE /api/close-friends`          | Mock; wire list/add/remove  |
| Post archive     | `GET /api/posts/archived`, archive/unarchive | Archive page uses mock      |
| Forgot password  | Not implemented                              | Stub; implement end-to-end |
| Feed             | Feed API                                     | Mock fallback               |
| Explore          | Explore/search API                           | Mock                        |
| Notifications    | `/api/notifications`                         | Mock fallback               |
| Blocked/Muted    | Account/safety APIs                          | Mock                        |

---

When these items are done, MOxE will be in a solid state for production. Prioritize: (1) replace stubs and wire Close Friends + Archive + Forgot password, (2) production env and build, (3) 401 handling and error/loading states, (4) tests and deployment.
