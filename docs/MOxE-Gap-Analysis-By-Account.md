# MOxE Gap Analysis: By Account Type and Area

Comparison of the **current MOxE codebase** to the full functional specs. For each area: **Implemented** | **Partial** | **Missing**.

**Legend**
- **Implemented** – Backend + frontend wired; behavior matches spec.
- **Partial** – Some parts done (e.g. backend only, or one flow); rest missing or stubbed.
- **Missing** – Not present or stub only.

---

## Shared / Basic (All Account Types)

Features that apply to every account (creation, profile, privacy, content, engagement, DMs, safety, platform).

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account creation** | Phone verification (send code, verify, register) | ✅ Implemented | `phoneVerification.service`; `PhoneVerification.tsx` (code, password, username, displayName, DOB). |
| | Email signup / verify email | ⚠️ Partial | Backend `/verify-email`; no full register-with-email parity. |
| | Google OAuth | ✅ Implemented | `/auth/google/url`, `/auth/google/callback`; `AuthCallback.tsx`. |
| | Username, display name, DOB, profile photo | ✅ Implemented | Onboarding, EditProfile; PATCH `accounts/me`; DOB/contact pages. |
| **Profile** | Bio, pronouns, link in bio, multiple links | ✅ Implemented | EditProfile, Onboarding; links page; `maxLinks` by account type. |
| | Profile photo upload in EditProfile | ⚠️ Partial | Photo displayed; in-form upload flow may be via settings. |
| **Privacy** | Public/private account | ✅ Implemented | `AccountPrivacy`; `isPrivate`; PATCH me. |
| | Follow requests (inbox, approve/decline) | ✅ Implemented | `follow.routes`; `FollowRequests.tsx`; link from Privacy. |
| | Remove followers | ✅ Implemented | `removeFollower`; DELETE `/follow/followers/:followerId`; `Followers.tsx`; link from Privacy. |
| | Profile visibility in search | ✅ Implemented | `searchVisibility` (EVERYONE/FOLLOWERS_ONLY/NO_ONE); `PrivacySettings`; explore filters. |
| | Activity status | ✅ Implemented | `showActivityStatus`, `lastActiveAt`; Privacy UI; auth middleware updates `lastActiveAt`. |
| | Story privacy (hide from, reply controls, reshare) | ⚠️ Partial | HideStoryFrom, StoryReplySettings; backend; reply enums may be incomplete. |
| **Content – Posts** | Create post (media, caption, carousel) | ✅ Implemented | NewPostPage → PostEditPage → PostSharePage; POST `/posts`; multi-select up to 10. |
| | Alt text, location, advanced (comments off, hide like) | ✅ Implemented | PostSharePage: alt text, location field, More options (allowComments, hideLikeCount); sent in body. |
| | Schedule post | ✅ Implemented | `canSchedulePosts`; CreatePost schedule; `scheduling.service` cron. |
| **Content – Stories** | Create story (camera/upload, text, stickers) | ✅ Implemented | `CreateStory.tsx`; poll, questions, countdown, link, donation, emoji_slider; alt text. |
| | Music / GIF stickers | ⚠️ Partial | StoryMusicPage, sticker search; story GIF flow not explicit. |
| **Content – Reels** | Create reel (video, caption, audio) | ✅ Implemented | Reel create flow; reel.service. |
| **Content – Highlights** | Create from story, manage, cover | ✅ Implemented | highlight.routes; ManageHighlights, EditHighlightPage, HighlightViewer. |
| **Engagement** | Like post / story | ✅ Implemented | Like APIs; FeedPost, StoryViewer. |
| | Comments (post/reel/story/live) | ✅ Implemented | Comments API; CommentThread, PostDetail; hidden/approve. |
| | Share to DM / share to story | ✅ Implemented / ⚠️ Partial | Share to DM; share-to-story uses CreateStory + hint. |
| **Save & collections** | Save post, choose collection | ✅ Implemented | POST/DELETE save (optional collectionId); FeedPost “Save” opens collection picker. |
| | Create/edit/delete/share collection | ✅ Implemented | collection.routes; SavedCollections, SharedCollection. |
| **DMs** | Send message (text, media, voice, GIF) | ✅ Implemented | message.routes; Messages.tsx (Record voice, GIF, media); VOICE type + playback. |
| | Message requests, reactions, delete, mute, pin | ✅ Implemented | messageRequests; reactions; pin/mute in message.routes; UI in Messages. |
| | View once, group chats | ✅ Implemented | isVanish, mediaExpiration; group.routes; CreateGroup; setAdmin, leave. |
| | Group polls | ⚠️ Partial | Backend POLL type, POST poll/vote; create/vote UI partial. |
| **Safety** | Block (permanent + temporary) | ✅ Implemented | privacy.service (expiresAt, durationDays); SafetyCenter; BlockedList. |
| | Restrict, mute, report, hidden words, limit interactions | ✅ Implemented | privacy.routes; RestrictedList, MutedList; report.routes; HiddenWordsSettings; limitInteraction. |
| **Notifications** | Quiet mode | ✅ Implemented | QuietModeSettings (enable, start/end, days); PATCH me; link from Notifications. |
| **Platform** | Nearby, SOS, Proximity, Anonymous Spaces, Streaks, View once | ✅ Implemented | location, safety, proximity, anonymousSpace, streak routes; corresponding pages. |

