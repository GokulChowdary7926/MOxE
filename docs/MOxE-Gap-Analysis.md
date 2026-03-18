# MOxE Gap Analysis: Codebase vs Functional Specs

This document compares the current MOxE codebase to the functional specifications for **Basic**, **Personal**, **Business**, **Creator**, and **Job** accounts. For each area, status is: **Implemented**, **Partial**, or **Missing**.

**Legend**
- **Implemented** – Backend + frontend (or API + UI) present and wired; behavior matches spec.
- **Partial** – Some parts done (e.g. backend only, or one flow); rest missing or stubbed.
- **Missing** – Not present or only a stub/placeholder.

---

## 1. Shared / Basic (All Accounts)

Features that apply across account types (account creation, core feed, content, DMs, safety).

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account creation** | Phone verification (send code, verify, register) | Implemented | `phoneVerification.service`, `/send-verification-code`, `/verify-code`; `PhoneVerification.tsx` (code, password, username, displayName, dateOfBirth). |
| | Email signup / verify email | Partial | Backend: `/verify-email`; no full “register with email” parity with phone flow; optional verify-email page. |
| | Google OAuth | Implemented | `/auth/google/url`, `/auth/google/callback`; `AuthCallback.tsx`; JWT + user fetch. |
| | Username, display name, DOB, profile photo | Implemented | Onboarding + EditProfile; PATCH `accounts/me`; DOB in `PhoneVerification.tsx`, `DateOfBirthPage.tsx`. |
| **Profile** | Bio, pronouns, link in bio | Implemented | EditProfile, Onboarding; links edited under Account Settings (`/settings/account/links`). |
| | Profile photo upload in EditProfile | Partial | EditProfile shows photo; in-form “change profile photo” upload flow not explicit (may be via settings). |
| | Multiple links (max by account) | Implemented | Backend `maxLinks` by type; Account Settings links page. |
| **Privacy (base)** | Public/private account | Implemented | `AccountPrivacy.tsx`, `isPrivate`; PATCH me. |
| | Follow requests (inbox, approve/decline) | Implemented | `follow.routes` (requests, approve/decline); `FollowRequests.tsx`. |
| | Remove followers | Implemented | `removeFollower`; DELETE `/follow/followers/:followerId`; `Followers.tsx` “Remove”. |
| | Profile visibility in search | Implemented | `searchVisibility` (EVERYONE / FOLLOWERS_ONLY / NO_ONE); `PrivacySettings.tsx`; explore.service filters. |
| | Activity status (show when active) | Partial | Settings pages exist (`ShowActivityStatusSettings.tsx`); backend mapping to `showActivityStatus`/config may be partial. |
| | Story privacy (hide from, reply controls, reshare) | Partial | `HideStoryFrom.tsx`, `StoryReplySettings.tsx`, `AllowStoryCommentsFrom.tsx`; backend hide-story-from, limit-interactions; reply-control enums/APIs may be incomplete. |
| **Content – Posts** | Create post (media, caption) | Implemented | `NewPostPage` → `PostEditPage` → `PostSharePage`; POST `/posts` (media, caption). |
| | Multi-photo (carousel, up to 10) | Implemented | NewPostPage multi-select; carousel in edit/share. |
| | Alt text, location on post | Partial | Backend schema and post.service support `altText`, location; PostSharePage does not clearly pass them in create payload. |
| | Hashtags (in caption) | Implemented | Caption-based; sticker bar in PostEditPage. |
| | Advanced (turn off comments, hide like count) | Partial | Backend has `allowComments`, `hideLikeCount`; create flow may not expose. |
| | Schedule post | Implemented | `canSchedulePosts`; CreatePost schedule datetime; `scheduling.service.publishDueScheduledContent` cron. |
| **Content – Stories** | Create story (camera/upload, text, stickers) | Implemented | `CreateStory.tsx`; stickers: poll, questions, countdown, link, donation, emoji_slider; alt text; share to API. |
| | Music sticker | Partial | `StoryMusicPage.tsx`, `StorySearchStickersPage.tsx`; backend integration may be partial. |
| | GIF sticker for stories | Partial | GIF for DMs (gif.routes); story GIF sticker flow not explicit. |
| **Content – Reels** | Create reel (video, caption, audio) | Implemented | Reel create flow; reel.service. |
| **Content – Highlights** | Create from story, manage, cover | Implemented | `highlight.routes`, `highlight.service`; `ManageHighlights.tsx`, `EditHighlightPage.tsx`, `HighlightViewer.tsx`. |
| **Engagement** | Like post / story | Implemented | POST/DELETE like on post and story; `FeedPost`, `StoryViewer`. |
| | Comments (post/reel/story/live) | Implemented | Comments API; `CommentThread`, `PostDetail`; hidden comments, approve. |
| | Share to DM | Implemented | POST `/share-post`; `SharePage`, `MessageSharePage`. |
| | Share to story | Partial | Share-to-story flow or reuse CreateStory with prefill may be partial. |
| **Save & collections** | Save post, unsave | Implemented | POST/DELETE `/:postId/save`; optional collectionId. |
| | Create/edit/delete collection | Implemented | `collection.routes`; `SavedCollections.tsx` (list, create, share). |
| | Choose collection when saving | Partial | Save API supports collectionId; “choose collection” UI may be simplified. |
| **DMs** | Send message (text, media) | Implemented | message.routes send (content, messageType, media); Messages.tsx. |
| | Message requests inbox | Implemented | messageRequests.routes; `MessageRequests.tsx`. |
| | Voice messages | Partial | Backend `messageType` VOICE; Messages.tsx has microphone, record (MediaRecorder), send VOICE; some docs say “Not started” — treat as partial until E2E verified. |
| | GIF in DMs | Implemented | gif.routes (GIPHY); messageType GIF. |
| | Reactions, delete, mute, pin thread | Implemented | add/delete reaction; delete message; pin/mute in message.routes; UI in Messages. |
| | View once (vanish) | Implemented | `isVanish` in send; mediaExpiration for view-once. |
| | Group chats (create, members, admin, leave) | Implemented | group.routes; CreateGroup; setAdmin, leave. |
| | Group polls | Partial | Backend: PollVote, POST message/:id/poll/vote; Message type POLL; UI for create/vote may be partial. |
| **Safety** | Block (permanent) | Implemented | privacy.service block; BlockedList, SafetyCenter. |
| | Temporary block (24h, 7d, 30d) | Implemented | Block `expiresAt`, `durationDays`; SafetyCenter duration dropdown; expiry in blocked list. |
| | Restrict, mute (posts/stories) | Implemented | privacy.routes; RestrictedList, MutedList; mute posts/stories. |
| | Report (content/user) | Implemented | report.routes; ReportProblem; payload may be generic. |
| | Hidden words (comments + DMs) | Implemented | hiddenWords, hiddenWordsCommentFilter, hiddenWordsDMFilter; HiddenWordsSettings; post/message services filter. |
| | Limit interactions (duration) | Implemented | limitInteraction.service (commentsFrom, dmsFrom, duration, expiresAt); settings. |
| **Platform** | Nearby (location, nearby list, opt-in) | Implemented | location.routes (nearbyEnabled, nearby-post); NearbyMessagingPage, NearbyPlacesPage. |
| | SOS / Safety check-in | Implemented | safety.routes (sos, hangout); SOSPage, SafetyCheckinPage; emergencyContact.routes. |
| | Proximity Alert | Implemented | proximity.routes (create/update/delete); ProximityAlertsPage. |
| | Anonymous Spaces | Implemented | anonymousSpace.routes; AnonymousSpaces.tsx. |
| | Lifestyle Streaks | Implemented | streak.routes; Streaks.tsx. |
| | View once media (vanish) | Implemented | isVanish + mediaExpiration. |

