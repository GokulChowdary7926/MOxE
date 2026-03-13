# MOxE Business Account — Feature Audit vs. Complete Feature Explanation

This document maps the **Complete MOxE Business Account Feature Explanation** (every component, sub-component, function, sub-function) to the actual MOxE codebase and notes **Implemented**, **Partial**, or **Missing**.

---

## Summary

| Volume | Status | Notes |
|--------|--------|--------|
| **Volume 1: Basic** | ~95% Implemented | Account creation, privacy, story/content, engagement, save & collections, DMs, group chats, block/restrict/mute/report/hidden words, notifications, quiet mode. Gaps: story donation/link/GIF stickers; message request “accept” is implicit (follow moves to main inbox). |
| **Volume 2: Personal / Star** | ~90% Implemented | Close Friends, Favorites, Archive, profile visitors, anonymous story viewing (schema + limit), DRM/screenshot protection, voice commands, priority support, message blocked user (Premium). Activity status: `lastActiveAt` updated in auth middleware. |
| **Volume 3: Business** | ~95% Implemented | Switch to business, category, contact, hours, links, action buttons, verification (PAN/GSTIN/bank, Blue Badge), reviews, analytics, promotions, product tagging, shop (collections, banner, featured), custom domain (stub verify), checkout (cart, guest, order confirmation), order management, returns (seller pays), settlements (7-day, return deductions), seller dashboard (fulfillment, response rate, benchmark placeholder), seller responsibilities, buyer access (browse, cart, wishlist), seller help center. Gaps: **coupon/discount code at checkout**; payment is reference-only (no gateway in repo). |
| **Volume 4: Innovative** | ~92% Implemented | Nearby (daily limit by tier), SOS, DRM config, proximity alert, voice commands, lifestyle streaks (check-in, list, share-preview), Live Shopping (schedule, products, pin, discount, sales), **real-time translation** (4.3: session, WebSocket, subtitles, usage tracking, STAR/THICK gated). Gaps: live **replay with product tags** (recording URL only); nearby **billing** for over-limit not implemented. |

---

## Volume 1: Basic — Detail

### 1.1 Account Management
- **Phone registration:** ✅ `auth.routes.ts` (send-verification-code, verify-code), account create; rate limiting.
- **Email addition:** ✅ `account.routes.ts` PATCH me/email; EmailVerification; block disposable not verified in code.
- **Username:** ✅ Unique, validation, 14-day change limit in account.service.
- **Display name, DOB, profile photo, bio, link(s), pronouns:** ✅ Account schema and update; Link model for multiple links (business cap).
- **Profile photo upload:** ✅ Via account PATCH or upload flow; no single dedicated “profile photo only” route (acceptable).

### 1.2 Basic Privacy
- **Account privacy (public/private):** ✅ `isPrivate`; follow requests approve/decline in follow.routes.
- **Remove followers:** ✅ DELETE `/followers/:followerId` (public & private).
- **Search visibility:** ✅ `searchVisibility` (EVERYONE, FOLLOWERS_ONLY, NO_ONE); enforced in explore.service.
- **Activity status:** ✅ `lastActiveAt` updated in auth middleware; `showActivityStatus` on Account.

### 1.3 Story Privacy
- **Hide story from:** ✅ privacy.routes (hide-story-from), HideStoryFrom model.
- **Reply / reshare controls:** ✅ Account defaults + story-level; schema and story create.
- **Story archive:** ✅ archive.service, ArchivedStory, Highlights.

### 1.4 Content Creation
- **Posts, Stories, Reels:** ✅ Full CRUD; media, caption, location, tag people, scheduling (business).
- **Story stickers:** ✅ Poll (vote, results), Question (submit, list, link answer), Emoji slider, Countdown (remind), Add Yours. Music in story JSON. **Partial:** ❌ Donation sticker not implemented; ❌ Story **link** sticker (clickable URL) not in story.service; ❌ GIF sticker in stories not found (GIF in DMs only).