---

## Personal Account (FREE & STAR)

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Capabilities** | FREE: feed, post, story, reels, DMs, explore, 1 link; no scheduling | ✅ Implemented | capabilities.ts PERSONAL + FREE. |
| | STAR: scheduling, insights, close friends, collections, 5 links | ✅ Implemented | PERSONAL + STAR. |
| **Close Friends** | List, add, remove | ✅ Implemented | closeFriend.routes; CloseFriendsList, CloseFriendsAdd. |
| **Favorites** | Favorites feed | ✅ Implemented | GET `/posts/feed/favorites`; FavoritesFeed.tsx; link from Privacy. |
| **Archive** | Archive posts; recently deleted | ✅ Implemented | archive.routes; Archive.tsx. |
| | Archive stories | ⚠️ Partial | Archive API; stories section in archive UI may be partial. |
| **Star tier** | Ad-free, profile visitors, anonymous story viewing | ⚠️ Partial | Schema (hideProfileVisits, etc.); not fully wired in feed/ads. |

---

## Business Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account** | Switch to Business | ✅ Implemented | AccountSettings “Switch to Business”; PATCH accountType. |
| | Category, contact (email, phone, address), business hours | ✅ Implemented | AccountSettings Business section; schema; PATCH; “Account type & profile” in Accounts Centre. |
| | Action buttons, multiple links (5) | ✅ Implemented | account.service; action buttons in AccountSettings. |
| | Verification (PAN, GSTIN, bank); Blue Badge | ✅ Implemented | Verification flow; verifiedBadge on profile/feed. |
| **Commerce** | Shop (catalog, collections, banner, featured) | ✅ Implemented | commerce.routes; Commerce.tsx; shop by username. |
| | Product tagging (post, reel, story; max 5) | ✅ Implemented | PostSharePage product tag picker (Business); productTags in POST; ProductTag, ProductTagClick. |
| | Cart, checkout (guest, coupon) | ✅ Implemented | commerce cart, checkout; SellerCoupon; guest checkout. |
| | Orders, returns, settlements, reviews | ✅ Implemented | orders CRUD; returns; settlements; review.service; HelpOrdersPage. |
| **Analytics** | Overview, content, demographics, follower growth, export | ✅ Implemented | analytics.service getBusinessInsights; BusinessInsights; productTagClicks, etc. |
| **Promotions** | Boost, scheduled posts, calendar | ✅ Implemented | Boost flow; scheduling.service; BusinessScheduling, BusinessCalendar. |
| **Live Shopping** | Schedule live, add products, pin, discount | ✅ Implemented | live.routes; LiveProduct; checkout liveId. |
| | Live replay with product tags | ⚠️ Partial | Replay has sidebar products; in-video overlay not implemented. |
| **Other** | Seller verification, help center, team, quick replies | ✅ Implemented | Verification; Business dashboard; SavedRepliesPage. |
| | Custom domain | ⚠️ Partial | commerce custom-domain/verify; verify may be stub. |

---

## Creator Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Capabilities** | FREE: live, schedule, basic analytics, 5 links | ✅ Implemented | CREATOR + FREE in capabilities. |
| | THICK: subscriptions, badges, gifts, full analytics, Blue Badge | ✅ Implemented | CREATOR + THICK; canSubscriptions, canBadgesGifts. |
| **Subscriptions** | Tiers, create tier, subscribe, list | ✅ Implemented | creatorSubscription.service; CreatorSubscriptionTiers; creator.routes. |
| **Badges & Gifts** | Badge display; send/receive gifts | ⚠️ Partial | Schema, capabilities; GiftsPage; full transaction UI partial. |
| **Branded content** | Status, disclosure; approve/decline | ⚠️ Partial | creatorTools.service; InsightsBrandedContentPage, BrandedContentStatusPage; approval flows partial. |
| **Insights** | Content, followers, interaction, branded, earnings | ✅ Implemented | InsightsHub; InsightsContentPage, Followers, Interaction, ApproximateEarnings, MonetisationStatus. |
| **Content tools** | Best practices, calendar, scheduling | ✅ Implemented | CreatorStudio; scheduling; content calendar. |
| **Payouts** | Setup, history, payouts page | ✅ Implemented | PayoutsPage; setup payout; commerce settlements. |
| **Creator-specific** | Exclusive content, early access, BTS | ⚠️ Partial | isSubscriberOnly on content; full gating UX partial. |
| | Live gifting, subscriber-only live | ⚠️ Partial | Backend support; full live gifting/subscriber live UI partial. |

