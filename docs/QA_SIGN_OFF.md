# MOxE EC2 QA Sign-Off Report

Use this after executing `docs/MOXE_QA_ACTION_EVIDENCE_RUNBOOK.md` and `docs/MOXE_EC2_QA_ACTION_PLAN.md`. Replace placeholders in **italics** (or empty cells) with your real values and evidence paths.

| Field | Value |
|-------|-------|
| **Date** | *e.g. 2026-04-18* |
| **QA Lead** | *(Your name)* |
| **Environment** | *e.g. Production EC2 — `https://your-domain.com`* |
| **Build / commit** | *e.g. output of `git rev-parse HEAD`* |
| **Release decision** | **GO** / **NO-GO** / **CONDITIONAL GO** |

---

## 1) Summary

Short narrative: what was verified, what was out of scope, P0/P1 status, and overall readiness.

*Example (delete when filling):* All P0 and P1 actions are defined with commands and expected outputs. Once evidence is attached for ACT-001–ACT-005, the release may move from **CONDITIONAL GO** to **GO**.

---

## 2) Action items status

| Action ID | Description | Status | Evidence (link or path) | Completed by | Date |
|-----------|-------------|--------|---------------------------|--------------|------|
| ACT-001 | HTTPS enablement | | *e.g. `ACT-001_evidence.txt`* | | |
| ACT-002 | Geolocation on HTTPS | | *e.g. screenshot or Playwright report* | | |
| ACT-003 | Upload limits (Nginx + app) | | *e.g. curl log + Network tab* | | |
| ACT-004 | Nearby 24h retention (manual / socket) | | *e.g. timed screenshots* | | |
| ACT-005 | SOS delivery to emergency contacts | | *e.g. notification screenshot + API snippet* | | |
| ACT-006 | Final sign-off (this document complete) | | *this file* | | |

---

## 3) Open defects

List any **S1** / **S2** items still open, or state **None**.

| ID | Severity | Title | Owner | Target date |
|----|----------|-------|-------|-------------|
| | | | | |

---

## 4) Recommendation

- **GO** — Release approved.
- **CONDITIONAL GO** — Approved once listed evidence is complete (or with waivers).
- **NO-GO** — Blockers remain.

**Waivers / conditions** (if any):

---

## 5) Signatures

| Role | Name | Date |
|------|------|------|
| QA Lead | | |
| Engineering Lead | | |
| Product (optional) | | |

---

## Quick reference — how to execute actions

1. **Infra (DNS, HTTPS, Nginx upload size):** `docs/MOXE_EC2_QA_ACTION_PLAN.md` → *Minimal Handoff (3 Steps)* and *Command Runbook*.
2. **Evidence commands** (curl, jq, expected JSON): `docs/MOXE_QA_ACTION_EVIDENCE_RUNBOOK.md`.

### ACT-001 — HTTPS

```bash
sudo certbot certificates
curl -I "https://<your-domain>"
curl -sS "https://<your-domain>/api/health/live"
```

Save terminal output → e.g. `ACT-001_evidence.txt`.  
Expected API body includes `"status":"alive"`.

### ACT-002 — Geolocation (browser)

On `https://<your-domain>`, DevTools Console:

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log(pos.coords.latitude, pos.coords.longitude),
  (err) => console.error(err.message)
);
```

Screenshot → e.g. `ACT-002_evidence.png`.

### ACT-003 — Upload limits

```bash
sudo nginx -T | grep client_max_body_size
```

Normal story/post upload uses **`POST /api/upload`** with a **≤20MB** file per app limits (see runbook). Example:

```bash
dd if=/dev/zero of=18mb.mp4 bs=1M count=18
curl -X POST "https://<your-domain>/api/upload" \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@18mb.mp4;type=video/mp4" \
  -w "\nHTTP: %{http_code}\n"
```

Log → e.g. `ACT-003_evidence.txt`.

### ACT-004 — Nearby retention

Two accounts, same radius; send messages; verify replay after refresh; optional long checks at +1h / +24h. Screenshots with timestamps → e.g. `ACT-004_evidence.png`.

### ACT-005 — SOS

```bash
curl -sS -X POST "https://<your-domain>/api/safety/sos" \
  -H "Authorization: Bearer <TOKEN_A>" \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.9716,"longitude":77.5946}'

curl -sS "https://<your-domain>/api/notifications?limit=50" \
  -H "Authorization: Bearer <TOKEN_B>" \
  | jq '.items[] | select(.type == "SOS_ALERT")'
```

Save output + recipient UI screenshot → e.g. `ACT-005_evidence.txt` / `.png`.

---

When all evidence is collected, set each action to **PASS**, update **Release decision** to **GO**, and complete signatures.
