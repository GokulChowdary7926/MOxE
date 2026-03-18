# Gap Analysis Reconciliation: March 14, 2026 Spec vs Current MOxE Codebase

**Purpose:** The “Comprehensive Gap Analysis” dated March 14, 2026 reports ~20% overall completion and marks many features as **Missing**. This document reconciles that report with the **current MOxE codebase** and gives corrected status by account type and area.

**Conclusion:** The March 14 analysis does not match the current repo. Many items it labels “Missing” or “Not implemented” are **Implemented** or **Partial** in code. Use the corrected tables below (and `MOxE-Gap-Analysis-By-Account.md`) for planning.

---

## Corrected Executive Summary

| Account Type | March 14 Doc | **Actual (current codebase)** | Notes |
|--------------|--------------|-------------------------------|--------|
| **Shared/Basic** | 60% (45% impl, 30% partial, 25% missing) | **~70%** | Remove followers, pronouns, stories, collections, voice, quiet mode, etc. are implemented. |
| **Personal** | 30% (20% impl, 25% partial, 55% missing) | **~65%** | Close Friends, Favorites feed, Archive are implemented. |
| **Business** | 15% (5% impl, 10% partial, 85% missing) | **~55%** | Switch to Business, category/contact/hours, shop, product tagging, orders, returns, settlements, analytics, boost, Live Shopping are implemented. |
| **Creator** | 5% (2% impl, 5% partial, 93% missing) | **~40%** | Creator type, subscription tiers, insights, payouts, content tools exist; badges/gifts and branded content partial. |
| **Job** | 2% (1% impl, 3% partial, 96% missing) | **~35%** | Job type, hub, TRACK/Recruiter/WORK/KNOW/CODE/STATUS/FLOW and other tools exist; dual-profile and job-search UX partial. |
| **Innovative** | 0% | **~50%** | Nearby, SOS, Proximity Alert, Streaks, Anonymous Spaces, View once are implemented; translation, screenshot protection, full voice commands missing. |
| **OVERALL** | **~20%** | **~50%** | Foundation and many Business/Creator/Job features exist; remaining work is completion and depth. |

---

## 1. Shared/Basic – Corrections to March 14 Analysis

| March 14 says | Actual status | Evidence in codebase |
|---------------|---------------|------------------------|
| **Remove Followers – Missing** | **Implemented** | `follow.service.ts` `removeFollower()`; `follow.routes.ts` DELETE `/followers/:followerId`; `Followers.tsx` “Remove” button; Privacy links to profile followers. |
| **Pronouns – Missing** | **Implemented** | `EditProfile.tsx`, Onboarding; Account schema `pronouns`; PATCH `accounts/me`. |
| **Story system – Entirely missing** | **Implemented** | `CreateStory.tsx`; `story.routes.ts`, `story.service.ts`; stickers (poll, questions, countdown, link, donation, emoji_slider). |
| **Story stickers – Entire library missing** | **Implemented / Partial** | Poll, questions, countdown, link, donation, emoji_slider in CreateStory; music/GIF partial. |
| **Story highlights – Missing** | **Implemented** | `highlight.routes.ts`, `highlight.service.ts`; `ManageHighlights.tsx`, `EditHighlightPage.tsx`, `HighlightViewer.tsx`. |
| **Create Collection – Missing** | **Implemented** | `collection.routes.ts`; `SavedCollections.tsx` (create, list, share); POST/GET/PATCH/DELETE collections. |
| **Manage/Share Collections – Missing** | **Implemented** | SavedCollections; SharedCollection (by share token); FeedPost save modal with collection picker. |
| **Voice messages – Missing** | **Implemented** | Messages.tsx Record (MediaRecorder); messageType VOICE; upload and playback. |
| **GIFs in DMs – Missing** | **Implemented** | `gif.routes.ts` (GIPHY); Messages.tsx GIF picker; messageType GIF. |
| **Message reactions – Missing** | **Implemented** | message.routes add/delete reaction; UI in Messages. |
| **Mute conversation – Missing** | **Implemented** | message.routes POST/DELETE `/mute/:userId`; UI in Messages. |
| **Pinned chats – Missing** | **Implemented** | message.routes POST/DELETE `/pin/:userId`; pinning in Messages. |
| **Group chats – Missing** | **Implemented** | `group.routes.ts`; CreateGroup; members, setAdmin, leave. |
| **Restrict user – Missing** | **Implemented** | `privacy.routes.ts` restrict; RestrictedList.tsx. |
| **Mute user – Missing** | **Implemented** | privacy.routes mute; MutedList.tsx; mute posts/stories. |
| **Hidden words – Missing** | **Implemented** | Account `hiddenWords`, `hiddenWordsCommentFilter`, `hiddenWordsDMFilter`; HiddenWordsSettings; filters in post/message services. |
| **Quiet mode – Missing** | **Implemented** | `QuietModeSettings.tsx`; PATCH me (quietModeEnabled, Start, End, Days); link from Notifications. |
| **Hide story from / Story reply controls – Missing** | **Partial** | HideStoryFrom.tsx; StoryReplySettings; backend hide-story-from, defaultStoryAllowReplies/Reshares. |
| **Add location on post – Missing** | **Implemented** | PostSharePage location field; post.service `location`; feed includes location. |
| **Schedule post – Missing** | **Implemented** | `canSchedulePosts`; CreatePost schedule; `scheduling.service.publishDueScheduledContent`. |
| **Carousel (10 photos) – Missing** | **Implemented** | NewPostPage multi-select up to 10; carousel in PostEditPage/PostSharePage. |

