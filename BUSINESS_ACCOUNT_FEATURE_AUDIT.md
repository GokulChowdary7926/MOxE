# MOxE Business Account Feature Audit Report

Audit of the MOxE codebase against the comprehensive Business Account feature document (Volumes 1–4). Repository paths: `BACKEND/src`, `FRONTEND/src`.

---

## 1. Backend: Routes Summary

| Base Path | Route File | Main Operations |
|-----------|------------|------------------|
| `/api/auth` | auth.routes.ts | GET /, POST /send-verification-code, POST /verify-code, GET /verify-email, POST /register (501), POST /login (501) |
| `/api/users` | user.routes.ts | GET / (stub) |
| `/api/accounts` | account.routes.ts | GET /me, PATCH /me/email, GET /me/profile-visitors, GET /list, GET /capabilities, GET /:accountId/highlights, GET /:accountId, GET /username/:username, POST /, PATCH /:accountId, POST /:accountId/upgrade |
| `/api/posts` | post.routes.ts | GET /, GET /feed, GET /feed/favorites, GET /tagged, GET /archived, GET /deleted, POST /, POST /:postId/like, DELETE /:postId/like, POST/DELETE comments, save/unsave, share, view, delete, archive |
| `/api/stories` | story.routes.ts | GET /, POST /, POST /share-post, GET/POST/DELETE /:storyId/like, POST /:storyId/view, GET anonymous-views-remaining, poll/remind/question/emoji-rating, add-yours-responses |
| `/api/reels` | reel.routes.ts | GET /, POST / |
| `/api/live` | live.routes.ts | GET /, GET /:id, POST /, POST /:liveId/products, DELETE /:liveId/products/:productId, PATCH /:liveId/pin, PATCH /:liveId/products/:productId/discount, GET /:liveId/sales |
| `/api/messages` | message.routes.ts | GET /threads, POST/DELETE /threads/:peerId/labels, GET /, POST /, POST /thread-read, DELETE /:messageId, POST/DELETE /:messageId/reaction, POST/DELETE /pin/:userId, POST/DELETE /mute/:userId, POST /hide/:userId, POST /share-post, POST /:messageId/poll/vote |
| `/api/notifications` | notification.routes.ts | GET /, PATCH /:id/read, POST /read-all |
| `/api/explore` | explore.routes.ts | GET /trending, GET /search, GET /hashtags/suggest |
| `/api/map` | map.routes.ts | GET / (stub) |
| `/api/commerce` | commerce.routes.ts | GET /shop/:username, GET /reviews/aggregate, GET /reviews, POST /seller-terms/accept, GET /dashboard, PATCH /shop-settings, POST /custom-domain/verify, collections CRUD, wishlist, cart, checkout, products CRUD, orders CRUD, returns flow, review/respond/report, product-tag/click, GET /settlements, GET /settlements/:payoutId |
| `/api/analytics` | analytics.routes.ts | GET /, POST /record-event, GET /insights, GET /insights/export |
| `/api/business` | business.routes.ts | Promotions CRUD + performance + record-event, GET/POST/PATCH/DELETE /team, GET /team/activity, quick-replies CRUD, GET/POST /verification, GET /scheduled, GET /calendar |
| `/api/admin` | admin.routes.ts | GET /, GET /verification-requests, PATCH /verification-requests/:id |
| `/api/job` | job.routes.ts | Track (applications, pipelines, jobs), Know (companies, reviews, salary, resources, interview prep), Flow (boards, columns, cards) |
| `/api/premium` | premiumBlockedMessage.routes.ts | (premium messaging blocked users) |
| `/api/collections` | collection.routes.ts | GET /shared/:shareToken, GET /, POST /, GET /saved, PATCH/DELETE /:id, POST /:id/items, etc. |
| `/api/privacy` | privacy.routes.ts | GET/POST/DELETE block, mute, restrict, hide-story-from, GET/PATCH limit-interactions |
| `/api/follow` | follow.routes.ts | POST /, DELETE /:accountId, DELETE /followers/:followerId, GET /followers, GET /following, GET/POST /requests approve/decline, GET /status/:accountId, GET /favorites, PATCH /:accountId/favorite |
| `/api/close-friends` | closeFriend.routes.ts | (close friends list) |
| `/api/reports` | report.routes.ts | POST /, POST /problem |
| `/api/drafts` | draft.routes.ts | (draft CRUD) |
| `/api/emergency-contacts` | emergencyContact.routes.ts | (SOS contacts) |
| `/api/upload` | upload.routes.ts | POST /, POST /multiple |
| `/api/archive` | archive.routes.ts | GET /, POST /run-job |
| `/api/highlights` | highlight.routes.ts | GET /view/:id, GET /, GET/POST/PATCH/DELETE /:id, POST /:id/items, DELETE /:id/items/:itemId, POST /:id/reorder |
| `/api/groups` | group.routes.ts | GET /, GET /:id, POST /, PATCH /:id, DELETE /:id, POST /:id/members, DELETE /:id/members/:userId, PATCH /:id/members/:userId/role, POST /:id/leave |
| `/api/support` | support.routes.ts | POST /tickets, GET /tickets, GET/POST /tickets/:id, POST /tickets/:id/reply |
| `/api/content` | content.routes.ts | POST /screenshot-detected |
| `/api/safety` | safety.routes.ts | POST /sos |
| `/api/streaks` | streak.routes.ts | POST /check-in, GET /, GET /types, GET /share-preview |
| `/api/anonymous` | anonymousSpace.routes.ts | GET/POST /spaces, GET /spaces/:spaceId, GET/POST /spaces/:spaceId/posts, vote, report, comments |
| `/api/location` | location.routes.ts | POST /, GET/PATCH /preferences, GET /nearby |
| `/api/proximity-alerts` | proximity.routes.ts | GET /, POST /, PATCH /:id, DELETE /:id |
| `/api/voice` | voice.routes.ts | POST /command |
| `/api/config` | config.routes.ts | GET /drm |

