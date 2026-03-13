# MOxE Business Account — Implementation Assumptions

This document records **assumptions** made when implementing the Complete MOxE Business Account Functional Guide and Feature Explanation. Use it to align product/backend and to fill gaps where the guide was silent.

---

## 1. Account & limits

| Topic | Assumption |
|-------|------------|
| Account limits | **2 business + 1 personal per phone** (max 3 accounts). Enforced in `account.service.createAccount`. |
| Blue Badge | Gated by paid tier + business verification; `verifiedBadge` set on Account. |
| Quiet mode | Stored on Account: `quietModeEnabled`, `quietModeStart`, `quietModeEnd`, `quietModeDays` (0–6). No server-side notification suppression yet; client can use these to show “Do not disturb”. |

---

## 2. Commerce & seller

| Topic | Assumption |
|-------|------------|
| Seller responsibility | One-time acknowledgment; `Account.sellerTermsAcceptedAt`. Modal on first Commerce use (Business/Creator). |
| Reviews | **One review per order per buyer.** Optional text and media (max 5 URLs). Reply stored on Review (`replyText`, `repliedAt`). Report uses existing Report flow with reason e.g. `REVIEW_FAKE`. |
| Settlements | **7-day cycle.** Payout model: periodStart, periodEnd, totalSales, commissionPct (default 10%), fees (e.g. ₹5/order), returnDeductions, netAmount, status. List/detail API for seller; cron or admin can create Payout records. No real bank transfer; `referenceId` and `paidAt` for manual reconciliation. |
| Commission | Single default **10%**; fixed fee **₹5 per order**. No category-wise or volume-based rates in initial implementation. |
| Return shipping | Seller pays; cost not auto-deducted in settlement (optional returnDeductions for refund amount only). |

---

## 3. Product tagging & shop

| Topic | Assumption |
|-------|------------|
| Product tags | Post create accepts `productTags: [{ productId, x?, y? }]` (max 5); only seller’s products. Reel/Story can use same ProductTag model (reelId/storyId). |
| Tag clicks | **ProductTagClick** model (productId, postId?, storyId?, reelId?, viewerId). POST `/commerce/product-tag/click` records click; analytics can aggregate later. |
| Public shop | **GET /commerce/shop/:username** (no auth). Frontend **/shop/:username**. No separate moxe.store subdomain; in-app route only. |
| Shop data | Returns account, products, rating, reviewsCount (from Review aggregate). |

---

## 4. Content & scheduling

| Topic | Assumption |
|-------|------------|
| Scheduled publish | Posts/Reels with `isScheduled: true` and `scheduledFor <= now` are “published” by setting `isScheduled: false`. **Cron:** `scheduling.service.publishDueScheduledContent()` runs every 1 min (setInterval in server). |
| Feed / profile | Feed and profile list only “published” content: `isScheduled: false` OR `scheduledFor <= now`. |

---

## 5. Buyer & checkout

| Topic | Assumption |
|-------|------------|
| My Orders | **GET /commerce/orders?asBuyer=true**; buyer can request return for DELIVERED orders. |
| Leave review | Buyer can leave one review per delivered order via **POST /commerce/orders/:orderId/review**. |
| Guest checkout | Not implemented; all orders require authenticated buyer. |
| Cart / wishlist | Cart is in-memory or separate feature; no multi-seller cart or product wishlist in this phase. |

---

## 6. Notifications & quiet mode

| Topic | Assumption |
|-------|------------|
| Quiet mode schedule | Stored on Account; **quietModeStart** / **quietModeEnd** (e.g. "22:00" / "07:00"), **quietModeDays** (e.g. [0,1,2,3,4,5,6]). Update via **PATCH /accounts/:accountId** with allowed keys. |
| Application | Notification service can check quiet mode before sending push; if not implemented, client can hide or mute UI. |

---

## 7. Analytics & ads

| Topic | Assumption |
|-------|------------|
| Ad delivery | No real ad server; promotions/boost stored in DB with mock or no delivery. |
| Tag click analytics | ProductTagClick table; seller dashboard/insights can sum by product or content later. |

---

## 8. Storage & tiers

| Topic | Assumption |
|-------|------------|
| Storage limits | 1GB free / 5GB paid per account not enforced in code yet; can be added to upload flow. |
| Tier gating | Blue Badge and some features (e.g. scheduling, advanced analytics) gated by subscription tier; checks in backend where needed. |

---

## 9. General

| Topic | Assumption |
|-------|------------|
| Errors | API returns 4xx/5xx with message; frontend shows toast or inline error. |
| Idempotency | Review create is idempotent per (orderId, reviewerId) via unique constraint. |
| Time zones | scheduledFor and quiet mode times are stored without timezone; server uses UTC or server local. |

---

*Confirm with product/backend before production. Update this doc when assumptions change.*
