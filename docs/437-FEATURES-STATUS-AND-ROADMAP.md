# 437 Features: Corrected Status & Implementation Roadmap

**Purpose:** The "Complete List of Missing Features" (437 items) was compiled without full codebase verification. This document (1) **corrects status** for items that are already implemented, (2) **lists truly missing or partial** items, and (3) **provides a phased roadmap** for implementing the rest.

---

## Recently implemented (March 2026) — Profile visitors page; dual profile toggle (Job); saved job searches + alerts (Job); company review form in Know (Job); download/screenshot protection in PostSharePage; subscriber badge in comments (Creator); story like viewing already in StoryViewer.

## 1. CORRECTION: Many Listed “Missing” Are Implemented

The following are **already implemented** in the current MOxE codebase. They should not be counted as “437 missing.”

### Shared/Basic (from your list)

| Your ID | Feature | Actual status | Where |
|---------|---------|---------------|--------|
| 1.1.1.9 | Pronouns Display | ✅ Implemented | EditProfile, Onboarding; `pronouns` on Account |
| 1.1.2.3 | Remove Followers | ✅ Implemented | `removeFollower` in follow.service; Followers.tsx Remove button; Privacy link |
| 1.1.3.1–1.1.3.4 | Hide Story From, Reply/Reshare, Archive | ✅ Implemented | privacy.service hideStoryFrom; Story allowReplies/allowReshares; storyArchiveEnabled; Archive run job |
| 1.2.1.5 | Location Tagging | ✅ Implemented | PostSharePage location; post.service location |
| 1.2.1.9 | Schedule Post | ✅ Implemented | canSchedulePosts; CreatePost schedule; scheduling.service |
| 1.2.2 | Complete Story System | ✅ Implemented | CreateStory, story.routes, story.service |
| 1.2.3 | Story Stickers | ✅ Implemented | Poll, questions, countdown, link, donation, emoji_slider in CreateStory |
| 1.2.4 | Story Highlights | ✅ Implemented | highlight.routes; ManageHighlights, EditHighlightPage, HighlightViewer |
| 1.4.1.2–1.4.1.4 | Create/Manage/Share Collections | ✅ Implemented | collection.routes; SavedCollections; SharedCollection; save modal in FeedPost |
| 1.5.1.3 | Voice Messages | ✅ Implemented | Messages.tsx Record; VOICE type; playback |
| 1.5.1.5 | GIFs in DMs | ✅ Implemented | gif.routes; Messages GIF picker |
| 1.5.1.6 | Message Reactions | ✅ Implemented | message.routes reaction; UI in Messages |
| 1.5.2.2–1.5.2.3 | Mute Conversation, Pinned Chats | ✅ Implemented | message.routes mute/pin; Messages UI |
| 1.5.3 | Group Chats | ✅ Implemented | group.routes; CreateGroup; setAdmin, leave |
| 1.3.3.2 | Share to Story | ✅ Implemented | FeedPost shareToStory; CreateStory with hint |

### Personal

| Your ID | Feature | Actual status |
|---------|---------|---------------|
| 2.1.1 | Close Friends List | ✅ closeFriend.routes; CloseFriendsList, CloseFriendsAdd |
| 2.1.2 | Favorites | ✅ GET /posts/feed/favorites; FavoritesFeed.tsx |
| 2.1.3 | Archive | ✅ archive.routes; Archive.tsx (Posts + Stories tabs) |

### Business

| Your ID | Feature | Actual status |
|---------|---------|---------------|
| 3.1.1–3.1.7 | Switch to Business, Category, Contact, Hours, Links, Action Buttons, Verification | ✅ AccountSettings; schema; verification flow |
| 3.2.1–3.2.2 | Blue Badge, Customer Reviews | ✅ verifiedBadge; review.service |
| 3.3.x | Analytics/Insights | ✅ analytics.service getBusinessInsights; BusinessInsights |
| 3.4.x | Ad Campaign, Boost | ✅ Boost flow; promotions |
| 3.5.1–3.5.4 | Product Tagging, Shop, Checkout | ✅ PostSharePage product tags; commerce.routes; Commerce; cart/checkout |
| 3.6.1 | Seller Verification (PAN/GSTIN/Bank) | ✅ Verification flow; schema |
| 3.7.x | Order Management, Status, Returns | ✅ orders CRUD; returns; HelpOrdersPage |
| 3.8.x | Settlements, Commission | ✅ settlements; Payout model |
| 3.9.x | Seller Dashboard, Metrics | ✅ BusinessDashboard; analytics |
| 3.10–3.12 | Logistics, Return Shipping, Terms, Buyer Access, Help | ✅ Schema/seller terms; Commerce; business routes |

### Creator

| Your ID | Feature | Actual status |
|---------|---------|---------------|
| C1.1–C1.3 | Switch to Creator, Category, Verification | ✅ AccountSettings; schema; verification |
| C2.1–C2.3 | Subscription Tiers, Subscribers, Analytics | ✅ creatorSubscription.service; CreatorSubscriptionTiers; creator.routes |
| C7.1–C7.2 | Payout Setup, History | ✅ PayoutsPage; commerce settlements |
| C8.1 | Branded Content (tag, disclosure, approve/decline) | ✅ creatorTools; BrandedContentStatusPage; PartnershipAdPermissionsPage (approve/decline) |

