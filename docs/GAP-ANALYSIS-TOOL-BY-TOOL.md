# MOxE Platform – Detailed Tool-by-Tool Gap Analysis

This document maps the **specification** to the **current codebase** for each major component. Status: **Implemented**, **Partial**, or **Missing**.

---

## 1. MOxE Basic & Personal Account (The Foundation)

| Area | Spec | Schema | API | UI | Route | Status | Notes |
|------|------|--------|-----|-----|-------|--------|-------|
| Phone signup / verification | ✅ | ✅ | ✅ | ✅ | /auth/* | **Implemented** | PhoneVerification, OTP flow |
| Profile (edit, photo, bio) | ✅ | ✅ | ✅ | ✅ | /profile, /profile/edit | **Implemented** | Account, profile APIs |
| Posts (create, edit, feed) | ✅ | ✅ | ✅ | ✅ | /create/post, / | **Implemented** | Post CRUD, media, caption, tag people, video edits, schedule |
| Stories (create, view, highlights) | ✅ | ✅ | ✅ | ✅ | /stories/* | **Implemented** | Story, Highlight, CreateStory |
| DMs & group chats | ✅ | ✅ | ✅ | ✅ | /messages | **Implemented** | Message, MessageRecipient, group polls |
| Privacy (block, restrict, mute) | ✅ | ✅ | ✅ | ✅ | /blocked, /restricted, /mute, settings | **Implemented** | Block, Restrict, Mute models & APIs |
| Close Friends | ✅ | ✅ | ✅ | ✅ | /close-friends | **Implemented** | CloseFriend list, suggestions |
| Star tier: Profile Visitors | ✅ | ✅ | ✅ | ✅ | /profile-visitors | **Implemented** | ProfileVisitor, export partial |
| Star tier: Ad-free | ✅ | ✅ | ⚠️ | ⚠️ | - | **Partial** | Subscription check; UI indicator missing |
| Star tier: Priority Support | ✅ | ✅ | ✅ | ✅ | /support/tickets, ?queue=true | **Implemented** | listQueue, SupportTickets UI |
| Screenshot notifications | ✅ | ✅ | ✅ | ✅ | /settings/screenshot-notifications | **Implemented** | ScreenshotLog, notificationPrefs.screenshotAlerts |
| Report / Anonymous report | ✅ | ✅ | ✅ | ✅ | /report/anonymous, /settings/help/report | **Implemented** | AnonymousReport model, UI, ReportProblem wired |
| 404 page | - | - | - | ✅ | * (catch-all) | **Implemented** | NotFound component |

**Summary:** Core social and Personal/Star features are **implemented**. Gaps are mostly polish (e.g. ad-free badge, profile visitors export).

---

## 2. MOxE Business Account

| Area | Spec | Schema | API | UI | Route | Status | Notes |
|------|------|--------|-----|-----|-------|--------|-------|
| Business account type & profile | ✅ | ✅ | ✅ | ✅ | /settings, profile | **Implemented** | accountType, contact info, hours |
| Shop section on profile | ✅ | ✅ | ✅ | ✅ | /shop/:username, Commerce | **Implemented** | getShopByUsername, products, collections |
| Product catalog (CRUD) | ✅ | ✅ | ✅ | ✅ | /commerce/*, Commerce.tsx | **Implemented** | Product, ProductVariant, list/create/update/delete |
| Product tagging on posts | ✅ | ✅ | ✅ | ✅ | PostSharePage product tags | **Implemented** | ProductTag, productTags in post create |
| Collections | ✅ | ✅ | ✅ | ✅ | /commerce/collections | **Implemented** | ProductCollection, CRUD |
| Cart (multi-seller) | ✅ | ✅ | ✅ | ✅ | /commerce/cart, Checkout.tsx | **Implemented** | Cart, CartItem, get/add/update/remove |
| Checkout & order creation | ✅ | ✅ | ✅ | ✅ | /commerce/cart/checkout | **Implemented** | createOrder, checkoutFromCart, sellerCoupons |
| Order management (seller) | ✅ | ✅ | ✅ | ✅ | /commerce/orders (seller) | **Implemented** | listOrdersAsSeller, updateOrderStatus |
| Order history (buyer) | ✅ | ✅ | ✅ | ✅ | Commerce / orders | **Partial** | listOrdersAsBuyer exists; buyer orders UI may be minimal |
| Coupons (seller) | ✅ | ✅ | ✅ | ⚠️ | /commerce/coupons | **Partial** | API full; coupon UI in checkout partial |
| Wishlist | ✅ | ✅ | ✅ | ⚠️ | /commerce/wishlist | **Partial** | API; wishlist UI may be minimal |
| Reviews & ratings | ✅ | ✅ | ✅ | ✅ | /commerce/reviews | **Implemented** | Review model, aggregate, listBySeller |
| Seller dashboard | ✅ | ✅ | ✅ | ✅ | /commerce/dashboard | **Implemented** | getSellerDashboard |
| Settlements / Payouts | ✅ | ✅ | ✅ | ✅ | /commerce/settlements, PayoutsPage | **Implemented** | Payout model, listPayouts, getPayout, createPayoutForPeriod (cron/admin) |
| **Payment gateway (Stripe/Razorpay)** | ✅ | ✅ | ⚠️ | ⚠️ | Checkout | **Partial** | Order stores paymentMethod/paymentId; no server-side charge. COD only in UI. |
| MOxE Website / custom domain | ✅ | ✅ | ⚠️ | ⚠️ | /shop/website, Commerce | **Partial** | shop settings, verifyCustomDomain stub; no hosting/DNS |
| Seller verification (PAN/GSTIN) | ✅ | ✅ | ⚠️ | ⚠️ | /verification/* | **Partial** | Document upload UI; manual review, no full automation |
| Seller Community | ✅ | ❌ | ❌ | ❌ | - | **Missing** | No schema or feature |

**Summary:** E-commerce **engine is present**: products, cart, checkout, orders, settlements, reviews. **Gaps:** real payment gateway integration (currently COD/placeholder), custom domain hosting, seller community, and some buyer-side UX (orders list, coupons in UI).

---

## 3. MOxE Creator Account

| Area | Spec | Schema | API | UI | Route | Status | Notes |
|------|------|--------|-----|-----|-------|--------|-------|
| Creator account type | ✅ | ✅ | ✅ | ✅ | Onboarding, settings | **Implemented** | accountType CREATOR |
| Subscription tiers (offer, set) | ✅ | ✅ | ✅ | ✅ | /accounts/me/subscription-tiers, CreatorSubscriptionTiers | **Implemented** | subscriptionTierOffers, getTiersWithWelcome, setTiers |
| Subscribe to creator | ✅ | ✅ | ✅ | ⚠️ | Profile / creator page | **Partial** | subscribe() API; subscribe UI on creator profile may be minimal |
| List subscribers / my subscriptions | ✅ | ✅ | ✅ | ⚠️ | /accounts/me/subscribers, /me/subscriptions | **Partial** | APIs exist; dedicated UI may be thin |
| Live (create, list, go live, end) | ✅ | ✅ | ✅ | ✅ | /live/* | **Implemented** | Live model, create, list, get, start, end, replay |
| Live Shopping (products on live) | ✅ | ✅ | ✅ | ⚠️ | Live products | **Partial** | LiveProduct; attach products to live |
| Live Badges (purchase during live) | ✅ | ✅ | ✅ | ⚠️ | Live | **Partial** | LiveBadge model; purchase flow may be stub |
| Live Gifts | ✅ | ✅ | ✅ | ⚠️ | Live | **Partial** | LiveGift model; send gift flow may be stub |
| **Recurring subscription payments** | ✅ | ✅ | ⚠️ | ⚠️ | - | **Partial** | Subscription record created; no Stripe recurring charge |
| Bonuses (views vs targets) | ✅ | ⚠️ | ⚠️ | ⚠️ | /creator/bonuses | **Partial** | Schema/APIs light; no full bonus engine |
| Branded content (disclosure, partner) | ✅ | ✅ | ✅ | ⚠️ | Post create, insights | **Partial** | brandedContentBrandId, brandedContentDisclosure on Post; workflow partial |
| Creator insights / analytics | ✅ | ✅ | ✅ | ✅ | CreatorStudio, insights | **Implemented** | Analytics, dashboard |

**Summary:** Creator **monetization is partially implemented**: tiers, subscribe API, live, live products/badges/gifts in schema and some API. **Gaps:** recurring payment processing, full live badge/gift purchase flow, bonus engine, and richer branded-content workflow.

---

## 4. MOxE Job Account & Dual Profile

| Area | Spec | Schema | API | UI | Route | Status | Notes |
|------|------|--------|-----|-----|-------|--------|-------|
| Job account type | ✅ | ✅ | ✅ | ✅ | Onboarding | **Implemented** | accountType JOB |
| Personal / Professional profile switch | ✅ | ✅ | ✅ | ✅ | Job.tsx | **Implemented** | activeProfile, PATCH /accounts/me |
| Professional profile (skills, etc.) | ✅ | ✅ | ✅ | ⚠️ | /job/profile | **Partial** | Profile tool; granular visibility partial |

**Summary:** Job account and dual-profile **switching are implemented**. Professional profile depth and visibility controls are partial.

---

## 5. The 24 MOxE Enterprise Tools (Job)

Each tool has **backend routes** under `/api/job/*` and **frontend pages** under `/job/*` (Job.tsx router). Depth varies.

| Tool | Backend | Frontend | Status | Notes |
|------|---------|----------|--------|-------|
| **TRACK** (applications, pipelines, jobs) | ✅ | ✅ Track.tsx | **Implemented** | applications, pipelines, saved-searches, job postings, publish |
| **TRACK Recruiter** (candidates, stages) | ✅ | ✅ Recruiter.tsx | **Implemented** | candidates, move, notes, interviews |
| **TRACK Agile** (projects, sprints, board) | ✅ | ✅ Agile.tsx | **Implemented** | track-agile.service, projects, sprints, board |
| **KNOW** (spaces, pages, wiki) | ✅ | ✅ Know.tsx | **Implemented** | know.service, know-knowledge.service; spaces, pages |
| **DOCS** (job documents) | ✅ | ✅ Docs.tsx | **Implemented** | JobDocument, versions, comments; job/docs routes |
| **FLOW** (kanban boards) | ✅ | ✅ Flow.tsx | **Implemented** | flow.service, boards, cards |
| **WORK** (projects, Gantt, tasks) | ✅ | ✅ Work.tsx | **Implemented** | work.service, projects, tasks |
| **CODE** (repos, PRs) | ✅ | ✅ Code.tsx | **Implemented** | code.service; no real Git host, in-app only |
| **STATUS** (status pages, incidents) | ✅ | ✅ Status.tsx | **Implemented** | status.service |
| **VIDEO** (recordings) | ✅ | ✅ Video.tsx | **Implemented** | job/video.service |
| **AI** (assistant) | ✅ | ✅ Ai.tsx | **Implemented** | job/ai.service |
| **STRATEGY** | ✅ | ✅ Strategy.tsx | **Implemented** | strategy.service |
| **ANALYTICS** | ✅ | ✅ Analytics.tsx | **Implemented** | job/analytics-job.service |
| **INTEGRATION** | ✅ | ✅ Integration.tsx | **Implemented** | integration.service |
| **TEAMS** | ✅ | ✅ Teams.tsx | **Implemented** | teams.service |
| **ACCESS** (SSO, MFA, users) | ✅ | ✅ Access.tsx | **Partial** | access-job.service; SSO/MFA basic, not full enterprise |
| **COMPASS** (services, health) | ✅ | ✅ Compass.tsx | **Implemented** | compass.service |
| **ATLAS** (objectives) | ✅ | ✅ Atlas.tsx | **Implemented** | atlas routes |
| **ALERT** (schedules, rules) | ✅ | ✅ Alert.tsx | **Implemented** | alert routes |
| **BUILD** (pipelines, CI/CD) | ✅ | ✅ Build.tsx | **Implemented** | build routes |
| **CHAT** (tickets) | ✅ | ✅ Chat.tsx | **Implemented** | chat-ticket.service, convert to ticket, list, assign |
| **SCRUM** | ✅ | ✅ Scrum.tsx | **Implemented** | Scrum page |
| **SOURCE** / **CodeSearch** | ✅ | ✅ Source.tsx, CodeSearch.tsx | **Implemented** | Code search UI |

**Summary:** All 24 tools have **backend services and routes** and **frontend pages**. They are **not** “completely missing.” Gaps are **depth**: e.g. real Git in CODE, full SAML/OIDC and MFA in ACCESS, real-time co-editing in DOCS, and automation depth in TRACK/ALERT/BUILD.

---

## 6. Cross-Tool Integration & Innovative Features

| Feature | Spec | Schema | API | UI | Status | Notes |
|---------|------|--------|-----|-----|--------|-------|
| **MOxE INTEGRATION** (central sync) | ✅ | ⚠️ | ⚠️ | ❌ | **Partial/Missing** | integration.service exists for Job; no platform-wide sync engine |
| **Nearby Messaging** | ✅ | ⚠️ | ⚠️ | ⚠️ | **Partial** | NearbyMessagingPage exists; Send/list not wired to location-based API |
| **SOS / Safety** | ✅ | ⚠️ | ⚠️ | ⚠️ | **Partial** | SOSPage, SafetyCheckinPage, Map; no deep OS integration |
| **Screenshot protection** | ✅ | ✅ | ✅ | ✅ | **Implemented** | ScreenshotLog, notify owner (Star), ScreenshotNotificationsSettings |
| **Proximity Alert** | ✅ | ⚠️ | ⚠️ | ⚠️ | **Partial** | ProximityAlertsPage, mocks; no real-time geofencing backend |
| **Translation (in-feed)** | ✅ | ✅ | ✅ | ✅ | **Implemented** | POST /translate/text, FeedPost Translate button |

---

## 7. Summary Table

| Component | Implemented | Partial | Missing |
|-----------|-------------|---------|---------|
| Basic & Personal | Core social, Star features, 404, report, screenshot notifs | Ad-free UI, profile visitors export | - |
| Business | Shop, products, cart, checkout, orders, settlements, reviews, dashboard | Payment gateway, custom domain hosting, buyer orders/coupon UI, seller community | Seller Community |
| Creator | Tiers, subscribe API, live, live products, insights | Recurring payments, live badges/gifts flow, bonuses, branded workflow | - |
| Job + 24 tools | All tools have backend + frontend | ACCESS (SSO/MFA), CODE (real Git), DOCS (real-time), depth elsewhere | - |
| Cross-tool | Screenshot, translation | Integration, Nearby, SOS, Proximity | Central INTEGRATION engine |

---

## 8. Recommended Next Steps (Priority)

1. **Business:** Integrate a payment gateway (Stripe or Razorpay) for checkout and optionally for payouts; keep COD as option.
2. **Business:** Add buyer “My Orders” page wired to `listOrdersAsBuyer` and improve coupon entry on Checkout.
3. **Creator:** Wire recurring subscription payments (Stripe Subscriptions or equivalent) to `subscribe()` and renewal.
4. **Creator:** Implement live badge/gift purchase flow (payment + LiveBadge/LiveGift create) and surface in Live UI.
5. **Job:** Harden ACCESS (SSO metadata upload, MFA enforcement) and document KNOW/DOCS rich-text and versioning behavior.
6. **Cross-tool:** Wire Nearby Messaging to a location-based send/list API (or document as future); same for Proximity Alert backend.

---

*Last updated from codebase scan: Backend (commerce, creator, job, support, report, account, content), Frontend (pages/job, commerce, dashboard, map, settings).*
