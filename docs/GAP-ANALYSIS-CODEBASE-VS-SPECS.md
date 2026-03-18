# Gap Analysis: MOxE Codebase vs Functional Specifications

**Purpose:** Compare the current MOxE codebase to the detailed functional specifications (Business, Personal, Creator, Job account guides) and list what is **Implemented**, **Partially implemented**, or **Missing** by account type and area.

**Spec sources:**
- **Business:** Complete MOxE Business Account Functional Guide & Feature Explanation (seller journey, Live Shopping, product tagging, returns/settlements)
- **Personal:** Complete MOxE Personal Account Functional Guide (Sections 1–7)
- **Creator:** MOxE Creator Account Complete Feature Guide (Sections 0–16)
- **Job:** COMPLETE MOxE JOB ACCOUNT FUNCTIONAL GUIDE (Personal foundation + Section 8 + 24 professional tools)

**Legend:**
- **Implemented** — Backend and frontend wired end-to-end for the specified behavior.
- **Partial** — Core exists but with gaps (e.g. backend only, simplified UI, or missing sub-functions).
- **Missing** — Not implemented.

---

## 1. SHARED / BASIC (All account types)

*These features are specified in the guides as foundational for Personal, Business, Creator, and Job.*

| Area | Component / Sub-component | Status | Notes |
|------|---------------------------|--------|--------|
| **Account** | Phone registration, email add/verify, username, display name, DOB, profile photo, bio, link(s), pronouns | Implemented | auth.routes, account.routes, EditProfile; Link model for multi-link (Business/Creator). |
| **Privacy** | Account privacy (isPrivate), follow requests, remove followers, search visibility, activity status | Implemented | removeFollower for all accounts; Followers.tsx Remove; lastActiveAt in auth middleware. |
| **Story privacy** | Hide story from, reply/reshare controls, story archive | Implemented | HideStoryFrom, allowReplies/allowReshares, storyArchiveEnabled; Archive run-job cron. |
| **Content** | Posts (media, caption, hashtags, location, alt text, advanced settings) | Implemented | CreatePost, post.service; PhotoEditorModal, VideoCoverModal; hashtag suggest. |
| **Content** | Stories (create, stickers: poll, question, countdown, link, donation, Add Yours, music) | Implemented / Partial | CreateStory full; donation sticker and story **link** sticker may be partial. |
| **Content** | Reels, story highlights | Implemented | Reels CRUD; highlight.routes, NewHighlight, HighlightManage, HighlightEdit. |
| **Engagement** | Like (post, story), comment, share (DM, story) | Implemented | Like, StoryLike; Comment CRUD; Share to DM/story; StoryViewer like. |
| **Save & collections** | Save posts, create/manage/share collections | Implemented | SavedPost, Collection CRUD; shareToken; Saved page, SharedCollection. |
| **DMs** | Send, requests, voice, media, GIFs, reactions, delete, mute, pin, view-once | Implemented | message.service; Messages.tsx; VOICE, GIF, isVanish. |
| **DMs** | Group chats (create, members, admin, leave) | Implemented | group.routes; CreateGroup; setAdmin, leave. |
| **DMs** | Group polls | Partial | Message type POLL / GroupPoll model not fully confirmed. |
| **Safety** | Block, restrict, mute, report, hidden words | Implemented | Block (with duration), Restrict, Mute, report.routes; Account hiddenWords. |
| **Notifications** | Push, list, mark read; Quiet Mode | Implemented / Partial | NotificationService; QuietModeSettings; per-type notification preferences may be partial. |

---

## 2. PERSONAL ACCOUNT

*Spec: Complete MOxE Personal Account Functional Guide (Sections 1–7).*

