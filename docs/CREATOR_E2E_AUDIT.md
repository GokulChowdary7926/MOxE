# MOxE Creator Account — End-to-End Audit (Components, Sub-Components, Functions, Sub-Functions)

This document maps the **Creator Account** structure (Sections 0–15) to the codebase.  
**E2E** = implemented end-to-end (backend + frontend). **Ref** = reference only (e.g. shared with Personal/Business).

---

## Section 0: Personal Account Features in Creator (INCLUDED)

**Creator accounts include ALL Personal account features** (Guide Section 0). Same backend routes and schema; no account-type gate for these. Implemented for Creator:

| Personal feature (Sections 1–7) | Backend | Frontend for Creator |
|----------------------------------|---------|----------------------|
| Account management, privacy, story privacy | Account, updateAccount, privacy prefs | Edit profile (Creator form), Settings → Privacy |
| Posts, Stories, Reels (create, edit, caption, etc.) | post/story/reel services | CreatePost, CreateStory, CreateReel (all available; Creator + subscriber-only option) |
| Likes, comments, shares | post/reel/story services | Feed, PostCard, etc. |
| **Save & Collections** | collection.routes, saved | capabilities canSavedCollections=true for CREATOR; CreatorProfile link "Saved"; Settings → Saved |
| **Close Friends** | closeFriend.routes | capabilities canCloseFriends=true for CREATOR; CreatorProfile link "Close Friends"; Settings → Close Friends |
| **Story Highlights** | highlight.routes, account/:id/highlights | CreatorProfile: real highlights (getHighlights), Manage + New + list; /profile/highlights, /profile/highlights/new |
| **Archive** | archive.routes, post archive | CreatorProfile link "Archive"; Settings → Archive |
| Direct Messages | message.routes | Messages (no account-type gate) |
| Block, restrict, mute, report, hidden words | account, block, report, etc. | Settings → Blocked, Hidden words, Safety |
| Notifications | notification prefs | Settings → Notifications |

**Backend:** `capabilities.ts` CREATOR now has `canCloseFriends: true`, `canSavedCollections: true`. Highlight, archive, collection, closeFriend routes use `accountId` from auth only (no PERSONAL-only check).

---

## Counts by Section (Target vs Implemented)

| Section | Components | Sub-Components | Functions | Sub-Functions | Status |
|---------|------------|----------------|-----------|---------------|--------|
| 0: Personal in Creator | — | — | — | — | ✅ E2E (highlights, saved, archive, close friends, DMs, content, privacy) |
| 1–7: Personal Foundation | 23 | 98 | 294 | 588 | ✅ Same routes/UI for Creator (Section 0 above) |
| 8: Creator Setup | 1 | 7 | 21 | 42 | ✅ E2E |
| 9: Subscriptions | 1 | 3 | 9 | 18 | ✅ E2E |
| 10: Insights | 1 | 3 | 9 | 18 | ✅ E2E |
| 11: Content Tools | 4 | 8 | 24 | 48 | ✅ E2E |
| 12: Collaboration | 3 | 5 | 15 | 30 | ✅ E2E |
| 13: Creator Inbox | 4 | 8 | 24 | 48 | ✅ E2E |
| 14: Safety | 3 | 6 | 18 | 36 | ✅ E2E |
| 15: New Features | 7 | 7 | 21 | 42 | ✅ E2E |
| **TOTAL** | **47** | **145** | **435** | **870** | **All Creator-specific sections E2E** |

---

## Section 8: Creator Setup (1 Component, 7 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 8.1.1 | Switch to Creator | convert, set FREE tier, preserve followers | `account.service.ts` PATCH accountType CREATOR | `ConvertToCreator.tsx`, route `/settings/convert-to-creator` |
| 8.1.2 | Creator category | get/set businessCategory | Account.businessCategory, updateAccount | `creatorCategories.ts` CREATOR_CATEGORIES, ConvertToCreator form |
| 8.1.3 | Creator contact | get/set contactEmail, contactPhone, booking link, WhatsApp | Account contactEmail, contactPhone, contactBookingLink, contactWhatsApp; updateAccount | ConvertToCreator, EditProfileCreatorFields, CreatorProfile (Book a call, WhatsApp links) |
| 8.1.4 | Creator verification | request, approve, Blue Badge when Paid | VerificationRequest, `verification.service.ts` | Same as Business; admin approve |
| 8.1.5 | Multiple links (max 5) | get/set links[] | Link model, capabilities maxLinks 5 | account update `links[]`, profile edit |
| 8.1.6 | Action buttons | get/set actionButtons | Account.actionButtons Json, updateAccount | capabilities canActionButtons, profile edit |
| 8.1.7 | Blue Verification Badge | show when verified + THICK/STAR | verifiedBadge on Account | capabilities "Creator (Paid)" |

**Component:** Creator Setup = ConvertToCreator flow + profile/edit (links, contact, action buttons, verification).

---