---

## 2. Personal Account – Corrections

| March 14 says | Actual status | Evidence |
|----------------|---------------|----------|
| **Close Friends – Missing** | **Implemented** | `closeFriend.routes.ts`; CloseFriendsList.tsx, CloseFriendsAdd.tsx. |
| **Favorites – Missing** | **Implemented** | GET `/posts/feed/favorites`; FavoritesFeed.tsx; link from Privacy. |
| **Archive – Missing** | **Implemented** | archive.routes; Archive.tsx; GET archived, GET deleted. |

---

## 3. Business Account – Corrections

| March 14 says | Actual status | Evidence |
|----------------|---------------|----------|
| **Switch to Business – Missing** | **Implemented** | AccountSettings “Switch to Business”; PATCH accountType; capabilities.ts BUSINESS. |
| **Business category – Missing** | **Implemented** | AccountSettings Business section; schema businessCategory; PATCH. |
| **Business hours – Missing** | **Implemented** | AccountSettings business hours (per day); schema businessHours (JSON); PATCH. |
| **Multiple links (5) – Missing** | **Implemented** | Account links; maxLinks by type; AccountSettings. |
| **Action buttons – Missing** | **Implemented** | AccountSettings action buttons (call, email, directions, website, WhatsApp); schema actionButtons. |
| **Business verification (PAN, GSTIN, bank) – Missing** | **Implemented** | Verification flow; schema pan, gstin, bankDetails; verifiedBadge. |
| **Blue badge – Missing** | **Implemented** | verifiedBadge on profile/feed; verification flow. |
| **Customer reviews – Missing** | **Implemented** | review.service; commerce reviews routes; create/list/aggregate/respond/report. |
| **Product tagging – Missing** | **Implemented** | PostSharePage product tag picker (Business); productTags in POST /posts; ProductTag, ProductTagClick; post/reel/story services. |
| **MOxE Shop / catalog – Missing** | **Implemented** | commerce.routes (products, collections, shop); Commerce.tsx; shop by username. |
| **In-app checkout – Missing** | **Implemented** | commerce cart, checkout; guest checkout; SellerCoupon; Order flow. |
| **Order management – Missing** | **Implemented** | orders CRUD; returns flow; HelpOrdersPage; BusinessDashboard. |
| **7-day settlement – Missing** | **Implemented** | settlements routes; Payout model; commerce settlements. |
| **Seller dashboard – Missing** | **Implemented** | BusinessDashboard.tsx; sales, orders, top products. |
| **Analytics (overview, content, demographics, clicks) – Missing** | **Implemented** | analytics.service getBusinessInsights; BusinessInsights; productTagClicks, websiteClicks, actionButtonClicks. |
| **Ad campaign / Boost – Missing** | **Implemented** | Boost flow (goals, audiences, budget, review); promotions; AdsCampaigns. |
| **Live Shopping – Missing** | **Implemented** | live.routes; LiveProduct; add products, pin, discount; checkout liveId; GET live sales. |
| **Seller help / responsibility – Missing** | **Implemented** | Seller terms acceptance (sellerTermsAcceptedAt); SavedRepliesPage; business routes. |

---

## 4. Creator Account – Corrections

| March 14 says | Actual status | Evidence |
|----------------|---------------|----------|
| **Switch to Creator – Missing** | **Implemented** | AccountSettings “Switch to Creator”; PATCH accountType; capabilities CREATOR. |
| **Creator category – Missing** | **Implemented** | AccountSettings Creator section uses businessCategory for creator category. |
| **Subscription tiers – Missing** | **Implemented** | creatorSubscription.service; CreatorSubscriptionTiers; creator.routes; tiers CRUD, subscribe, list. |
| **Creator insights / earnings – Missing** | **Implemented** | InsightsHub; InsightsContentPage, Followers, Interaction, BrandedContent, ApproximateEarnings, MonetisationStatus; PayoutsPage. |
| **Payout setup / history – Missing** | **Implemented** | PayoutsPage; setup payout; commerce settlements; payoutMethod in schema. |
| **Branded content (tag, disclosure) – Missing** | **Partial** | creatorTools.service; BrandedContentStatusPage; InsightsBrandedContentPage; approval flows partial. |
| **Badges/Gifts – Missing** | **Partial** | Schema badgesEnabled, giftsEnabled; GiftsPage; full transaction UI partial. |

