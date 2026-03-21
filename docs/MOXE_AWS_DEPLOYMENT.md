# MOxE on AWS — deployment guide

This guide maps MOxE (Node API + Socket.IO + PostgreSQL + Vite SPA) to common **AWS** patterns. Adjust regions, names, and sizing to your needs.

---

## 1. Recommended architecture (overview)

```
Users (HTTPS)
    │
    ├─► CloudFront + S3          → Static SPA (FRONTEND/dist)
    │
    └─► Application Load Balancer  → ECS Fargate tasks (or EC2) → Node (Express + Socket.IO)
              │                              │
              │                              └─► RDS PostgreSQL (private subnets)
              │
              └─ WebSocket + HTTP (same ALB; enable sticky sessions if >1 task)
```

- **Frontend:** **S3** (private bucket) + **CloudFront** + **ACM** certificate + custom domain.
- **API + real-time:** **ECS Fargate** (or **Elastic Beanstalk** / single **EC2**) behind an **Application Load Balancer**.
- **Database:** **RDS for PostgreSQL** in private subnets.
- **Secrets:** **AWS Secrets Manager** (or SSM Parameter Store) for `DATABASE_URL`, `JWT_SECRET`, OAuth keys.

**Socket.IO:** The ALB supports WebSockets. If you run **more than one** Node task, enable **sticky sessions (session affinity)** on the target group so a client stays on one instance—or add a **Redis** (Elastiache) Socket.IO adapter later for shared rooms.

---

## 2. Database — Amazon RDS (PostgreSQL)

1. Create a **VPC** (or use default) with **private subnets** for RDS.
2. **RDS** → Create database → **PostgreSQL** → template per your SLA (Multi-AZ optional).
3. Security group: allow inbound **5432** only from the security group attached to your ECS tasks / EC2 / Beanstalk instances (not `0.0.0.0/0`).
4. Build connection string:

   `postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/moxe?schema=public`

5. Store as `DATABASE_URL` in Secrets Manager; inject into the container at runtime.

6. From CI or a bastion, run:

   ```bash
   cd BACKEND && npm ci && npx prisma migrate deploy
   ```

---

## 3. Backend — container on ECS Fargate (typical)

### 3.1 Dockerfile (add to repo root or `BACKEND/`)

Example `BACKEND/Dockerfile`:

```dockerfile
FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5007
CMD ["node", "dist/server.js"]
```

Build and push to **Amazon ECR**, then define an **ECS task definition** with:

- Port **5007** (or set `PORT` env to match).
- Environment variables from Secrets Manager / task definition:
  - `NODE_ENV=production`
  - `DATABASE_URL` (secret)
  - `JWT_SECRET` (secret)
  - `CLIENT_URL=https://app.yourdomain.com` (your **CloudFront** URL or custom domain)
  - `API_URL` / `BACKEND_URL` / `UPLOAD_BASE_URL` = public URL of the API (ALB DNS or `https://api.yourdomain.com`)

### 3.2 Application Load Balancer

- **Listener:** HTTPS (443) with **ACM** certificate.
- **Target group:** IP or instance targets, port **5007**, health check path **`/health`** or **`/api/health/live`** (see `server.ts`).
- **Stickiness:** If desired task count **> 1**, enable **stickiness** on the target group for WebSocket-heavy workloads (DMs, Nearby, notifications).

### 3.3 Security groups

- ALB: inbound 443 from `0.0.0.0/0` (or restrict by IP if internal).
- ECS tasks: inbound only from ALB security group on container port.

---

## 4. Frontend — S3 + CloudFront

1. **Build** locally or in **CodeBuild** with production env:

   ```bash
   cd FRONTEND
   echo 'VITE_API_URL=https://api.yourdomain.com/api' > .env.production
   npm ci && npm run build
   ```

2. Create **S3** bucket (Block Public Access ON); origin access via **CloudFront OAC**.
3. **CloudFront** distribution:
   - Origin: S3 bucket.
   - **Alternate domain (CNAME):** `app.yourdomain.com`
   - **ACM certificate** in **us-east-1** (required for CloudFront).
4. Upload **`dist/*`** to the bucket (`aws s3 sync dist/ s3://bucket-name/`).
5. Set **`CLIENT_URL`** on the backend to **`https://app.yourdomain.com`** (exact match for CORS + Socket.IO).

---

## 5. DNS — Route 53

| Record | Type | Target |
|--------|------|--------|
| `app.yourdomain.com` | A (alias) | CloudFront distribution |
| `api.yourdomain.com` | A (alias) | Application Load Balancer |

Point **ACM** validation CNAMEs as required.

---

## 6. Uploads (`/uploads`) on AWS

The app serves uploads from **local disk** (`/uploads`). On AWS:

- **Single task:** attach **EFS** and mount at `/app/uploads` (same path in container).
- **Or** (better long-term): migrate uploads to **S3** and return S3 URLs (code change; `aws-sdk` is already a dependency).

Until then, **one** Fargate task or **one** EC2 avoids inconsistent file storage.

---

## 7. Elastic Beanstalk (simpler alternative to ECS)

1. Create Node.js platform environment.
2. Deploy the `BACKEND` folder (with `package.json` + `postinstall` script: `prisma generate && npm run build` if needed).
3. Set env vars in the EB console.
4. Attach **RDS** from the same VPC; open RDS SG to EB instances.
5. Put **ALB** in front (included with EB); enable **sticky sessions** if you scale instances.

Good for **single-region** prototypes; ECS gives more control for scaling and networking.

---

## 8. Environment variables checklist (AWS)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | RDS PostgreSQL |
| `PORT` | Match container + target group (e.g. `5007`) |
| `JWT_SECRET` | Secrets Manager |
| `CLIENT_URL` | `https://app.yourdomain.com` |
| `VITE_API_URL` | **Build-time** only — `https://api.yourdomain.com/api` |
| `API_URL` / `UPLOAD_BASE_URL` | Public API base for media URLs |

---

## 9. CI/CD (outline)

- **CodePipeline** + **CodeBuild**: build Docker image → push ECR → deploy ECS; or build `dist` → sync S3 → invalidate CloudFront.
- Run **`prisma migrate deploy`** in a **migration step** (CodeBuild or one-off task) before or after deploy, not on every user request.

---

## 10. Monitoring & ops

- **CloudWatch** logs for ECS / EB / Lambda (if used).
- **RDS** backups and maintenance window.
- **ALB** access logs optional (S3).
- Health checks: `/api/health/ready` for DB-aware readiness.

---

## 11. Cost levers (rough)

- **RDS** and **NAT Gateway** (if private subnets need outbound internet) are recurring costs.
- **Fargate** billed per vCPU/memory; **single small task** + **single-AZ RDS** is lowest for a pilot.
- **CloudFront** + **S3** is usually cheap for static assets.

---

## 12. Related docs

- **[`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md)** — generic production (env, WebSockets, checklist)
- **[`DEV_SERVER.md`](./DEV_SERVER.md)** — local development

---

## 13. Quick “minimum viable” AWS stack

1. **RDS** PostgreSQL (single instance, dev/test tier).  
2. **One EC2** or **one Fargate task** + **ALB** + **ACM** for `api.yourdomain.com`.  
3. **S3 + CloudFront** for `app.yourdomain.com`.  
4. Secrets in **Secrets Manager**; **Route 53** records.  
5. **`CLIENT_URL`** + **`VITE_API_URL`** set as above; **sticky sessions** if you scale the API horizontally.

---

*If you standardize on a single service (e.g. only ECS Fargate), you can add a sample `task-definition.json` or CodeBuild buildspec to this repo in a follow-up.*