---

## 2. Backend: Services Identified

| Area | Service(s) | Evidence |
|------|------------|----------|
| Auth / account creation (phone) | phoneVerification.service | sendVerificationCode, verifyCode (phone + optional username, displayName, DOB) |
| Auth / account creation (email) | email.service | verifyToken (email verification link); no email-based signup route |
| Account creation (username, display name, DOB, profile) | account.service | createAccount(username, displayName, accountType, bio, profilePhoto, pronouns, website, business fields, links) |
| Account update | account.service | updateAccount (includes isPrivate, searchVisibility, showActivityStatus, business fields, quiet mode, etc.) |
| Privacy settings | privacy.service | block, mute, restrict, hide-story-from, limit-interactions |
| Post creation | post.service | create, like, comment, save, share, view, archive, delete |
| Story creation | story.service | create, view, like, poll, question, emoji-rating, remind, add-yours |
| Reel creation | reel.service | create, list, listByAccount |
| Live | live.service | create (schedule), addProductsToLive, removeProductFromLive, setPinnedProduct, discount, getLiveSales; **no start/end/status transition or replay** |
| Messaging (DM, threads, labels) | message.service | send (TEXT, VOICE, IMAGE, VIDEO, GIF, STICKER, POLL), threads, labels, pin, mute, hide, reactions, poll vote |
| Group chats | group.service | create, update, delete, addMembers, removeMember, setAdmin, leave |
| Notifications | notification.service | list, markRead, markAllRead |
| Explore / search | explore.service | getTrendingHashtags, search (users/hashtags/posts), suggestHashtags; search respects searchVisibility |
| Commerce (shop, products, orders, cart, wishlist, reviews, settlements) | commerce.service | shop, dashboard, shop-settings, custom-domain, collections, wishlist, cart, checkout, products, orders, returns, reviews, product-tag click, settlements |
| Business (team, promotions, verification) | promotion.service, verification.service | promotions CRUD + events; team (business.routes); verification request (business + verification.service) |
| Analytics | analytics.service | recordEvent (profile_visit, link_click, action_button_click), getBusinessInsights (reach, engagement, profile visits, website/action/productTag clicks, trend, follower growth, top posts, demographics), export |
| Safety / SOS | safety.service | SOS trigger (safety.routes POST /sos) |
| Streaks | streak.service | check-in, list, types, share-preview |
| Voice | voice.service | command (voice.routes POST /command) |
| Config / DRM | config.routes | GET /drm (screenshotBlockEnabled, watermarkMediaUrlPrefix) |
| Location / nearby | location.service | updateLocation, getPreferences, setNearbyEnabled, getNearby (daily limit per schema: nearbyQueryCountToday, nearbyQueryResetAt) |
| Archive / highlights | archive.service, highlight.service | runArchiveJob, getArchive; highlight CRUD + items |
| Drafts | draft.service | (draft CRUD) |
| Reports | report.service | create (account, post, comment), createProblemReport; schema also has reportedReviewId, reportedAnonymousPostId — **review/anonymous report not in service** |
| Emergency contacts | emergencyContact.service | (emergency contacts CRUD) |
| Close friends / Favorites | closeFriend.service, follow.service | close friends list; follow with isFavorite, removeFollower |

