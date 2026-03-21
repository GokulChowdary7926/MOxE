# MOxE — Deploy for real-time production use

This guide explains how to run MOxE **in production** so the API, database, uploads, and **real-time features** (Socket.IO: DMs, notifications, Nearby, live, etc.) work for real users.

**Student / AWS Free Tier (single EC2):** see [`MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md`](./MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md). **Command-by-command runbook:** [`MOXE_AWS_STEP_BY_STEP_EXECUTION.md`](./MOXE_AWS_STEP_BY_STEP_EXECUTION.md).

---

## 1. Architecture (what you deploy)

| Piece | Role |
|--------|------|
| **PostgreSQL** | Primary database (Prisma). |
| **Node.js backend** | Express API on `/api`, static `/uploads`, **Socket.IO** on the same HTTP server (WebSockets). |
| **Frontend** | Vite **production build** (`dist/`) — static files (CDN, S3+CloudFront, Nginx, Vercel, Netlify, etc.). |

Real-time traffic uses **WebSockets** to the **same host/port as the API** (not `/api` path — the client connects to the API origin without `/api`). Your reverse proxy must **allow WebSocket upgrades**.

---

## 2. Prerequisites

- **Node.js** 18+ (match local dev).
- **PostgreSQL** 14+ (managed DB: RDS, Supabase, Neon, Railway, etc.).
- A **domain** + **HTTPS** (required for camera, geolocation, and secure cookies in browsers).
- (Optional) **S3** or compatible storage if you later move uploads off disk.

---

## 3. Backend deployment

### 3.1 Environment variables

Copy `BACKEND/.env.example` to `.env` on the server and set at least:

| Variable | Example | Notes |
|----------|---------|--------|
| `NODE_ENV` | `production` | Enables stricter CORS (see below). |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/moxe?schema=public` | Production Postgres connection string. |
| `PORT` | `5007` or `8080` | What the process listens on (behind a reverse proxy). |
| `JWT_SECRET` | Long random string | **Never** commit; rotate if leaked. |
| `CLIENT_URL` | `https://app.yourdomain.com` | **Exact** origin of your web app (scheme + host + port if any). Used for CORS and Socket.IO `cors.origin`. |

Optional but important for links and uploads:

| Variable | Notes |
|----------|--------|
| `API_URL` or `BACKEND_URL` | Public URL of the API, e.g. `https://api.yourdomain.com` |
| `UPLOAD_BASE_URL` | If uploads are served from the API host, often same as `https://api.yourdomain.com` |

Fill in **Google OAuth**, **Twilio**, **Spotify**, etc., only if you use those features (see `.env.example`).

### 3.2 CORS and production

In production, the backend only allows origins listed in `CLIENT_URL` (plus localhost for debugging). **`CLIENT_URL` must match** the URL users type in the browser for the frontend (e.g. `https://moxe.app`, not `http://` if you redirect to HTTPS).

If you use both `www` and bare domain, add both to `allowedOrigins` in `BACKEND/src/server.ts` or use a single canonical URL.

### 3.3 Database migrations

On the server (or CI):

```bash
cd BACKEND
npm ci
npx prisma migrate deploy
npm run build   # if you compile TS to dist
```

Run your start command, e.g.:

```bash
NODE_ENV=production node dist/server.js
```

(Adjust entrypoint if your `package.json` uses `ts-node` or another path.)

### 3.4 Reverse proxy (Nginx example)

- Proxy `https://api.yourdomain.com` → `http://127.0.0.1:5007`.
- **WebSockets** must pass through:

```nginx
location / {
    proxy_pass http://127.0.0.1:5007;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Socket.IO connects to the **same origin** you set in `VITE_API_URL` without `/api` for the socket path — ensure nothing strips `Upgrade` headers.

---

## 4. Frontend deployment

### 4.1 Build

```bash
cd FRONTEND
npm ci
```

Create **`FRONTEND/.env.production`** (or set vars in your host’s dashboard):

```bash
# Public URL of your API including /api — no trailing slash
VITE_API_URL=https://api.yourdomain.com/api
```

Build:

```bash
npm run build
```

Output is in **`FRONTEND/dist/`**. Upload that folder to any static host, or serve it with Nginx.

### 4.2 Same-origin vs split domains

- **Split** (common): `https://app.yourdomain.com` (static) + `https://api.yourdomain.com` (API).  
  - Set `CLIENT_URL=https://app.yourdomain.com` on the backend.  
  - Set `VITE_API_URL=https://api.yourdomain.com/api`.

