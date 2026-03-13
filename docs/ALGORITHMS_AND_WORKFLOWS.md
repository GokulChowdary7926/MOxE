# MOxE – Algorithms and Workflows

This document defines the **algorithm** (how data is computed/ranked/filtered) and **workflow** (step-by-step flow) for every component and function in the application.

---

## Key Data Models Reference

| Model | Purpose |
|-------|--------|
| **User** | Authentication, credentials, settings (email/phone, password hash) |
| **Account** | Profile, capabilities, type (Personal / Business / Creator / Job) |
| **Post** | Content with media, caption, privacy, engagement metrics (likes, comments) |
| **Follow** | Directed relationship (follower → following) with timestamps |
| **Notification** | Typed event (LIKE, COMMENT, FOLLOW, MESSAGE, MENTION) with metadata and read state |
| **Message** | DM/group content with delivery/read status; MessageRecipient for per-recipient state |
| **Block / Mute** | Relationship constraints (block: hide all, no DMs; mute: hide from feed, no notifications) |
| **Report** | User-generated report (targetType, targetId, reason, status: PENDING / RESOLVED) |

---

## Standard Error Responses

All API endpoints should use consistent HTTP status codes and body shape:

| Code | Meaning | When to use |
|------|--------|-------------|
| **400** | Bad Request | Validation failed, missing required fields, malformed payload |
| **401** | Unauthorized | Unauthenticated (missing or invalid token) |
| **403** | Forbidden | Authenticated but not authorized for this resource/action |
| **404** | Not Found | Resource does not exist or not visible to caller |
| **409** | Conflict | Duplicate (e.g. username taken), state conflict |
| **429** | Too Many Requests | Rate limited (Retry-After header when applicable) |
| **500** | Internal Server Error | Unexpected error; include request ID in response for debugging |

Response body should include a consistent shape (e.g. `{ error: string, code?: string, requestId?: string }`).

---

## 1. Authentication

### 1.1 Login workflow
1. User submits phone/email + password.
2. Backend validates credentials, checks rate limit.
3. Backend looks up User, verifies password (bcrypt).
4. Backend creates or reuses Session; returns JWT (and optional refresh token).
5. Frontend stores token, dispatches setCredentials; fetches `/accounts/me` and sets current account + capabilities.
6. Frontend redirects to Home (or intended redirect).

### 1.2 Register workflow
1. User submits phone/email, password, date of birth.
2. Backend validates format, checks uniqueness, rate limit.
3. Backend creates User (password hashed), sends verification (e.g. OTP) if required.
4. User completes verification (phone/email OTP).
5. User selects account type (Personal / Business / Creator / Job).
6. Backend creates Account linked to User; returns session + account.
7. Frontend stores token, sets account, redirects to Home.

### 1.3 Forgot password workflow
1. User submits email or phone.
2. Backend looks up User, generates reset token (short-lived), sends link/OTP.
3. User submits new password + token/OTP.
4. Backend validates token, updates password, invalidates reset token.
5. Frontend redirects to Login.

---

## 2. Feed (Home)

### 2.1 Feed algorithm
- **Input:** Current account ID, cursor (optional), limit (default 20).
- **Steps:**
  1. Resolve **candidate set:** posts from accounts the user follows (Follow table), plus own posts; exclude blocked/muted; respect privacy (PUBLIC or FOLLOWERS_ONLY for followed).
  2. **Ranking:** Sort by a composite score: `recency` (e.g. time decay) + `engagement_weight` (likes, comments, shares) + optional `relationship_boost` (close friends, recent interactions). Formula: `score = recency_factor * (1 + log(1 + engagement))`.
  3. **Deduplication:** One post per ID.
  4. **Pagination:** Return `limit` items, next cursor = last post ID or createdAt.
- **Output:** Ordered list of posts with account, like/comment counts, media, caption.

### 2.2 Feed load workflow (frontend)
1. On mount (or tab focus), call `getFeed(cursor?)`.
2. If no cursor, show skeleton; replace with posts when loaded.
3. On scroll near bottom, call `getFeed(nextCursor)` and append.
4. On like/comment/save, update local state optimistically; sync with server.

---

## 3. Stories