---

## 3. Prisma Schema: Model Checklist

| Model | Status | Notes |
|-------|--------|-------|
| Account | ✅ | businessCategory, businessHours, contactEmail/Phone/Address, actionButtons, quietMode*, customDomain*, shopBannerUrl, featuredProductIds, pan, gstin, bankDetails, sellerTermsAcceptedAt, searchVisibility, showActivityStatus, storageBytesUsed, hideProfileVisits, anonymousStoryViews*, defaultStoryAllowReplies/Reshares, nearbyEnabled, nearbyQueryCountToday |
| Post | ✅ | media, caption, altText, privacy, allowComments, hideLikeCount, screenshotProtection, isCarousel, isScheduled, isMature, ProductTag |
| Story | ✅ | allowReplies, allowReshares, stickers, music, poll/reminder/question/emoji, addYours, ProductTag |
| Reel | ✅ | video, thumbnail, audio, music, privacy, ProductTag |
| Live | ✅ | scheduledFor, startedAt, endedAt, status, recording, LiveProduct (pin, discount) |
| Message | ✅ | messageType (TEXT, VOICE, IMAGE, VIDEO, GIF, STICKER, POLL), media, isVanish, groupId, replyToId |
| MessageRecipient | ✅ | isRead, deliveredAt, mutedUntil |
| ConversationLabel | ✅ | accountId, peerId, label |
| PinnedChat, ConversationMute | ✅ | |
| Group, GroupMember, GroupAdmin | ✅ | |
| Cart, CartItem | ✅ | multi-seller (cart per account) |
| Order, OrderItem | ✅ | returnStatus, returnLabelUrl, returnTrackingNumber, returnReceivedAt, refundedAt, guestEmail/guestName |
| Payout | ✅ | periodStart/End, totalSales, commissionPct/Amt, feesAmt, returnDeductions, netAmount |
| Review | ✅ | rating, text, media, replyText, repliedAt |
| Product, ProductVariant, ProductTag | ✅ | ProductTagClick in schema |
| ProductCollection, ProductCollectionItem | ✅ | |
| ProductWishlist | ✅ | |
| Promotion, PromotionEvent | ✅ | objective, budgetCents, budgetType, targeting |
| Streak | ✅ | type, currentCount, longestCount, lastCheckIn |
| Follow, FollowRequest | ✅ | isCloseFriend, isFavorite |
| Block, Mute, Restrict | ✅ | Block has blockFutureAccounts, expiresAt; Mute has mutePosts, muteStories |
| HideStoryFrom | ✅ | |
| LimitInteractionSetting | ✅ | commentsFrom, dmsFrom, duration, expiresAt |
| VerificationRequest | ✅ | |
| BusinessMember, BusinessTeamActivity | ✅ | role (OWNER, ADMIN, MEMBER, VIEWER) |
| BusinessQuickReply | ✅ | |
| Link | ✅ | multiple links (linkCategory, order) |
| Archive / ArchivedStory, Highlight, HighlightItem | ✅ | |
| Draft | ✅ | type POST/STORY/REEL, content, media, expiresAt |
| AnalyticsEvent | ✅ | |
| EmergencyContact | ✅ | |
| ProximityAlert | ✅ | |
| PremiumMessageGrant, PremiumBlockedMessage | ✅ | (message blocked user – Star tier) |
| LifestyleStrike | ✅ | |
| ProfileView | ✅ | isAnonymous |
| ScreenshotLog | ✅ | (DRM/screenshot alert) |
| SupportTicket, SupportTicketReply | ✅ | isPriority (Star) |
| Job (Track, Know, Flow) | ✅ | JobPosting, Pipeline, JobApplication, Company, CompanyReview, SalaryEntry, FlowBoard, FlowColumn, FlowCard |

