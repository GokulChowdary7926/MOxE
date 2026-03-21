# MOxE on AWS Free Tier — Complete Student Guide

**Deploy MOxE for $0 using AWS Free Tier** (single EC2 + PostgreSQL on instance + Nginx + PM2).

> **Also read:** [`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md) for env vars, Socket.IO, and production checklist. This guide focuses on **one cheap AWS layout** for students.  
> **Step-by-step commands (launch → SSH → PM2 → Nginx):** [`MOXE_AWS_STEP_BY_STEP_EXECUTION.md`](./MOXE_AWS_STEP_BY_STEP_EXECUTION.md)

> **Nginx note:** MOxE serves the API under **`/api/...`** on the Node process. The `proxy_pass` examples below preserve the full path (see §3.8).

---

## SECTION 1: AWS FREE TIER OVERVIEW

### 1.1 What's Free (12 months)

| Service | Free Tier Limit | MOxE Usage |
|---------|-----------------|------------|
| **EC2 (t2.micro)** | 750 hours/month | API + WebSocket server |
| **RDS (db.t2.micro)** | 750 hours/month | PostgreSQL (optional; this guide uses Postgres **on EC2** to stay simple) |
| **S3** | 5 GB storage | Optional: frontend static files |
| **CloudFront** | 1 TB data transfer | Optional CDN |
| **Route 53** | Not free | Use public IP or free DNS (Cloudflare, DuckDNS) |
| **Secrets Manager** | Not free | Use `.env` or EC2 Parameter Store sparingly |

### 1.2 Student-Specific Options

| Option | Description | Cost |
|--------|-------------|------|
| **AWS Educate** | Credits for students | Varies |
| **GitHub Student Developer Pack** | May include AWS credits | Varies |
| **Always Free Tier** | t2.micro EC2 (limits apply) | $0 within limits |

*Verify current limits on [AWS Free Tier](https://aws.amazon.com/free/) — they change over time.*

---

## SECTION 2: SIMPLIFIED ARCHITECTURE (FREE TIER)

### 2.1 Single-Server Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EC2 t2.micro (1 instance)                 │
│  Ubuntu 22.04 LTS                                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express + Socket.IO (PORT from .env, e.g. 5007)│  │
│  │  - REST API under /api/*                                 │  │
│  │  - WebSocket /socket.io/                                 │  │
│  │  - /uploads static                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Nginx — :80 / :443 → proxy to Node + serve SPA         │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (localhost) — same instance                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  /var/www/html — React build (dist/)                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
                 Elastic IP (recommended)
```

### 2.2 Why This Works for Free Tier

| Component | Approach |
|-----------|----------|
| **Database** | PostgreSQL on same EC2 (no RDS bill; simpler backup) |
| **API** | One Node process behind Nginx |
| **Frontend** | Static `dist/` via Nginx (or S3 later) |
| **WebSockets** | Same origin as API host; Nginx must upgrade WebSockets |
| **HTTPS** | Let’s Encrypt when you have a domain |

---

## SECTION 3: STEP-BY-STEP DEPLOYMENT

### 3.1 AWS Account Setup (Student)

1. Sign up at [AWS](https://aws.amazon.com/) (or AWS Educate if your school offers it).
2. Open [EC2 Console](https://console.aws.amazon.com/ec2/).

### 3.2 Launch EC2 Instance

1. **Launch instance** → Name: `moxe-server`
2. **AMI:** Ubuntu 22.04 LTS
3. **Instance type:** `t2.micro` (Free tier eligible where available)
4. **Key pair:** Create `moxe-key.pem` and download it
5. **Security group:** Allow **22** (SSH), **80** (HTTP), **443** (HTTPS optional)
6. **Storage:** 20–30 GB gp2/gp3
7. **Launch**

### 3.3 Connect to EC2

```bash
chmod 400 moxe-key.pem
ssh -i moxe-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

(Optional) **Allocate Elastic IP** and associate it so your IP doesn’t change on restart.

### 3.4 Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node --version
npm --version

sudo apt install -y postgresql postgresql-contrib nginx git
sudo npm install -g pm2
```

### 3.5 Configure PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql << 'SQL'
CREATE DATABASE moxe;
CREATE USER moxe_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE moxe TO moxe_user;
ALTER DATABASE moxe OWNER TO moxe_user;
SQL
```

For Prisma you may need `GRANT ALL ON SCHEMA public TO moxe_user` and default privileges on PostgreSQL 15+ — run `npx prisma migrate deploy` and fix errors if any.

### 3.6 Clone and Setup Backend

```bash
sudo mkdir -p /var/www/moxe
sudo chown -R ubuntu:ubuntu /var/www/moxe
cd /var/www/moxe

# Replace with your repo
git clone https://github.com/yourusername/MOxE.git .
# Or upload BACKEND/ and FRONTEND/ with scp

cd BACKEND
npm install

# IMPORTANT: CLIENT_URL = exact URL users use in the browser for the SPA (e.g. http://YOUR_IP)
cat > .env << EOF
NODE_ENV=production
PORT=5007
DATABASE_URL=postgresql://moxe_user:your_strong_password@localhost:5432/moxe
JWT_SECRET=$(openssl rand -base64 32)
CLIENT_URL=http://YOUR_EC2_PUBLIC_IP
API_URL=http://YOUR_EC2_PUBLIC_IP
UPLOAD_BASE_URL=http://YOUR_EC2_PUBLIC_IP
EOF

npx prisma generate
npx prisma migrate deploy
mkdir -p uploads
npm run build
```

### 3.7 Build Frontend

```bash
cd /var/www/moxe/FRONTEND
npm install

# Browser will call API at same host: /api → Nginx proxies to Node
# VITE_API_URL must end with /api
echo "VITE_API_URL=http://YOUR_EC2_PUBLIC_IP/api" > .env.production

npm run build
sudo mkdir -p /var/www/html
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### 3.8 Configure Nginx (correct paths for MOxE)

MOxE Express mounts routes at **`/api/...`**. The proxy must **not** strip `/api`.

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    root /var/www/html;
    index index.html;

    # SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — preserve full URI: /api/foo → Node receives /api/foo
    location /api/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO (same Node server)
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

    # Uploads served by Express (recommended)
    location /uploads/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:

```bash
sudo nano /etc/nginx/sites-available/moxe   # paste config
sudo ln -sf /etc/nginx/sites-available/moxe /etc/nginx/sites-enabled/moxe
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 3.9 Start Backend with PM2

```bash
cd /var/www/moxe/BACKEND
pm2 start dist/server.js --name moxe-api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 3.10 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## SECTION 4: HTTPS (Let’s Encrypt)

Requires a **domain** pointing to your server (not IP-only for standard Let’s Encrypt).

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Update `CLIENT_URL` and `VITE_API_URL` to `https://...` and rebuild the frontend.

---

## SECTION 5: FREE DNS OPTIONS

| Service | Notes |
|---------|--------|
| **Cloudflare** | DNS + free SSL (orange cloud) |
| **DuckDNS** | `duckdns.org` subdomains |
| **No-IP** | Dynamic DNS |

---

## SECTION 6: BACKUPS

Example pg_dump cron:

```bash
mkdir -p /home/ubuntu/backups
pg_dump -U moxe_user -h localhost moxe > /home/ubuntu/backups/moxe_$(date +%Y%m%d).sql
```

---

## SECTION 7: HEALTH CHECKS

MOxE exposes:

- `GET http://127.0.0.1:5007/api/health/live`
- `GET http://127.0.0.1:5007/api/health/ready`
- `GET http://127.0.0.1:5007/health` (root)

Example:

```bash
curl -sf http://127.0.0.1:5007/api/health/live
```

---

## SECTION 8: TROUBLESHOOTING

| Issue | What to check |
|-------|----------------|
| `502 Bad Gateway` | `pm2 status`, `pm2 logs moxe-api`, Node listening on `PORT` |
| API 404 / wrong path | Nginx `proxy_pass` must **not** strip `/api` (see §3.8) |
| CORS errors | `CLIENT_URL` in `.env` must match browser URL (scheme + host + port) |
| WebSocket fails | Socket.IO `location /socket.io/` and `Upgrade` headers |
| Prisma errors | `DATABASE_URL`, PostgreSQL user privileges on `public` schema |

---

## SECTION 9: MAINTENANCE

```bash
cd /var/www/moxe
git pull
cd BACKEND && npm install && npm run build && pm2 restart moxe-api
cd ../FRONTEND && npm install && npm run build && sudo cp -r dist/* /var/www/html/
```

---

## SECTION 10: COST & BUDGETS

Set **AWS Budgets** / billing alerts to avoid surprise charges if you leave free tier or add services.

---

## SECTION 11: ONE‑LINER DEPLOY NOTES

Automated scripts (e.g. “one-click”) must **not** use `proxy_pass http://127.0.0.1:5007/` with a trailing slash on `/api/` — that breaks MOxE routing. Always use the pattern in **§3.8**.

If you use **IMDS** for metadata (`curl 169.254.169.254`), newer instances may require **IMDSv2** (token) — prefer typing your public IP or Elastic IP into `.env` for homework projects.

---

## SECTION 12: UPGRADE PATH

| Need | Action |
|------|--------|
| More CPU/RAM | Larger instance type |
| Managed DB | RDS PostgreSQL |
| Uploads off disk | S3 + presigned URLs |
| HA / multiple Node | Load balancer + **Redis adapter** for Socket.IO |

---

*This guide is for learning and small deployments. For production, add monitoring, backups off-site, and security hardening.*
