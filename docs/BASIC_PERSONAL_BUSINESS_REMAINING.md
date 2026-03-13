# Basic, Personal & Business — Feature Ownership and Remaining List

This document lists **what belongs to Basic, Personal, and Business** and the **remaining** (if any) implementation status. Implement only features in their correct bucket.

---

## Definitions

| Bucket | Scope | Account types |
|--------|--------|----------------|
| **Basic** | Platform-wide: auth, feed, explore, core DMs, profile view, content consumption. Available to all accounts. | All (PERSONAL, BUSINESS, CREATOR, JOB) |
| **Personal** | PERSONAL-account features: profile edit, privacy, stories, posts, reels, save/collections, close friends, DMs (full), block/mute/restrict, STAR tier (ad-free, profile visitors, etc.). | PERSONAL (and included in CREATOR/JOB as “personal base”) |
| **Business** | BUSINESS-account features: switch to business, category, contact, hours, verification, shop, commerce, orders, reviews, analytics, promotions, product tagging, settlements, team, business inbox. | BUSINESS only (CREATOR has overlapping analytics/live but not commerce) |

**Note:** CREATOR has “Personal + basic social” plus creator-specific (live, subscriptions, badges, analytics). JOB has “Personal base” plus Track, Know, Flow, dual profile. Those are separate account types; this doc focuses on Basic / Personal / Business.

---

## 1. BASIC (platform-wide)

All items below apply to every account type. Implement only if missing.

| # | Feature | Status | Notes |
|---|---------|--------|--------|
| 1.1 | Auth (phone, email, login, register) | Implemented | POST send-verification-code, verify-code, login; PATCH me/email, verify-email |
| 1.2 | Feed (posts, reels from following) | Implemented | feed.service, GET /feed |
| 1.3 | Explore (discovery, search, hashtags) | Implemented | explore.routes, search, hashtags |
| 1.4 | Profile view (public) | Implemented | GET /accounts/username/:username, Profile.tsx |
| 1.5 | Core DMs (send, receive, threads) | Implemented | message.service, Messages.tsx |
| 1.6 | Follow / unfollow | Implemented | follow.routes, follow.service |
| 1.7 | Notifications | Implemented | Notification model, routes, UI |
| 1.8 | Upload (media) | Implemented | POST /upload, storage limits by tier |
| 1.9 | Content consumption (view post, story, reel) | Implemented | PostCard, StoryViewer, reel viewer |

**Remaining (Basic):** None. All basic platform features are implemented.

---

## 2. PERSONAL (PERSONAL account)

Features that belong **only** to Personal (or to Personal + STAR). Do not put Business/Creator-only features here.

| # | Feature | Status | Notes |
|---|---------|--------|--------|
| 2.1 | Account creation (username, display name, DOB, bio, profile photo, 1 link) | Implemented | Register, EditProfilePersonalFields |
| 2.2 | Privacy (isPrivate, follow requests, search visibility, activity status) | Implemented | PrivacySettings, PATCH /accounts/me |
| 2.3 | Story privacy (hide from, reply/reshare, archive) | Implemented | HideStoryFrom, allowReplies/allowReshares, StoryArchive |
| 2.4 | Posts (create, edit, delete, location, hashtags, alt text, advanced) | Implemented | CreatePost, post.routes |
| 2.5 | Stories (create, stickers, text, filters) | Implemented | CreateStory, story.routes |
| 2.6 | Reels (create, consume) | Implemented | Reel create/view |
| 2.7 | Highlights (create, manage, edit) | Implemented | NewHighlight, HighlightManage, HighlightEdit |
| 2.8 | Save & collections | Implemented | SavedPost, Collection CRUD, Saved page |
| 2.9 | Close friends | Implemented | CloseFriend list, story visibility |
| 2.10 | DMs (full: voice, view-once, GIF, reactions, delete, mute, pin, groups) | Implemented | Messages, view-once, Voice, GIF, groups |
| 2.11 | Block / Restrict / Mute | Implemented | BlockedAccounts, Restrict (comments), MutedAccounts |
| 2.12 | STAR: Ad-free, profile visitors, anonymous story view, download protection | Implemented | useAdFree, ProfileVisitors, StoryViewer anonymous, screenshotProtection |
| 2.13 | STAR: Voice commands, priority support, message blocked user | Implemented | VoiceCommands, SupportTicket, PremiumBlockedMessage |
| 2.14 | Lifestyle streaks | Implemented | Streak model, POST /streaks/check-in, GET /streaks, Streaks.tsx |
| 2.15 | Email settings, verify email | Implemented | EmailSettings, VerifyEmail page |

