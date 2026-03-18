# MOxE Components – Troubleshooting

When "components are not working" in MOxE, check the following.

## 1. Build and imports

- **Frontend build:** Run `npm run build` in the `FRONTEND` folder. If it succeeds, all imports and routes resolve.
- **Backend:** Run `npm run dev` in the `BACKEND` folder. Many components depend on the API; if the backend is not running, login, feed, Job tools, and map features can fail or show errors.

## 2. Account type and routes

- **Job tools (`/job/*`):** Only available when the logged-in account type is **JOB**. If you use a Personal/Creator/Business account and open `/job/overview`, you are redirected to `/`. Use a Job account to test Job tools.
- **Bottom nav:** Personal/Creator/Business see: Home, Explore, Map, Message, Profile. Job (social mode) sees: Home, **Projects** (→ `/job/work`), Map, Message, Profile.
- **Global bottom nav** is hidden on `/job/*`; the Job screen uses its own bottom nav (Home, Work, Recruit, More).

## 3. Navigation

- **Job:** From any Job tool, use **Back** in the header to return to app home (`/`). Use the bottom tabs (Home, Work, Recruit) or **More** to switch between Job tools.
- **Map:** The Map tab is a single screen with links to MOxE Map, Nearby Places, Nearby Messaging, SOS, and Proximity Alerts. Each link goes to its sub-screen.

## 4. Common fixes applied

- **Job header:** Back link restored so users can leave Job and return to `/`.
- **Personal/Professional toggle:** Removed from the Job header; Job tools no longer depend on it.
- **Bottom tabs:** Aligned with spec (5 tabs; Shop removed from the bar; Map is the unified location screen).
- **Auth:** Login and signup flow and error messages improved; backend returns a valid `accountId` in the token.

## 5. If a specific component fails

- **Browser console:** Check for red errors (e.g. "Cannot read property of undefined", failed `fetch`).
- **Network tab:** Check for 401 (auth), 404 (wrong URL or backend route), or 500 (backend error). Ensure `VITE_API_URL` (or default `http://localhost:5007/api`) matches your backend.
- **Redux:** If the app expects `currentAccount` or `capabilities`, ensure you have logged in and that `GET /accounts/me` returns the expected shape so the store is populated.

## 6. Quick checklist

| Check | Command / action |
|-------|-------------------|
| Frontend builds | `cd FRONTEND && npm run build` |
| Backend runs | `cd BACKEND && npm run dev` (port 5007) |
| Job tools | Log in with a **JOB** account and open `/job/overview` or use Projects → Work |
| Map features | Open the **Map** tab and use the cards to open each sub-feature |
| Auth | Use Login or phone verification; ensure backend is up and DB is migrated |
