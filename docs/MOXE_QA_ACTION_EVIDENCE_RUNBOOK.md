# QA Action Evidence Generation — Complete Runbook

Exact commands, expected outputs, and evidence collection for EC2 QA actions. Paths and limits match the current MOxE backend (`BACKEND/src`).

**Infra order:** Run **`docs/MOXE_EC2_QA_ACTION_PLAN.md`** → *Minimal Handoff (3 Steps)* first (DNS → Certbot → Nginx body size), then collect evidence below.

---

## ACT-001: HTTPS enablement — evidence commands

Run on EC2 after Certbot installation. Replace `<your-domain>` with your real hostname (for example `moxe.app`).

```bash
# 1) Verify certificate is installed
sudo certbot certificates

# Expected (shape):
# Found the following certs:
#   Certificate Name: <your-domain>
#   Domains: <your-domain> www.<your-domain>
#   Expiry Date: <date> (VALID: <days> days)

# 2) Test HTTPS response
curl -I "https://<your-domain>"

# Expected: HTTP/2 200 (or 301→200), server: nginx, no TLS errors

# 3) Check TLS negotiation details
curl -vI "https://<your-domain>" 2>&1 | grep -E "SSL connection|TLS"

# 4) Verify auto-renewal is scheduled
sudo systemctl status certbot.timer
# Expected: active (waiting)

# 5) API health over HTTPS (MOxE shape)
curl -sS "https://<your-domain>/api/health/live"
```

**Expected API body** for `GET /api/health/live` (see `BACKEND/src/routes/health.routes.ts`):

```json
{"status":"alive","timestamp":"<ISO8601>"}
```

**Evidence:** Save terminal output to `ACT-001_evidence.txt` (include `certbot certificates`, `curl -I`, and `curl -sS .../api/health/live`).

---

## ACT-002: Geolocation on HTTPS — browser tests

### Method 1: Browser console (quick)

Open `https://<your-domain>`, DevTools → Console:

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log("Location success:", pos.coords.latitude, pos.coords.longitude),
  (err) => console.error("Geolocation error:", err.message)
);
```

**Expected:** Coordinates print; no `Only secure origins are allowed` (that error appears on plain HTTP).

### Method 2: Playwright (optional CI)

Create `FRONTEND/e2e/geolocation-https.spec.ts` (run only when `baseURL` or test URL is HTTPS):

```typescript
import { test, expect } from '@playwright/test';

test('Geolocation works on HTTPS', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('/map');
  const locationGranted = await page.evaluate(() => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
      );
    });
  });
  expect(locationGranted).toBe(true);
});
```

**Evidence:** Screenshot of console with coordinates, or Playwright HTML report.

---

## ACT-003: Upload limit verification — commands

MOxE mounts uploads at **`POST /api/upload`** and **`POST /upload`** (same handler). Limits in `BACKEND/src/routes/upload.routes.ts`:

| Route | Multer limit | Typical use |
|--------|----------------|-------------|
| `POST /api/upload` (field `file`) | **20MB** | Images/videos for feed, etc. |
| `POST /api/upload/multiple` (field `files`) | **20MB** per file | Batches |
| `POST /api/upload/track` (field `file`) | **100MB** | TRACK attachments |

Nginx `client_max_body_size` must be **≥** the size you test (often **50M**). If Nginx is 50MB, the practical maximum through the proxy is **50MB** even when Multer allows 100MB on `/track`.

### 1) Confirm Nginx

```bash
sudo nginx -T | grep client_max_body_size
# Expected: client_max_body_size 50M; (or higher) in server or location blocks
```

### 2) Curl — standard post upload (stay under 20MB)

```bash
dd if=/dev/zero of=18mb.mp4 bs=1M count=18
curl -X POST "https://<your-domain>/api/upload" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@18mb.mp4;type=video/mp4" \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: HTTP 200, JSON with url/key (unless storage quota exceeded → 413 JSON)
```

### 3) Curl — larger file via `/track` (under Nginx and Multer caps)

```bash
dd if=/dev/zero of=45mb.bin bs=1M count=45
curl -X POST "https://<your-domain>/api/upload/track" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@45mb.bin;type=application/octet-stream" \
  -w "\nHTTP Status: %{http_code}\n"
# Expected: 200 if under Nginx limit and account storage; 413 if Nginx body limit exceeded
```

### 4) Manual UI

- Open create-post (or relevant screen) and upload ~18MB media → should succeed for normal post flow.
- For “large file” stress, use a flow that hits `/api/upload/track` if your product uses it.

**Evidence:** Terminal output for curl + Network tab screenshot (no `413` for the intended route and file size).

---

## ACT-004: Nearby 24h retention — test script

Nearby messaging is **real-time over Socket.IO**, not a simple `GET /api/nearby/messages` in this codebase. Treat **manual two-device** testing as the source of truth; optional automation would require socket clients or dedicated integration tests.

**Manual steps**

1. Two accounts A and B, same geographic radius, both on Nearby messaging.
2. A sends several messages; B should see them immediately (screenshot).
3. Refresh / rejoin after ~2–5 minutes; history should still replay (screenshot).
4. Optional long soak: recheck at +1h, +24h against product expectation (server-side TTL for in-memory history is documented in `BACKEND/src/sockets/nearbyHistory.ts`).

**Evidence:** Screenshots with visible timestamps at T=0, T=short-delay, and (if run) T=24h.

---

## ACT-005: SOS delivery — test script

Backend route: **`POST /api/safety/sos`** with JSON body `latitude` / `longitude` optional (`BACKEND/src/routes/safety.routes.ts`). Notifications use type **`SOS_ALERT`**.

### Manual

1. Add emergency contacts for Account A (other user accounts B, C).
2. Trigger SOS from A (UI or API below).
3. On B (and C): open **Notifications** / activity and confirm SOS.
4. Repeat with geolocation denied; SOS should still notify (may omit coordinates).

### API examples

```bash
# Trigger SOS (Account A token)
curl -sS -X POST "https://<your-domain>/api/safety/sos" \
  -H "Authorization: Bearer <TOKEN_A>" \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946}'

# List notifications (Account B — emergency contact)
curl -sS "https://<your-domain>/api/notifications?limit=50" \
  -H "Authorization: Bearer <TOKEN_B>"
```

Filter with **jq** (if installed):

```bash
curl -sS "https://<your-domain>/api/notifications?limit=50" \
  -H "Authorization: Bearer <TOKEN_B>" \
  | jq '.items[] | select(.type == "SOS_ALERT")'
```

**Expected:** At least one item with `type` `SOS_ALERT` after A triggers SOS (when contacts and backend delivery succeed).

**Evidence:** Recipient screenshot + redacted JSON snippet or jq output.

---

## Final sign-off

Use and fill: `docs/QA_SIGN_OFF.md`.

---

## Optional: Playwright QA snippet

Save under `FRONTEND/e2e/` only for **HTTPS** environments; point `baseURL` at your domain.

```typescript
import { test, expect } from '@playwright/test';

test('ACT-002: Geolocation resolves on HTTPS', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('/map');
  const hasLocation = await page.evaluate(() => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
      );
    });
  });
  expect(hasLocation).toBe(true);
});
```

Run:

```bash
cd FRONTEND && npx playwright test e2e/geolocation-https.spec.ts
```
