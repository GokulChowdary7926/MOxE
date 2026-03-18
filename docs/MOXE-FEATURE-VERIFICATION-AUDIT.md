# MOxE Platform Feature Verification & Implementation Audit

**Date:** March 2026  
**Scope:** Comprehensive audit of 627+ features across Shared/Basic, Personal, Business, Creator, and Job account types.  
**Methodology:** Schema → API → Service → UI → Routing → E2E (per feature where applicable).

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|--------|
| **Database (Prisma)** | ✅ | Schema covers Account, User, Post, Story, Reel, Message, Group, Commerce, Job tools, Support, Premium, etc. |
| **Backend API** | ✅ | 50+ route modules mounted under `/api/*`; auth middleware; error handler. |
| **Frontend routing** | ✅ | 200+ routes in App.tsx; ProtectedRoute; account-type and role gating. |
| **Shared/Basic** | ⚠️ | Core flows (auth, post, message, like, comment, share, save) implemented; some partial (video edit, tag people, polls). |
| **Personal** | ⚠️ | Close friends, favorites, archive, support tickets, premium blocked message; priority queue & screenshot flow partial. |
| **Business** | ⚠️ | Commerce, products, orders, ads/boost, analytics, shop, webinar library; MOxE Website/Custom domain partial. |
| **Creator** | ⚠️ | Subscriptions, insights, branded content, creator tools; translation UI added. |
| **Job** | ⚠️ | 24 tools (TRACK, WORK, KNOW, CODE, STATUS, FLOW, ACCESS, ALERT, BUILD, COMPASS, ATLAS, VIDEO, CHAT, DOCS, etc.); CHAT ticketing and DOCS implemented. |

---

## 2. Verification Methodology Applied

For each feature area:

1. **Schema** – Model and relations in `BACKEND/prisma/schema.prisma`.
2. **API** – Route exists, method correct, auth/validation.
3. **Frontend** – Page/component exists, uses `getApiBase()`/`getToken()`, loading/error states.
4. **Routing** – Route in `FRONTEND/src/App.tsx`, protected where needed.
5. **Connection** – Buttons/forms call the right API and update UI.

---

## 3. Shared/Basic Features – Status

### 3.1 Account Management

| Feature | Schema | API | UI | Route | Status |
|---------|--------|-----|-----|-------|--------|
| Phone registration | ✅ PhoneVerification | ✅ auth, phone verify | ✅ PhoneVerification.tsx | /verify | ✅ |
| Email addition | ✅ EmailVerification | Partial | Partial | - | ⚠️ |
| Username / display name / DOB / bio | ✅ Account | ✅ account routes | ✅ EditProfile, settings | /profile/edit, settings | ✅ |
| Profile photo | ✅ Account.profilePhoto | ✅ upload, account PATCH | ✅ EditProfile | - | ✅ |
| Link in bio / Pronouns | ✅ Account.website, pronouns | ✅ account | ✅ profile/settings | - | ⚠️ |

### 3.2 Content Creation

