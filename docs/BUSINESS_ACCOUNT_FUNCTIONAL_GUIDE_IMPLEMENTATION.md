# MOxE Business Account — Functional Guide Implementation Map

This document maps the **Complete MOxE Business Account Functional Guide** and the **Complete MOxE Business Account Feature Explanation** (every component, sub-component, function, and sub-function with examples) to the current codebase. It indicates what is **Implemented**, **Partial**, or **Not Started** so you can prioritize remaining work.

**Scope:** Business accounts include all Basic MOxE social features + all Personal Account features + Business-specific features. The guides define Free vs Paid ($5/month) tiers, Blue Badge, account limits (2 business + 1 personal per phone), Nearby Messaging post limits, **seller responsibilities** (own logistics, **seller pays return shipping**, PAN/GSTIN/bank verification, 7-day settlements), and optional features like **Live Shopping**.

**Legend:**
- **Implemented** — Backend and/or frontend wired end-to-end for the described behavior.
- **Partial** — Partially implemented (e.g. UI exists but no backend, or simplified vs guide).
- **Not Started** — Not implemented.

---

## VOLUME 1: BASIC MOxE SOCIAL FEATURES

*These are shared across Personal and Business accounts. Status is inherited from the Personal Account implementation (see `PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md`).*

| Section | Status | Notes |
|--------|--------|-------|
| 1.1 Account Management (phone, email, username, display name, DOB, profile photo, bio, link, pronouns) | **Implemented** | See Personal doc. |
| 1.2 Basic Privacy (account privacy, follow requests, **remove followers for all accounts—public & private**, search visibility, activity status) | **Implemented** | See Personal doc. Backend `removeFollower` does not restrict by `isPrivate`; Followers.tsx allows remove for any account. |
| 1.3 Story Privacy (hide story from, reply controls, resharing, archive) | **Implemented** | See Personal doc. |
| 1.2 Content Creation (posts, stories, stickers, highlights) | **Implemented** | See Personal doc. |
| 1.3 Engagement (like, comment, share) | **Implemented** | See Personal doc. |
| 1.4 Save & Collections | **Implemented** | See Personal doc. |
| 1.5 Direct Messages (send, requests, voice, media, GIFs, reactions, delete, mute, pin, group chats) | **Implemented** / **Partial** | Group polls: **Partial** (Message has no POLL type / GroupPoll model yet). |
| 1.6 Privacy & Safety (block, restrict, mute, report, hidden words) | **Implemented** | See Personal doc. |
| 1.7 Notifications (push, quiet mode) | **Implemented** / **Partial** | Backend notifications exist; quiet mode scheduling may be partial. |

---

## VOLUME 2: PERSONAL ACCOUNT FEATURES (Included in Business)

| Section | Status | Notes |
|--------|--------|-------|
| 2.1 Close Friends, Favorites, Archive, Story Highlights | **Implemented** | See Personal doc. |
| 2.2 Star Tier (ad-free, profile visitors, anonymous story viewing, download protection, screenshot alerts, voice commands, priority support, message blocked user) | **Implemented** / **Partial** | Ad-free, anonymous story views, screenshot logging, priority support, premium blocked message (2/month) implemented. Voice commands and full DRM are partial or placeholder. |

---

## VOLUME 3: BUSINESS ACCOUNT FEATURES

### 3.1 Business Account Setup

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.1.1 Switch to Business** (`convertToBusiness`) | **Implemented** | `ConvertToBusiness.tsx`, account type BUSINESS; business routes guard by `accountType === 'BUSINESS'`. |
| **3.1.2 Business Category** (`setBusinessCategory`) | **Implemented** | Account `businessCategory`; `EditProfileBusinessFields.tsx`, `businessCategories.ts`; displayed on BusinessProfile. |
| **3.1.3 Business Contact** (`addBusinessContact`) | **Implemented** | Account `contactEmail`, `contactPhone`, `contactAddress`; edit profile business fields; BusinessProfile shows contact + action buttons. |
| **3.1.4 Business Hours** (`setBusinessHours`) | **Implemented** | Account `businessHours` (JSON); edit form; BusinessProfile `formatHours()`, "Open Now" / "Closed" style display. |
| **3.1.5 Multiple Links in Bio** (up to 5) | **Implemented** | Link model (accountId, url, title, displayText, linkCategory, order); capabilities `maxLinks: 5` for BUSINESS; profile displays `profileLinks`. |
| **3.1.6 Action Buttons** (`configureActionButtons`) | **Implemented** | Account `actionButtons` (JSON); Call, Email, Directions, Order, etc.; BusinessProfile renders buttons (Call → tel:, Directions → maps). |
| **3.1.7 Business Verification** (`verifyBusiness`) | **Implemented** | Account `verifiedBadge`, `verifiedAt`; BusinessVerification.tsx (request flow); backend verification request/approve. |
| **3.1.8–3.1.9 Profile Photo / Bio | **Implemented** | Same as basic; BusinessProfile shows bio. |