**Remaining (Personal):** None. Per PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md all 76 items are Implemented.

---

## 3. BUSINESS (BUSINESS account)

Features that belong **only** to Business. Do not put Personal-only or Creator-only features here. Commerce/live/analytics for Business are here.

| # | Feature | Status | Notes |
|---|---------|--------|--------|
| 3.1 | Switch to Business, category, contact, hours, action buttons | Implemented | AccountSettings, PATCH /accounts/me |
| 3.2 | Verification (PAN, GSTIN, bank), Blue Badge | Implemented | Business verification, VerificationRequest, admin approve |
| 3.3 | Shop (products, collections, banner, featured) | Implemented | Commerce products, shop settings, GET /commerce/shop/:username |
| 3.4 | Orders (seller: list, mark shipped/delivered; buyer: my orders, request return) | Implemented | Commerce orders, CommerceMyOrders, returns |
| 3.5 | Reviews (collect, display, respond, report) | Implemented | Review model, POST/PATCH/report, Commerce Reviews |
| 3.6 | Analytics / insights (reach, engagement, profile visits, 7d/30d) | Implemented | GET /analytics/insights, Analytics.tsx |
| 3.7 | Promotions / boost (campaign, performance) | Implemented | Promotion, PromotionEvent, BusinessPromotions |
| 3.8 | Product tagging (post, reel, story; tag clicks) | Implemented | productTags on create, ProductTagClick |
| 3.9 | Settlements (7-day, payouts, deductions) | Implemented | Payout, GET /commerce/settlements, CommerceSettlements |
| 3.10 | Seller dashboard (sales, top products, fulfillment, response rate) | Implemented | GET /commerce/dashboard, BusinessDashboard |
| 3.11 | Seller responsibility acknowledgment | Implemented | sellerTermsAcceptedAt, modal, accept API |
| 3.12 | Seller Help Center | Implemented | /commerce/help, SellerHelpCenter |
| 3.13 | Business inbox (labels, quick replies) | Implemented | ConversationLabel, filter by label |
| 3.14 | Team (members, roles, activity log) | Implemented | BusinessTeam, BusinessTeamActivity |
| 3.15 | Live (list, create, replay) | Implemented (UI minimal) | GET /live, Live.tsx list + “coming soon” |
| 3.16 | Cart, checkout, guest checkout | Implemented | Cart, CartItem, checkout flow |

**Remaining (Business):** None. Per REMAINING_IMPLEMENTATION_LIST.md all business items are Implemented or Deferred (e.g. coupon at checkout, payment gateway reference-only).

---

## 4. Where things are gated (correct belongings)

- **Routes:** `/business-dashboard` → `requiredType="BUSINESS"`; `/creator-studio` → `requiredType="CREATOR"`; `/job-hub`, `/job/*` → `requiredType="JOB"`. `/analytics` and `/live` are protected but use capability check inside the page (canAnalytics, canLive).
- **Profile:** Business Dashboard link only when `accountType === 'business'`; Creator Studio only for creator; Job Hub only for job. No Business/Job/Creator links on Personal-only profile.
- **Capabilities:** useAccountCapabilities() and backend capabilities.ts: canCommerce only BUSINESS; canLive BUSINESS + CREATOR; canAnalytics BUSINESS + CREATOR + STAR; canTrack/canKnow/canFlow JOB.

---

## 5. Summary

| Bucket | Total items listed | Remaining to implement |
|--------|--------------------|-------------------------|
| Basic | 9 | 0 |
| Personal | 15 (grouped) | 0 |
| Business | 16 (grouped) | 0 |

**Implement only in their belongings:** All listed features are already implemented and gated by account type or capability. No feature is implemented in the wrong bucket (e.g. no Business-only API exposed without BUSINESS check). Any **new** feature should be added only to the bucket it belongs to and gated accordingly.