---

## 4. Frontend: Main Pages and Feature Coverage

| Area | Pages | Feature coverage |
|------|--------|-------------------|
| Auth | Login, Register, PhoneVerification, VerifyEmail, ForgotPassword, RegisterLanding, RegisterPersonalForm, RegisterBusinessForm, RegisterCreatorForm, RegisterJobForm, Splash | Phone OTP signup/login; email verify; multi-account-type registration |
| Home | Home | Feed |
| Profile | Profile, EditProfile, EditProfilePersonalFields, EditProfileBusinessFields, EditProfileCreatorFields, EditProfileJobFields, PersonalProfile, HighlightViewer, HighlightEdit, HighlightManage, NewHighlight | Profile view/edit, highlights |
| Create | CreatePost, CreateStory, CreateReel | Post, story, reel creation |
| Commerce | Commerce, Shop, CommerceCart, Checkout, CommerceCollections, CommerceWishlist, CommerceShopSettings, CommerceSettlements, CommerceReviews, SellerHelpCenter, CommerceOrders, CommerceMyOrders, CommerceProductNew, CommerceProducts, OrderDetail | Shop, cart, checkout, orders, products, collections, wishlist, settlements, reviews, help center |
| Business | BusinessProfile, BusinessVerification, BusinessTeam, BusinessInsights, BusinessPromotions, BusinessTools, BusinessLocal, BusinessCalendar, BusinessQuickReplies, BusinessScheduling, ConvertToBusiness | Verification, team, insights, promotions, quick replies, scheduling, convert to business |
| Settings | Settings, PrivacySettings, QuietMode, BlockedAccounts, MutedAccounts, RestrictedAccounts, CloseFriends, CloseFriendsAdd, FollowRequests, HideStoryFrom, LimitInteractions, EmergencyContacts, SafetySOS, ProximityAlerts, EmailSettings, ProfileVisitors, PrioritySupport, SubscriptionTiers, PremiumFeatures, AccessibilitySettings, ReportProblem, SwitchAccount, StubSetting | Privacy, quiet mode, block/mute/restrict, close friends, follow requests, story hide-from, limits, SOS, proximity, profile visitors, priority support, subscriptions |
| Explore | Explore, ExploreSearch | Explore, search |
| Messages | Messages, NewMessage, CreateGroup | Threads, new message, group create |
| Notifications | Notifications | List, read |
| Archive / Saved | Archive, Saved, Drafts | Archive, saved posts, drafts |
| Live | Live | Live viewing/creation |
| Map / Location | Map, Nearby | Map stub; nearby |
| Streaks | Streaks | Lifestyle streaks |
| Anonymous | AnonymousSpaces, AnonymousSpaceFeed | Anonymous spaces |
| Analytics | Analytics | Insights/analytics |
| Admin | Admin, AdminPlatform, AdminReports, AdminUsers, AdminModeration | Admin tools |
| Job | Job, JobHome, Track, Know, Flow, JobKanban, JobProfile, TrackApplicationDetail, JobWellness | Track, Know, Flow |
| Creator | CreatorProfile, CreatorSubscribers, CreatorEarnings, SubscriberContent | Creator tier |
| Story (extra) | StoryQuestions, AddYoursResponses, StoryAddYoursResponses | Story Q&A, Add Yours |

---

## 5. Frontend: Workflows / API Wrappers

