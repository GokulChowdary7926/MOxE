# MOxE: Ownership vs Others — Deep dive

**Version:** 2.0  
**Audience:** Engineers and technical PMs building or reviewing any MOxE feature.

This is the **canonical** guide for **actor vs subject**, **own vs other**, and how that flows through **UI, API, JWT, sockets, and privacy**.  

- **Quick UI checklist:** [`FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md`](../FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md)  
- **Platform context:** [`MOXE_PLATFORM_OVERVIEW.md`](./MOXE_PLATFORM_OVERVIEW.md)

---

## Part A — Concepts

### A.1 Why this matters

MOxE combines:

1. **Multi-account** — one login, many `Account` profiles (Personal, Business, Creator, Job).
2. **Social graph** — every screen may show **your** data or **someone else’s**.
3. **Real-time** — events must carry enough identity to label **own vs other** on the client.
4. **Privacy** — search visibility, blocks, close friends, and tiers change what “other” can see.

Getting this wrong produces **wrong buttons**, **data leaks in the UI**, **403/IDOR-style bugs**, and **trust issues**.

**Invariant:** For every screen and every mutation, answer:

1. **Who is acting?** → Active **`accountId`** (JWT + Redux `currentAccount`).
2. **Who owns the resource?** → Subject **`accountId`** on the row or profile being viewed.
3. **Is `actor === subject`?** → **Own** vs **Other** branches everywhere.

---

### A.2 Terminology (precise)

| Term | Definition |
|------|------------|
| **User** | Human identity (login). Owns many accounts. |
| **Account** | MOxE profile entity (`Account.id`, `username`, `accountType`, etc.). |
| **Actor** | The account **currently selected** for this session (JWT `accountId`). All “I post / I follow / I message” actions are as the actor. |
| **Subject** | The **owner** of the resource being read or displayed (post.accountId, profile id, etc.). |
| **Own** | `actorAccountId === subjectAccountId`. |
| **Other** | `actorAccountId !== subjectAccountId` — you are viewing or interacting with another account’s resource. |
| **Viewer** | Same as actor in most cases; use when the question is “who sees this UI?” (e.g. preview-as). |

**Important:** “Own” is **not** “logged in.” You are always logged in as a **User**, but “own profile” means the **route’s profile matches the active Account**.

---

### A.3 Mental model (ASCII)

```
     ┌────────────── User (login) ──────────────┐
     │                                            │
     │   Account A (Personal)  ←── actor today ──┼── JWT.accountId
     │   Account B (Business)                    │
     │   Account C (Job)                         │
     └────────────────────────────────────────────┘

     Request: GET /posts?profile=username_X
              Subject = Account X
              Actor   = Account A
              Own?    (A.id === X.id)
```

---

## Part B — Frontend deep dive

### B.1 Deriving `isOwn` (profiles)

| Route pattern | Own when |
|---------------|----------|
| `/profile` (no param) | Always own (your default profile). |
| `/profile/:username` | `currentAccount.username === username`. |

**Hook:** `useIsOwnProfile()` — [`FRONTEND/hooks/useIsOwnProfile.ts`](../FRONTEND/hooks/useIsOwnProfile.ts).

**Pitfall:** Using Redux `currentAccount` to fill **another** user’s `@username` page. **Never** do that — fetch `GET /accounts/username/:username`.

### B.2 Deriving ownership on content cards

Prefer **stable ids** from the API:

```ts
const isOwnPost = item.accountId === currentAccount?.id;
// or item.author?.id depending on API shape — align with backend
```

**Pitfall:** Comparing **only** `username` strings — usernames can change. Prefer **`accountId`** for ownership of posts/stories.

### B.3 Redux and cache

| Data | Rule |
|------|------|
| `currentAccount` | **Only** for the active actor. Invalidate on **switch account**. |
| Other user’s profile | From **API only** into local component state or React Query key `['profile', username]`. |
| Feed items | Each item carries `accountId`; compare to `currentAccount.id` per row. |

### B.4 Anonymous / masked display

Features (e.g. Nearby) may show **“Anonymous”** as display text. **Ownership is not anonymous:**

- Billing, limits, and moderation still use the real **`accountId`** on the server.
- UI treats **own anonymous** post as own for delete/limits; **other** anonymous post as other for report/block.

---

## Part C — Backend deep dive

### C.1 JWT and middleware

Authenticated routes resolve:

- `userId` — human user.
- `accountId` — **active** MOxE account for this token.

**Mutations** must assert one of:

- Resource `accountId === req.user.accountId`, or  
- Explicit privilege (moderation, admin, system job).

Never trust **body** `accountId` without verifying it matches the token (or you’re intentionally acting as admin).

### C.2 Public reads (“other”)

Endpoints like `GET /accounts/username/:username` should return:

- Public profile fields, counts, relationship flags (`isFollowing`, `isBlockedByMe`, …).
- **Not** private fields: email, phone, full settings, billing.

Enforce **search visibility** (`EVERYONE` / `FOLLOWERS_ONLY` / `NO_ONE`) on search and explore.

### C.3 Row-level ownership (Prisma)

Typical pattern:

```ts
const post = await prisma.post.findFirst({
  where: { id: postId, accountId: req.user.accountId },
});
if (!post) throw new AppError('Forbidden or not found', 403);
```

Use **404** vs **403** per product policy (hide existence vs deny).

### C.4 Messaging and blocks

- **DM thread:** Two (or more) **accounts**; check block in **both directions** before send/deliver.
- **Premium blocked messaging:** Additional rules; still **account-scoped**.

### C.5 Socket.IO

- **Join** `account:{accountId}` for the **actor** only.
- **Emit** payloads that include `accountId` / `username` so the client can mark **own vs other** and dedupe.
- **Authorize** every socket action on the server (rate limits, blocks, membership in room).

---

## Part D — Multi-account switch

Flow: `POST /auth/switch-account` → new JWT with new `accountId`.

| Concern | Action |
|---------|--------|
| Redux | Replace `currentAccount`, token, capabilities. |
| Queries | Invalidate caches keyed by old account. |
| Sockets | Reconnect or `register:account` with new id. |
| “Own” UI | All `isOwn` flags recompute from **new** `currentAccount`. |

**Failure mode:** Showing **Account B’s** feed while JWT still says **Account A** — treat as P0 bug.

---

## Part E — Account types (Job, Business, Creator)

Ownership is still **accountId-based**. Extra rules:

| Type | Typical “own” surfaces |
|------|-------------------------|
| **Personal** | Feed, profile, standard settings |
| **Business / Creator** | + commerce, insights, branded flows — still **that** account’s rows |
| **Job** | `/job/*` tools; guard `requiredType="JOB"` on routes |

“Other” for a Job account viewing a **candidate** profile is still **other user** patterns (no edit of their resume unless product allows).

---

## Part F — Feature matrix (extended)

| Feature | Own | Other |
|---------|-----|--------|
| **Profile grid** | Full grid + archive/saved if product | Public grid + tagged where allowed |
| **Story ring** | Add story, viewers list (policy) | View story; no edit |
| **Reels** | Delete/edit own | Report, share |
| **DM** | Unsend/edit own bubble (if enabled) | Report, block |
| **Nearby** | Your posts + limits | Report; radius delivery |
| **Notes** | Create/delete own note; analytics tier | View/listen per audience rules |
| **SOS / emergency** | Your contacts, your alerts | N/A for “their” SOS config |
| **Followers list** | Remove follower, etc. | Read-only list |

---

## Part G — Privacy & “other”

- **searchVisibility** — Others may not find the account in search even though the account exists.
- **Close friends** — “Own” lists; **other** people don’t see membership.
- **Private account** (if implemented) — **Other** sees limited or request-only follow.

These are **orthogonal** to `isOwn`: you can be “other” but still **allowed** or **denied** by privacy.

---

## Part H — Anti-patterns (expanded)

1. **Hydrating another user’s profile from `currentAccount`** when URL has a different `@username`.
2. **Client-only** ownership checks — always re-check on the server.
3. **Mock data** as real **other** users in production paths.
4. **Global socket** events without `accountId` — causes wrong badges and leaks in multi-tab.
5. **Username-only** ownership for security-critical actions — prefer **account id**.
6. **Assuming** `userId === one account` — one user has **many** accounts.

---

## Part I — Testing checklist

- [ ] **Own profile:** Edit, settings entry, no “Follow self.”
- [ ] **Other profile:** Follow, Message, no Edit their profile.
- [ ] **Own post:** Delete appears; API rejects other account’s id.
- [ ] **Switch account:** Feed and profile header match **new** account.
- [ ] **Blocked:** Cannot message either direction; UI explains.
- [ ] **Search:** Other user with `NO_ONE` does not appear in results.

---

## Part J — Related documents

| Doc | Role |
|-----|------|
| [`FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md`](../FRONTEND/docs/OWNERSHIP_AND_VIEWER_PATTERNS.md) | UI rules by screen |
| [`MOXE_PLATFORM_OVERVIEW.md`](./MOXE_PLATFORM_OVERVIEW.md) | Platform stack & surfaces |
| [`PREMIUM_MESSAGING_BLOCKED_USERS.md`](./PREMIUM_MESSAGING_BLOCKED_USERS.md) | Blocked messaging |
| [`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md) | Production |

---

## Part K — One-line summary

**Own** = active `accountId` matches the resource owner’s `accountId`. **Other** = everyone else: use public APIs, social actions, and server-side checks; never treat mock or `currentAccount` as their data.
