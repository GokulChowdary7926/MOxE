# MOxE Developer Alignment: Instagram and Atlassian

This document is the **single place** for developers and AI to ensure MOxE features that mirror **Instagram** (social) and **Atlassian** (Business/Job) follow the **same workflow, same APIs, same architecture, and same plan and functions**. All new or changed code in these areas must align with the references below.

**See also (expanded references):**
- [MOXE_COMPLETE_IMPLEMENTATION_SUMMARY_AND_DEVELOPER_REFERENCE.md](MOXE_COMPLETE_IMPLEMENTATION_SUMMARY_AND_DEVELOPER_REFERENCE.md) – Full implementation summary, architecture, API usage, UI tokens, bug fixes, testing checklist.
- [MOXE_IMPLEMENTATION_GUIDE_INSTAGRAM_ATLASSIAN_PATTERNS.md](MOXE_IMPLEMENTATION_GUIDE_INSTAGRAM_ATLASSIAN_PATTERNS.md) – Step-by-step implementation guide, checklists, feature tables, common pitfalls.

---

## 1. Feature split

| Style | Account types | Features |
|-------|----------------|----------|
| **Instagram-like** | Personal, Creator | Home (feed), Explore, Reels, Map, Messages, Profile; Stories; Posts (create, like, comment, save); DMs; Activity; Notifications; Settings (account stack). |
| **Atlassian-like** | Business, Job | Business: Dashboard, Commerce, Insights, Promotions. Job: Track, Flow, Know, Code, Build, Status, Alert, etc. (boards, issues, candidates). |

**Theme boundary:** Personal and Creator routes/screens use **Instagram** UI tokens and patterns. Business and Job routes/screens use **Atlassian** UI tokens and patterns. Do not mix (e.g. do not use `#0095f6` or moxe-primary for primary actions in Business/Job; use `#0052CC`). In code: routes under `/job/*`, `/business-dashboard`, `/commerce` (seller view), and Business/Job-only screens use Atlassian tokens; all other user-facing routes (Home, Explore, Reels, Map, Messages, Profile, Settings, Activity, Create, Stories, etc.) use Instagram moxe-* tokens. BottomNav and MobileHeader are shared but render different tabs by account type; active tab color is moxe-primary (Instagram blue) for Personal/Creator; Job/Business surfaces use Atlassian blue in their own screens.

---

## 2. Mandatory references for any change

Before implementing or modifying a feature, use these sources:

| Concern | Reference | Use |
|---------|------------|-----|
| **Workflow** | [ALGORITHMS_AND_WORKFLOWS.md](ALGORITHMS_AND_WORKFLOWS.md) | Step-by-step flow, algorithm, and API contract for the feature. Cite section (e.g. "3. Stories", "4. Posts"). |
| **API** | [MOxE_END_TO_END_BLUEPRINT.md](MOxE_END_TO_END_BLUEPRINT.md) "Current codebase vs blueprint" + backend route file | Verify route exists (e.g. `/api/stories`), method, and request/response shape. Backend routes live in `BACKEND/src/routes/*.routes.ts`. |
| **UI (Instagram)** | [MOxE_UI_DESIGN_BLUEPRINT.md](MOxE_UI_DESIGN_BLUEPRINT.md) | Shell, tabs, moxe-* tokens (colors, spacing, typography), key screens. Use for Personal/Creator. |
| **UI (Atlassian)** | [MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md](MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md) | Atlassian-style tokens (#172B4D, #0052CC, #DFE1E6, #F4F5F7), JobPageContent, layout. Use for Business/Job. |

---

## 3. Instagram-style features: rules

- **Workflow and API:** Implement exactly as in [ALGORITHMS_AND_WORKFLOWS.md](ALGORITHMS_AND_WORKFLOWS.md) (auth, feed, story, post, like, comment, save, explore, message, notification, profile, follow, etc.). Use the **Standard Error Responses** shape and status codes from that doc.
- **UI:** Use [MOxE_UI_DESIGN_BLUEPRINT.md](MOxE_UI_DESIGN_BLUEPRINT.md): moxe-background, moxe-surface, moxe-text, moxe-textSecondary, moxe-border, moxe-primary (#0095f6), moxe-danger; spacing moxe-xs through moxe-xl; typography moxe-caption, moxe-body, moxe-title. No raw hex for semantic roles; no Lobster for UI.
- **API base:** Always use `getApiBase()` from `services/api` (and `getToken()` for authenticated requests). Do not use `import.meta.env.VITE_API_URL` directly in feature code.

---

## 4. Atlassian-style features: rules

- **Workflow and API:** Same as blueprint and [ALGORITHMS_AND_WORKFLOWS.md](ALGORITHMS_AND_WORKFLOWS.md) for Job (Track, Know, Flow), Commerce (seller), and Business dashboard. Capability checks (e.g. canCommerce, canLive) must gate access.
- **UI:** Use [MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md](MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md): colors #172B4D (text primary), #5E6C84 (secondary), #DFE1E6 (border), #0052CC (primary blue), #2684FF (hover), #F4F5F7 (surface); cards with border; JobPageContent for Job tools; getApiBase() for all requests.
- **No Instagram blue** (#0095f6) for primary actions in Business/Job screens; use Atlassian blue (#0052CC).

---

## 5. Workflow-to-code mapping

Use this table to trace a workflow from the doc to the actual files. Keeps "same workflow" auditable.

| Workflow (ALGORITHMS_AND_WORKFLOWS.md) | Frontend (FRONTEND) | Backend route / service |
|----------------------------------------|---------------------|--------------------------|
| **1. Authentication** (Login, Register, Forgot password) | `pages/auth/Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`; Redux `store/authSlice.ts` | `BACKEND/src/routes/auth.routes.ts`; `/api/auth`, `/api/accounts` |
| **2. Feed (Home)** | `pages/home/Home.tsx`; feed fetch (posts/feed or equivalent) | `post.routes.ts` / feed; `feed.service` (or posts with follow filter) |
| **3. Stories** | `pages/stories/StoryViewer.tsx`, `CreateStory.tsx`, `AddStoryPage.tsx`; `components/ui/StoryCircle.tsx` | `BACKEND/src/routes/story.routes.ts` (`/api/stories`) |
| **4. Posts** (create, like, comment, save) | `components/ui/FeedPost.tsx`, `pages/post/PostDetail.tsx`; `pages/create/CreatePost.tsx`, `NewPostPage.tsx` | `BACKEND/src/routes/post.routes.ts` (`/api/posts`) |
| **5. Explore & Search** | `pages/explore/Explore.tsx` | `BACKEND/src/routes/explore.routes.ts` (`/api/explore`) |
| **6. Messages** | `pages/messages/Messages.tsx`, `MessageRequests.tsx` | `BACKEND/src/routes/message.routes.ts`, `messageRequests.routes.ts` (`/api/messages`, `/api/message_requests`) |
| **7. Notifications** | `pages/notifications/Notifications.tsx` | `BACKEND/src/routes/notification.routes.ts` (`/api/notifications`) |
| **8. Profile** (load, edit, follow) | `pages/profile/Profile.tsx`, `EditProfile.tsx`; `pages/profile/Followers.tsx`, `FollowingPage.tsx` | `BACKEND/src/routes/account.routes.ts`, `follow.routes.ts` (`/api/accounts`, `/api/follow`) |
| **9. Commerce** (products, orders, cart) | `pages/commerce/Commerce.tsx`, `Checkout.tsx`, `MyOrdersPage.tsx` | `BACKEND/src/routes/commerce.routes.ts` (`/api/commerce`) |
| **10. Analytics** | `pages/analytics/Analytics.tsx`; ads/insights | `BACKEND/src/routes/analytics.routes.ts` (`/api/analytics`) |
| **11. Job (Track, Know, Flow)** | `pages/job/Job.tsx`, `Track.tsx`, `Flow.tsx`, `Recruiter.tsx`, `Agile.tsx`, etc.; `components/job/JobPageContent.tsx`, `JobMobileLayout.tsx` | `BACKEND/src/routes/job.routes.ts` (`/api/job`) |
| **12. Live** | `pages/live/Live.tsx`, `LiveWatch.tsx`, `LiveReplay.tsx` | `BACKEND/src/routes/live.routes.ts` (`/api/live`) |
| **14. Map & Safety** (SOS, proximity) | `pages/map/Map.tsx`, `SOSPage.tsx`, `ProximityAlertsPage.tsx` | `BACKEND/src/routes/location.routes.ts`, `proximity.routes.ts`, `safety.routes.ts`, `emergencyContact.routes.ts` |
| **15. Content reporting** | Report flows from FeedPost, PostDetail, profile | `BACKEND/src/routes/report.routes.ts` (`/api/reports`) |
| **16. Block / Mute** | Privacy/settings; profile block/mute actions | `BACKEND/src/routes/privacy.routes.ts` (`/api/privacy`) |
| **Highlights / Archive** | `pages/stories/HighlightViewer.tsx`, `ManageHighlights.tsx`; `pages/archive/Archive.tsx` | `BACKEND/src/routes/highlight.routes.ts`, `archive.routes.ts` |
| **Collections / Saved** | `pages/saved/SavedCollections.tsx`; save in FeedPost | `BACKEND/src/routes/collection.routes.ts` (`/api/collections`) |

---

## 6. Per-feature checklist (short)

When adding or changing a feature, ensure:

- [ ] **Workflow:** Steps and order match the relevant section in ALGORITHMS_AND_WORKFLOWS.md.
- [ ] **API:** Method and path match the blueprint; request/response and errors match Standard Error Responses.
- [ ] **UI:** Correct theme (Instagram moxe-* vs Atlassian #172B4D/#0052CC/etc.); use getApiBase() and, for Job, JobPageContent where applicable.
- [ ] **Auth:** Protected routes use auth token; capability checks (canCommerce, canLive, etc.) where required.

**Example – Story create:**  
1. Uses `POST /api/stories` (see story.routes.ts).  
2. Payload and response match workflow (media, expiresAt, etc.).  
3. UI uses moxe-* tokens (CreateStory, AddStoryPage).  
4. Error handling returns consistent `{ error: string }` and correct status codes.

---

## 7. API alignment and gaps

Backend routes are mounted in `BACKEND/src/server.ts` under `/api/*`. The mapping in MOxE_END_TO_END_BLUEPRINT.md "Current codebase vs blueprint" is the source of truth for which domain uses which route prefix. When a workflow in ALGORITHMS_AND_WORKFLOWS.md references an endpoint (e.g. `POST /posts`, `GET /stories`), verify:

1. The route exists in the corresponding `*.routes.ts` file.
2. Request body and query params match the workflow description.
3. Response shape and error body match the doc (e.g. `{ error: string, code?: string }`).

Any intentional deviation (e.g. different path or extra field) must be documented here or in the workflow doc so "same APIs" remains explicit. Gaps found during audit are listed in the next section.

### 7.1 Documented API gaps / decisions

- **Feed:** Implemented as `GET /api/posts/feed` (cursor, limit). FeedService implements follow-based + ranking per ALGORITHMS_AND_WORKFLOWS section 2. Response: `{ items, nextCursor }`. Aligned.
- **Block/Mute:** Workflow doc (section 16) and implementation both use `/api/privacy`: `POST /api/privacy/block`, `DELETE /api/privacy/block/:accountId`, `POST /api/privacy/mute`, `DELETE /api/privacy/mute/:accountId`. Aligned.
- **Data export:** Implemented as `POST /api/accounts/me/data-export` (authenticated). Returns JSON attachment with profile, posts metadata, follows, likes, saved posts, collections, comments, messages metadata, notifications metadata. Frontend: Settings → "Download your data" → DownloadYourDataPage triggers download. Aligned.
- **Standard errors:** Backend should return `{ error: string, code?: string, requestId?: string }` and use status codes from ALGORITHMS_AND_WORKFLOWS (400, 401, 403, 404, 409, 429, 500). Verify per-route in future passes.

(Add further gaps or decisions here as audits are done.)

---

## 8. Summary

- **Instagram-like features:** MOxE_UI_DESIGN_BLUEPRINT.md + ALGORITHMS_AND_WORKFLOWS.md; moxe-* tokens; getApiBase().
- **Atlassian-like features:** MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md + same workflows/APIs; Atlassian tokens; JobPageContent; getApiBase().
- **Every change:** Check workflow doc, blueprint route table, and correct UI theme so MOxE keeps the same workflow, same APIs, same architecture, and same plan and functions as the Instagram and Atlassian alignment targets.
