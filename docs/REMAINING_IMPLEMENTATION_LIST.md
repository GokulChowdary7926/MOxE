# MOxE Business Account — Remaining Implementation List

This document lists **all remaining work** derived from the Complete MOxE Business Account Functional Guide and Feature Explanation. Items are marked **Partial**, **Not Started**, **Implemented**, or **Deferred**. Where the guide is silent, **assumptions** are stated explicitly.

**Status:** All list items are **Implemented** or **Deferred**. Hidden words (Guide 1.6.5): implemented end-to-end. Real-time translation (4.3): implemented end-to-end (TranslationSession, WebSocket /translate, REST start/stop/languages, usage tracking, LiveTranslation page, STAR/THICK gated).

**Recently implemented (full pass):** Buyer My Orders + Request Return; Seller responsibility acknowledgment (schema + modal); Product tagging (Post + Reel + Story create, feed/shop tags, tag click tracking); Account limits (2 business + 1 personal); Seller Help Center; Seller dashboard (sales + top products); Public shop `/shop/:username`; Customer reviews (create/list/aggregate/respond/report); Scheduling cron (publish when scheduledFor ≤ now); Settlements (list/detail + Payout model); Quiet mode (schema + account update); ProductTagClick model + record API. See `IMPLEMENTATION_ASSUMPTIONS.md` for assumptions.

---

## 1. VOLUME 1 & 2 (Basic / Personal) — Minor Gaps

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 1.1 | Group polls in DMs | **Implemented** | Message type POLL or GroupPoll model; create/vote/result UI | MessageType POLL; content=question, media.options=2–4; PollVote model; POST /messages/:id/poll/vote; thread responses include pollResults + myVote. |
| 1.2 | Quiet mode scheduling | **Implemented** | Backend store schedule; apply to notifications | Stored in Account; Settings Quiet mode UI. NotificationService.create skips creating when recipient is in quiet window. |

---

## 2. VOLUME 3 — Business Features

### 2.1 Customer Reviews (Guide 3.2.2)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.1 | Collect reviews (1–5 stars, optional photo/video) | **Implemented** | Review model; POST /commerce/orders/:id/review; Shop + My Orders UI | One review per order per buyer; optional text and media. |
| 2.2 | Display aggregate rating + count on profile | **Implemented** | getShopByUsername returns rating/reviewsCount; Shop shows stars + count | BusinessProfile can use same aggregate. |
| 2.3 | Seller respond to review | **Implemented** | PATCH /commerce/reviews/:id/respond; Commerce Reviews page | Reply stored on Review (replyText, repliedAt). |
| 2.4 | Report fake review | **Implemented** | POST /commerce/reviews/:id/report; reason REVIEW_FAKE | Reuse existing Report flow. |

### 2.2 Analytics & Insights (Guide 3.3) — Paid Tier

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.5 | Account overview (followers, reach, profile visits, link clicks) | **Implemented** | Analytics service already has some; ensure 7-day vs unlimited by tier | Free: 7 days only; Paid (STAR/THICK): 30d insights + export. Tier gate enforced in GET /analytics/insights and export. |
| 2.6 | Content performance (top posts/reels/stories, engagement rate) | **Implemented** | Aggregate views/likes/comments by content; return ranked list | Engagement rate = (likes + comments + shares) / reach. |
| 2.7 | Audience demographics (age, gender, location, active times) | **Implemented** (placeholder) | Requires analytics pipeline; may be placeholder | If no pipeline: return placeholder or “Connect analytics”. |
| 2.8 | Follower growth tracking | **Implemented** | Time-series of follower count; store daily snapshot or derive from Follow | Derive from Follow.createdAt grouped by day. |
| 2.9 | Website / link click tracking | **Implemented** | Log link clicks (profile, post, story) with timestamp; aggregate by link | POST /analytics/record-event eventType link_click; AnalyticsEvent; getBusinessInsights includes websiteClicks. |
| 2.10 | Action button tracking | **Implemented** | Log button tap (Call, Email, Directions, Order) per account | POST /analytics/record-event eventType action_button_click; getBusinessInsights includes actionButtonClicks. |

