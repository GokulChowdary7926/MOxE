# MOxE EC2 QA Action Plan

## Objective

Close remaining release blockers from the EC2 QA report and move from `CONDITIONAL GO` to `GO`.

You do not need to be the server expert—only someone with **SSH to EC2** and a **domain** (or subdomain) that can point at the instance IP.

---

## Minimal Handoff (3 Steps)

**1. Point DNS at the server**

- Add an **A record** (e.g. `app.example.com`) → your EC2 public IP (e.g. `13.126.171.152`).
- Wait for propagation (often 5–30 minutes; can be longer).

**2. TLS with Certbot (on the server)**

```bash
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
```

Run Certbot for **every hostname that exists in DNS and should serve HTTPS**. If you only created `app.example.com`, use that—do not request certs for names that do not resolve to this host.

```bash
# Example: single app host
sudo certbot --nginx -d app.example.com

# Example: apex + www (only if both have A records to this server)
# sudo certbot --nginx -d example.com -d www.example.com
```

```bash
sudo systemctl status certbot.timer
```

**3. Raise Nginx upload body limit**

Add `client_max_body_size` in `http`, `server`, or `location` (see ACT-003 below). **50M** clears many `413` cases; use **100M** if you need large **`POST /api/upload/track`** payloads and want the proxy limit to match the app.

Example — inside the `server { ... }` block for your site (path is often `/etc/nginx/sites-available/default` or a file under `sites-available/`):

```nginx
client_max_body_size 50M;
```

Then test and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Quick check over HTTPS (use the **same hostname** as in DNS and Certbot):

```bash
DOMAIN=app.example.com   # replace with your real hostname
curl -I "https://${DOMAIN}/api/health/live"
```

This covers **ACT-001** (HTTPS) and **ACT-003** (upload limits)—the two infra fixes for insecure-origin geolocation/camera issues and `413` on uploads. Details and QA steps follow.

---

## Priority Work Items

| Action ID | Task | Owner | Priority | Deadline | Success Criteria | Status |
|-----------|-------------|--------|----------|----------|------------------|--------|
| ACT-001 | Enable HTTPS for production domain | DevOps | P0 | +1 day | Public app served on HTTPS with valid TLS certificate | Open |
| ACT-002 | Re-validate geolocation on HTTPS | FE + QA | P0 | +1 day after ACT-001 | Map/Nearby/SOS geolocation works on real devices | Open |
| ACT-003 | Verify/upload max body size end-to-end | DevOps + QA | P0 | +1 day | No `413` for expected media limits; upload + playback pass | Open |
| ACT-004 | Run manual two-account Nearby 24h retention check | QA | P1 | +2 days | Messages remain available until 24h TTL boundary | Open |
| ACT-005 | Run manual two-account SOS delivery check | QA | P1 | +2 days | Emergency contacts receive notifications promptly | Open |
| ACT-006 | Publish final sign-off report | QA Lead | P1 | +2 days | Signed report attached with all P0 items PASS | Open |

---

## Command Runbook (EC2)

Use the **same hostname** everywhere: DNS A record, Certbot `-d` flags, and the `DOMAIN` variable in the commands below (avoids shell `<` redirection mistakes). Evidence commands and expected JSON shapes are in `docs/MOXE_QA_ACTION_EVIDENCE_RUNBOOK.md`.

### ACT-001: HTTPS enablement (Nginx + Certbot)

```bash
# On EC2
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Set your real hostname once (must match DNS and Minimal Handoff steps 1–2).
DOMAIN=app.example.com
# For multiple names that all resolve here, e.g.:
# sudo certbot --nginx -d "$DOMAIN" -d "www.example.com"

sudo certbot --nginx -d "$DOMAIN"

# Verify renewal timer
sudo systemctl status certbot.timer
```

Validation:

```bash
curl -I "https://${DOMAIN}"
curl -sS "https://${DOMAIN}/api/health/live"
```

### ACT-003: Upload limit verification

Ensure Nginx config contains `client_max_body_size` (e.g. **50M** or **100M**) in `http`, `server`, or relevant `location` blocks, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**App limits** (see `BACKEND/src/routes/upload.routes.ts`): `POST /api/upload` accepts up to **20MB** per file; `POST /api/upload/track` up to **100MB**. Nginx must allow at least the size you test (a **50M** proxy cap still blocks **100MB** track uploads—use **100M** at the proxy if you need full track size).

Runtime validation (reuse `DOMAIN` from ACT-001, or set `DOMAIN=app.example.com` first):

```bash
curl -sS "https://${DOMAIN}/api/health/live"
# UI: ~5MB and ~18MB via normal post upload (under 20MB).
# Stress: optional curl to /api/upload/track — see docs/MOXE_QA_ACTION_EVIDENCE_RUNBOOK.md
```

---

## QA Execution Steps

### ACT-002: Geolocation on HTTPS

1. Login with test user.
2. Open map page and allow location permission.
3. Confirm map centers on current location.
4. Open nearby messaging and verify location-based join succeeds.
5. Trigger SOS with and without permission to verify fallback.

Expected:

- No insecure-origin geolocation error.
- Location-enabled flows complete without runtime crash.

### ACT-004: Nearby 24h retention

1. Account A and Account B join nearby in same radius.
2. Send multiple messages from A.
3. Confirm B receives in real-time.
4. Refresh both clients and rejoin nearby; verify history replay.
5. Recheck at +1h, +6h, +24h.

Expected:

- Messages remain visible before 24h TTL.
- Expire only after TTL window.

### ACT-005: SOS delivery

1. Configure emergency contacts for Account A.
2. Trigger SOS from A.
3. Verify B/C accounts receive SOS notification.
4. Repeat with geolocation denied.

Expected:

- Notification reaches all contacts in both cases.

---

## Reporting Template for Completion

When each action is completed, append:

- Action ID:
- Completed by:
- Completion date/time:
- Evidence (screenshot/log link):
- Result (PASS/FAIL):
- Notes:

---

## Exit Criteria for Release GO

- ACT-001 PASS
- ACT-002 PASS
- ACT-003 PASS
- No open `S1`/`S2` defects
- QA and Engineering sign-off recorded

---

## See also

| Document | Purpose |
|----------|---------|
| `docs/MOXE_QA_ACTION_EVIDENCE_RUNBOOK.md` | Exact curl/jq commands, expected API bodies, evidence filenames |
| `docs/QA_SIGN_OFF.md` | Sign-off table, ACT-001–ACT-006 evidence slots, release decision |