### 3.1 Story tray algorithm
- **Input:** Current account ID.
- **Steps:**
  1. Fetch accounts that have **at least one unexpired story** (expiresAt > now).
  2. Order: own account first, then by most recent story time, then by “has viewed” (unviewed first).
  3. For each account, return: accountId, username, displayName, profilePhoto, hasViewed (whether current user viewed latest story), latestStoryId.
- **Output:** List of story rings (tray items).

### 3.2 Story expiration workflow (backend)
- **Cron/job:** Periodically (e.g. every 15 min) delete stories where `expiresAt < now()` (or mark expired and exclude from queries).
- **Create story workflow:** User uploads media → backend creates Story with `expiresAt = now() + duration` (e.g. 24h) → return story ID; optionally fanout notification to followers.

### 3.3 Story view workflow
1. User opens story viewer; frontend sends view event (storyId, viewerId).
2. Backend creates StoryView (if not exists), increments viewedCount.
3. When user finishes segment or exits, frontend may send completion; backend can aggregate for “hasViewed” in tray.

---

## 4. Posts

### 4.1 Create post workflow
1. User selects media, caption, location, tags, privacy, options (allow comments, hide like count).
2. Frontend uploads media (if any) to storage; gets URLs.
3. Frontend calls `POST /posts` with { media, caption, location, privacy, tagIds, mentionIds, ... }.
4. Backend validates, creates Post; creates Tag/Mention records; optionally notifies mentioned users and followers (notification workflow).
5. Frontend redirects to Home or profile; new post appears in feed after refetch or optimistic update.

### 4.2 Like workflow
1. User taps like on a post.
2. Frontend optimistically toggles UI (red heart, count +1/-1).
3. Frontend calls `POST /posts/:id/like` or `DELETE /posts/:id/like`.
4. Backend creates/deletes Like record; updates post like count (or derived).
5. Backend creates Notification (type LIKE) for post owner if not self.
6. On failure, frontend reverts optimistic update.

### 4.3 Comment workflow
1. User submits comment text.
2. Frontend calls `POST /posts/:id/comments` with { content, parentId? }.
3. Backend creates Comment; optionally creates Notification (type COMMENT) and Mention notifications.
4. Frontend appends comment to list or refetches thread.

### 4.4 Save workflow
1. User taps save; frontend calls `POST /posts/:id/save` or `DELETE /posts/:id/save` (optionally with collectionId).
2. Backend creates/deletes SavedPost.
3. Frontend updates bookmark state.

---

## 5. Explore & Search

### 5.1 Explore (discovery) algorithm
- **Trending hashtags:** Order Hashtag by postCount (or recent post count) descending; limit 10.
- **Discover (suggested content):** Mix of (a) popular posts (high engagement, recent), (b) posts from non-followed accounts with high engagement, (c) by category/cluster if available. Score: `engagement * recency_factor`; exclude blocked/muted.

### 5.2 Search algorithm
- **Input:** Query string q, type filter (all | users | hashtags | posts), limit.
- **Steps:**
  1. **Users:** Match Account.username, displayName (ILIKE or full-text); exclude blocked; order by relevance (match quality) then follower count.
  2. **Hashtags:** Match Hashtag.name (prefix or contains); order by postCount.
  3. **Posts:** Match Post.caption, Tag names; exclude private; order by recency and engagement.
- **Output:** Aggregated list with type (user | hashtag | post), id, label, sub (e.g. @username), link.

### 5.3 Explore/Search workflow (frontend)
1. User types in search; on submit or debounce (e.g. 300ms), call `GET /explore/search?q=...&type=all`.
2. Display results by type (users first, then hashtags, then posts); each row links to profile, hashtag page, or post.

---

## 6. Messages

### 6.1 Thread list algorithm
- **Input:** Current account ID.
- **Steps:**
  1. Fetch last message per conversation (DM: other participant; Group: groupId). Conversation = set of participants (or group).
  2. For each conversation, get last Message by createdAt; include sender, content preview, read status, time.
  3. Sort by last message time descending.
- **Output:** List of threads { id, otherParticipant or group, lastMessage, time, unreadCount }.

### 6.2 Message send workflow
1. User types message and taps send.
2. Frontend creates optimistic bubble (own side); calls `POST /messages` with { recipientId or groupId, content, messageType }.
3. Backend creates Message and MessageRecipient(s); marks delivered; pushes via socket to recipient(s).
4. Backend creates Notification (type MESSAGE) for recipient if not in chat.
5. Frontend replaces optimistic with server response; on failure, show retry.