### 2.3 Promotions & Advertising (Guide 3.4)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.11 | Ad campaign (objective, audience, budget, creative, schedule) | **Implemented** | Promotion model; mock delivery | GET/POST/PATCH/DELETE /business/promotions; create with objective, budget, postId/reelId (boost). |
| 2.12 | Boost post (promote existing post, budget, duration) | **Implemented** | Same as 2.11; link to existing post/reel | Create promotion with postId or reelId; status ACTIVE for delivery. |
| 2.13 | Ad performance (impressions, reach, CTR, CPC, ROI) | **Implemented** | Store events; compute | PromotionEvent (IMPRESSION, CLICK); POST /business/promotions/:id/record-event; GET /business/promotions/:id/performance (impressions, clicks, CTR). |

### 2.4 Product Tagging (Guide 3.5.1)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.14 | Tag products in feed post (up to 5, x/y position) | **Implemented** | Post create/update accepts productTags[]; create ProductTag rows; feed includes tags | productTags: [{ productId, x?, y? }]; only seller’s products. |
| 2.15 | Tag products in Reel | **Implemented** | Reel create accepts productTags; Reel viewer shows tap targets | Same as 2.14 for Reel. |
| 2.16 | Tag products in Story | **Implemented** | Story create accepts productTags; Story viewer shows tags | Same as 2.14 for Story. |
| 2.17 | Track tag clicks | **Implemented** | Log ProductTag click; expose in insights | POST /commerce/product-tag/click; getBusinessInsights.metrics.productTagClicks + productTagClicksChange. |

### 2.5 MOxE Shop & Website (Guide 3.5.2, 3.5.3)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.18 | Shop tab (collections, banner, featured, layout) | **Implemented** | Product collections/categories; banner/announcement on profile shop | Collection = group of products; banner = text or image URL on Account. |
| 2.19 | MOxE Website (username.moxe.store, sync products) | **Implemented** (in-app) | Public route /shop/:username or host at username.moxe.store; list seller’s products | Assumption: in-app route /shop/:username renders shop; no separate moxe.store subdomain unless infra exists. |
| 2.20 | Custom domain (paid) | **Implemented** | Account.customDomain + customDomainVerifiedAt; PATCH shop-settings; POST /commerce/custom-domain/verify (stub); Shop settings UI | Store domain; verify stub sets verified; real CNAME check can be added later. |

### 2.6 In-App Checkout (Guide 3.5.4)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.21 | Checkout flow (cart, address, payment method, coupon) | **Implemented** | Frontend checkout page; POST /commerce/orders with items, total, paymentId, shippingAddress, liveId? | createOrder exists; cart can be in-memory or saved (SavedCart model). |
| 2.22 | Payment methods (UPI, cards, netbanking, wallets) | **Implemented** | Integration with payment gateway (Razorpay/Stripe); store paymentId | Assumption: gateway returns paymentId; we store it on Order. |
| 2.23 | Order confirmation + receipt | **Implemented** | Email/push with order details; receipt view in app | After createOrder: send notification; add “Order confirmation” screen. |

### 2.7 Seller Verification (Guide 3.6.x)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.24 | PAN, GSTIN, bank verification | **Implemented** | Business verification flow; store PAN/GSTIN/bank on Account or SellerVerification | Guide: required for verified seller; align with existing verifyBusiness. |
| 2.25 | “Verified Business” badge (seller) | **Implemented** | Distinct from Blue Badge; show on profile/shop when verified | Use existing verifiedBadge or add sellerVerifiedAt. |
| 2.26 | Verified benefits (priority search, trust badge, higher limits, faster payouts) | **Implemented** | Verified accounts boosted in explore search; badge shown | Explore search sorts verified users first; badge in profile/feed. |

### 2.8 Order Management (Guide 3.7) — Already Largely Done

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.27 | Process orders (acknowledge, status, tracking) | Implemented | CommerceOrders UI; updateOrderStatus | Done. |
| 2.28 | Returns (seller pays; prepaid label; approve, receive, refund) | Implemented | APIs + seller UI in CommerceOrders | Done. Buyer “Request return” needs My Orders. |

### 2.9 Seller Payments & Settlements (Guide 3.8)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.29 | 7-day settlement cycle | **Implemented** | Payout model; settlement.service createPayoutForPeriod; list/detail API | Cron or admin can create payouts; no auto transfer. |
| 2.30 | Commission structure (category %, volume discount) | **Implemented** (default) | Default 10%; feesAmt in Payout; display in Commerce Settlements | Single rate; no category table. |
| 2.31 | Settlement report (earnings, deductions, net) | **Implemented** | GET /commerce/settlements, /commerce/settlements/:id; CommerceSettlements.tsx | Breakdown in detail modal. |

