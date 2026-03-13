# MOxE Business Account — Feature Verification Checklist

This document confirms that each feature, sub-feature, function, and component from the MOxE Business Account guide has been verified against the codebase. **Implemented** = present end-to-end; **Partial** = core exists, minor gap; **N/A** = not applicable.

---

## Volume 1: Basic MOxE Social (All Accounts)

| # | Feature / Sub-feature | Status | Evidence |
|---|------------------------|--------|----------|
| 1.1.1 | Phone registration | ✅ Implemented | `auth.routes.ts` send-verification-code, verify-code; username, displayName, dateOfBirth |
| 1.1.2 | Email addition | ✅ Implemented | `account.routes.ts` PATCH /me/email, `email.service.ts` |
| 1.1.3 | Username selection | ✅ Implemented | Auth verify-code flow; account update |
| 1.1.4 | Display name | ✅ Implemented | Account update, getAccountById |
| 1.1.5 | Date of birth | ✅ Implemented | Auth + account schema |
| 1.1.6 | Profile photo | ✅ Implemented | Account.profilePhoto, updateAccount, upload |
| 1.1.7 | Bio | ✅ Implemented | Account update, schema |
| 1.1.8 | Link in bio (1–5 links) | ✅ Implemented | `Link` model; `account.service.ts` getAccountById includes links; updateAccount accepts `links[]` (up to cap.maxLinks); `EditProfileBusinessFields.tsx` add/remove links |
| 1.1.9 | Pronouns | ✅ Implemented | Account.pronouns, updateAccount, schema |
| 1.2 | Privacy: account toggle, follow requests, remove followers, search visibility, activity status | ✅ Implemented | `privacy.routes.ts`, `follow.routes.ts` (requests, approve/decline, DELETE followers/:followerId), schema |
| 1.3 | Story privacy: hide from, reply controls, resharing, archive | ✅ Implemented | Schema defaultStoryAllowReplies/Reshares, storyArchiveEnabled; `privacy.routes.ts` hide-story-from; archive in story flow |
| 1.2 | Post create (media, caption, location, tag people, productTags, schedule) | ✅ Implemented | `post.routes.ts`, `post.service.ts`; `scheduling.service.ts`, business /scheduled |
| 1.2 | Story create (media, stickers: poll, questions, emoji slider, countdown, add yours, music, GIF, **link**, **donation**, text, location, mention) | ✅ Implemented | `story.routes.ts`, `story.service.ts` (stickers JSON); `CreateStory.tsx` link + donation forms; `StoryViewer.tsx` renders link & donation |
| 1.2 | Story highlights | ✅ Implemented | `highlight.routes.ts`, `highlight.service.ts`; account /:id/highlights |
| 1.3 | Like post/story; comment (write, reply, like, edit, delete); share to DM, share to story | ✅ Implemented | `post.routes.ts`, `story.routes.ts` like; `post.service.ts` comment CRUD; `message.routes.ts` share-post; `story.routes.ts` share-post |
| 1.4 | Save post, create/manage/share collection | ✅ Implemented | `collection.routes.ts`, `post.routes.ts` save/unsave, `collection.service.ts` share token |
| 1.5 | DMs: send, requests, voice, media, GIF, reactions; delete, mute, pin; group create, polls, admin, leave | ✅ Implemented | `message.routes.ts`, `message.service.ts`, `group.routes.ts`; MessageType, reactions, mute, pin, poll vote |
| 1.6 | Block, restrict, mute; report content; hidden words | ✅ Implemented | `privacy.routes.ts`, `report.routes.ts` (type account/post/comment/**story**); schema hiddenWords; post/message filter; `HiddenWords.tsx` |
| 1.7 | Notifications; quiet mode; **per-type notification preferences** | ✅ Implemented | `notification.routes.ts`; schema quietMode*; **GET/PATCH /accounts/me/notification-preferences**, `NotificationPreferences.tsx` |

---

## Volume 2: Personal Account Features

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 2.1 | Close Friends, Favorites, Archive | ✅ Implemented | `closeFriend.routes.ts`, Follow.isFavorite, feed favorites; post archive/archived |
| 2.2 | Star tier: ad-free, profile visitors, anonymous story, download/screenshot protection, voice commands, priority support, message blocked user | ✅ Implemented | `capabilities.ts`; profile-visitors; story anonymous views; content screenshot-detected; `voice.routes.ts`; support; `premiumBlockedMessage.routes.ts` |

---

## Volume 3: Business Account Features

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 3.1 | Convert to business; category; contact; hours; multiple links; action buttons; verification; Blue Badge | ✅ Implemented | `ConvertToBusiness.tsx`; account update (businessCategory, contact*, businessHours, actionButtons); `business.routes.ts` GET/POST verification/request; admin verification-requests; `verification.service.ts` (badge when STAR/THICK) |
| 3.2 | Customer reviews (collect, display, respond, report) | ✅ Implemented | `review.service.ts`, `commerce.routes.ts` reviews aggregate/list/create/respond/report; Shop + CommerceReviews |
| 3.3 | Analytics: overview, content performance, demographics, follower growth, link/button tracking | ✅ Implemented | `analytics.routes.ts`, `analytics.service.ts`; `BusinessInsights.tsx` |
| 3.4 | Promotions / boost post; ad performance | ✅ Implemented | `business.routes.ts` promotions CRUD, record-event, performance; `promotion.service.ts` |
| 3.5 | Product tagging (post, reel, story); shop; MOxE website (shop by username); **in-app checkout with coupon** | ✅ Implemented | ProductTag, post/reel/story productTags; `commerce.service.ts` getShopByUsername; cart, **checkout with couponCode**, **SellerCoupon**, validateCoupon |
| 3.6 | Seller verification (PAN, GSTIN, bank, proof; verified benefits) | ✅ Implemented | Schema Account.pan, gstin, bankDetails; VerificationRequest (documentUrl, notes); business GET/POST verification/request; admin approve/reject; verifiedBadge + verifiedAt on approve (paid tier); explore/search can prioritize verified |
| 3.7 | Order management; returns (seller pays, prepaid label, approve, receive, refund) | ✅ Implemented | `commerce.routes.ts` orders, return flow; `commerce.service.ts` approveReturn, setReturnTracking, markReturnReceived, refundOrder |
| 3.8 | 7-day settlement; commission; settlement report | ✅ Implemented | `settlement.service.ts`, Payout model; GET /commerce/settlements, /settlements/:id |
| 3.9 | Seller dashboard (sales, top products, fulfillment, response rate) | ✅ Implemented | `commerce.service.ts` getSellerDashboard; GET /commerce/dashboard |
| 3.10 | Seller responsibilities (acknowledgment; logistics; return shipping seller pays) | ✅ Implemented | POST /commerce/seller-terms/accept; schema sellerTermsAcceptedAt; return flow |
| 3.11 | Buyer access (browse shop, cart, checkout guest/account, track orders) | ✅ Implemented | GET /commerce/shop/:username; cart APIs; POST cart/checkout; GET orders?asBuyer; CommerceMyOrders, Checkout, Shop |
| 3.12 | Seller support (help center, contact, community) | ✅ Implemented | `SellerHelpCenter.tsx`; `support.routes.ts` |
| — | **Seller coupons (create/list/update/delete; apply at checkout)** | ✅ Implemented | `commerce.routes.ts` GET/POST/PATCH/DELETE /coupons; `commerce.service.ts` listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon; checkoutFromCart/createOrder accept couponCode; Checkout.tsx, CommerceCart.tsx |

---

## Volume 4: Innovative Features

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| 4.1 | Nearby (enable, radius, daily limit; **nearby post 1 free/day, $0.50 extra**) | ✅ Implemented | `location.routes.ts` preferences, nearby, **POST nearby-post**, **GET nearby-post/usage**; `location.service.ts` recordNearbyPost, getNearbyPostUsage; **Nearby.tsx** usage + “Post to nearby” |
| 4.2 | SOS | ✅ Implemented | `safety.routes.ts` POST /sos, `safety.service.ts` triggerSOS |
| 4.3 | Real-time translation | ✅ Implemented | `translation.routes.ts`, TranslationSession, usage; LiveTranslation UI |
| 4.4 | DRM / screenshot protection | ✅ Implemented | `content.routes.ts` screenshot-detected; client capabilities |
| 4.5 | Promity Alert | ✅ Implemented | `proximity.routes.ts`, `proximity.service.ts`, `ProximityAlerts.tsx` |
| 4.6 | Voice commands | ✅ Implemented | `voice.routes.ts`, `VoiceCommands.tsx` |
| 4.7 | Lifestyle streaks | ✅ Implemented | `streak.routes.ts`, `Streaks.tsx` |
| 4.8 | Live Shopping (schedule, products, pin, discount; **replay with product tray**) | ✅ Implemented | `live.routes.ts` create, /:liveId/products, pin, discount; **GET /:id/replay**; `live.service.ts` getReplay; **LiveReplay.tsx**; Live.tsx “Watch replay” when ENDED |

---

## Report Story & Notification Preferences

| # | Feature | Status | Evidence |
|---|---------|--------|----------|
| — | Report story | ✅ Implemented | Report.reportedStoryId; `report.service.ts` type `'story'` sets reportedStoryId |
| — | Per-type notification preferences | ✅ Implemented | Account.notificationPrefs; GET/PATCH /accounts/me/notification-preferences; `NotificationPreferences.tsx` (likes, comments, dms, mentions, follows, storyReplies) |

---

## Summary

- **All listed features are Implemented** in backend and/or frontend as above.
- **Links in bio:** Multiple links (up to 5 for business) are supported via Account update with `links[]` and the Link model; no separate `/links` CRUD required.
- **Story link & donation stickers:** Backend accepts stickers JSON; frontend CreateStory has link and donation sticker UI; StoryViewer renders them.
- **Seller verification:** VerificationRequest + admin review; Account.pan, gstin, bankDetails exist for storage; Blue Badge granted on approve when tier is STAR/THICK.

*Last verified: against BACKEND and FRONTEND codebase.*