### Job

| Your ID | Feature | Actual status |
|---------|---------|---------------|
| J1.1–J1.2 | Switch to Job, Professional Profile | ✅ JOB type; schema professionalHeadline, professionalSection, skills; Job hub |
| J3.1, J4.1 | Job Search, Apply | ✅ track/track-recruiter; Track.tsx search + Apply modal; POST track/apply |
| J5.1–J5.2 | Post Jobs, Manage Candidates | ✅ track-recruiter; job.routes |

### Innovative

| Your ID | Feature | Actual status |
|---------|---------|---------------|
| 4.1 | Nearby Messaging | ✅ location.routes; NearbyMessagingPage |
| 4.2 | SOS Safety | ✅ safety.routes (sos, hangout); SOSPage |
| 4.5 | Proximity Alert | ✅ proximity.routes; ProximityAlertsPage |
| 4.7 | Lifestyle Streaks | ✅ streak.routes; Streaks.tsx |
| 4.8 | Live Shopping | ✅ live.routes; LiveProduct; replay overlay |

---

## 2. Truly Missing or Partial (Prioritized)

These are **actually missing or only partially done**. Counts are approximate after removing implemented items.

### High priority (implement next)

| Area | Item | Notes |
|------|------|--------|
| Shared | Edit comment (within 15 min) | Backend exists (PATCH); add UI in CommentThread / FeedPost |
| Shared | Story reply/reshare in CreateStory | Backend has allowReplies/allowReshares; ensure CreateStory sends them |
| Shared | Hide story from – settings UI | Backend hideStoryFrom; add Settings page to add/remove users |
| Job | Dual profile toggle + separate feeds | Schema canDualProfile; add activeProfile, feed filter, toggle UI |
| Job | Professional headline / work history edit | Ensure Job profile edit form and PATCH |
| Job | Company pages CRUD + company reviews | KNOW has companies; full company page + reviews UI |
| Creator | Exclusive content gating UI | isSubscriberOnly exists; full “subscribers only” create flow |
| Creator | Badges/gifts full transaction UI | Schema/capabilities; GiftsPage partial; complete send/receive |
| Business | Custom domain verification | commerce custom-domain; verify flow |
| Personal | Profile visitors (Star) | Schema hideProfileVisits; “Who viewed your profile” page + backend |
| Innovative | Real-time translation | translation.routes; wire UI for posts/comments |
| Innovative | Screenshot protection / watermark | Schema; optional client/backend hooks |

### Medium priority (next phase)

- Video editing (trim, cover) in post/reel create
- Tag people in post (user mentions in caption + backend link)
- Add music to Reels (Spotify already; wire in Reel create)
- Star tier: ad-free, anonymous story viewing, download protection
- Seller help center (guides, FAQs, contact)
- Creator community channels, AMA, collaborations
- Job: saved searches, alerts, company follow, InMail-style messaging
- Full recruiter analytics (time to hire, cost per hire)

### Lower priority

- QR code (already in Profile – verify and expose)
- Advanced voice commands
- Message blocked user (exception)
- Benchmark comparison for sellers
- Reorder subscription tiers, etc.

---

## 3. Phased Implementation Roadmap

Implementing **all** remaining features end-to-end is a **multi-month** effort. Recommended phasing:

### Phase 1 (Current batch – 1–2 weeks)

- Edit comment UI (post/reel)
- Story reply/reshare in CreateStory + Hide story from settings UI
- Job: professional headline/work history in profile edit; dual profile toggle (if schema ready)
- Document and verify QR code for profile

### Phase 2 (2–4 weeks)

- Company pages: create/edit company, post jobs from company, company reviews (list, submit, verify employment)
- Creator: exclusive content flow (subscriber-only post/story/reel/live)
- Creator: badges/gifts full flow (purchase, send in live/comment, track revenue)
- Profile visitors (Star): backend + “Who viewed your profile” page

### Phase 3 (1–2 months)

- Video trim/cover in create
- Tag people in post (mention linking)
- Music in Reels (Spotify)
- Star tier: ad-free, anonymous story viewing, download protection
- Seller help center
- Translation UI for content
- Screenshot/watermark options

### Phase 4 (2+ months)

- Creator community (channels, AMA, collaborations, revenue split)
- Job: saved searches, alerts, InMail, full recruiter analytics
- Remaining Business/Creator/Job sub-features from the original list
- Innovative features (advanced voice, etc.)

---

## 4. Summary Counts (Corrected)

| Account Type | Listed as Missing | Actually Implemented | Truly Missing/Partial |
|--------------|-------------------|----------------------|------------------------|
| Shared/Basic | 25 | ~18 | ~7 |
| Personal | 13 | ~5 | ~8 |
| Business | 125 | ~90 | ~35 |
| Creator | 120 | ~70 | ~50 |
| Job | 106 | ~50 | ~56 |
| Innovative | 48 | ~10 | ~38 |
| **Total** | **437** | **~243** | **~194** |

The **437** number overstates missing work; roughly **half** of the listed items are already implemented. The remaining **~194** are genuinely missing or partial and should be implemented in phases as above.

---

*This document should be updated as features are completed. See also `MOxE-Gap-Analysis-By-Account.md` and `GAP-ANALYSIS-RECONCILIATION-MARCH-2026.md`.*