### 6.3 Message load workflow (thread view)
1. On open thread, call `GET /messages?userId=...` or `?groupId=...` with cursor.
2. Backend returns messages ordered by createdAt asc (or desc with cursor); frontend appends/prepends.
3. Frontend marks as read: `PATCH /messages/:id/read` or bulk mark thread read.
4. Real-time: socket listeners append new messages to list.

---

## 7. Notifications

### 7.1 Notification list algorithm
- **Input:** Current account ID, tab (all | mentions), cursor, limit.
- **Steps:**
  1. Fetch Notification where recipientId = accountId; if tab = mentions, filter type in (MENTION, TAG).
  2. Order by createdAt desc.
  3. Paginate with cursor.
- **Output:** List of notifications with type, sender (if any), content, data (postId, commentId, etc.), read, createdAt.

### 7.2 Notification creation (backend)
- **Triggers:** Like → type LIKE; Comment → COMMENT; Follow → FOLLOW; Message → MESSAGE; Mention/Tag → MENTION/TAG.
- **Deduplication:** Optional: merge same type from same sender for same target (e.g. “X and 2 others liked your post”).
- **Batching:** Optional: group within time window (e.g. 5 min) for same type and target.

### 7.3 Mark read workflow
1. User opens notifications or clicks a notification.
2. Frontend calls `PATCH /notifications/:id/read` or `POST /notifications/read-all`.
3. Backend sets read = true, readAt = now(); frontend updates local state.

---

## 8. Profile

### 8.1 Profile load workflow
1. Route: `/profile` (own) or `/profile/:username`.
2. Frontend calls `GET /accounts/me` or `GET /accounts/username/:username`.
3. Backend returns account (public fields; private only for self); optionally post count, follower count, following count (from Follow table).
4. Frontend displays avatar, bio, stats, posts grid (paginated).

### 8.2 Edit profile workflow
1. User edits displayName, username, bio, etc. on Edit Profile page.
2. Frontend validates (e.g. username format); calls `PATCH /accounts/:id` with allowed fields.
3. Backend updates Account; returns updated account.
4. Frontend updates Redux/state and redirects to profile.

### 8.3 Follow workflow
1. User taps Follow; frontend calls `POST /accounts/:id/follow` or `DELETE` to unfollow.
2. Backend creates/deletes Follow; updates follower/following counts; creates Notification (FOLLOW) for target.
3. Frontend updates button state and counts.

---

## 9. Commerce

### 9.1 Products list workflow
- **Input:** Current account (seller).
- **Algorithm:** Fetch Product where accountId = seller, isActive = true; order by createdAt desc.
- **Add product workflow:** User submits form → `POST /commerce/products` → backend creates Product; frontend redirects to list.

### 9.2 Orders workflow
- **Buyer:** List Order where buyerId = accountId.
- **Seller:** List Order where sellerId = accountId.
- **Order state machine:** PENDING → PAID → SHIPPED → DELIVERED (or CANCELLED).

---

## 10. Analytics

### 10.1 Analytics aggregation algorithm
- **Input:** Account ID, date range.
- **Metrics:** Reach (impressions, profile visits), Engagement (likes, comments, shares), Content (top posts by engagement).
- **Steps:** Query AnalyticsEvent, View, Like, Comment, Share grouped by content and date; aggregate by eventType; return time series and top content.
- **Workflow:** Frontend calls `GET /analytics?from=...&to=...`; backend returns pre-aggregated or raw; frontend charts.

---

## 11. Job (Track, Know, Flow)

### 11.1 Track workflow
- **Applications:** List JobApplication for accountId; order by appliedAt desc; include jobPosting, pipelineStage. Detail: GET application by id.
- **Apply:** POST job application (cover letter, resume); backend creates JobApplication, increments job post application count.
- **Pipelines:** List pipelines and stages; create pipeline with optional stage names.
- **Jobs:** List JobPosting (open); create job posting (recruiter).

### 11.2 Know workflow
- **Companies:** Search by name/slug; list with industry; detail by slug (company + reviews, salary entries, resources).
- **Reviews/Salaries:** POST review or salary for company (authenticated).