---

## Job Account

| Area | Item | Status | Notes |
|------|------|--------|--------|
| **Account** | Job account; dual profile; Purple Badge | ✅ Implemented | JOB type; canDualProfile; verification. |
| | Professional profile fields (headline, section, skills) | ✅ Implemented | Schema professionalHeadline, professionalSection, skills; Job hub. |
| **Capabilities** | Track, Know, Flow, Work, job feed, networking | ✅ Implemented | capabilities.ts JOB; ProtectedRoute requiredType="JOB". |
| **TRACK** | Applications, pipeline, stages | ✅ Implemented | job/track.service; track.routes; Job hub Track. |
| **Recruiter** | Postings, candidates, offers | ✅ Implemented | track-recruiter.service; Job hub Recruiter. |
| **WORK / KNOW / CODE / STATUS / FLOW** | Tasks, companies, repos, status pages, boards | ✅ Implemented | work, know, code, status, flow services; Job hub pages. |
| **Other tools** | Compass, Build, Atlas, Access, Alert, Video, Chat, Ai, Strategy, etc. | ✅ Implemented | Corresponding services and Job hub pages; depth varies. |
| **Dual profile** | Toggle personal vs professional | ⚠️ Partial | canDualProfile; full dual-profile UI (separate feeds/connections) may be partial. |
| **Job search / applications** | Search jobs, apply, track applications | ⚠️ Partial | TRACK has applications; full job-search and apply flows may be partial. |
| **Company pages** | Create company page, post jobs | ⚠️ Partial | KNOW has companies; full company page CRUD may be partial. |

---

## Summary by Status

### ✅ Implemented (by account)

| Account | Implemented areas |
|---------|-------------------|
| **Shared** | Auth (phone, Google), profile (bio, pronouns, links), privacy (public/private, follow requests, remove followers, search visibility, activity status), post/reel/story create (incl. alt text, location, advanced options), highlights, engagement, save + collection picker, DMs (text/media/voice/GIF, reactions, mute, pin, view once, groups), safety (block, temporary block, restrict, mute, report, hidden words, limit interactions), quiet mode, platform (Nearby, SOS, Proximity, Anonymous Spaces, Streaks). |
| **Personal** | FREE/STAR capabilities, Close Friends, Favorites feed, Archive (posts, recently deleted). |
| **Business** | Switch to Business, category, contact, hours, action buttons, verification, shop, product tagging in create, cart/checkout/orders/returns/settlements/reviews, analytics, boost, scheduling, Live Shopping (add products, pin, discount), seller verification, help center, quick replies. |
| **Creator** | FREE/THICK capabilities, subscription tiers, insights, content tools, payouts. |
| **Job** | Job type, capabilities, TRACK, Recruiter, WORK, KNOW, CODE, STATUS, FLOW, and other hub tools; professional profile fields. |

### ⚠️ Partial (by account)

| Account | Partial areas |
|---------|----------------|
| **Shared** | Email signup parity; profile photo upload in EditProfile; story privacy (reply controls); story music/GIF stickers; share to story; group polls create/vote UI. |
| **Personal** | Archive stories; Star ad-free, profile visitors, anonymous story viewing. |
| **Business** | Live replay with product tags overlay; custom domain verify. |
| **Creator** | Badges/gifts full UI; branded content approve/decline; exclusive content / early access / BTS; live gifting, subscriber-only live. |
| **Job** | Dual profile (separate feeds/connections); job search and apply; company pages. |

### ❌ Missing (major gaps)

- **Shared:** Full register-with-email flow; optional profile photo upload in EditProfile.
- **Personal:** Star-tier ad-free and profile visitors wired end-to-end.
- **Business:** Replay page with product overlay on video.
- **Creator:** End-to-end badge/gift transactions; full branded content approval; full exclusive/subscriber-only content and live.
- **Job:** Full dual-profile UX (separate feeds/connections); full job search and application flows; full company page management.
- **Innovative (all):** Real-time translation; screenshot protection; full voice commands.

---

*Gap analysis by account type and area. See also `MOxE-Gap-Analysis.md` and `GAP-ANALYSIS-IMPLEMENTATION-STATUS.md`.*
