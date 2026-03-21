# MOxE EC2 deployment script — reference

This document accompanies **`scripts/deploy-ec2-moxe.sh`**: a single-server deploy for Ubuntu EC2 (Nginx + Node/PM2 + PostgreSQL + Vite build).

## Quick start (on EC2)

1. SSH in (from your laptop):

   ```bash
   ssh -i /path/to/moxe-key.pem ubuntu@15.135.70.106
   ```

2. **Either** clone this repo on the server **or** upload the `MOxE` folder (e.g. `scp -r`).

3. Run the script **from any directory** (it uses `/var/www/moxe` by default):

   ```bash
   export MOXE_GIT_URL="https://github.com/YOUR_ORG/MOxE.git"   # if code not already on disk
   export MOXE_PUBLIC_IP="15.135.70.106"
   bash /path/to/MOxE/scripts/deploy-ec2-moxe.sh
   ```

   If the repo is already at `/var/www/moxe` with `BACKEND/` and `FRONTEND/`, omit `MOXE_GIT_URL`.

4. Copy secrets off the server (see **Security** below):

   ```bash
   cat ~/.moxe-secrets/moxe-credentials.txt
   ```

---

## What the script does

| Step | Action |
|------|--------|
| Secrets | Generates DB password (hex) + `JWT_SECRET` / `JWT_REFRESH_SECRET` (base64); stores under `~/.moxe-secrets/` |
| Packages | `apt`: nginx, postgresql, ufw, git, curl, build tools; Node.js 18 via NodeSource; `pm2` global |
| PostgreSQL | Creates `moxe` DB + `moxe_user`; `GRANT ALL ON SCHEMA public`; default privileges for Prisma |
| Backend | Writes `BACKEND/.env`, `npm ci`/`npm install`, `prisma generate`, `prisma migrate deploy`, `npm run build` |
| PM2 | `pm2 start dist/server.js --name moxe-api`, `pm2 save`, systemd startup |
| Frontend | `VITE_API_URL=http://<IP>/api`, `npm run build`, copy `dist/` → `/var/www/html` |
| Nginx | **`proxy_pass http://127.0.0.1:5007;` (no trailing URI)** for `/api/`, `/socket.io/`, `/uploads/` |
| UFW | SSH + “Nginx Full” (80/443) |
| Tests | `curl` `/health`, `/api/health/live`, Nginx proxy, Socket.IO polling handshake |

---

## Verification checklist

After a successful run:

- [ ] Script exits with **“deploy finished OK”** and log path printed.
- [ ] **Browser:** `http://15.135.70.106` loads the SPA (no blank page / nginx 502).
- [ ] **API (direct):** `curl -s http://127.0.0.1:5007/api/health/live | jq .` → `status: "alive"`.
- [ ] **API (via Nginx):** `curl -s http://127.0.0.1/api/health/live | jq .` same JSON.
- [ ] **DB readiness:** `curl -s http://127.0.0.1:5007/api/health/ready | jq .` → `status: "ready"` (DB connected).
- [ ] **PM2:** `pm2 status` shows `moxe-api` **online**.
- [ ] **Real-time:** Log in and test DMs / notifications / Nearby / Live as you normally would (same origin + `CLIENT_URL`).

---

## Troubleshooting

### 502 Bad Gateway from Nginx

```bash
pm2 logs moxe-api --lines 80
curl -sS http://127.0.0.1:5007/health
sudo nginx -t
```

### Prisma / database errors

```bash
# As postgres
sudo -u postgres psql -d moxe -c '\dn+'
sudo -u postgres psql -d moxe -c '\dt'
grep DATABASE_URL /var/www/moxe/BACKEND/.env
```

### Nginx `/api` returns 404 from Express

- Confirm **`proxy_pass` has no trailing slash** on the `location /api/` block:

  `proxy_pass http://127.0.0.1:5007;`

### Out of memory during `npm run build`

```bash
export NODE_OPTIONS="--max-old-space-size=1536"
# re-run backend/frontend build steps manually
```

### UFW locked you out

Use **AWS Session Manager** or **EC2 Serial Console** if SSH was blocked; in normal cases the script allows `OpenSSH` before enabling.

### Git clone fails (private repo)

Use a deploy key or PAT, or `scp -r` your project to `/var/www/moxe` and re-run **without** `MOXE_GIT_URL`.

---

## Maintenance commands

```bash
# Logs
pm2 logs moxe-api
sudo tail -f /var/log/nginx/error.log

# Restart API after code/config change
cd /var/www/moxe/BACKEND && npm run build && pm2 restart moxe-api

# Restart Nginx after config edit
sudo nginx -t && sudo systemctl reload nginx

# Update from git and redeploy
export MOXE_GIT_URL="https://github.com/YOUR_ORG/MOxE.git"
export MOXE_PUBLIC_IP="15.135.70.106"
bash /var/www/moxe/scripts/deploy-ec2-moxe.sh
```

### Database backup (manual)

```bash
export PGPASSWORD="$(tr -d '\n' < ~/.moxe-secrets/db_password.txt)"
pg_dump -U moxe_user -h localhost moxe | gzip > ~/moxe-backup-$(date +%Y%m%d).sql.gz
```

---

## Security notes

1. **Credentials file:** `~/.moxe-secrets/moxe-credentials.txt` and sibling files contain **live secrets**. Copy them to a password manager, then **restrict SSH access** to your IP in the AWS security group.
2. **Rotate secrets** if the instance was ever shared or imaged.
3. **HTTPS:** With a domain pointing at this instance, use Let’s Encrypt:

   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

   Update `CLIENT_URL`, `API_URL`, and `VITE_API_URL` to `https://…` and rebuild frontend + restart PM2.

4. **Default passwords:** There are no default app passwords—the script generates random DB and JWT material. Change anything you typed manually in `.env` if you merge custom settings.

---

## Related docs

- [`MOXE_AWS_STEP_BY_STEP_EXECUTION.md`](./MOXE_AWS_STEP_BY_STEP_EXECUTION.md) — manual step-by-step
- [`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md) — production architecture & env vars
- [`MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md`](./MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md) — Free Tier layout

---

*Example IP `15.135.70.106` is illustrative; set `MOXE_PUBLIC_IP` to your Elastic/Public IPv4.*