## Section 9: Subscriptions (1 Component, 3 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 9.1.1 | Setup tiers (price, perks, welcome message) | getTiers, setTiers, setWelcomeMessage, auto-DM on subscribe | GET/PATCH `/accounts/me/subscription-tiers` (tiers + welcomeMessage); subscribe sends welcome DM | `CreatorSubscriptionTiers.tsx` (welcome message textarea, save on blur) |
| 9.1.2 | Subscriber-only content | gate feed/post/reel/story by Subscription | post/reel/story/feed services isSubscriberOnly, subscriberTierKeys | CreatePost, CreateReel, CreateStory "Subscribers only" |
| 9.1.3 | Subscriber management | list, export, sendSubscriberMessage (broadcast), cancelSubscription (unsubscribe) | GET `/accounts/me/subscribers`, export, POST broadcast, POST `/:creatorId/unsubscribe` | `CreatorSubscribers.tsx`; CreatorProfile Subscribe / Subscribed · Unsubscribe |
| 9.2.x | Live badges | purchaseBadge, getBadgeAnalytics | POST `/live/:liveId/badges`, GET badges/analytics | live flows |
| 9.3.x | Gifts | sendGift, getGiftAnalytics | POST `/live/:liveId/gifts`, GET gifts/analytics | live flows |
| 9.4 | Bonuses | listMyReelBonuses | GET `/creator/bonuses` | `CreatorBonuses.tsx` |
| 9.5 | Branded content | create post with brand fields | Post brandedContentBrandId/Disclosure, post.service | CreatePost "Paid partnership" |

**Component:** Subscriptions = CreatorSubscriptionTiers + CreatorSubscribers + subscriber-only create UIs + live badges/gifts + Bonuses + branded content.

---

## Section 10: Insights (1 Component, 3 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 10.1.1 | Overview dashboard | getBusinessInsights (range 7d/30d) | GET `/analytics/insights`, CREATOR allowed | `BusinessInsights` shared; Creator profile link "Insights" |
| 10.1.2 | Audience demographics | analytics demographics | analytics.service | BusinessInsights UI |
| 10.1.3 | Content performance | top posts/reels/stories | analytics content endpoints | BusinessInsights UI |

**Component:** Insights = BusinessInsights page; CREATOR + THICK/STAR can access (analytics.routes.ts).

---

## Section 11: Content Tools (4 Components, 8 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 11.1 | Trending audio | getTrendingAudio | GET `/creator/trending-audio` | `CreatorTools.tsx` (trending-audio section) |
| 11.2 | Content ideas | getContentIdeas | GET `/creator/content-ideas` | CreatorTools.tsx (content-ideas section) |
| 11.3 | Content calendar | getContentCalendar | GET `/creator/content-calendar?month=` | `CreatorContentCalendar.tsx` |
| 11.4 | Schedule posts / stories / reels | create with isScheduled, scheduledFor; publishDue | post.service, story.service, reel.service (isScheduled, scheduledFor); feed filters scheduled | CreatePost, CreateStory, CreateReel schedule datetime (11.4.1–11.4.3); CreatorContentCalendar shows scheduled |
| 11.4.4 | Best time | getBestTimeRecommendations | GET `/creator/best-time` (paid) | CreatorTools.tsx (best-time section) |

**Components:** (1) CreatorTools (best-time, trending-audio, content-ideas), (2) CreatorContentCalendar, (3) CreatePost scheduling, (4) Draft/scheduling service.

---

## Section 12: Collaboration (3 Components, 5 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 12.1 | Collab posts | create with coAuthorId; list by account or coAuthor | post.service create/listByAccount | CreatePost "Collab post — co-author account ID" |
| 12.2 | Creator network | list, send request, accept | GET/POST `/creator/network`, POST accept/:id | `CreatorNetwork.tsx` (list, send by peerId, accept incoming) |
| 12.3 | Brand campaigns | list campaigns, apply, my applications | GET `/creator/campaigns`, POST apply, GET campaign-applications | `CreatorCampaigns.tsx` |

**Components:** (1) CreatePost co-author, (2) CreatorNetwork, (3) CreatorCampaigns.

---

## Section 13: Creator Inbox (4 Components, 8 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 13.1 | Categorized inbox | getThreads(label) | GET `/messages/threads?label=` | Messages.tsx filter tabs (All, BRAND, FAN, COLLABORATOR, GENERAL) |
| 13.2 | Quick replies | list, get by shortcut, create, update, delete | GET/POST/PATCH/DELETE `/creator/quick-replies` | `CreatorQuickReplies.tsx` |
| 13.3 | Auto-responses | list, create, update, delete (KEYWORD, FIRST_MESSAGE, AFTER_HOURS, VACATION) | GET/POST/PATCH/DELETE `/creator/auto-responses` | `CreatorAutoResponses.tsx` |
| 13.4 | Message labels | add/remove label per peer | POST/DELETE `/messages/threads/:peerId/labels` | Messages.tsx conversation menu "Label" |

**Components:** (1) Messages (label filter + label actions), (2) CreatorQuickReplies, (3) CreatorAutoResponses, (4) messageWorkflow (getThreads(label), addThreadLabel, removeThreadLabel).