### 11.3 Flow workflow
- **Boards:** List FlowBoard for account; create board (name, description); get board with columns and cards.
- **Columns:** Add column to board; order by `order`.
- **Cards:** Add card to column (title, companyName, optional jobApplicationId); move card (PATCH move to targetColumnId, order); delete card.
- **Algorithm for board view:** Load board → columns ordered by order → cards per column ordered by order.

---

## 12. Live

### 12.1 Go live workflow
1. Creator starts live; frontend calls `POST /live` with title, description, privacy.
2. Backend creates Live (status SCHEDULED then LIVE); returns stream key/URL for ingest.
3. Frontend opens publisher; viewers connect to stream URL.

### 12.2 Watch live workflow
1. User opens `/live/:liveId`; frontend fetches live session (GET /live/:id).
2. Backend returns live metadata; frontend plays stream; sends view event (join); on exit, sends leave.
3. Comments: POST live comment; backend broadcasts via socket to all viewers.
4. Reactions (hearts): optional POST; broadcast via socket.

---

## 13. Admin

### 13.1 Moderation workflow
- **Queue:** List Report where status = PENDING; order by createdAt.
- **Action:** Resolve (dismiss, remove content, warn user); update Report.status; optionally delete content or restrict account.

### 13.2 Reports / Users / Platform
- **Reports:** Same as moderation; filter by type.
- **Users:** Search accounts; view detail; restrict/ban.
- **Platform:** Feature flags, limits (stored in config or DB); update via admin API.

---

## 14. Map & Safety

### 14.1 Map workflow
- **Nearby:** Optional location sharing; fetch LocationShare or SafeZone for user; display on map.
- **SOS / Proximity:** Trigger emergency flow; notify emergency contacts; optional location history for safety.

---

## 15. Content Reporting (User-side)

### 15.1 Report workflow
1. User taps "Report" on post, comment, or profile.
2. User selects reason (spam, harassment, inappropriate, violence, other).
3. User may add optional details (free text).
4. Frontend calls `POST /reports` with `{ targetType, targetId, reason, details? }`.
5. Backend validates target exists and user has not already reported it (optional idempotency); creates Report with status `PENDING`.
6. Optional: notify moderators (admin dashboard badge, email, or webhook).
7. Frontend shows confirmation ("Thanks, we'll review this").

---

## 16. Block / Mute

### 16.1 Block workflow
1. User selects "Block" on profile (or from menu on post/comment).
2. Frontend calls `POST /blocks` with `{ blockedAccountId }`.
3. Backend creates Block record (blockerId, blockedId).
4. **Effects:** Remove from follower/following if present; hide all content from blocked user in feed/explore; prevent DMs; exclude from search results both ways.
5. Frontend updates UI immediately (e.g. "Blocked" state, hide their content).

### 16.2 Mute workflow
1. User selects "Mute" on profile.
2. Frontend calls `POST /mutes` with `{ mutedAccountId }`.
3. Backend creates Mute record.
4. **Effects:** Hide muted account’s posts from feed; no notifications from muted user; no DM blocking (unlike block).
5. Frontend updates button state.

### 16.3 Unblock / Unmute
- `DELETE /blocks/:id` and `DELETE /mutes/:id` (or by target id); backend removes record; feed/notifications reflect change on next load or real-time update.

---

## 17. Data Export (GDPR / Compliance)

### 17.1 Data export workflow
1. User requests data export from Settings (e.g. "Download my data").
2. Frontend calls `POST /account/data-export`.
3. Backend creates async job (queue); returns job id or "request received".
4. Job aggregates user data: profile, posts (metadata + captions), messages (metadata, not full content if policy restricts), follows, likes, saved posts, etc., into a structured archive (e.g. JSON or ZIP).
5. When ready, backend stores file in secure temporary storage; sends notification to user with download link (signed URL or one-time token).
6. Link expires after set time (e.g. 7 days); backend deletes file after expiry.
7. Frontend shows "Export requested" and later "Your data is ready" with link (or in-app download).

---

## 18. Webhooks (Future / Integrations)

### 18.1 Webhook workflow
1. Admin (or verified integration) configures webhook URL and subscribed events (e.g. `post.created`, `user.follow`, `order.paid`).
2. On event trigger, backend sends `POST` to configured URL with payload (event type, timestamp, entity id, relevant data) and signature header (e.g. HMAC) for verification.
3. Backend expects 2xx within timeout; on failure, retry with backoff (exponential) and max attempts.
4. Log delivery attempts (success/failure, response code) for debugging and audit.
5. Optional: allow per-event subscription and payload filtering to reduce payload size.