- **Same origin**: Serve `dist` and reverse-proxy `/api` (and WebSocket) to Node on one domain.  
  - Then `VITE_API_URL` might be `https://yourdomain.com/api` and `CLIENT_URL=https://yourdomain.com`.

The **socket client** in `FRONTEND/services/socket.ts` derives the base URL from `VITE_API_URL` by removing `/api`. It must match your deployed API host.

---

## 5. Real-time (Socket.IO) in production

1. **One Node process**  
   Nearby rooms, DMs, and notifications work in memory on that instance.

2. **Multiple Node instances / horizontal scaling**  
   In-memory rooms are **not** shared across servers. You need a **Redis adapter** for Socket.IO (`@socket.io/redis-adapter`) so all instances share pub/sub. That is an extra implementation step beyond the default repo.

3. **HTTPS**  
   Use TLS on the public URL; mixed content (HTTPS page → `ws:`) will be blocked.

4. **Firewalls**  
   Ensure WebSocket traffic is allowed on the same routes as HTTPS.

---

## 6. Health check

The backend exposes health routes:

- `GET /api/health/live` — liveness  
- `GET /api/health/ready` — readiness (includes DB check)  
- `GET /health` — simple check at server root (see `server.ts`)

Example: `https://api.yourdomain.com/api/health/ready`

---

## 7. Checklist before go-live

- [ ] `DATABASE_URL` production DB; `prisma migrate deploy` applied.  
- [ ] `JWT_SECRET` strong and private.  
- [ ] `CLIENT_URL` matches the live frontend origin.  
- [ ] `VITE_API_URL` built into the frontend matches production API.  
- [ ] Reverse proxy: WebSocket **upgrade** enabled.  
- [ ] HTTPS everywhere.  
- [ ] `UPLOAD_BASE_URL` / file URLs reachable from browsers (CORS + correct host).  
- [ ] Google OAuth redirect URIs updated to production URLs (if used).

---

## 8. “Deploy in real time” — quick meaning

- **Real-time features** = Socket.IO + WebSockets + optional Redis for multi-server.  
- **Deploy** = host Postgres + Node API (with WS) + static `dist` + env vars above.

For a **fast managed path**, many teams use:

- **DB:** Neon / Supabase / Railway PostgreSQL  
- **API:** Railway, Render, Fly.io, or a VPS + PM2 + Nginx  
- **Frontend:** Vercel, Netlify, Cloudflare Pages, or Nginx serving `dist`

### AWS

See **[`MOXE_AWS_DEPLOYMENT.md`](./MOXE_AWS_DEPLOYMENT.md)** for RDS, ECS Fargate / Elastic Beanstalk, S3 + CloudFront, ALB + WebSockets, and Route 53.

---

## 9. Related files in this repo

- `BACKEND/.env.example` — all backend env hints  
- `BACKEND/src/server.ts` — CORS, `Server` (Socket.IO), `CLIENT_URL`  
- `FRONTEND/services/socket.ts` — how the client connects for real-time  
- `docs/DEV_SERVER.md` — local dev only  

---

## 10. Troubleshooting

| Symptom | What to check |
|--------|----------------|
| API 401 / CORS errors | `CLIENT_URL` vs browser URL; HTTPS vs HTTP. |
| Socket never connects | Proxy WebSocket headers; `VITE_API_URL` wrong; firewall. |
| Uploads broken | `UPLOAD_BASE_URL`, `/uploads` static route, disk permissions. |
| Works on one device only (Nearby) | Expected with one server; multi-server needs Redis adapter. |

If you tell us your target host (e.g. “Vercel + Railway”), we can narrow this to exact click-steps for that stack.