---

## 2. Personal Account (FREE & STAR)

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Capabilities** | FREE: feed, post, story, reels, DMs, explore, 1 link; no scheduling | Implemented | Backend PERSONAL + FREE: canSchedulePosts false, maxLinks 1. |
| | STAR: scheduling, insights, close friends, collections, 5 links | Implemented | PERSONAL + STAR: canSchedulePosts, canAnalytics, maxLinks 5. |
| **Close Friends** | List, add, remove | Implemented | closeFriend.routes; CloseFriendsList, CloseFriendsAdd. |
| **Favorites** | Mark accounts as Favorites; Favorites feed | Partial | Backend GET `/feed/favorites`; PrivacySettings describes Favorites; no dedicated Favorites feed in main nav. |
| **Archive** | Archive posts; recently deleted | Implemented | archive.routes; GET archived, GET deleted; Archive.tsx. |
| | Archive stories (stories tab in archive) | Partial | Archive API/routes; “stories” section in archive UI may be partial. |
| **Star tier** | Ad-free experience | Partial | subscriptionTier STAR/THICK in schema; ad-free behavior not clearly wired in feed/ads. |
| | Profile visitors (who viewed profile) | Partial | Schema has hideProfileVisits; “profile visitors” feature may be partial. |
| | Anonymous story viewing | Partial | anonymousStoryViews in schema; feature not clearly exposed. |

