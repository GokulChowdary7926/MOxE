# MOxE AWS Deployment — Step-by-Step Execution Guide

**Continue from EC2 launch** through a full deploy on a single Ubuntu EC2 instance.

> **Shorter overview:** [`MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md`](./MOXE_AWS_FREE_TIER_STUDENT_GUIDE.md)  
> **General production:** [`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md)  
> **Automated EC2 script (bash):** [`MOXE_EC2_DEPLOY_SCRIPT_README.md`](./MOXE_EC2_DEPLOY_SCRIPT_README.md) + [`../scripts/deploy-ec2-moxe.sh`](../scripts/deploy-ec2-moxe.sh)

**Replace placeholders:** `YOUR_EC2_PUBLIC_IP` (e.g. `15.135.70.106`), `moxe-key.pem`, and passwords throughout.

**Instance types:** `t2.micro` or **`t3.micro`** (your console may show `t3.micro` in `ap-southeast-2` — check [AWS Free Tier](https://aws.amazon.com/free/) for current eligibility).

---

## SECTION 1: AFTER LAUNCH — CONNECT TO EC2

### 1.1 Locate your instance (EC2 → Instances → your server)

Copy:

- **Public IPv4 address** (e.g. `15.135.70.106`)
- **Public IPv4 DNS** (optional)

### 1.2 Connect via SSH

```bash
cd ~/Downloads   # or wherever moxe-key.pem is

chmod 400 moxe-key.pem

ssh -i moxe-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**If SSH fails:** Security group must allow **SSH (22)** from your IP (or `0.0.0.0/0` for class projects — less secure). Wait 1–2 minutes after launch.

**Success looks like:** `ubuntu@ip-172-31-xx-xx:~$`

---

## SECTION 2: INITIAL SERVER SETUP

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip
```

### Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### PM2

```bash
sudo npm install -g pm2
pm2 --version
```

---

## SECTION 3: DATABASE SETUP

```bash
sudo -u postgres psql << 'SQL'
CREATE DATABASE moxe;
CREATE USER moxe_user WITH PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE moxe TO moxe_user;
ALTER DATABASE moxe OWNER TO moxe_user;
SQL
```

**Prisma / PostgreSQL 15+** often needs schema privileges. As `postgres`:

```bash
sudo -u postgres psql -d moxe << 'SQL'
GRANT ALL ON SCHEMA public TO moxe_user;
ALTER SCHEMA public OWNER TO moxe_user;
SQL
```

Test:

```bash
sudo -u postgres psql -d moxe -c "\dt"
```

---

## SECTION 4: DEPLOY BACKEND

```bash
sudo mkdir -p /var/www/moxe
sudo chown -R ubuntu:ubuntu /var/www/moxe
cd /var/www/moxe
```

**Upload code — from your laptop:**

```bash
scp -i ~/Downloads/moxe-key.pem -r ./BACKEND ubuntu@YOUR_EC2_PUBLIC_IP:/var/www/moxe/
scp -i ~/Downloads/moxe-key.pem -r ./FRONTEND ubuntu@YOUR_EC2_PUBLIC_IP:/var/www/moxe/
```

**Or clone on EC2:**

```bash
cd /var/www/moxe
git clone https://github.com/YOUR_ORG/MOxE.git .
```

### Install, env, Prisma, build

```bash
cd /var/www/moxe/BACKEND
npm install

export JWT_SECRET=$(openssl rand -base64 32)
export PUBLIC_URL="http://YOUR_EC2_PUBLIC_IP"

cat > .env << EOF
NODE_ENV=production
PORT=5007
DATABASE_URL=postgresql://moxe_user:REPLACE_WITH_STRONG_PASSWORD@localhost:5432/moxe
JWT_SECRET=${JWT_SECRET}
CLIENT_URL=${PUBLIC_URL}
API_URL=${PUBLIC_URL}
UPLOAD_BASE_URL=${PUBLIC_URL}
EOF
```

> Do **not** put `$(openssl ...)` inside a **single-quoted** heredoc — it won’t run. The `export JWT_SECRET=...` pattern above is correct.

```bash
npx prisma generate
npx prisma migrate deploy

mkdir -p uploads
chmod 755 uploads

npm run build
```

### PM2

```bash
pm2 start dist/server.js --name moxe-api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Run the command pm2 prints if needed
```

### Verify backend (direct to Node)

```bash
curl -s http://127.0.0.1:5007/health
curl -s http://127.0.0.1:5007/api/health/live
```

MOxE exposes `/health` and `/api/health/live` — use either for smoke tests.

---

## SECTION 5: DEPLOY FRONTEND

```bash
cd /var/www/moxe/FRONTEND
npm install

# Must include /api — same host as browser will use
echo "VITE_API_URL=http://YOUR_EC2_PUBLIC_IP/api" > .env.production

npm run build

sudo mkdir -p /var/www/html
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

---

## SECTION 6: CONFIGURE NGINX (CRITICAL FOR MOxE)

Express serves the API under **`/api/...`**. The upstream `proxy_pass` must **keep** the `/api` path.

**Wrong (breaks routes):**

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5007/;   # BAD — strips /api
}
```

**Correct:**

```bash
sudo nano /etc/nginx/sites-available/moxe
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    client_max_body_size 50M;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Preserve full URI: /api/foo → Node receives /api/foo
    location /api/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Option A: let Node serve uploads (matches Express /uploads)
    location /uploads/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Option B: serve files directly from disk (if you prefer)
    # location /uploads/ {
    #     alias /var/www/moxe/BACKEND/uploads/;
    # }
}
```

Enable:

```bash
sudo ln -sf /etc/nginx/sites-available/moxe /etc/nginx/sites-enabled/moxe
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Test through Nginx:

```bash
curl -s http://127.0.0.1/api/health/live
curl -s http://127.0.0.1/health
```

---

## SECTION 7: FIREWALL (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

**AWS Security Group** must also allow **80** (and **443** if you add HTTPS later).

---

## SECTION 8: TEST DEPLOYMENT

- **Frontend:** `http://YOUR_EC2_PUBLIC_IP`
- **API health:** `http://YOUR_EC2_PUBLIC_IP/api/health/live` or `http://YOUR_EC2_PUBLIC_IP/health`

**WebSocket:** The app’s `socket.io-client` connects to the **same origin** as the API (no `/api`). With the config above, Socket.IO works over port 80 via Nginx.

Quick check from server:

```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  "http://127.0.0.1/socket.io/?EIO=4&transport=websocket"
```

(Exact query may vary; if the app loads in the browser and DMs/Nearby connect, you’re good.)

---

## SECTION 9: MONITORING & RESTARTS

```bash
pm2 status
pm2 logs moxe-api --lines 50
sudo systemctl status nginx postgresql
sudo tail -f /var/log/nginx/error.log
```

```bash
pm2 restart moxe-api
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

---

## SECTION 10: BACKUPS

```bash
mkdir -p /home/ubuntu/backups
```

Example `pg_dump` (set `PGPASSWORD` or use `.pgpass`):

```bash
export PGPASSWORD='REPLACE_WITH_STRONG_PASSWORD'
pg_dump -U moxe_user -h localhost moxe | gzip > /home/ubuntu/backups/moxe_$(date +%Y%m%d).sql.gz
```

Cron (daily 02:00):

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * PGPASSWORD='...' pg_dump -U moxe_user -h localhost moxe | gzip > /home/ubuntu/backups/moxe_\$(date +\%Y\%m\%d).sql.gz") | crontab -
```

(Edit password securely — prefer IAM / SSM for secrets in real production.)

---

## SECTION 11: TROUBLESHOOTING

| Issue | What to check |
|-------|----------------|
| **502** | `pm2 logs moxe-api`, `npm run build`, `dist/server.js` exists |
| **API 404** | Nginx `proxy_pass` for `/api/` (see §6) |
| **CORS** | `CLIENT_URL` in `.env` = exact browser URL (`http://IP`) |
| **Prisma migrate errors** | DB user owns `public` schema; `DATABASE_URL` password matches |
| **WebSocket** | `location /socket.io/`, `Upgrade` headers, same host as `CLIENT_URL` |

---

## SECTION 12: UPDATES (GIT PULL)

```bash
cd /var/www/moxe/BACKEND
git pull
npm install
npm run build
npx prisma migrate deploy
pm2 restart moxe-api

cd /var/www/moxe/FRONTEND
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

---

## SECTION 13: OPTIONAL NEXT STEPS

| Goal | Action |
|------|--------|
| **HTTPS** | Domain → DNS A record → `certbot --nginx` |
| **Elastic IP** | So the public IP doesn’t change on stop/start |
| **Swap (small RAM)** | Add 1–2G swap if `t3.micro` runs OOM during `npm run build` |
| **IMDSv2** | New instances may require a token for metadata; for scripts, prefer hardcoding Elastic IP in `.env` |

---

## Quick reference

```bash
ssh -i moxe-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
pm2 restart moxe-api && pm2 logs moxe-api --lines 30
sudo systemctl restart nginx
```

**App URL:** `http://YOUR_EC2_PUBLIC_IP`

---

*Last aligned with MOxE Express routes (`/api/*`, `/uploads`, `/health`, Socket.IO) and Nginx path preservation.*