---

## 5. Job Account – Corrections

| March 14 says | Actual status | Evidence |
|----------------|---------------|----------|
| **Switch to Job – Missing** | **Implemented** | Account type JOB; capabilities canTrack, canKnow, canFlow, etc.; ProtectedRoute requiredType="JOB". |
| **Professional profile (headline, skills) – Missing** | **Implemented** | Schema professionalHeadline, professionalSection, skills; Job hub and profile. |
| **TRACK / Recruiter / WORK / KNOW / CODE / STATUS / FLOW – Missing** | **Implemented** | job.routes.ts; track.service, track-recruiter.service, work.service, know.service, code.service, status.service, flow.service; Job hub pages (Track, Recruiter, Work, Know, Code, Status, Flow, etc.). |
| **Dual profile – Missing** | **Partial** | canDualProfile in capabilities; full dual-profile UX (separate feeds/connections) partial. |
| **Job search / applications / company pages – Missing** | **Partial** | TRACK has applications; KNOW has companies; full job-search and company-page CRUD partial. |

---

## 6. Innovative Features – Corrections

| March 14 says | Actual status | Evidence |
|----------------|---------------|----------|
| **Nearby messaging – Missing** | **Implemented** | location.routes (nearbyEnabled, nearby-post); NearbyMessagingPage, NearbyPlacesPage. |
| **SOS Safety – Missing** | **Implemented** | safety.routes (sos, hangout); SOSPage, SafetyCheckinPage; emergencyContact.routes. |
| **Proximity Alert – Missing** | **Implemented** | proximity.routes; ProximityAlertsPage; create/update/delete. |
| **Lifestyle Streaks – Missing** | **Implemented** | streak.routes; Streaks.tsx. |
| **Live Shopping – Missing** | **Implemented** | See Business section; live.routes, LiveProduct, checkout with liveId. |
| **Real-time translation, Screenshot protection, Voice commands – Missing** | **Missing / Partial** | Translation and screenshot protection not implemented; voice.service has command intents (e.g. SCHEDULE_POST, SOS) but not full voice UX. |

---

## 7. Top 10 “Critical Missing” – Corrected

| March 14 “Critical missing” | Actual status |
|-----------------------------|----------------|
| 1. Remove Followers | **Implemented** |
| 2. Business Account Type | **Implemented** |
| 3. Seller Verification | **Implemented** (PAN, GSTIN, bank, verifiedBadge) |
| 4. Product Catalog | **Implemented** (commerce products, shop, collections) |
| 5. Order Management | **Implemented** (orders CRUD, returns, dashboard) |
| 6. In-App Checkout | **Implemented** (cart, checkout, guest, coupon) |
| 7. Subscription System (Creator) | **Implemented** (tiers, subscribe, list) |
| 8. Dual Profile (Job) | **Partial** (capability and schema; full UX partial) |
| 9. Job Search | **Partial** (TRACK/application data; dedicated job-search UI partial) |
| 10. Live Shopping | **Implemented** (schedule, products, pin, discount, sales) |

---

## 8. Recommended Use of This Reconciliation

1. **For planning:** Use **`docs/MOxE-Gap-Analysis-By-Account.md`** and this reconciliation as the source of truth for “what exists” vs “what’s partial” vs “what’s missing.”
2. **For the March 14 document:** Treat it as a spec checklist, not as the current implementation state; many of its “Missing” entries are implemented or partial in this repo.
3. **Remaining gaps** (partial or missing) to prioritize:
   - Full dual-profile UX (Job): separate feeds/connections and toggle.
   - Full job search and application flows (Job): search UI, apply, track.
   - Company pages (Job): full CRUD and company reviews.
   - Creator: end-to-end badges/gifts, branded content approval, exclusive/subscriber-only content and live.
   - Business: Live replay with product overlay on video; custom domain verification.
   - Innovative: real-time translation, screenshot protection, full voice commands.
   - Shared: email signup parity, group poll create UI, Star-tier ad-free/profile visitors wiring.

---

*Reconciliation against the MOxE codebase as of the date of this document. For file-level references see `MOxE-Gap-Analysis-By-Account.md` and `GAP-ANALYSIS-IMPLEMENTATION-STATUS.md`.*