---

## 3. Business Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account** | Switch to Business, category, contact, hours | Implemented | Account type switch; business fields in account; BusinessDashboard. |
| | Action buttons, multiple links | Implemented | account.service; business.routes. |
| | Verification (PAN, GSTIN, bank); Blue Badge | Implemented | Verification flow; verifiedBadge on profile/feed. |
| **Commerce** | Shop (catalog, collections, banner, featured) | Implemented | commerce.routes (shop, collections, products); Commerce.tsx; shop by username. |
| | Product tagging (post, reel, story; max 5; x/y) | Partial | Backend: ProductTag on Post/Reel/Story; productTags in create; ProductTagClick; CreatePost UI does not expose product tag picker in create flow. |
| | Product tag click tracking | Implemented | POST `/commerce/product-tag/click`; analytics productTagClicks. |
| | Cart, checkout (guest, coupon) | Implemented | commerce cart, checkout; SellerCoupon; guest checkout. |
| | Orders (seller + buyer), returns | Implemented | orders CRUD; returns flow; HelpOrdersPage. |
| | Settlements (7-day, return deductions) | Implemented | settlements routes; Payout model. |
| | Reviews (create, list, aggregate, respond, report) | Implemented | review.service; commerce reviews routes. |
| **Analytics** | Overview (reach, engagement, profile visits, clicks) | Implemented | analytics.service getBusinessInsights; BusinessInsights; productTagClicks, websiteClicks, actionButtonClicks. |
| | Demographics, follower growth, export | Implemented | Demographics placeholder; trendData; export. |
| **Promotions / Ads** | Boost (objectives, audience, budget, creative) | Implemented | Boost flow (goals, audiences, budget, review); promotions. |
| | Scheduled posts / calendar | Implemented | scheduling.service; BusinessScheduling, BusinessCalendar. |
| **Live Shopping** | Schedule live, add products, pin, discount | Implemented | live.routes (pin product); LiveProduct; checkout liveId. |
| | Live replay with product tags | Partial | Recording URL; replay page with product overlay not implemented. |
| **Other** | Seller verification (status/badge) | Implemented | Verification + Blue Badge display. |
| | Custom domain (store) | Partial | commerce custom-domain/verify; verify may be stub. |
| | Seller help center, team, quick replies | Implemented | Business dashboard; business routes; SavedRepliesPage. |

---

## 4. Creator Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Capabilities** | FREE: live, schedule, basic analytics, 5 links | Implemented | CREATOR + FREE in capabilities. |
| | THICK: subscriptions, badges, gifts, full analytics, Blue Badge | Implemented | CREATOR + THICK; canSubscriptions, canBadgesGifts. |
| **Subscriptions** | Tiers, create tier, subscribe, list | Implemented | creatorSubscription.service; CreatorSubscriptionTiers; creator.routes. |
| **Badges & Gifts** | Badge display; send/receive gifts | Partial | Schema and capabilities; GiftsPage (accountType check); full badge/gift transaction UI may be partial. |
| **Branded content** | Approve/decline; status; disclosure | Partial | creatorTools.service; InsightsBrandedContentPage, BrandedContentStatusPage; approval/decline flows may be partial. |
| **Insights** | Content, followers, interaction, branded, earnings | Implemented | InsightsHub, InsightsContentPage, InsightsFollowersPage, InsightsInteractionPage, ApproximateEarningsPage, InsightsMonetisationStatusPage. |
| **Content tools** | Best practices, calendar, scheduling | Implemented | CreatorStudio; scheduling; content calendar. |
| **Payouts** | Setup, history, payouts page | Implemented | PayoutsPage; setup payout account; commerce settlements. |

---