| Workflow | File | Purpose |
|----------|------|---------|
| Auth | (none as dedicated workflow) | Auth uses api.ts (apiGet, apiPost) from pages (e.g. PhoneVerification, Login) |
| Account | (no accountWorkflow.ts) | Account APIs called from pages/settings (EditProfile, SwitchAccount, etc.) |
| Feed | feedWorkflow.ts | Feed, favorites feed, profile reels |
| Post | createPostWorkflow.ts, contentWorkflow, commentsWorkflow, shareWorkflow | Create post, comments, share |
| Story | storyWorkflow.ts | Story APIs |
| Reel | reelWorkflow.ts | Reel APIs |
| Messages | messageWorkflow.ts | Threads, send, labels, pin, mute, reactions, poll |
| Commerce | commerceWorkflow.ts | Shop, cart, checkout, orders, products, wishlist, collections, settlements, reviews, etc. |
| Business | (no businessWorkflow.ts) | Business APIs used from business pages (e.g. BusinessPromotions, BusinessTeam) |
| Analytics | analyticsWorkflow.ts | Insights, record event |
| Privacy | privacyWorkflow.ts | Block, mute, restrict, hide-story-from, limit-interactions |
| Follow | followWorkflow.ts | Follow, unfollow, requests, favorites |
| Notifications | notificationWorkflow.ts | List, mark read |
| Explore | exploreWorkflow.ts | Search, trending, hashtags |
| Highlights / Collections | highlightWorkflow.ts, collectionsWorkflow.ts | Highlights, saved/collections |
| Archive | archiveWorkflow.ts | Archive |
| Drafts | draftsWorkflow.ts | Drafts |
| Groups | groupWorkflow.ts | Groups |
| Safety / SOS | safetyWorkflow.ts | SOS |
| Streaks | streakWorkflow.ts | Streaks |
| Location / Proximity | locationWorkflow.ts, proximityWorkflow.ts | Location, nearby, proximity alerts |
| Reports | reportWorkflow.ts | Report |
| Close friends | closeFriendsWorkflow.ts | Close friends |
| Premium blocked message | premiumBlockedMessageWorkflow.ts | Premium message blocked user |
| Anonymous | anonymousSpaceWorkflow.ts | Anonymous spaces |
| Live | liveWorkflow.ts | Live |

**Gaps:** No dedicated `authWorkflow.ts` or `accountWorkflow.ts`; auth/account calls are inline or via api.ts.

---

## 6. Cross-Reference with Doc Sections

### Volume 1 (Basic)

| Section/Component | Status | Evidence / Gaps |
|-------------------|--------|------------------|
| Account creation (phone) | Implemented | auth.routes: POST /send-verification-code, POST /verify-code; phoneVerification.service |
| Account creation (email) | Partial | Email verification link (GET /verify-email); no email-based signup flow (only add/verify email on account) |
| Account creation (username, display name, DOB, profile photo, bio, link, pronouns) | Implemented | verify-code accepts username, displayName, dateOfBirth; account.service createAccount (bio, profilePhoto, pronouns, website, links) |
| Privacy: public/private, follow requests, remove follower, search visibility, activity status | Implemented | Account.isPrivate, searchVisibility, showActivityStatus; follow.routes (requests approve/decline, DELETE /followers/:followerId); account.service updateAccount; explore.service respects searchVisibility |
| Story privacy: hide from, replies, reshare, archive | Implemented | privacy.routes hide-story-from; Story.allowReplies, allowReshares; ArchivedStory, archive.service |
| Post/story creation | Implemented | post.routes, story.routes; post.service, story.service |
| Stickers: poll, questions, emoji slider, countdown, add yours, music, GIF, link, donation | Partial | Story has stickers JSON, poll/question/emoji/remind/add-yours in story.routes; donation sticker not found |
| Highlights | Implemented | highlight.routes + highlight.service; Highlight, HighlightItem |
| Like / comment / share | Implemented | post.routes (like, comments, share); story/reel like; message share-post |
| Save / collections | Implemented | post save/unsave with collectionId; collection.routes, collection.service |
| DMs: send, requests, voice, media, GIF, reactions | Implemented | message.service messageType TEXT/VOICE/IMAGE/VIDEO/GIF/STICKER/POLL; reactions; no explicit “message requests” inbox route (threads list covers) |
| Delete / mute / pin (conversation) | Implemented | message.routes delete, mute/:userId, pin/:userId; ConversationMute, PinnedChat |
| Group chats: create, poll, admin, leave | Implemented | group.routes create, members, role, leave; Message with groupId, PollVote |
| Block / restrict / mute / report / hidden words | Partial | block, restrict, mute, report (account, post, comment) implemented; **hidden words** (comment filter) **not found** in schema or services |
| Notifications | Implemented | notification.routes + notification.service |
| Quiet mode | Implemented | Account.quietModeEnabled/Start/End/Days; account update; settings/QuietMode.tsx |