---

## Performance Considerations

- **Feed generation:** Consider caching pre-computed feeds for highly active users (e.g. short TTL cache keyed by accountId); invalidate on new follow/unfollow or new post from followed accounts.
- **Story tray:** Cache "has viewed" status per user to avoid N+1; consider materialized or denormalized field per (viewerId, accountId) for latest story.
- **Search:** Use full-text search indexes (e.g. PostgreSQL `tsvector`/GIN or Elasticsearch) for users, hashtags, and posts; keep ranking logic in application or search engine.
- **Notifications:** For large volumes, consider materialized views or aggregated notification tables; paginate with cursor and index on (recipientId, createdAt).
- **Messages:** Index on (conversationId or participant ids, createdAt) for thread list and thread load; avoid full scan of messages for "last message per thread."
- **Media:** Serve via CDN; use responsive image URLs or signed URLs with expiry where applicable.

---

## Security Requirements

- **All endpoints:** Validate that the authenticated user has permission to access or modify the resource (e.g. owner, or role-based). Enforce authorization after authentication on every protected route.
- **Media uploads:** Scan for malware (e.g. ClamAV or cloud scan); validate file types and size limits; store in isolated bucket with access control; do not execute user-uploaded content.
- **Rate limiting:** Apply per endpoint and per user/IP (e.g. token bucket or sliding window); stricter limits for auth (login, register, forgot password) and for expensive operations (search, export).
- **SQL / injection:** Use parameterized queries or ORM only; never concatenate user input into raw SQL.
- **XSS:** Sanitize all user-generated content before persisting and before rendering (escape on output; allow only safe HTML if rich text is required).
- **Secrets:** Store API keys, JWT secrets, and DB credentials in environment or secret manager; never in code or client.
- **CORS / CSP:** Configure allowed origins and Content-Security-Policy for web clients.

---

## Summary table

| Component     | Algorithm / logic summary                    | Workflow summary                                      |
|---------------|----------------------------------------------|-------------------------------------------------------|
| Auth          | Verify credentials; session + JWT           | Login, Register, Forgot password, Verify              |
| Feed          | Follow-based + score(recency, engagement)    | Load feed, paginate, like/comment/save                |
| Stories       | Unexpired by account; order + viewed          | Create, expire cron, view, tray                       |
| Posts         | Create with media/tags; like/comment/save    | Create, Like, Comment, Save                           |
| Explore       | Trending hashtags; discover mix               | Load explore, search                                  |
| Search        | Users + hashtags + posts by query             | Query, debounce, display by type                      |
| Messages      | Last message per thread; sort by time         | Thread list, send, load thread, read, socket          |
| Notifications | By recipient; filter type; sort by time       | List, mark read, create on events                     |
| Profile       | Public/private fields; counts                 | Load, edit, follow                                    |
| Commerce      | Products/orders by account                    | List products/orders, add product, fulfill            |
| Analytics     | Aggregate events and engagement              | Date range, metrics, top content                      |
| Job Track     | Applications, pipelines, jobs                | List, apply, create job/pipeline                      |
| Job Know      | Companies search; reviews/salaries           | Search, detail, add review/salary                     |
| Job Flow      | Boards → columns → cards; move card          | CRUD board/column/card, move card                     |
| Live          | Live session status; viewers, comments       | Start live, watch, comment, react                    |
| Admin         | Reports queue; user/config actions            | Moderation, resolve, users, platform                  |
| Reporting     | One report per target; status PENDING          | Report post/comment/profile, reason, notify mods     |
| Block / Mute  | Block: hide all + no DMs; Mute: feed + notifs | Block, unblock, mute, unmute                         |
| Data Export   | Async job; aggregate profile, posts, etc.      | Request export, job runs, signed link, expiry        |
| Webhooks      | Event-driven; signature; retry with backoff   | Configure URL/events, POST on trigger, log delivery  |

All workflows assume: authenticated user where required, capability checks (e.g. canCommerce, canTrack), consistent error handling (see Standard Error Responses), validation on both backend and frontend, and security requirements (authorization, rate limiting, sanitization) as described above.
