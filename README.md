# MOxE

Unified social + professional platform with **MOxE Job** (Track, Know, Flow), messaging, live, explore, and more.

## What's included

- **BACKEND** — Node.js, Express, Prisma, Socket.IO (`src/server.ts`)
- **FRONTEND** — React + Vite (`FRONTEND/`)
- **Database** — PostgreSQL schema in `BACKEND/prisma/schema.prisma`

## Quick start (local)

### Backend

```bash
cd BACKEND
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, CLIENT_URL
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

API default: `http://localhost:5007` — health: `GET /health`, `GET /api/health/live`.

### Frontend

```bash
cd FRONTEND
npm install
npm run dev
```

Set `VITE_API_URL` (e.g. `http://localhost:5007/api`) as needed for your environment.

## MOxE Job (Track · Know · Flow)

- **Track** — Applications, pipelines, job postings  
- **Know** — Companies, reviews, salaries, resources  
- **Flow** — Boards, columns, cards (Trello-style)

## Deployment

See **`docs/MOXE_DEPLOYMENT_GUIDE.md`** and **`docs/MOXE_EC2_DEPLOY_SCRIPT_README.md`** for production / AWS EC2.

## Layout

| Path | Role |
|------|------|
| `BACKEND/` | API, Prisma, uploads |
| `FRONTEND/` | Web app |
| `docs/` | Deployment and architecture notes |