### Volume 2 (Personal)

| Section/Component | Status | Evidence / Gaps |
|-------------------|--------|------------------|
| Close friends | Implemented | closeFriend.routes, closeFriend.service; CloseFriend model |
| Favorites | Implemented | Follow.isFavorite; follow.routes GET /favorites, PATCH /:accountId/favorite; feed/favorites |
| Archive | Implemented | archive.routes, archive.service; ArchivedStory; posts /archived, /deleted |
| Star tier (ad-free, profile visitors, anonymous story, download protection, screenshot alert, voice commands, priority support, message blocked user) | Partial | Schema: hideProfileVisits, anonymousStoryViews, screenshotProtection (post/story), SupportTicket.isPriority; PremiumMessageGrant/Blocked; config/drm; voice.routes. **Ad-free** not explicitly found. **Download protection** in schema (screenshotProtection); DRM config. Full Star feature set not fully audited in one place. |
| Profile visitors | Implemented | account.routes GET /me/profile-visitors; ProfileView; ProfileVisitors.tsx |
| Priority support | Implemented | SupportTicket.isPriority; support.routes; PrioritySupport.tsx |

### Volume 3 (Business)

| Section/Component | Status | Evidence / Gaps |
|-------------------|--------|------------------|
| Switch to business / category / contact / hours / multiple links / action buttons | Implemented | account.service business fields; ConvertToBusiness.tsx; Link[]; actionButtons JSON |
| Verification (PAN/GSTIN/bank, blue badge) | Implemented | Account.pan, gstin, bankDetails, verifiedBadge; business.routes /verification, /verification/request; VerificationRequest; BusinessVerification.tsx |
| Reviews: collect, aggregate, respond, report | Implemented | commerce.routes reviews, respond, report; review.service; Review model |
| Analytics: overview, content performance, demographics, follower growth, link tracking, action button tracking | Implemented | analytics.service getBusinessInsights (reach, engagement, profile visits, website/action/productTag clicks, trend, follower growth, top posts, demographics); recordEvent; analytics.routes |
| Promotions: campaign, audience, budget, creative, boost, ad analytics | Implemented | business.routes promotions CRUD, performance, record-event; promotion.service; Promotion, PromotionEvent |
| Product tagging (post/reel/story, track clicks) | Implemented | ProductTag on Post/Story/Reel; commerce.routes POST /product-tag/click; ProductTagClick model |
| Shop setup (collections, banner, featured) | Implemented | Account.shopBannerUrl, featuredProductIds; commerce collections; ProductCollection |
| MOxE website (username.moxe.store, custom domain) | Partial | customDomain, customDomainVerifiedAt; commerce.routes POST /custom-domain/verify; **username.moxe.store** not found in code (deferred or external) |
| In-app checkout (payment, coupon, address, confirmation) | Partial | Order.shippingAddress, guest checkout; **coupon** not found in schema or commerce routes |
| Seller verification benefits | Implemented | Verification flow; seller terms acceptance |
| Order management (process, status, tracking) | Implemented | commerce.routes orders PATCH, tracking; Order.trackingNumber, status |
| Returns (seller pays, prepaid label, approve, receive, refund) | Implemented | Order return fields; commerce.routes return/approve/tracking/received/refund |
| Settlements (7-day, commission, report) | Implemented | Payout model; commerce.routes GET /settlements; settlement.service |
| Dashboard (sales, top products) | Implemented | commerce.routes GET /dashboard; analytics top posts / metrics |
| Performance (fulfillment rate, response rate, return rate, benchmark) | Partial | Analytics and dashboard exist; **fulfillment/response/return rate metrics** not explicitly found in analytics.service |
| Logistics / return shipping responsibility / seller acknowledgment | Implemented | sellerTermsAcceptedAt; return flow (seller-provided label, etc.) |
| Buyer: browse, cart, guest checkout, wishlist, multi-seller | Implemented | Shop, cart, optionalAuthenticate on orders, wishlist, Cart per account (multi-seller) |
| Seller help center (FAQs, contact, community) | Partial | SellerHelpCenter.tsx; support tickets; **FAQs/community** not found as dedicated APIs |