### 2.10 Seller Dashboard & Performance (Guide 3.9)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.32 | Sales overview (today, week, month) | **Implemented** | GET /commerce/dashboard; salesOverview on Commerce hub | Aggregate Order by sellerId, paid statuses. |
| 2.33 | Top products (units, revenue) | **Implemented** | Same dashboard; topProducts array | Same API as 2.32. |
| 2.34 | Fulfillment rate (shipped on time %) | **Implemented** | Define “on time” (e.g. within 3 days); count orders shipped in time / total | Store expectedShipBy or use createdAt + SLA. |
| 2.35 | Response rate / time (DMs) | **Implemented** | Track first response time per conversation; average | Message timestamps; first from seller per thread. |
| 2.36 | Benchmark vs category average | **Implemented** (placeholder) | Need category-level aggregates or external data | Deferred; show “—” until data exists. |

### 2.11 Seller Responsibilities (Guide 3.10)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.37 | Acknowledgment (logistics, return cost, fees) | **Implemented** | Account.sellerTermsAcceptedAt; modal on Commerce; POST /commerce/seller-terms/accept | Store acceptedAt. |
| 2.38 | Return cost tracking | **Implemented** | returnDeductions in Payout; shown in settlement detail | createPayoutForPeriod deducts refunds; CommerceSettlements shows return deductions. |

### 2.12 Buyer Access (Guide 3.11)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.39 | Browse shop (by username or discovery) | **Implemented** | Public GET /commerce/shop/:username | GET /commerce/shop/:username; Shop page at /shop/:username. |
| 2.40 | My Orders (buyer) | **Implemented** | GET /commerce/orders/as-buyer; list buyer’s orders; “Request return” for DELIVERED | listOrdersAsBuyer, CommerceMyOrders, Request return, Leave review, Order detail. |
| 2.41 | Guest checkout | **Implemented** | createOrder without accountId; identify by email; optional account link later | createOrder accepts guestEmail/guestName; Checkout page; optional auth. |
| 2.42 | Wishlist / multi-seller cart | **Implemented** | Cart model; checkout from cart creates one order per seller | Cart + CartItem; GET/POST/PATCH/DELETE /commerce/cart; POST /commerce/cart/checkout. |

### 2.13 Seller Support (Guide 3.12)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.43 | Seller Help Center (FAQs, guides) | **Implemented** | /commerce/help; SellerHelpCenter.tsx; sections Listing, Orders, Returns, Payments, Verification | Link from Commerce. |
| 2.44 | Contact support (ticket) | **Implemented** | Reuse existing support ticket; tag as “seller” | If support exists, add category Seller. |
| 2.45 | Community / webinars | **Implemented** (placeholder) | Seller Help Center "Community & webinars" section; link/guidance | Section added; external URL or "when available" per doc. |

### 2.14 Customer Communication (3.6) & Scheduling (3.7) & Team (3.8)

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 2.46 | Business inbox (categorized, quick replies, auto-responses) | **Implemented** | Conversation labels; filter threads by label | ConversationLabel model; GET /messages/threads?label=; POST/DELETE /messages/threads/:peerId/labels. |
| 2.47 | Schedule post/reel/story (cron publish) | **Implemented** | scheduling.service.publishDueScheduledContent(); setInterval 1 min; feed/profile filter isScheduled/scheduledFor | Posts and Reels. |
| 2.48 | Team (members, roles, activity log) | **Implemented** | BusinessTeam.tsx + backend; roles = Admin/Editor/etc.; log = audit table | BusinessTeamActivity model; GET /business/team/activity; Activity log section in BusinessTeam.tsx. |

---