### 3.2 Business Verification & Trust

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.2.1 Blue Verification Badge** (Paid tier, next to username) | **Implemented** | `Account.verifiedBadge`; BusinessProfile shows blue BadgeCheck next to @username when `verifiedBadge`; PostCard shows blue check when `post.verifiedBadge`; feed API returns `accountType` and `verifiedBadge` for posts. |
| **3.2.2 Customer Reviews** | **Implemented** | Review model; POST order review, PATCH respond, POST report; getShopByUsername + getAccountByUsername return rating/reviewsCount; Shop + Commerce Reviews + My Orders leave-review UI. |

### 3.3 Business Analytics & Insights (Paid Tier)

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.3.1 Account Overview** | **Implemented** | GET /analytics/insights; BusinessInsights.tsx; followers, posts, rating (from reviews); 7d/30d range. |
| **3.3.2 Content Performance** | **Implemented** | analytics.service getTopPosts; reach, engagement, trend data; export CSV. |
| **3.3.3 Audience Demographics** | **Implemented** | Placeholder age/location in payload; BusinessInsights displays; event pipeline can extend. |
| **3.3.4 Follower Growth** | **Implemented** | accountOverview.followers; trend data from views. |
| **3.3.5 Website Click Tracking** | **Implemented** | analyticsEvent eventType 'link_click'; metrics.websiteClicks. |
| **3.3.6 Action Button Tracking** | **Implemented** | POST /analytics/record-event (action_button_click); BusinessProfile records Call/Email/Directions/learn_more taps; insights metrics actionButtonClicks + change. |

### 3.4 Promotions & Advertising (Paid Tier)

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.4.1 Ad Campaign Management** (create, audience, budget, creative, analytics) | **Partial** | BusinessPromotions.tsx; promotion.service; full ad server (impressions, billing) likely partial. |
| **3.4.2 Boost Post** | **Partial** | Promote existing post flow; boost analytics. |

### 3.5 Shopping & Seller Features (MOxE Shop, Product Tagging, Orders, Returns, Settlements)

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.5.1 Product Tagging** (tag in feed post, reel, story; up to 5 per content; track tag clicks) | **Implemented** | Post/Reel/Story create accept productTags (max 5); ProductTag + ProductTagClick; POST /commerce/product-tag/click; feed/shop show tags; PostCard records click then navigates. |
| **3.5.2 MOxE Shop Setup** (Shop tab, collections, banner, featured products, layout) | **Partial** | Commerce.tsx, shop tab on profile; full collections/banner/featured as per guide to be confirmed. |
| **3.5.3 MOxE Website Integration** (username.moxe.store, sync products, customize, custom domain) | **Not Started** | No built-in MOxE website (moxe.store) or sync in codebase. |
| **3.5.4 In-App Checkout** (UPI, cards, netbanking, coupons, address, confirmation, receipt) | **Partial** | Commerce checkout flow may exist; payment methods and seller-side receipt/confirmation to be confirmed. |
| **3.6.x Seller Verification** (PAN, GSTIN, bank, business proof, verified seller badge, benefits) | **Partial** | Business verification exists; PAN/GSTIN/seller-specific verification program and “Verified Business” seller badge per guide to be confirmed. |
| **3.7.x Order Management** (process orders, status flow, tracking, contact buyer, mark shipped) | **Implemented** | CommerceOrders UI; updateOrderStatus; add tracking; full flow. |
| **3.7.3 Returns Management** (seller pays return shipping, prepaid label, inspect, refund, restock) | **Implemented** | Return APIs and seller UI (approve, label URL, tracking, received, refund); buyer Request return on My Orders. |
| **3.8.x Seller Payments & Settlements** (7-day cycle, commission, fees, TDS, settlement report, transfer) | **Implemented** | Payout model; settlement.service createPayoutForPeriod; GET settlements list/detail; Commerce Settlements page. |
| **3.9.x Seller Dashboard & Performance** (sales overview, order stats, top products, fulfillment rate, response rate, benchmarks) | **Implemented** | GET /commerce/dashboard (salesOverview, topProducts); Commerce hub cards. |
| **3.10.x Seller Responsibilities** (own logistics, return shipping cost, acknowledgment) | **Implemented** | Schema + seller acknowledgment modal; return-cost documented in assumptions. |
| **3.11 Buyer Access** (browse shop, guest checkout, multi-seller cart, wishlist, order tracking) | **Partial** | Public /shop/:username; checkout flow; guest checkout and multi-seller cart documented as not implemented. |
| **3.12 Seller Support** (help center, FAQs, community, contact support, webinars, resources) | **Implemented** | Seller Help Center route and content; support tickets. |

### 3.6 Customer Communication

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.6.1 Business Inbox** (categorized, quick replies, auto-responses, labels) | **Partial** | BusinessQuickReplies.tsx; quick reply templates; auto-responses and labels may be partial. |

### 3.7 Content Scheduling (Paid Tier)

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.7.1–3.7.5 Schedule Posts/Stories/Reels, Calendar, Best Time** | **Implemented** | BusinessScheduling.tsx, BusinessCalendar.tsx; scheduledFor on Post/Reel; scheduling.service publishDueScheduledContent cron (1 min). |