| Section | Component | Status | Notes |
|---------|------------|--------|--------|
| **1** | Account creation (phone, email, username, display name, DOB, photo, bio, link, pronouns) | Implemented | PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md; 150-char bio for Personal. |
| **1** | Account privacy, follow requests, remove followers, search visibility, activity status | Implemented | PrivacySettings; removeFollower; searchVisibility. |
| **1** | Story privacy (hide from, reply/reshare, archive) | Implemented | HideStoryFrom.tsx; CreateStory allowReplies/allowReshares. |
| **2** | Posts (media, editing, caption, hashtags, location, alt text, advanced) | Implemented | CreatePost; PhotoEditorModal, VideoCoverModal; location; advanced (hide like, turn off comments). |
| **2** | Stories (camera modes, stickers), story highlights | Implemented | CreateStory; highlights from archive; HighlightManage, HighlightEdit. |
| **3** | Engagement (like post/story, comments, share) | Implemented | PostCard, StoryViewer like; CommentThread; share to DM/story. |
| **4** | Save & collections | Implemented | SavedPost, Collection CRUD; Saved page; share collection. |
| **5** | DMs (send, requests, voice, media, GIF, reactions, delete, mute, pin, groups) | Implemented | Messages; useThread; group CRUD. |
| **6** | Block, restrict, mute, report, hidden words | Implemented | BlockedAccounts, RestrictedList; report; Hidden words UI. |
| **7** | **Star tier:** Ad-free, profile visitors, anonymous story viewing, download protection, voice commands, priority support, message blocked user | Implemented / Partial | ProfileVisitorsPage; anonymous story views; screenshotProtection in CreatePost/CreateStory; VoiceCommands; Priority Support tickets; PremiumBlockedMessage. Ad-free gate (useAdFree); full DRM/watermark partial. |
| **—** | Lifestyle streaks | Implemented | Streak model; Streaks.tsx; check-in, types. |
| **—** | Edit comment (within 15 min) | Partial | Backend PATCH comment; edit UI in CommentThread/FeedPost may be missing. |

---

## 3. BUSINESS ACCOUNT

*Spec: Complete MOxE Business Account Functional Guide & Feature Explanation.*

| Section | Component | Status | Notes |
|---------|------------|--------|--------|
| **3.1** | Switch to Business, category, contact, hours, multiple links (5), action buttons, verification | Implemented | ConvertToBusiness; businessCategory; contactEmail/Phone/Address; businessHours; Link model; actionButtons; VerificationRequest. |
| **3.2** | Blue Verification Badge, customer reviews | Implemented | verifiedBadge; Review model; create/respond/report reviews; rating on shop. |
| **3.3** | Analytics & insights (overview, content performance, demographics, follower growth, website/action clicks) | Implemented | GET /analytics/insights; BusinessInsights; export CSV; action button tracking. |
| **3.4** | Promotions & advertising (ad campaign, boost post) | Partial | BusinessPromotions; promotion.service; full ad server (impressions, billing) partial. |
| **3.5** | Product tagging (feed/reel/story, max 5, tag clicks) | Implemented | productTags; ProductTagClick; POST commerce/product-tag/click. |
| **3.5** | MOxE Shop (collections, banner, featured, layout) | Partial | Commerce, shop tab; full collections/banner/featured per guide to be confirmed. |
| **3.5** | MOxE Website (username.moxe.store, sync, custom domain) | Partial | GET /commerce/website/:username; Commerce.tsx MOxE Website section (default URL, custom domain input, save, verify). No actual moxe.store subdomain hosting in code. |
| **3.5** | In-app checkout (UPI, cards, coupons, address, receipt) | Partial | Checkout flow; coupon/discount code at checkout missing; payment reference-only. |
| **3.5** | Seller verification (PAN, GSTIN, bank, verified seller badge) | Partial | Business verification exists; PAN/GSTIN/seller-specific program to align. |
| **3.5** | Order management, returns (seller pays return shipping), settlements (7-day) | Implemented | CommerceOrders; updateOrderStatus; return approve/label/refund; Payout, settlement.service. |
| **3.5** | Seller dashboard, responsibilities, buyer access, seller help | Implemented / Partial | Commerce dashboard; seller terms; HelpCentrePage; guest checkout / multi-seller cart partial. |
| **3.6** | Business inbox (quick replies, auto-responses, labels) | Partial | BusinessQuickReplies; labels/auto-responses may be partial. |
| **3.7** | Content scheduling (posts, stories, reels, calendar, best time) | Implemented | BusinessScheduling, BusinessCalendar; scheduledFor; publishDueScheduledContent cron. |
| **3.8** | Team management (add members, roles, activity log) | Implemented / Partial | GET/POST/PATCH/DELETE business/team; roles; team activity log partial. |
| **4** | Nearby Messaging (radius, daily limit, Blue badge 1 free/day, $0.50 extra) | Partial | nearbyEnabled; BusinessLocal; post limit and billing partial. |
| **4** | SOS, DRM/screenshot, Proximity Alert, Voice, Streaks, Live Shopping | Implemented / Partial | safety.routes; screenshotProtection; proximity; voice; streaks; Live Shopping (replay-with-tags partial). |
| **4** | Real-time translation | Partial / Deferred | translation.routes; UI for posts/comments may be partial; sometimes deferred. |