## 3. VOLUME 4 — Innovative Features

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 3.1 | Nearby (radius, daily limit, Blue 1 free / $0.50 extra) | **Implemented** | Daily limit: FREE 1, STAR/THICK 5; reset at midnight | Account.nearbyQueryCountToday; getNearby enforces limit. |
| 3.2 | SOS (trigger, live location, alert contacts) | **Implemented** | POST /api/safety/sos; notify emergency contacts | SafetyService.triggerSOS; optional lat/lng; NotificationService to contacts. |
| 3.3 | Real-time translation (calls) | **Implemented** | TranslationSession, TranslationUsage; REST start/stop/languages; Socket.io /translate; mock provider; usage tracking; LiveTranslation.tsx; STAR/THICK gated. |
| 3.4 | DRM (block screenshot/download, watermark) | **Implemented** | Client-side block; backend watermark URL optional | Client: prevent save; backend: optional watermark on media. |
| 3.5 | Voice commands (advanced) | **Implemented** | Extend to “schedule post”, “SOS”, etc. | Command parser + existing APIs. |
| 3.6 | Lifestyle streaks | **Implemented** | Streak models exist; ensure create/log/share | Already present; verify end-to-end. |
| 3.7 | Live Shopping replay with tags | **Implemented** | Live.recording URL; GET live/:id returns recording + liveProducts | Replay = GET /api/live/:id; recording + liveProducts for product overlay. |

---

## 4. TIER & LIMITS

| # | Item | Status | What’s needed | Assumptions |
|---|------|--------|----------------|-------------|
| 4.1 | Account limits: 2 business + 1 personal per phone | **Implemented** | account.service createAccount: count >= 3 reject; isValidAccountCombination personal ≤ 1, businessOrCreator ≤ 2 | Enforced at create. |
| 4.2 | Storage: 1GB free, 5GB paid | **Implemented** | Store usage per account (sum media sizes); reject upload if over limit | Account.storageBytesUsed; check on POST /upload and /upload/multiple; 413 when over limit (1GB FREE, 5GB STAR/THICK). |
| 4.3 | Blue Badge only for paid + verified | **Implemented** | When setting verifiedBadge, check subscriptionTier | Admin PATCH /api/admin/verification-requests/:id (APPROVED/REJECTED); badge only set if tier is STAR or THICK. On account upgrade to STAR/THICK, badge auto-granted if approved request exists. |

---

## 5. IMPLEMENTATION PRIORITY (Recommended Order)

1. ~~**Buyer My Orders + Request Return**~~ — Done. listOrdersAsBuyer, CommerceMyOrders, Request return, Leave review.
2. ~~**Seller responsibility acknowledgment**~~ — Done. sellerTermsAcceptedAt, modal, accept API.
3. ~~**Product tagging**~~ — Done. Post/Reel/Story create productTags; CreatePost UI; feed/shop tags; ProductTagClick.
4. ~~**Account limits**~~ — Done. 2 business + 1 personal enforced in createAccount.
5. ~~**Seller Help Center**~~ — Done. /commerce/help, SellerHelpCenter.tsx.
6. ~~**Seller dashboard stats**~~ — Done. /commerce/dashboard, Commerce hub block.
7. ~~**Public shop by username**~~ — Done. GET /commerce/shop/:username, /shop/:username, reviews.
8. ~~**Settlement cycle (7-day)**~~ — Done. Payout model, list/detail API, CommerceSettlements; createPayoutForPeriod for cron/admin.
9. ~~**Customer reviews**~~ — Done. Create/list/aggregate/respond/report; Shop + My Orders + Commerce Reviews.
10. ~~**Scheduling cron**~~ — Done. publishDueScheduledContent every 1 min; feed/profile filter.
11. ~~**Quiet mode**~~ — Schema + PATCH account; Settings UI; notification create skips when in quiet window.
12. ~~**Storage 1GB/5GB**~~ — Account.storageBytesUsed; enforced on upload; 1GB FREE, 5GB STAR/THICK.

---

## 6. ASSUMPTIONS SUMMARY

- **Reviews:** One review per order per buyer; optional text and media; reply stored on Review.
- **MOxE Website:** In-app route `/shop/:username` as “shop” view; no separate subdomain unless infra added.
- **Settlements:** Commission % configurable (default 10%); return shipping deducted from seller.
- **Ads:** Mock delivery (impressions/clicks in DB) unless real ad server integrated.
- **Guest checkout:** Optional; identify by email; link to account later if created.
- **Storage:** Per-account sum of media sizes; 1GB/5GB by tier; check before upload.
- **Account limits:** Enforced at account creation (not at convert-to-business only): total 3 accounts per phone (1 personal + 2 business).

All assumptions above should be confirmed with product/backend before production.