### 1.5 Engagement, Save, DMs, Group Chats
- **Like, comment, share:** ✅ Post/reel like and comment; share to DM/story.
- **Save & collections:** ✅ SavedPost, Collection; collection.routes, Saved.tsx.
- **DMs:** ✅ Threads, requests (split by follow), send (text, voice, media, GIF, reactions), delete, mute, pin. View-once (isVanish) in schema. **Partial:** No explicit “Accept request” API; following the user effectively moves thread to main inbox.
- **Group chats:** ✅ Create, members, admin, leave; **group polls** (PollVote, POST message/:id/poll/vote).

### 1.6 Block, Restrict, Mute, Report, Hidden Words
- **Block, Restrict, Mute:** ✅ privacy.routes, Block, Restrict, Mute.
- **Report:** ✅ report.routes (account, post, comment, review, anonymous post). **Partial:** Report **story** not explicitly in report.service.
- **Hidden words:** ✅ Account hiddenWords, comment/DM filter in message.service.

### 1.7 Notifications & Quiet Mode
- **Notifications:** ✅ List, mark read; NotificationService; type-based. **Partial:** No per-type **notification preferences** API (only Quiet mode).
- **Quiet mode:** ✅ Schema (quietModeEnabled, Start/End/Days); Settings QuietMode.tsx; NotificationService skips create when in window.

---

## Volume 2: Personal / Star Tier
- **Close Friends, Favorites, Archive:** ✅ closeFriend.routes, Follow.isFavorite, archive + highlights.
- **Profile visitors:** ✅ ProfileView, GET me/profile-visitors, ProfileVisitors.tsx.
- **Anonymous story viewing:** ✅ Schema (anonymousStoryViewsUsed, reset); story view logic.
- **Download/screenshot protection:** ✅ Post/Story screenshotProtection; content.routes screenshot-detected; ScreenshotLog; Star notification.
- **Voice commands:** ✅ voice.routes POST /command, VoiceCommands.tsx.
- **Priority support:** ✅ Support ticket isPriority; PrioritySupport.tsx.
- **Message blocked user (Premium):** ✅ PremiumMessageGrant, PremiumBlockedMessage, premiumBlockedMessage.routes.

---

## Volume 3: Business — Detail
- **Switch to business, category, contact, hours, links, action buttons:** ✅ Account fields; EditProfileBusinessFields, BusinessVerification.
- **Verification (PAN, GSTIN, bank, Blue Badge):** ✅ VerificationRequest, admin approve; Blue Badge only for STAR/THICK; BusinessVerification.tsx.
- **Customer reviews:** ✅ Review model, create/aggregate/respond/report; CommerceReviews.tsx.
- **Analytics:** ✅ analytics.service (overview, content performance, demographics placeholder, follower growth, link/action button/product tag tracking); BusinessInsights.tsx; tier gate 7d/30d.
- **Promotions & boost:** ✅ Promotion, PromotionEvent; business.routes promotions; record-event; performance; BusinessPromotions.tsx.
- **Product tagging:** ✅ Post/Reel/Story productTags; ProductTagClick; commerce product-tag/click; feed/shop tags.
- **Shop:** ✅ Collections, banner, featured; CommerceShopSettings, CommerceCollections; Shop.tsx.
- **MOxE website / custom domain:** ✅ In-app /shop/:username; customDomain, customDomainVerifiedAt; verify stub; shop settings UI.
- **In-app checkout:** ✅ Cart (multi-seller), createOrder (guestEmail/guestName, paymentId, shippingAddress); Checkout.tsx, CommerceCart, OrderDetail. **Missing:** ❌ **Coupon/discount code** at checkout (no Order.couponCode or applyCoupon in commerce.service). Payment is reference-only (no Razorpay/Stripe in repo).
- **Order management & returns:** ✅ Status, tracking, return request/approve/receive/refund; seller-paid return; CommerceOrders.tsx.
- **Settlements:** ✅ Payout, returnDeductions; list/detail; CommerceSettlements.tsx.
- **Seller dashboard:** ✅ Sales overview, top products, fulfillment rate, response rate, benchmarkVsCategory (null placeholder); Commerce.tsx.
- **Seller responsibilities:** ✅ sellerTermsAcceptedAt, accept API, modal on Commerce.
- **Buyer access:** ✅ Browse shop, cart, wishlist, guest checkout; CommerceMyOrders, CommerceWishlist.
- **Seller support:** ✅ SellerHelpCenter.tsx; support tickets; community section (placeholder).

