# MOxE Application

Unified social + professional platform with **MOxE Job** (Track, Know, Flow).

## What's Included

- **Backend** (Node + Express + Prisma): Auth stubs, Job APIs for **Track**, **Know**, **Flow**
- **Database schema**: Full Prisma schema in `backend/prisma/schema.prisma` and `DATABASE SCHEMA/Main Schema File.txt`, including:
  - MOxE **Track**: Job postings, pipelines, pipeline stages, job applications
  - MOxE **Know**: Companies, company reviews, salary entries, career resources, interview prep
  - MOxE **Flow**: Flow boards, columns, cards (Trello-style)
- **Frontend** (React): Job hub at `/job` with Track, Know, Flow pages; stub pages for Home, Auth, etc.

## Quick Start

### Backend

```bash
cd backend
cp ../ENV/Backend\ .env.sh .env   # or create .env with DATABASE_URL and optional JWT_SECRET, CLIENT_URL
npm install
npx prisma generate
npx prisma migrate dev --name init   # requires PostgreSQL
npm run dev
```

Server runs at `http://localhost:5000`. Health: `GET /health`. Job APIs under `GET/POST /api/job/*` (see below).

### Frontend

The UI lives in `FRONTEND/`. To run with Create React App:

1. Create a new CRA app or use an existing one with `src/`.
2. Copy contents of `FRONTEND/` into `src/` (e.g. `Main App Component.tsx` → `src/App.tsx`), or set up your build to use `FRONTEND` as the source.
3. Install deps: `react-router-dom`, `react-redux`, `@reduxjs/toolkit`, `@tanstack/react-query`, `react-hot-toast`.
4. Set `REACT_APP_API_URL=http://localhost:5000/api` in `.env`.
5. For protected routes (Home, Job), set a fake token: `localStorage.setItem('token', 'dev');` then refresh.

### Job API (authenticated with `Authorization: Bearer <token>`)

- **Track**: `GET /api/job/track/applications`, `POST /api/job/track/apply/:jobPostingId`, `GET /api/job/track/pipelines`, `POST /api/job/track/pipelines`, `GET /api/job/track/jobs`, `POST /api/job/track/jobs`
- **Know**: `GET /api/job/know/companies`, `GET /api/job/know/companies/:slug`, `POST /api/job/know/companies`, `POST /api/job/know/companies/:id/reviews`, `POST /api/job/know/companies/:id/salaries`, `GET /api/job/know/resources`, `GET /api/job/know/interview-preps`, `POST /api/job/know/interview-preps`
- **Flow**: `GET /api/job/flow/boards`, `POST /api/job/flow/boards`, `GET /api/job/flow/boards/:boardId`, `POST /api/job/flow/boards/:boardId/columns`, `POST /api/job/flow/columns/:columnId/cards`, `PATCH /api/job/flow/cards/:cardId/move`, `DELETE /api/job/flow/cards/:cardId`

## Project Layout

- `backend/` – Express server, Prisma schema, routes, services (Track, Know, Flow)
- `FRONTEND/` – React app: Main App, Job hub (Track/Know/Flow), pages, store, components
- `DATABASE SCHEMA/` – Main schema (source of truth; mirrored into `backend/prisma/schema.prisma`)
- `BACKEND/` – Legacy/reference backend files
- `DEPLOYMENT/`, `DOCKER/`, etc. – Deployment and config

## MOxE Job

- **Track**: Applications and recruitment pipelines (Jira-like).
- **Know**: Company research, reviews, salary, interview prep, resources (Confluence-like).
- **Flow**: Visual job-search boards with columns and cards (Trello-like).

Schema and APIs support job seeker and recruiter flows; frontend currently targets job seeker use (applications, companies, boards).