| Feature | Schema | API | UI | Route | Status |
|---------|--------|-----|-----|-------|--------|
| Post create (media, caption, location) | ✅ Post, ProductTag, Mention | ✅ POST /posts | ✅ NewPostPage → PostEditPage → PostSharePage | /create/post, /create/post/edit, /create/post/share | ✅ |
| Tag people in post | ✅ Mention | ✅ mentionedUserIds in POST /posts | ✅ ReelTagPeoplePage (search + select), PostSharePage sends mentionedUserIds | /create/post/tag | ✅ (fixed) |
| Video edit (trim, cover, mute, speed) | - | Edits in media payload | ✅ CreatePost.tsx (Video options section) | CreatePost not in main route; PostSharePage no video opts | ⚠️ |
| Edit photo (filters, adjustments) | - | edits in media | ✅ CreatePost.tsx, PostEditPage (sticker UI) | - | ⚠️ |
| Schedule post | ✅ Post.scheduledFor | ✅ posts | ✅ CreatePost; PostSharePage no schedule | - | ⚠️ |
| Story create / stickers / highlights | ✅ Story, Highlight | ✅ story, highlight routes | ✅ AddStoryPage, StoryViewer, ManageHighlights | /stories/create, /highlights/* | ✅ |
| Reel create | ✅ Reel | ✅ reels | ✅ NewReelPage, ReelEditPage, ReelSharePage | /create/reel/* | ✅ |

### 3.3 Engagement

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Like / unlike post | ✅ Like | ✅ POST/DELETE like | ✅ FeedPost (heart), PostDetail | ✅ |
| Comment / reply / edit / delete | ✅ Comment | ✅ comments CRUD, PATCH 15min | ✅ FeedPost, CommentThread (edit timer) | ✅ |
| Share to DM / Story | - | ✅ share, messages | ✅ SharePage, MessageSharePage | ⚠️ |
| Save / collections | ✅ Collection, SavedPost | ✅ collections, posts save | ✅ SaveButton, SavedCollections | ✅ |

### 3.4 Direct Messages & Groups

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Send message (text, media, voice, GIF) | ✅ Message | ✅ POST /messages | ✅ Messages.tsx | ✅ |
| Message requests | ✅ MessageRequest | ✅ message_requests | ✅ MessageRequests, Messages | ✅ |
| Poll in group | ✅ Message POLL, votePoll | ✅ POST messages, POST poll/vote | ✅ Messages (Poll button in group, create + vote) | ✅ |
| Group create / list | ✅ Group | ✅ groups | ✅ Messages (group list, thread by groupId) | ✅ |
| Delete / mute / pin | ✅ | ✅ messages routes | ✅ Messages.tsx | ✅ |

### 3.5 Privacy & Safety

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Block / unblock | ✅ Block | ✅ privacy block | ✅ BlockedList, profile/settings | ✅ |
| Restrict / mute | ✅ Restrict, Mute | ✅ privacy | ✅ RestrictedList, MutedList, settings | ✅ |
| Hidden words / limit interactions | ✅ Account.hiddenWords, etc. | ✅ account, privacy | ✅ HiddenWordsSettings, LimitInteraction* | ⚠️ |
| Report content | ✅ Report | ✅ reports | ✅ Report flow in UI | ⚠️ |

### 3.6 Notifications

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Notification prefs / quiet mode | ✅ Account.notificationPrefs, quietMode* | ✅ account, config | ✅ NotificationsSettings, QuietModeSettings | ⚠️ |

---

## 4. Personal Account Features – Status

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Close friends list | ✅ CloseFriend | ✅ close-friends | ✅ CloseFriendsList, CloseFriendsAdd | ✅ |
| Favorites feed | - | ✅ feed favorites | ✅ FavoritesFeed | ✅ |
| Archive | ✅ Post.isArchived | ✅ archive | ✅ Archive | ✅ |
| Star tier: Ad-free, profile visitors, anonymous story | ✅ Account.subscriptionTier | ✅ config, activity | ✅ Settings, ProfileVisitorsPage | ⚠️ |
| Screenshot notifications | - | Partial | - | ⚠️ |
| Priority support | ✅ SupportTicket.isPriority | ✅ support (queue=true) | Support dashboard can call ?queue=true | ✅ (backend) |
| Message blocked user (2/month) | ✅ PremiumBlockedMessage, Grant | ✅ premium/blocked-messages | ✅ Messages (blockedByThem + modal) | ✅ |

---

## 5. Business Account Features – Status

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Commerce (products, orders, shop) | ✅ Product, Order, etc. | ✅ commerce | ✅ Commerce, Checkout | ✅ |
| Product tag in post | ✅ ProductTag | ✅ posts productTags | ✅ PostSharePage (tag products) | ✅ |
| MOxE Website / custom domain | ✅ Account.shopUsername, customDomain | ✅ GET website/:username, PATCH domain | ✅ Commerce (MOxE Website section) | ⚠️ (no hosting/DNS) |
| Ads / boost | ✅ AdCampaign, etc. | ✅ ads | ✅ AdsCampaigns, Boost* | ⚠️ |
| Seller verification / reviews | ✅ Review, seller fields | ✅ commerce, review | ✅ Commerce, ReviewsPage | ⚠️ |
| Webinar library | ✅ SellerWebinar | ✅ GET commerce/webinars | ✅ Commerce (Webinar library section) | ✅ |

---

## 6. Creator Account Features – Status

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| Subscriptions / tiers | ✅ SubscriptionTierOffer, etc. | ✅ creator, account | ✅ CreatorSubscriptionTiers, settings | ⚠️ |
| Branded content | ✅ Post.brandedContent* | ✅ posts | ✅ PartnershipLabelAdsPage, insights | ⚠️ |
| Creator insights / dashboard | - | ✅ analytics, creator | ✅ CreatorStudio, InsightsHub | ⚠️ |
| Real-time translation UI | - | ✅ translate/text, languages | ✅ FeedPost (Translate on caption + comments) | ✅ |

---

## 7. Job Account Features – Status

| Feature | Schema | API | UI | Status |
|---------|--------|-----|-----|--------|
| TRACK (projects, issues, sprints, board) | ✅ Job project/issue models | ✅ job/track/* | ✅ Job TRACK | ✅ |
| WORK (Gantt, tasks) | ✅ | ✅ job/work/* | ✅ Job WORK | ✅ |
| KNOW (wiki/spaces) | ✅ Space, Page, etc. | ✅ job/know/* | ✅ Job KNOW | ⚠️ |
| CODE, STATUS, FLOW, ACCESS, ALERT, BUILD, COMPASS, ATLAS | ✅ | ✅ job routes | ✅ Job tool panels | ✅/⚠️ |
| VIDEO (recordings) | ✅ Video | ✅ job/video/* | ✅ Job VIDEO | ✅ |
| CHAT (ticketing) | ✅ ChatTicket | ✅ job/chat/tickets | ✅ Chat.tsx (Conversations + Tickets) | ✅ |
| DOCS (real-time docs) | ✅ JobDocument, Version, Comment | ✅ job/docs | ✅ Docs.tsx | ✅ |
| SOURCE, CODE SEARCH, AI, STRATEGY, ANALYTICS, INTEGRATION, TEAMS, SCRUM, PROFILE | ✅/Partial | ✅ job routes | ✅ Job hub | ⚠️ |

---

## 8. Connection Fixes Applied in This Audit

### 8.1 Tag People – Main Post Flow

- **Issue:** Tag people was implemented in CreatePost.tsx and backend accepted `mentionedUserIds`, but the main flow (NewPostPage → PostEditPage → PostSharePage) did not send `mentionedUserIds` and ReelTagPeoplePage was a stub.
- **Fix:**
  - **PostSharePage.tsx:** Added `mentionedUserIds` state; sync from `location.state.mentionedUserIds` when returning from Tag page; include `mentionedUserIds` in POST /posts body; "Tag people" navigates to `/create/post/tag` with state `{ files, mentionedUserIds }` and shows "X selected" when non-empty.
  - **ReelTagPeoplePage.tsx:** Implemented user search via `GET /explore/search?type=users`, display results, add/remove selected users; on Done, `navigate(-1, { state: { mentionedUserIds, files } })` so PostSharePage receives IDs and preserves files.
- **Verification:** Create post → Tag people → Search → Add users → Done → Share; post payload includes `mentionedUserIds`; backend creates Mention records.

### 8.2 Support Priority Queue

- **Backend:** `GET /support/tickets?queue=true` returns all tickets ordered by `isPriority` (desc), then `createdAt` (desc). Star tier tickets get `isPriority: true` on create.
- **Frontend:** Any support dashboard or agent UI can call `GET /api/support/tickets?queue=true` to show priority queue.

### 8.3 Premium Blocked Message (2/month)

- **Frontend:** When `can-message` returns `blocked_by_them`, Messages.tsx shows "Send limited message" and modal that calls `GET /premium/blocked-messages/check` and `POST /premium/blocked-messages` with 150-char limit and remaining grants.

---

## 9. Common Issues to Check (From Prompt)

- **Icons/buttons not connected:** Addressed for Tag people (ReelTagPeoplePage and PostSharePage). Elsewhere, spot-check FeedPost (like, comment, share, save), Messages (send, poll, reactions).
- **Forms not submitting:** PostSharePage and CreatePost both submit to POST /posts with correct body.
- **Loading/error states:** Many components use local state for loading/error; ensure all API calls set them.
- **Routing:** 404 is handled by `<Route path="*" element={<Navigate to="/" />} />` (no dedicated 404 page).
- **Account/tier gating:** ProtectedRoute supports `requiredType` and `requiredRole`; Job routes use `requiredType="JOB"`, Business/Creator dashboards use `requiredType`.

---

## 10. Recommended Next Steps

1. **Create dedicated 404 page** – Replace `Navigate to="/"` with a 404 component for invalid routes.
2. **Wire CreatePost into a route** – If full post flow (video options, schedule, tag people in one screen) is desired, add e.g. `/create/post/full` that uses CreatePost.tsx.
3. **Support dashboard** – Add a screen (e.g. Settings or Admin) that lists tickets with `?queue=true` for agents.
4. **MOxE Website / Custom domain** – Implement DNS verification and optional SSL/proxy for `username.moxe.store` and custom domains.
5. **Continue partial features** – Video trim/cover in main flow, schedule in PostSharePage, ad server/impressions, KNOW full wiki, ACCESS SSO/MFA, etc.

---

## 11. File Reference (Key Files Touched or Verified)

| Area | Files |
|------|--------|
| Tag people (main flow) | `FRONTEND/pages/create/PostSharePage.tsx`, `FRONTEND/pages/create/ReelTagPeoplePage.tsx` |
| Backend posts | `BACKEND/src/services/post.service.ts` (mentionedUserIds, Mention), `BACKEND/src/routes/post.routes.ts` |
| Support queue | `BACKEND/src/services/support.service.ts` (listQueue), `BACKEND/src/routes/support.routes.ts` (?queue=true) |
| Premium blocked message | `FRONTEND/pages/messages/Messages.tsx` (blockedByThem, modal, check/send) |
| Translation UI | `FRONTEND/components/ui/FeedPost.tsx` (Translate on caption/comments), `BACKEND/src/routes/translation.routes.ts` (POST /text) |
| Job CHAT/DOCS | `BACKEND/prisma/schema.prisma` (ChatTicket, JobDocument*), `BACKEND/src/services/job/chat-ticket.service.ts`, `docs.service.ts`, `FRONTEND/pages/job/Chat.tsx`, `Docs.tsx` |

---

*This audit is a living document. Re-run verification after implementing the recommended next steps and any additional features from the 627+ checklist.*