### Volume 4

| Section/Component | Status | Evidence / Gaps |
|-------------------|--------|------------------|
| Nearby (radius, daily limit, billing) | Partial | location.routes GET /nearby; Account.nearbyEnabled, nearbyQueryCountToday, nearbyQueryResetAt; **billing for nearby** not found |
| SOS (trigger, location, alert contacts) | Implemented | safety.routes POST /sos; safety.service; EmergencyContact; SafetySOS.tsx |
| Real-time translation | Deferred / Not found | No translation service or routes |
| DRM (screenshot block, watermark) | Implemented | config.routes GET /drm; content.routes POST /screenshot-detected; ScreenshotLog |
| Proximity alert | Implemented | proximity.routes; proximity.service; ProximityAlert; ProximityAlerts.tsx |
| Voice commands (advanced) | Partial | voice.routes POST /command; voice.service; no “advanced” spec in code |
| Lifestyle streaks (create, log, share) | Implemented | streak.routes check-in, list, types, share-preview; Streak model; Streaks.tsx |
| Live shopping (schedule, products, tray, pin, discount, track sales, replay) | Partial | live.routes create (schedule), products, pin, discount, sales; Live.recording. **Live start/end** (status transition SCHEDULED→LIVE→ENDED) **no route**; **replay** (serve recording) **no dedicated route** |

---

## 7. Gaps Summary

- **Hidden words:** No model or API for comment filter / hidden words.
- **Email-based signup:** Only phone OTP signup; email is verification/add-on, not primary signup.
- **Dedicated auth/account workflows (frontend):** No authWorkflow.ts or accountWorkflow.ts; usage is ad-hoc.
- **Live start/end and replay:** No PATCH or POST to start/end live or to fetch replay by recording URL.
- **Report review/anonymous post:** Schema has reportedReviewId, reportedAnonymousPostId; report.service create() only handles account, post, comment.
- **Coupon:** No coupon/discount code in Order or commerce routes.
- **username.moxe.store:** Not referenced in codebase (likely external or deferred).
- **Fulfillment/response/return rate metrics:** Not explicitly in analytics.service.
- **Real-time translation:** Not implemented (deferred).
- **Map:** map.routes is a stub (GET / only).
- **User routes:** user.routes is a stub.

---

## 8. Overall Coverage and Next Steps

**Overall:** The codebase implements most of the Business Account doc: auth (phone + profile), account and business fields, privacy, content (post/story/reel), messaging and groups, commerce (shop, cart, orders, returns, settlements, reviews), business (team, promotions, verification), analytics (insights, link/action/product tag tracking), safety (SOS), streaks, DRM config, location/nearby, and live shopping (without live start/end/replay APIs). Frontend pages and workflows align with these areas; auth/account have no dedicated workflow files.

**Recommended next steps:**

1. **Backend:** Add live **start/end** (e.g. PATCH `/api/live/:id` for status/startedAt/endedAt) and **replay** (e.g. GET live by id when status=ENDED and return recording URL or dedicated replay endpoint).
2. **Backend:** Implement **hidden words** (model + privacy/safety service + route to add/remove words and filter comments).
3. **Backend:** Extend **report.service** to support type `review` and `anonymousPost` using reportedReviewId and reportedAnonymousPostId.
4. **Backend:** Add **coupon** support (model + apply in checkout) if required by product.
5. **Frontend:** Add **authWorkflow.ts** and **accountWorkflow.ts** for consistent API usage and reuse.
6. **Product:** Confirm **username.moxe.store** and **billing for nearby** are handled elsewhere or backlog; implement **real-time translation** if not deferred.

---

*Audit completed against BACKEND/src and FRONTEND/src. Evidence is route paths, service methods, and Prisma schema.*
