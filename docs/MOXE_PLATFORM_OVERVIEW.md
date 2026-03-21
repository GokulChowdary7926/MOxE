# MOxE — Platform deep dive (overview)

**Purpose:** High-level map of what MOxE is, how pieces connect, and where “ownership” fits. For **ownership vs others** in detail, see [`MOXE_OWNERSHIP_AND_OTHERS.md`](./MOXE_OWNERSHIP_AND_OTHERS.md).

---

## 1. What MOxE is

MOxE is a **multi-account social platform** (feed, stories, reels, DMs, maps, safety, job tools, commerce, etc.) built as:

| Layer | Technology |
|--------|------------|
| **Web app** | React + TypeScript (Vite), Redux for session/account |
| **API** | Node.js + Express, REST under `/api` |
| **Real-time** | Socket.IO (same Node process as HTTP; WebSockets) |
| **Data** | PostgreSQL via Prisma ORM |
| **Media** | Uploads to local `uploads/` or configurable base URL (S3-ready pattern) |

One **human user** (`User`) can own several **`Account`** rows (Personal, Business, Creator, Job). The **active account** is the **actor** for almost every social action.

---

## 2. Core entities (mental model)

```
User (login identity: phone/email/OAuth)
 └── Account (many) — each has username, type, tier, profile
       ├── Post / Story / Reel / Message … (content owned by accountId)
       └── Settings, blocks, follows … (scoped by account)
```

- **JWT** typically carries `userId` + **`accountId`** (current acting account).
- **Ownership** of a row in the DB = that row’s `accountId` (or `userId` where the model is user-scoped — check schema per feature).

---

## 3. Major product surfaces

| Surface | “Own” means | Notes |
|---------|-------------|--------|
| **Home / Feed** | Posts from accounts you follow + you | Actor = viewer for interactions |
| **Profile** | `route username === currentAccount.username` | Strong own vs other split |
| **Messages** | Thread participants; “my” bubbles vs peer | Block state is bidirectional |
| **Explore / Search** | N/A (discovery) | Others’ public data + search visibility |
| **Map / Nearby** | Your location session vs anonymous/public peers | Radius + rooms |
| **Job tools** | JOB account + tools under `/job/*` | Often own-org vs candidate data |
| **Safety (SOS, proximity)** | Your contacts & alerts | Highly sensitive; own-only config |
| **Notes** | Your note vs feed of others’ notes | Tier limits per account |

---

## 4. Real-time boundaries

- **Private to an account:** `account:{accountId}` rooms (notifications, DMs tied to account).
- **Shared spaces:** Conversation rooms, Nearby `nearby:feed`, live rooms — participants are explicit; still enforce auth on each action server-side.

---

## 5. Where to read next

| Topic | Document |
|--------|----------|
| **Ownership vs others (deep)** | [`MOXE_OWNERSHIP_AND_OTHERS.md`](./MOXE_OWNERSHIP_AND_OTHERS.md) |
| **UI patterns only** | [`FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md`](../FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md) |
| **Deploy / prod** | [`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md) |
| **Schema** | `BACKEND/prisma/schema.prisma` |

---

## 6. Summary

MOxE’s complexity comes from **many accounts per user** + **social graph** + **real-time**. Every feature should declare **who owns the data** (subject) and **who is acting** (actor from JWT/Redux), then branch UI and permissions accordingly.