---

## 4. CREATOR ACCOUNT

*Spec: MOxE Creator Account Complete Feature Guide (Sections 0–16).*

| Section | Component | Status | Notes |
|---------|------------|--------|--------|
| **0** | Personal foundation (all Personal features) | Implemented | Same routes/schema as Personal; CREATOR capabilities. |
| **8** | Switch to Creator, category, contact, verification, multiple links (5), action buttons, Blue Badge (Paid) | Implemented | ConvertToCreator; businessCategory/creator categories; contact; VerificationRequest; Link; actionButtons; verifiedBadge when THICK. |
| **9** | Subscriptions (tiers, perks, welcome message); subscriber-only content; subscriber management | Implemented | subscriptionTierOffers; GET/PATCH subscription-tiers; isSubscriberOnly/subscriberTierKeys; GET subscribers; CreatorSubscriptionTiers, CreatorSubscribers. |
| **9** | Live badges (Bronze/Silver/Gold/Platinum), badge analytics | Implemented | POST live/:id/badges; getBadgeAnalytics. |
| **9** | Gifts (Hearts, Stars, etc.), gift analytics | Implemented | POST live/:id/gifts; getGiftAnalytics; LiveGift. |
| **9** | Bonuses (invite-only Reels), branded content (tag, disclosure) | Implemented | ReelBonus; GET creator/bonuses; Post brandedContentBrandId, brandedContentDisclosure. |
| **10** | Creator insights (overview, demographics, content performance) | Implemented | analytics/insights; BusinessInsights; CREATOR THICK. |
| **11** | Trending audio, content ideas, content calendar, scheduling, best time | Implemented | getTrendingAudio; getContentIdeas; getContentCalendar; scheduling; getBestTimeRecommendations. |
| **12** | Collab posts (coAuthorId), creator network (connect, accept), brand campaign marketplace | Implemented | Post.coAuthorId; CreatorConnection; BrandCampaign, BrandCampaignApplication; CreatorNetwork, CreatorCampaigns. |
| **13** | Creator inbox (labels, quick replies, auto-responses) | Implemented | ConversationLabel (BRAND/FAN/COLLABORATOR); MessageTemplate; AutoResponseRule; CreatorQuickReplies, CreatorAutoResponses. |
| **14** | Comment filter sensitivity, harassment protection (3 reports → restrict), hidden words | Implemented | commentFilterSensitivity; report.service auto-restrict; hiddenWords. |
| **15** | Nearby, SOS, translation, DRM, Proximity, voice, streaks | Implemented | location.service; safety; translation; DRM; proximity; voice; streak. |
| **16** | Free vs Paid tier (Creator Free vs Creator Paid, Blue Badge when Paid) | Implemented | capabilities CREATOR+FREE vs THICK; subscriptionsEnabled, badgesEnabled, giftsEnabled on upgrade. |
| **—** | Subscriber badge in comments | Implemented | getComments enriched with isSubscriber/subscriberTierKey; ★ badge in CommentThread/FeedPost. |

---

## 5. JOB ACCOUNT

*Spec: COMPLETE MOxE JOB ACCOUNT FUNCTIONAL GUIDE (Personal foundation + Section 8 + 24 tools).*

### 5.1 Personal foundation (Section 0)

| Area | Status | Notes |
|------|--------|--------|
| All Personal Account features (account, privacy, content, engagement, save, DMs, safety, notifications) | Implemented | Same backend/frontend; JOB capabilities (canCloseFriends, canSavedCollections, maxLinks: 5, etc.). |

### 5.2 Job account setup & verification (Section 8)