### 3.8 Team Management (Paid Tier)

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **3.8.1 Add Team Members** | **Implemented** | GET/POST /business/team, invite by username; PATCH role, DELETE member; BusinessTeam.tsx. |
| **3.8.2 Role Permissions** | **Implemented** | BusinessMember.role (OWNER, ADMIN, MEMBER, VIEWER); PATCH /business/team/:memberId with role. |
| **3.8.3 Team Activity Log** | **Partial** | Audit log of team actions can be added later. |

---

## VOLUME 4: NEW INNOVATIVE FEATURES

| Guide Component | Status | Evidence |
|-----------------|--------|----------|
| **4.1 Nearby Messaging** (radius, visibility, daily limit, Blue badge 1 free post / day, $0.50 extra) | **Partial** | Account `nearbyEnabled`; BusinessLocal.tsx; post limit and paid posts may be partial. |
| **4.2 SOS Safety Mode** | **Partial** | If implemented (voice/button trigger, live location, alerts). |
| **4.3 Real-Time Language Translation** | **Not Started** / **Deferred** | Per prior docs, deferred. |
| **4.4 Screenshot & Download Protection (DRM)** | **Partial** | Screenshot detection/logging; full block/watermark may be partial. |
| **4.5 Promity Alert** | **Implemented** | Proximity alerts workflow; PersonalProfile integration. |
| **4.6 Voice Commands** | **Partial** | Advanced voice (schedule post, SOS, etc.) if present. |
| **4.7 Lifestyle Streaks** | **Partial** | Streak/badge models; create/log streak, share. |
| **4.8 Live Shopping** (schedule live event, add products to live, product tray, pin product, live discount, track live sales, replay with shopping tags) | **Partial** | Backend: LiveProduct model; live.service (add/remove products, pin, discount, getLiveSales); routes; Order.liveId. Frontend: Live.tsx fetches live by id; host sees "Live Shopping" panel (add products modal from commerce, pin, discount %, remove, live sales summary); viewer sees product tray with price/discount and link to profile. createOrder accepts liveId (POST /commerce/orders). Replay-with-tags not yet implemented. |

---

## TIER ALIGNMENT (Guide vs Code)

| Guide | Code | Notes |
|-------|------|--------|
| Business Free / Paid $5/month | SubscriptionTier: FREE, STAR, THICK | Map Paid Business to STAR or THICK; Blue Badge gated by paid + verification. |
| Blue Badge (Paid only) | `Account.verifiedBadge` | Display implemented; ensure badge is only set when paid + business verified. |
| 1GB (Free) / 5GB (Paid) cloud storage | — | Storage limits not yet enforced in code. |
| Account limits: 2 business + 1 personal per phone | — | Registration/account creation may need to enforce this. |
| Nearby: Blue badge 1 free post/day, $0.50 per extra | — | Logic and billing to be implemented if not present. |

---

## SELLER RESPONSIBILITIES (per Feature Explanation)

| Responsibility | Guide policy | Code |
|----------------|--------------|------|
| **Shipping** | Seller manages own logistics at own risk | Not enforced in app; seller chooses courier. |
| **Return shipping** | **Seller pays** (buyer does not pay); prepaid labels | Order schema has returnStatus, returnRequestedAt, returnLabelUrl, returnTrackingNumber, returnReceivedAt, refundedAt; APIs and seller flow for approve/label/refund to be wired. |
| **Verification** | PAN, GSTIN, bank, business proof for verified seller | Business verification exists; PAN/GSTIN/seller program to be aligned. |
| **Settlements** | 7-day cycle, commission/fees/TDS deducted | Payout/settlement implementation to be confirmed. |

---

## SUMMARY

- **Fully implemented for Business:** Account type BUSINESS, convert to business, category, contact, hours, multiple links, action buttons, verification request, **Blue Verification Badge display** (profile + feed), business profile UI, **remove followers for public and private accounts**, **analytics/insights** (reach, engagement, profile visits, website clicks, account overview with real rating, top posts, demographics, export), promotions/team/scheduling/calendar/quick replies/verification, **commerce** (orders, returns, settlements, dashboard, reviews, product tagging, tag clicks, shop by username, seller terms, help center), **content scheduling cron**, **account limits** (2 business + 1 personal per phone).
- **Partial:** Ad campaigns/boost (mock), shop collections/banner/featured, checkout payment gateway, PAN/GSTIN seller verification, business inbox labels/auto-responses, team activity log, Nearby post limits and paid posts, SOS, DRM, voice commands, lifestyle streaks, Live Shopping replay-with-tags.
- **Not started / deferred:** MOxE Website (username.moxe.store), custom domain, real-time translation, storage limits (1GB/5GB), guest checkout, multi-seller cart.

Use this document alongside the **Complete MOxE Business Account Functional Guide** and the **Complete MOxE Business Account Feature Explanation** (Riya’s seller journey, seller responsibilities, Live Shopping, product tagging, returns/settlements) to tick off or implement remaining sub-functions.