---

## Volume 4: Innovative
- **Nearby:** ✅ location.service getNearby; daily limit (FREE 1, STAR/THICK 5); reset at midnight. **Partial:** No billing for over-limit ($0.50).
- **SOS:** ✅ safety.routes POST /sos; SafetyService.triggerSOS; EmergencyContact; SafetySOS.tsx.
- **Real-time translation (4.3):** ✅ TranslationSession, TranslationUsage; POST /translate/start, /stop, GET /translate/languages; Socket.io namespace /translate (auth, join, audio → translation); mock provider (swap for Google when keys set); usage tracking; STAR/THICK gated; LiveTranslation.tsx (start/join, mic capture, subtitles, share link).
- **DRM:** ✅ GET /config/drm (screenshotBlockEnabled, watermarkMediaUrlPrefix); screenshot detection + notification for Star.
- **Proximity alert:** ✅ proximity.routes, ProximityAlert; ProximityAlerts.tsx.
- **Voice commands (advanced):** ✅ POST /voice/command (SOS, schedule post intent); VoiceCommands.tsx.
- **Lifestyle streaks:** ✅ Streak model; check-in, list, types, share-preview; Streaks.tsx.
- **Live Shopping:** ✅ Live, LiveProduct; schedule, add products, pin, discount %; GET :liveId/sales; recording field. **Partial:** Replay **with product tags** (overlay on replay) not implemented—only recording URL stored.

---

## Confirmed Gaps (Missing or Partial)

| # | Feature | Doc reference | Status |
|---|--------|----------------|--------|
| 1 | **Coupon / discount code at checkout** | 3.5.4 applyCoupon | **Missing** — No Order.couponCode or applyCoupon in createOrder. |
| 2 | **Story donation sticker** | 1.2.3.9 | **Missing** — Not in story stickers or story.service. |
| 3 | **Story link sticker** (clickable URL on story) | 1.2.3.8 | **Missing** — Link sticker for stories not in story.service. |
| 4 | **Story GIF sticker** | 1.2.3.7 | **Partial** — GIF in DMs; story sticker type not verified. |
| 5 | **Message request “Accept”** | 1.5.1.2 | **Partial** — Requests = threads where you don’t follow; following moves to main inbox; no dedicated accept endpoint. |
| 6 | **Per-type notification preferences** | 1.7.1 | **Missing** — Only Quiet mode; no API for “likes on/off”, “comments on/off”, etc. |
| 7 | **Report story** | 1.6.4 | **Partial** — Report account/post/comment/review; story not explicitly in report flow. |
| 8 | **Benchmark vs category** | 3.9.2 | **Placeholder** — Dashboard returns null; “—” in UI until category aggregates exist. |
| 9 | **Nearby billing** ($0.50 per extra post) | 4.1.1 | **Missing** — Only daily cap; no charge for over-limit. |
| 10 | **Live replay with product tags** | 4.8.1 replayLive | **Partial** — Recording URL; replay page with product overlay not implemented. |

---

## Conclusion

The MOxE codebase implements **most** of the Complete MOxE Business Account Feature Explanation end-to-end across backend and frontend. The main **implementable** gaps are:

1. **Coupon/discount code** at checkout (schema + apply in createOrder/cart checkout).
2. **Story donation sticker** and **story link sticker** (if product requires them).
3. **Message request accept** (explicit endpoint that “accepts” and optionally follows).
4. **Per-type notification preferences** (schema + API + settings UI).
5. **Report story** (add story to report flow).
6. **Nearby over-limit billing** (optional; currently cap-only).
7. **Live replay page** with product tray/tags (frontend + reuse LiveProduct for replay).

Everything else from the document is **Implemented**. Use this audit with `REMAINING_IMPLEMENTATION_LIST.md` for prioritization.