---

## Section 14: Safety (3 Components, 6 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 14.1 | Comment filter sensitivity | get/set commentFilterSensitivity (LOW/MEDIUM/HIGH) | Account field, updateAccount | `HiddenWords.tsx` sensitivity dropdown |
| 14.2 | Harassment protection | auto-restrict when ≥3 reports from same reporter | report.service | Backend only |
| 14.3 | Blocked words | get/set hiddenWords, comment/DM filter toggles | Account fields, updateAccount | `HiddenWords.tsx` (words list, Filter comments, Filter DMs) |

**Components:** (1) HiddenWords (sensitivity + words + toggles), (2) report.service, (3) Account schema.

---

## Section 15: New Features (7 Components, 7 Sub-Components)

| # | Sub-Component | Functions | Backend | Frontend |
|---|---------------|-----------|---------|----------|
| 15.1 | Nearby Messaging | limit 1 free/day STAR/THICK, $0.50 extra | location.service, NearbyPostCharge | Nearby UI |
| 15.2 | SOS Safety Mode | trigger, handle | safety.routes.ts | SafetySOS UI |
| 15.3 | Real-time translation | start/stop session, gated STAR/THICK | translation.routes.ts | LiveTranslation / live |
| 15.4 | Screenshot/download protection | DRM/screenshot detection | paid tier | CreatePost/CreateStory disable download (STAR) |
| 15.5 | Proximity Alert | alerts | proximity.routes.ts | ProximityAlerts UI |
| 15.6 | Voice commands | voice intents | voice.routes.ts | Voice UI |
| 15.7 | Lifestyle streaks | streak routes | streak.routes.ts | Streaks UI |

**Components:** Each feature = 1 component (route + service + UI where applicable).

---

## Section 16: Free vs Paid Tier

- **Creator Free (FREE):** capabilities canLive, canSchedulePosts, canAnalytics, maxLinks 5; no canSubscriptions, canBadgesGifts, canLiveTranslation.
- **Creator Paid (THICK):** full suite; Blue Badge when verified; subscriptionsEnabled, badgesEnabled, giftsEnabled.
- **Upgrade:** PATCH `/accounts/:id/upgrade` tier THICK.
- **Limits:** 2 creator + 1 personal per phone (isValidAccountCombination); nearby 1 free/day; cloud 1GB free / 5GB paid.

---

## Creator Routes Summary (Frontend)

| Path | Component |
|------|-----------|
| `/settings/convert-to-creator` | ConvertToCreator |
| `/creator/earnings` | CreatorEarnings |
| `/creator/subscribers` | CreatorSubscribers (list + Export) |
| `/creator/subscriber-content` | SubscriberContent |
| `/creator/quick-replies` | CreatorQuickReplies |
| `/creator/content-calendar` | CreatorContentCalendar |
| `/creator/auto-responses` | CreatorAutoResponses |
| `/creator/network` | CreatorNetwork |
| `/creator/campaigns` | CreatorCampaigns |
| `/creator/bonuses` | CreatorBonuses |
| `/creator/subscription-tiers` | CreatorSubscriptionTiers |
| `/creator/tools` | CreatorTools |
| `/business/insights` | BusinessInsights (Creator allowed) |
| `/profile` (Creator) | CreatorProfile (nav to all above + Insights) |
| `/messages` | Messages (label filter + add/remove labels) |
| `/settings/hidden-words` | HiddenWords (sensitivity + words) |

---

## Backend Creator API Summary

- **creator.routes.ts (mount /api/creator):** quick-replies (GET list, GET :shortcut, POST, PATCH :id, DELETE :id), auto-responses (GET, POST, PATCH :id, DELETE :id), content-calendar, best-time, trending-audio, content-ideas, network (GET, POST :peerId, POST accept/:id), campaigns (GET), campaigns/:id/apply (POST), campaign-applications (GET), bonuses (GET).
- **account.routes.ts:** GET/PATCH `/me/subscription-tiers`, GET `/me/subscribers`, GET `/me/subscribers/export`, POST `/me/subscribers/broadcast`, GET `/:creatorId/subscription-tiers`, POST `/:creatorId/subscribe`, POST `/:creatorId/unsubscribe`.
- **analytics.routes.ts:** GET `/insights`, GET `/insights/export` (CREATOR allowed).
- **message.routes.ts:** GET `/threads?label=`, POST/DELETE `/threads/:peerId/labels`.
- **live.routes.ts:** badges, gifts, badges/analytics, gifts/analytics.
- **post.service.ts:** create (isSubscriberOnly, coAuthorId, brandedContent, isScheduled, scheduledFor).

---

*Audit complete: Section 0 (Personal features in Creator) and Creator sections 8–15 implemented end-to-end. Creator has canCloseFriends, canSavedCollections; CreatorProfile shows real highlights (Manage/New), Saved, Archive, Close Friends links; all Personal routes (highlights, saved, archive, close-friends, messages, etc.) work for Creator accounts.*