| Component | Status | Notes |
|-----------|--------|--------|
| 8.1.1 Switch to Job (dual sections, preserve followers) | Implemented / Partial | PATCH accountType JOB; dual profile (professional/personal) and “suggest categorization” per guide TBD. |
| 8.1.2 Professional section (role, experience, education, skills, portfolio, certs, languages, volunteer) | Partial | EditProfileJobFields; full professional subsection list per guide to align. |
| 8.1.3 Personal section (bio, interests, family, milestones, visibility) | Partial | Job profile fields; granular visibility per element TBD. |
| 8.1.4 Purple Verification Badge (verified + paid; display next to username) | Implemented | verifiedBadge; JobProfile + PostCard show Purple (#a855f7) for JOB when verifiedBadge. |
| Dual profile toggle (activeProfile), professional feed filter | Implemented | activeProfile on Account; PATCH /accounts/me; toggle UI in Job. |
| Saved job searches + job alerts | Implemented | SavedJobSearch model; CRUD in track.service; Track.tsx saved searches modal and alerts. |
| Company reviews UI (submit, display) | Implemented | Know.tsx company review form; submit; display reviews. |

### 5.3 The 24 professional Job tools

| # | Tool | Status | Notes |
|---|------|--------|--------|
| 1 | **MOxE TRACK** (Agile: projects, issues, sprints, boards, backlog) | Implemented | track-agile.service; Track.tsx; TrackProjectDetail (board, backlog, sprints, labels, attachments, filter/export, bulk, CSV import). |
| 2 | **MOxE TRACK Recruiter** (requisitions, pipeline, interviews) | Implemented | Pipelines, stages; recruiter-specific UI/templates TBD. |
| 3 | **MOxE WORK** (business projects, task lists, Gantt, dependencies) | Implemented | work.service; job.routes /work/*; Work.tsx, WorkProjectDetail (Gantt, checklist, comments, attachments). |
| 4 | **MOxE KNOW** (spaces, pages, search) | Partial | Companies, CompanyReview, SalaryEntry, CareerResource, InterviewPrep; Know.tsx. Full wiki/spaces/pages not implemented. |
| 5 | **MOxE CODE** (repos, PRs, code review) | Implemented | job.routes: repos, branches, commits, PRs, merge, review, labels, collaborators; Code.service; Code.tsx. |
| 6 | **MOxE STATUS** (status page, incidents) | Implemented | job.routes: status/pages, components, incidents, updates, resolve; Status.service; Status.tsx. |
| 7 | **MOxE FLOW** (boards, lists, cards, drag-and-drop) | Implemented | flow.service; Flow.tsx; FlowBoard, FlowColumn, FlowCard; move card. |
| 8 | **MOxE ACCESS** (SSO, MFA, user management) | Partial | job.routes: GET /access/org only; Access.tsx. Full SSO/MFA/provisioning not in job API. |
| 9 | **MOxE ALERT** (on-call, schedules) | Partial | Backend at /api/alert (alert.routes); Alert.tsx. Job-scoped wiring to be confirmed. |
| 10 | **MOxE BUILD** (CI/CD) | Partial | Backend at /api/build (build.routes); Build.tsx. |
| 11 | **MOxE COMPASS** (service catalog) | Partial | Backend at /api/compass (compass.routes; services, docs); Compass.tsx. |
| 12 | **MOxE ATLAS** (OKRs, key results) | Partial | Backend at /api/atlas (atlas.routes); Atlas.tsx. |
| 13 | **MOxE VIDEO** (screen recording) | Implemented | job.routes: GET/POST /video, GET /video/:id; JobVideoService; Video.tsx. |
| 14 | **MOxE CHAT** (chat ticketing) | Missing | Convert message to ticket, ticket notifications; no dedicated backend. |
| 15 | **MOxE SOURCE** (Git GUI) | Partial | CODE covers repos/commits/push; Source.tsx; distinct Git GUI flows TBD. |
| 16 | **MOxE CODE SEARCH** | Implemented | GET /job/code/search; codeService.searchCode; CodeSearch.tsx. |
| 17 | **MOxE AI** (AI assistant) | Implemented | job.routes: GET /ai/history, POST /ai/chat; JobAIService; Ai.tsx. |
| 18 | **MOxE STRATEGY** (portfolio management) | Implemented | job.routes: strategy/plans CRUD; Strategy.service; Strategy.tsx. |
| 19 | **MOxE ANALYTICS** (cross-tool analytics) | Implemented | job.routes: GET /analytics/insights; JobAnalyticsService; Analytics.tsx. |
| 20 | **MOxE PROFILE** (unified identity across tools) | Partial | Account, JobProfile; “unified across all tools” per guide TBD. |
| 21 | **MOxE INTEGRATION** (cross-tool sync) | Implemented | job.routes: GET /integrations, connect, disconnect; JobIntegrationService; Integration.tsx. |
| 22 | **MOxE SCRUM** (automated Scrum) | Partial | TRACK agile (sprints, board) covers core; automated standup/retro bot TBD; Scrum.tsx. |
| 23 | **MOxE TEAMS** (collaboration hub) | Implemented | job.routes: GET/POST/PATCH/DELETE /teams; JobTeamsService; Teams.tsx. |
| 24 | **MOxE DOCS** (document editing, real-time) | Missing | Real-time doc editing not in job API; Compass has service docs only; Docs.tsx. |

*Note:* CODE, STATUS, FLOW, WORK, VIDEO, AI, STRATEGY, ANALYTICS, INTEGRATION, TEAMS, and CODE SEARCH have backend under `/api/job`. ALERT, BUILD, COMPASS, ATLAS use separate roots (`/api/alert`, `/api/build`, `/api/compass`, `/api/atlas`). CHAT (ticketing) and DOCS (real-time editing) have no backend. Frontend pages exist for all 24 tools; wiring depth varies.

---

## 6. SUMMARY BY ACCOUNT TYPE

| Account type | Implemented | Partial | Missing |
|--------------|-------------|---------|--------|
| **Shared/Basic** | Account, privacy, content, engagement, save, DMs, groups, safety, notifications | Group polls; story donation/link sticker; per-type notification prefs | — |
| **Personal** | Full account, privacy, content, engagement, save, DMs, safety, Star tier (visitors, anonymous story, download protection, voice, priority support, message blocked user), streaks | Edit comment UI; full DRM/watermark | — |
| **Business** | Setup, verification, Blue Badge, reviews, analytics, product tagging, orders/returns/settlements, scheduling, team, shop basics, Live Shopping (core); MOxE Website UI + custom domain (partial) | Promotions/boost (mock); shop collections/banner; checkout coupon; PAN/GSTIN seller program; business inbox labels/auto-responses; team activity log; Nearby limits/billing; Live replay-with-tags; moxe.store hosting not in code | Real-time translation (if deferred) |
| **Creator** | Setup, verification, Blue Badge, subscriptions, badges, gifts, bonuses, branded content, insights, content tools, collab, inbox, safety, innovative features, Free/Paid tier, subscriber badge in comments | — | — |
| **Job** | Personal foundation; Job setup (convert, Purple Badge, dual profile toggle, saved searches, company reviews); TRACK (agile + recruiter), WORK, FLOW, CODE, STATUS, VIDEO, AI, STRATEGY, ANALYTICS, INTEGRATION, TEAMS, CODE SEARCH | KNOW (wiki/spaces); ACCESS (org only); ALERT, BUILD, COMPASS, ATLAS (separate API roots); SOURCE (overlap with CODE); SCRUM (agile present, automation TBD); MOxE PROFILE (unified identity) | CHAT (ticketing), DOCS (real-time editing) |

---

## 7. REFERENCE DOCUMENTS

- **Business:** `docs/BUSINESS_ACCOUNT_FUNCTIONAL_GUIDE_IMPLEMENTATION.md`, `docs/BUSINESS_ACCOUNT_FEATURE_AUDIT.md`, `docs/MOXE_BUSINESS_FEATURE_AUDIT.md`
- **Personal:** `docs/PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md`, `docs/MOXE_PERSONAL_ACCOUNT_IMPLEMENTATION_ROADMAP.md`
- **Creator:** `docs/MOXE_CREATOR_ACCOUNT_VERIFICATION.md`, `docs/MOXE_CREATOR_ACCOUNT_COMPLETE_GUIDE.md`
- **Job:** `docs/MOXE_JOB_ACCOUNT_FUNCTIONAL_GUIDE.md`, `docs/JOB_ACCOUNT_FEATURE_CHECKLIST.md`
- **Roadmap:** `docs/437-FEATURES-STATUS-AND-ROADMAP.md`

*Last updated: March 2026. Includes: Business MOxE Website + custom domain (partial); Job 24-tool verification (CODE, STATUS, VIDEO, AI, STRATEGY, ANALYTICS, INTEGRATION, TEAMS, CODE SEARCH implemented; ALERT, BUILD, COMPASS, ATLAS partial; CHAT, DOCS missing).*