## 5. Job Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account** | Job account (paid); dual profile; Purple Badge when verified | Implemented | JOB type; canDualProfile; verification. |
| **Capabilities** | Track, Know, Flow, Work, dual profile, job feed, networking | Implemented | capabilities.ts JOB; ProtectedRoute requiredType="JOB". |
| **TRACK** | Applications, pipeline, stages | Implemented | job/track.service; track.routes; Job hub Track. |
| **Recruiter** | Postings, candidates, offers | Implemented | track-recruiter.service; Job hub Recruiter. |
| **WORK** | Tasks, projects, comments | Implemented | work.service; Job hub Work. |
| **KNOW** | Companies, reviews, salary, comments | Implemented | know.service; know-knowledge; Job hub Know. |
| **CODE** | Repos, PRs, comments | Implemented | code.service; Job hub Code. |
| **STATUS** | Status pages, incidents | Implemented | status.service; Job hub Status. |
| **FLOW** | Boards, columns, cards, comments | Implemented | flow.service; Job hub Flow. |
| **Other tools** | Compass, Build, Atlas, Access, Alert, Video, Chat, Source, CodeSearch, Ai, Strategy, Analytics, Scrum, Integration, Docs, Teams | Implemented | Corresponding services and Job hub pages exist; depth varies (some CRUD-only). |
| **Privacy & safety** | Same as base (block, restrict, mute, report, limit interactions) | Implemented | Shared privacy/safety; Job account uses same. |

---

## 6. Summary by Status

### Implemented (spec met in codebase)
- Account creation (phone, Google), profile (bio, pronouns, links), privacy (public/private, follow requests, remove followers, search visibility).
- Post/reel creation (media, caption, schedule); story creation (text, stickers); highlights.
- Engagement (like, comment, share to DM); save and collections (save, create/manage collection).
- DMs (text, media, GIF, reactions, delete, mute, pin, view once, groups).
- Safety (block, temporary block, restrict, mute, report, hidden words, limit interactions).
- Platform (Nearby, SOS, Proximity Alert, Anonymous Spaces, Streaks, view once).
- Personal: Close Friends, Archive (posts, recently deleted), STAR capabilities (scheduling, insights, 5 links).
- Business: switch, verification, shop, cart/checkout/orders/returns/settlements, reviews, analytics, promotions, scheduling, Live Shopping (without replay tags).
- Creator: subscriptions, insights, content tools, payouts.
- Job: hub and 24 tools (Track, Recruiter, Work, Know, Code, Status, Flow, etc.).

### Partial (backend or UI incomplete)
- **Account:** Email signup parity; profile photo upload in EditProfile; activity status backend mapping.
- **Content:** Alt text and location in post share step; story music/GIF stickers; share to story.
- **Save:** “Choose collection” when saving a post.
- **DMs:** Voice messages (type and UI exist; E2E unclear); group polls (vote API; create/vote UI).
- **Personal:** Favorites feed in nav; archive stories; Star ad-free, profile visitors, anonymous story viewing.
- **Business:** Product tag picker in Create Post/Reel/Story UI; Live replay with product tags; custom domain verify.
- **Creator:** Badges/gifts full UI; branded content approve/decline flows.

### Missing (not present or stub only)
- No major feature area fully missing. Gaps are mostly: (1) wiring (e.g. alt text/location in post share), (2) UI for existing APIs (e.g. product tags in create, Favorites feed entry), (3) optional flows (e.g. replay with product tags, full email signup).

---

## 7. Recommended Next Steps

1. **Post creation:** Pass `altText` and `locationId` from PostSharePage to POST `/posts`; add “Advanced” (comments off, hide like count) if desired.
2. **Product tagging:** Add product tag picker and position overlay in CreatePost (and CreateReel/CreateStory) and send `productTags` in create payload.
3. **Favorites:** Add a “Favorites” entry in main nav or profile that calls GET `/feed/favorites`.
4. **Voice messages:** Confirm record → upload → send VOICE and playback in Messages E2E; fix if broken.
5. **Group polls:** Add UI to create POLL messages and to vote (POST message/:id/poll/vote) in group threads.
6. **Live Shopping replay:** Implement replay page that loads recording and shows product tags/overlay.
7. **Star/Personal:** Wire ad-free, profile visitors, and anonymous story viewing to subscriptionTier and schema where applicable.

---

*Gap analysis generated from codebase exploration and existing docs (PERSONAL_ACCOUNT_FULL_IMPLEMENTATION, BUSINESS_ACCOUNT_FEATURE_AUDIT, CREATOR/JOB guides, etc.).*
