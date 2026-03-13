# MOxE — Overall Features, Functions and Components Implemented

This document lists **each and every feature, component and function** implemented in MOxE (frontend and backend) as of the current codebase.

---

## Table of Contents

0. [Features (Overview)](#0-features-overview)
1. [Frontend — Pages](#1-frontend--pages)
2. [Frontend — Components](#2-frontend--components)
3. [Frontend — Hooks](#3-frontend--hooks)
4. [Frontend — Store & State](#4-frontend--store--state)
5. [Frontend — Constants & Types](#5-frontend--constants--types)
6. [Frontend — Services & Workflows](#6-frontend--services--workflows)
7. [Frontend — Routes (App.tsx)](#7-frontend--routes-apptsx)
8. [Backend — API Routes](#8-backend--api-routes)
9. [Backend — Services (Business Logic)](#9-backend--services-business-logic)
10. [Backend — Middleware & Utils](#10-backend--middleware--utils)

---

## 0. Features (Overview)

High-level **features** implemented in MOxE, with the main **components** and **functions** that power them.

| # | Feature | Description | Main components / functions |
|---|---------|-------------|----------------------------|
| 1 | **Authentication** | Login, register, phone verify, forgot password | Splash, Login, Register, RegisterLanding, Register*Form, PhoneVerification, ForgotPassword; auth.routes (stub) |
| 2 | **Multi-account & account types** | Personal, Business, Creator, Job; switch/add; convert to Business | Profile (type-specific), EditProfile + Edit*Fields, SwitchAccount, ConvertToBusiness; account.routes, AccountService (getAccountById, getAccountByUsername, listAccountsByUser, createAccount, updateAccount) |
| 3 | **Profiles (by type)** | Personal, Creator, Business, Job profile UIs | PersonalProfile, CreatorProfile, BusinessProfile, JobProfile; Profile (router) |
| 4 | **Edit profile** | Type-specific edit forms (bio, links, business hours, action buttons, etc.) | EditProfile, EditProfilePersonalFields, EditProfileBusinessFields, EditProfileCreatorFields, EditProfileJobFields; PATCH /accounts/:id |
| 5 | **Feed & content** | Main feed, favorites feed, posts by account | Home, PostCard; post.routes (feed, feed/favorites, list by account), FeedService, PostService |
| 6 | **Posts** | Create, like, comment, save, archive, delete, restore | CreatePost; post.routes (create, like, comments, save, archive, delete, restore), PostService |
| 7 | **Stories** | Create, list for feed | CreateStory, StoryTray, StoryViewer; story.routes, StoryService |
| 8 | **Reels** | Create, list, list by account | CreateReel; reel.routes, ReelService |
| 9 | **Live** | Create, list, get live | Live; live.routes, LiveService |
| 10 | **Messages (DMs)** | Threads, send, read, delete, reactions, pin | Messages, NewMessage; message.routes, MessageService |
| 11 | **Notifications** | List, mark read, read all | Notifications; notification.routes, NotificationService |
| 12 | **Explore & search** | Trending, search (users/hashtags) | Explore, ExploreSearch; explore.routes, ExploreService |
| 13 | **Follow & privacy** | Follow, unfollow, requests, block, mute, restrict, hide story, limit interactions | PrivacySettings, BlockedAccounts, MutedAccounts, RestrictedAccounts, FollowRequests, HideStoryFrom, LimitInteractions; follow.routes, privacy.routes, FollowService, PrivacyService |
| 14 | **Close friends** | List, add, remove | CloseFriends, CloseFriendsAdd; closeFriend.routes, CloseFriendService |
| 15 | **Saved & collections** | Saved posts, collections CRUD | Saved; collection.routes, CollectionService |
| 16 | **Drafts** | List, get, create, update, delete drafts | Drafts; draft.routes, DraftService |
| 17 | **Archive** | Archived posts | Archive; post archive endpoints |
| 18 | **Safety & support** | SOS, emergency contacts, report problem | SafetySOS, EmergencyContacts, ReportProblem; emergencyContact.routes, report.routes |
| 19 | **Settings & subscription** | Settings menu, subscription tiers, premium, accessibility, help, about | Settings, SubscriptionTiers, PremiumFeatures, AccessibilitySettings, StubSetting |
| 20 | **Business account core** | Business profile, hours, links, action buttons, category, contact | BusinessProfile, EditProfileBusinessFields; account update (businessHours, actionButtons, links) |
| 21 | **Business — Insights** | Reach, engagement, profile visits, website clicks, trend, top content, demographics, CSV export | BusinessInsights; analytics.routes (insights, insights/export), AnalyticsService |
| 22 | **Business — Promotions** | Campaigns: create, edit, objective, budget, post/reel, status (DRAFT/ACTIVE/PAUSED/ENDED) | BusinessPromotions; business.routes (promotions CRUD), PromotionService |
| 23 | **Business — Team** | Members, invite by username, roles, remove | BusinessTeam; business.routes (team, team/invite, PATCH/DELETE team/:id) |
| 24 | **Business — Scheduling** | List scheduled posts/reels, calendar link | BusinessScheduling; business.routes (scheduled, calendar) |
| 25 | **Business — Verification** | Request verification, view status | BusinessVerification; business.routes (verification, verification/request) |
| 26 | **Business — Quick replies** | Saved replies (shortcut + message) for inbox | BusinessQuickReplies; business.routes (quick-replies CRUD) |
| 27 | **Business — Calendar** | Promotions + scheduled content overview | BusinessCalendar; GET /business/calendar |
| 28 | **Business — Local** | Address, map link, category, hours, local offers | BusinessLocal; profile data + map link |
| 29 | **Business — Tools** | Insights link, export CSV, calendar, link tracking, reports copy | BusinessTools |
| 30 | **Commerce (Business-only)** | Products CRUD, orders list, order status + tracking | Commerce, CommerceProducts, CommerceProductNew, CommerceOrders; commerce.routes, CommerceService |
| 31 | **Creator** | Earnings, subscribers, subscriber content | CreatorEarnings, CreatorSubscribers, SubscriberContent; creator profile |
| 32 | **Job account** | Track (applications, pipelines, jobs), Know (companies, reviews, resources), Flow (boards, columns, cards) | Job, Track, Know, Flow, JobHome, JobKanban, JobWellness, TrackApplicationDetail; job.routes, TrackService, KnowService, FlowService |
| 33 | **Map** | Map view | Map; map.routes (stub) |
| 34 | **Admin** | Moderation, reports, users, platform | Admin, AdminModeration, AdminReports, AdminUsers, AdminPlatform; admin.routes |
| 35 | **Upload** | Single and multiple file upload | upload.routes |
| 36 | **Premium / blocked messages** | Blocked messages check, create, action, grants | premiumBlockedMessage.routes, PremiumBlockedMessageService |

---

## 1. Frontend — Pages

### Auth
| Component | Path | Description |
|-----------|------|-------------|
| `Splash` | `pages/auth/Splash.tsx` | Landing / splash when not authenticated |
| `Login` | `pages/auth/Login.tsx` | Login form |
| `Register` | `pages/auth/Register.tsx` | Registration entry |
| `RegisterLanding` | `pages/auth/RegisterLanding.tsx` | Account type selection for registration |
| `RegisterPersonalForm` | `pages/auth/register/RegisterPersonalForm.tsx` | Personal account signup form |
| `RegisterBusinessForm` | `pages/auth/register/RegisterBusinessForm.tsx` | Business account signup form |
| `RegisterCreatorForm` | `pages/auth/register/RegisterCreatorForm.tsx` | Creator account signup form |
| `RegisterJobForm` | `pages/auth/register/RegisterJobForm.tsx` | Job account signup form |
| `PhoneVerification` | `pages/auth/PhoneVerification.tsx` | Phone verification step |
| `ForgotPassword` | `pages/auth/ForgotPassword.tsx` | Forgot password flow |

### Profile & Edit Profile
| Component | Path | Description |
|-----------|------|-------------|
| `Profile` | `pages/profile/Profile.tsx` | Profile by username (Personal/Creator/Business/Job) |
| `EditProfile` | `pages/profile/EditProfile.tsx` | Edit profile form (type-specific fields) |
| `EditProfilePersonalFields` | `pages/profile/edit/EditProfilePersonalFields.tsx` | Personal: displayName, username, bio, pronouns, website |
| `EditProfileBusinessFields` | `pages/profile/edit/EditProfileBusinessFields.tsx` | Business: displayName, username, bio, category, contact, hours, action buttons, links |
| `EditProfileCreatorFields` | `pages/profile/edit/EditProfileCreatorFields.tsx` | Creator: displayName, username, bio, category, contact |
| `EditProfileJobFields` | `pages/profile/edit/EditProfileJobFields.tsx` | Job: displayName, headline, skills, openToOpportunities |
| `PersonalProfile` | `pages/personal/PersonalProfile.tsx` | Personal account profile UI |
| `CreatorProfile` | `pages/creator/CreatorProfile.tsx` | Creator account profile UI |
| `BusinessProfile` | `pages/business/BusinessProfile.tsx` | Business account profile: actions, hours, links, products, Posts/Shop/Reviews tabs |
| `JobProfile` | `pages/job/JobProfile.tsx` | Job account profile UI |

### Business Account (Business-only)
| Component | Path | Description |
|-----------|------|-------------|
| `BusinessInsights` | `pages/business/BusinessInsights.tsx` | Analytics: reach, engagement, profile visits, website clicks, trend, top content, demographics, export |
| `BusinessPromotions` | `pages/business/BusinessPromotions.tsx` | Promotions: list, create, edit, objective, budget, post/reel picker, status (DRAFT/ACTIVE/PAUSED/ENDED) |
| `BusinessTeam` | `pages/business/BusinessTeam.tsx` | Team: list members, add by username, roles (OWNER/ADMIN/MEMBER/VIEWER), remove |
| `BusinessScheduling` | `pages/business/BusinessScheduling.tsx` | Scheduled content: list posts/reels, link to calendar |
| `BusinessVerification` | `pages/business/BusinessVerification.tsx` | Verification: request badge, view status (PENDING/APPROVED/REJECTED) |
| `BusinessQuickReplies` | `pages/business/BusinessQuickReplies.tsx` | Quick replies: shortcut + message CRUD for inbox |
| `BusinessCalendar` | `pages/business/BusinessCalendar.tsx` | Calendar: promotions + scheduled posts/reels |
| `BusinessLocal` | `pages/business/BusinessLocal.tsx` | Local: address, map link, category, hours, local offers copy |
| `BusinessTools` | `pages/business/BusinessTools.tsx` | Tools: insights link, export CSV, calendar, link tracking, reports copy |

### Commerce (Business-only)
| Component | Path | Description |
|-----------|------|-------------|
| `Commerce` | `pages/commerce/Commerce.tsx` | Commerce hub: Products & Orders links |
| `CommerceProducts` | `pages/commerce/CommerceProducts.tsx` | List products, add, delete |
| `CommerceProductNew` | `pages/commerce/CommerceProductNew.tsx` | Add product form (name, description, price, image) |
| `CommerceOrders` | `pages/commerce/CommerceOrders.tsx` | List orders, update status, tracking |

### Creator
| Component | Path | Description |
|-----------|------|-------------|
| `CreatorEarnings` | `pages/creator/CreatorEarnings.tsx` | Creator earnings view |
| `CreatorSubscribers` | `pages/creator/CreatorSubscribers.tsx` | Subscribers list |
| `SubscriberContent` | `pages/creator/SubscriberContent.tsx` | Subscriber-only content |

### Content Creation
| Component | Path | Description |
|-----------|------|-------------|
| `CreatePost` | `pages/create/CreatePost.tsx` | Create post (media, caption) |
| `CreateStory` | `pages/create/CreateStory.tsx` | Create story |
| `CreateReel` | `pages/create/CreateReel.tsx` | Create reel |

### Feed & Home
| Component | Path | Description |
|-----------|------|-------------|
| `Home` | `pages/home/Home.tsx` | Main feed / home |

### Explore
| Component | Path | Description |
|-----------|------|-------------|
| `Explore` | `pages/explore/Explore.tsx` | Explore feed |
| `ExploreSearch` | `pages/explore/ExploreSearch.tsx` | Search (users, hashtags, etc.) |

### Messages
| Component | Path | Description |
|-----------|------|-------------|
| `Messages` | `pages/messages/Messages.tsx` | Inbox / thread list |
| `NewMessage` | `pages/messages/NewMessage.tsx` | New conversation |

### Notifications & Settings
| Component | Path | Description |
|-----------|------|-------------|
| `Notifications` | `pages/notifications/Notifications.tsx` | Notifications list |
| `Settings` | `pages/settings/Settings.tsx` | Settings menu |
| `SwitchAccount` | `pages/settings/SwitchAccount.tsx` | Switch/add account, link to Convert to Business |
| `ConvertToBusiness` | `pages/settings/ConvertToBusiness.tsx` | Convert Personal → Business (form + PATCH) |
| `PrivacySettings` | `pages/settings/PrivacySettings.tsx` | Privacy options |
| `BlockedAccounts` | `pages/settings/BlockedAccounts.tsx` | Blocked users |
| `MutedAccounts` | `pages/settings/MutedAccounts.tsx` | Muted users |
| `RestrictedAccounts` | `pages/settings/RestrictedAccounts.tsx` | Restricted users |
| `FollowRequests` | `pages/settings/FollowRequests.tsx` | Follow requests |
| `LimitInteractions` | `pages/settings/LimitInteractions.tsx` | Limit interactions |
| `HideStoryFrom` | `pages/settings/HideStoryFrom.tsx` | Hide story from list |
| `SafetySOS` | `pages/settings/SafetySOS.tsx` | Safety SOS |
| `EmergencyContacts` | `pages/settings/EmergencyContacts.tsx` | Emergency contacts |
| `SubscriptionTiers` | `pages/settings/SubscriptionTiers.tsx` | Subscription tiers |
| `PremiumFeatures` | `pages/settings/PremiumFeatures.tsx` | Premium features |
| `AccessibilitySettings` | `pages/settings/AccessibilitySettings.tsx` | Accessibility |
| `CloseFriends` | `pages/settings/CloseFriends.tsx` | Close friends list |
| `CloseFriendsAdd` | `pages/settings/CloseFriendsAdd.tsx` | Add close friends |
| `ReportProblem` | `pages/settings/ReportProblem.tsx` | Report a problem |
| `StubSetting` | `pages/settings/StubSetting.tsx` | Generic stub for Help, About, Crossposting, etc. |

### Other Pages
| Component | Path | Description |
|-----------|------|-------------|
| `Saved` | `pages/Saved.tsx` | Saved posts |
| `Archive` | `pages/Archive.tsx` | Archived posts |
| `Drafts` | `pages/Drafts.tsx` | Drafts list |
| `Live` | `pages/live/Live.tsx` | Live streaming |
| `Map` | `pages/map/Map.tsx` | Map view |
| `Analytics` | `pages/analytics/Analytics.tsx` | Analytics (generic) |
| `Job` | `pages/job/Job.tsx` | Job account hub (Track, Know, Flow) |
| `Track` | `pages/job/Track.tsx` | Job applications / pipeline |
| `Know` | `pages/job/Know.tsx` | Companies, reviews, resources |
| `Flow` | `pages/job/Flow.tsx` | Kanban boards |
| `JobHome` | `pages/job/JobHome.tsx` | Job home |
| `JobKanban` | `pages/job/JobKanban.tsx` | Kanban UI |
| `JobWellness` | `pages/job/JobWellness.tsx` | Wellness |
| `TrackApplicationDetail` | `pages/job/TrackApplicationDetail.tsx` | Application detail |
| `Admin` | `pages/admin/Admin.tsx` | Admin dashboard |
| `AdminModeration` | `pages/admin/AdminModeration.tsx` | Moderation |
| `AdminReports` | `pages/admin/AdminReports.tsx` | Reports |
| `AdminUsers` | `pages/admin/AdminUsers.tsx` | User management |
| `AdminPlatform` | `pages/admin/AdminPlatform.tsx` | Platform settings |

---

## 2. Frontend — Components

| Component | Path | Description |
|-----------|------|-------------|
| `ProtectedRoute` | `components/auth/ProtectedRoute.tsx` | Auth guard, optional requiredType/requiredRole |
| `BusinessAccountGuard` | `components/business/BusinessAccountGuard.tsx` | Renders children only for BUSINESS account; else "Switch account" |
| `Navbar` | `components/layout/Navbar.tsx` | Top navigation |
| `BottomNav` | `components/layout/BottomNav.tsx` | Bottom navigation |
| `AccountSwitcher` | `components/layout/AccountSwitcher.tsx` | Account switcher UI |
| `PostCard` | `components/feed/PostCard.tsx` | Single post in feed |
| `StoryTray` | `components/feed/StoryTray.tsx` | Story tray |
| `StoryViewer` | `components/feed/StoryViewer.tsx` | Story viewer |
| `SOSButton` | `components/safety/SOSButton.tsx` | Safety SOS button |

---

## 3. Frontend — Hooks

| Hook | Path | Description |
|------|------|-------------|
| `useAccountCapabilities` | `hooks/useAccountCapabilities.ts` | Capabilities from Redux or derived from account type/tier |
| `useCurrentAccount` | `hooks/useCurrentAccount.ts` | Current account from Redux |
| `useAccountType` | `hooks/useAccountType.ts` | Account type string |
| `useAccountUIMode` | `hooks/useAccountUIMode.ts` | UI mode (personal/creator/business/job) |
| `useFeed` | `hooks/useFeed.ts` | Feed data |
| `useMessages` | `hooks/useMessages.ts` | Messages / threads |
| `useNotifications` | `hooks/useNotifications.ts` | Notifications |
| `useExploreSearch` | `hooks/useExploreSearch.ts` | Explore search |

---

## 4. Frontend — Store & State

| Item | Path | Description |
|------|------|-------------|
| `store` | `store/index.ts` | Redux store |
| `authSlice` | `store/authSlice.ts` | Auth state (user, token, isAuthenticated) |
| `accountSlice` | `store/accountSlice.ts` | currentAccount, accounts, capabilities |

---

## 5. Frontend — Constants & Types

| Item | Path | Description |
|------|------|-------------|
| `accountTypes` | `constants/accountTypes.ts` | ACCOUNT_TYPES, SUBSCRIPTION_TIERS, AccountCapabilities, DEFAULT_CAPABILITIES, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS |
| `businessCategories` | `constants/businessCategories.ts` | BUSINESS_CATEGORIES, LINK_CATEGORIES, ACTION_BUTTON_TYPES |
| `types` | `types/index.ts` | Shared TypeScript types |

---

## 6. Frontend — Services & Workflows

| Item | Path | Description |
|------|------|-------------|
| `api` | `services/api.ts` | API client helpers |
| `socket` | `services/socket.ts` | Socket.io client |
| `feedWorkflow` | `workflows/feedWorkflow.ts` | Feed data workflow |
| `messageWorkflow` | `workflows/messageWorkflow.ts` | Messages workflow |
| `notificationWorkflow` | `workflows/notificationWorkflow.ts` | Notifications workflow |
| `exploreWorkflow` | `workflows/exploreWorkflow.ts` | Explore workflow |
| `createPostWorkflow` | `workflows/createPostWorkflow.ts` | Create post workflow |
| `storyWorkflow` | `workflows/storyWorkflow.ts` | Story workflow |
| `reelWorkflow` | `workflows/reelWorkflow.ts` | Reel workflow |
| `liveWorkflow` | `workflows/liveWorkflow.ts` | Live workflow |
| `draftsWorkflow` | `workflows/draftsWorkflow.ts` | Drafts workflow |
| `archiveWorkflow` | `workflows/archiveWorkflow.ts` | Archive workflow |
| `collectionsWorkflow` | `workflows/collectionsWorkflow.ts` | Collections workflow |
| `commentsWorkflow` | `workflows/commentsWorkflow.ts` | Comments workflow |
| `followWorkflow` | `workflows/followWorkflow.ts` | Follow workflow |
| `privacyWorkflow` | `workflows/privacyWorkflow.ts` | Privacy (block, mute, etc.) |
| `closeFriendsWorkflow` | `workflows/closeFriendsWorkflow.ts` | Close friends |
| `reportWorkflow` | `workflows/reportWorkflow.ts` | Reports |
| `emergencyContactWorkflow` | `workflows/emergencyContactWorkflow.ts` | Emergency contacts |
| `premiumBlockedMessageWorkflow` | `workflows/premiumBlockedMessageWorkflow.ts` | Premium blocked messages |

---

## 7. Frontend — Routes (App.tsx)

- `/` — Splash or Home (protected)
- `/feed` — Home (protected)
- `/login`, `/register`, `/forgot-password`, `/verify`
- `/explore`, `/explore/search`
- `/messages`, `/messages/new`, `/messages/:userId`
- `/notifications`
- `/profile/:username?`, `/profile/edit`
- `/settings`, `/settings/accounts`, `/settings/convert-to-business`
- `/settings/privacy`, `/settings/blocked`, `/settings/safety`, `/settings/emergency-contacts`
- `/settings/subscription`, `/settings/premium`, `/settings/accessibility`
- `/settings/help`, `/settings/report`, `/settings/about`
- `/settings/muted`, `/settings/restricted`, `/settings/follow-requests`
- `/settings/limit-interactions`, `/settings/hide-story-from`, `/settings/crossposting`
- `/saved`, `/archive`, `/drafts`, `/activity`, `/time-management`
- `/close-friends`, `/close-friends/add`
- **Business:** `/business/insights`, `/business/promotions`, `/business/team`, `/business/scheduling`, `/business/verification`, `/business/quick-replies`, `/business/calendar`, `/business/local`, `/business/tools`
- **Commerce:** `/commerce`, `/commerce/products`, `/commerce/products/new`, `/commerce/orders`
- **Creator:** `/creator/earnings`, `/creator/subscribers`, `/creator/subscriber-content`
- `/create/post`, `/create/story`, `/create/reel`
- `/live/:liveId?`, `/map`
- `/analytics`
- `/job/*` (Job account)
- **Admin:** `/admin`, `/admin/moderation`, `/admin/reports`, `/admin/users`, `/admin/platform`

---

## 8. Backend — API Routes

Base prefix: `/api`. All routes below are under their respective prefix.

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| POST | `/register` | 501 Not implemented |
| POST | `/login` | 501 Not implemented |

### Users — `/api/users`
| GET | `/` | Service info |

### Accounts — `/api/accounts`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Current account + capabilities |
| GET | `/list` | List accounts for user |
| GET | `/capabilities` | Capabilities for current account |
| GET | `/:accountId` | Account by ID |
| GET | `/username/:username` | Account by username |
| POST | `/` | Create account |
| PATCH | `/:accountId` | Update account (incl. type conversion, businessHours, actionButtons, links) |
| POST | `/:accountId/upgrade` | Upgrade account |

### Posts — `/api/posts`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List by accountId (with cursor) |
| GET | `/feed` | Main feed |
| GET | `/feed/favorites` | Favorites feed |
| GET | `/archived` | Archived posts |
| GET | `/deleted` | Recently deleted |
| POST | `/` | Create post |
| POST | `/:postId/like` | Like post |
| DELETE | `/:postId/like` | Unlike |
| POST | `/:postId/comments` | Add comment |
| GET | `/:postId/comments` | List comments |
| POST | `/:postId/save` | Save post |
| DELETE | `/:postId/save` | Unsave |
| POST | `/:postId/archive` | Archive |
| POST | `/:postId/unarchive` | Unarchive |
| POST | `/:postId/restore` | Restore deleted |
| POST | `/:postId/delete` | Soft delete |

### Stories — `/api/stories`
| GET | `/` | List for feed |
| POST | `/` | Create story |

### Reels — `/api/reels`
| GET | `/` | List (or by accountId) |
| POST | `/` | Create reel |

### Live — `/api/live`
| GET | `/` | List live |
| GET | `/:id` | Get live by ID |
| POST | `/` | Create live |

### Messages — `/api/messages`
| GET | `/threads` | Threads + requests + pinned |
| GET | `/` | Messages in thread (query) |
| POST | `/` | Send message |
| POST | `/thread-read` | Mark thread read |
| DELETE | `/:messageId` | Delete message |
| POST | `/:messageId/reaction` | Add reaction |
| DELETE | `/:messageId/reaction` | Remove reaction |
| POST | `/pin/:userId` | Pin chat |
| DELETE | `/pin/:userId` | Unpin |

### Notifications — `/api/notifications`
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark read |
| POST | `/read-all` | Mark all read |

### Explore — `/api/explore`
| GET | `/trending` | Trending hashtags |
| GET | `/search` | Search |

### Map — `/api/map`
| GET | `/` | Service info |

### Commerce — `/api/commerce` (Business account only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/products` | List products (seller) |
| GET | `/products/:productId` | Get product |
| POST | `/products` | Create product |
| PATCH | `/products/:productId` | Update product |
| DELETE | `/products/:productId` | Delete product |
| GET | `/orders` | List orders (seller) |
| PATCH | `/orders/:orderId` | Update order status + tracking |

### Analytics — `/api/analytics`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/insights` | Business/Creator insights (metrics, trend, top posts, demographics) |
| GET | `/insights/export` | CSV export of insights |

### Business — `/api/business` (Business account only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/promotions` | List promotions |
| POST | `/promotions` | Create promotion |
| GET | `/promotions/:promotionId` | Get one |
| PATCH | `/promotions/:promotionId` | Update promotion |
| DELETE | `/promotions/:promotionId` | Delete promotion |
| GET | `/team` | List team members |
| POST | `/team/invite` | Invite member (memberAccountId, role) |
| PATCH | `/team/:memberId` | Update role |
| DELETE | `/team/:memberId` | Remove member |
| GET | `/quick-replies` | List quick replies |
| POST | `/quick-replies` | Create quick reply |
| PATCH | `/quick-replies/:id` | Update quick reply |
| DELETE | `/quick-replies/:id` | Delete quick reply |
| GET | `/verification` | Verification status + request |
| POST | `/verification/request` | Submit verification request |
| GET | `/scheduled` | Scheduled posts + reels |
| GET | `/calendar` | Promotions + scheduled posts/reels |

### Admin — `/api/admin`
| GET | `/` | Service info |

### Job — `/api/job`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/track/applications` | List applications |
| POST | `/track/apply/:jobPostingId` | Apply |
| GET | `/track/pipelines` | List pipelines |
| POST | `/track/pipelines` | Create pipeline |
| GET | `/track/jobs` | List job postings |
| POST | `/track/jobs` | Create job posting |
| GET | `/know/companies` | List companies |
| GET | `/know/companies/:slug` | Company by slug |
| POST | `/know/companies` | Create company |
| POST | `/know/companies/:companyId/reviews` | Add review |
| POST | `/know/companies/:companyId/salaries` | Add salary |
| GET | `/know/resources` | Career resources |
| GET | `/know/interview-preps` | Interview preps |
| POST | `/know/interview-preps` | Create interview prep |
| GET | `/flow/boards` | List boards |
| POST | `/flow/boards` | Create board |
| GET | `/flow/boards/:boardId` | Get board |
| POST | `/flow/boards/:boardId/columns` | Add column |
| POST | `/flow/columns/:columnId/cards` | Add card |
| PATCH | `/flow/cards/:cardId/move` | Move card |
| DELETE | `/flow/cards/:cardId` | Delete card |

### Premium — `/api/premium`
| GET | `/blocked-messages/check` | Check blocked |
| POST | `/blocked-messages` | Create blocked message |
| POST | `/blocked-messages/:id/action` | Action on blocked message |
| GET | `/blocked-messages/grants` | Grants |

### Collections — `/api/collections`
| GET | `/` | List collections |
| POST | `/` | Create collection |
| GET | `/saved` | Saved posts (optionally by collection) |
| PATCH | `/:collectionId` | Update collection |
| DELETE | `/:collectionId` | Delete collection |

### Privacy — `/api/privacy`
| GET/POST/DELETE | `/blocked`, `/block`, `/block/:accountId` | Block |
| GET/POST/DELETE | `/muted`, `/mute`, `/mute/:accountId` | Mute |
| GET/POST/DELETE | `/restricted`, `/restrict`, `/restrict/:accountId` | Restrict |
| GET/POST/DELETE | `/hide-story-from`, etc. | Hide story from |
| GET/PATCH | `/limit-interactions` | Limit interactions |

### Follow — `/api/follow`
| POST | `/` | Follow |
| DELETE | `/:accountId` | Unfollow |
| GET | `/requests` | Pending requests |
| POST | `/requests/:requestId/approve` | Approve |
| POST | `/requests/:requestId/decline` | Decline |
| GET | `/status/:accountId` | Follow status |
| GET | `/favorites` | Favorites list |
| PATCH | `/:accountId/favorite` | Toggle favorite |

### Close Friends — `/api/close-friends`
| GET | `/` | List |
| POST | `/` | Add |
| DELETE | `/:friendId` | Remove |

### Reports — `/api/reports`
| POST | `/` | Create report |
| POST | `/problem` | Report problem |

### Drafts — `/api/drafts`
| GET | `/` | List drafts |
| GET | `/:draftId` | Get draft |
| POST | `/` | Create draft |
| PATCH | `/:draftId` | Update draft |
| DELETE | `/:draftId` | Delete draft |

### Emergency Contacts — `/api/emergency-contacts`
| GET | `/` | List |
| POST | `/` | Add |
| DELETE | `/:id` | Remove |
| PATCH | `/:id/primary` | Set primary |

### Upload — `/api/upload`
| POST | `/` | Single file upload |
| POST | `/multiple` | Multiple files (max 10) |

---

## 9. Backend — Services (Business Logic)

| Service | Path | Main functions |
|---------|------|----------------|
| **AccountService** | `services/account.service.ts` | getAccountById, getAccountByUsername, listAccountsByUser, getCapabilities, createAccount, updateAccount (incl. type conversion, businessHours, actionButtons, links) |
| **PromotionService** | `services/promotion.service.ts` | list, create, update, getOne, delete (promotions) |
| **CommerceService** | `services/commerce.service.ts` | listProducts, getProduct, createProduct, updateProduct, deleteProduct, listOrdersAsSeller, updateOrderStatus |
| **AnalyticsService** | `services/analytics.service.ts` | getBusinessInsights, exportInsightsCsv, getTrendDaily, getTopPosts |
| **PostService** | `services/post.service.ts` | create, getComments, listArchived, listRecentlyDeleted, listByAccount |
| **ReelService** | `services/reel.service.ts` | create, list, listByAccount |
| **FeedService** | `services/feed.service.ts` | getFeed, getFavoritesFeed |
| **StoryService** | `services/story.service.ts` | create, listForFeed |
| **LiveService** | `services/live.service.ts` | create, list, get |
| **MessageService** | `services/message.service.ts` | getThreads, getThread, sendMessage, deleteMessage, etc. |
| **NotificationService** | `services/notification.service.ts` | list, create |
| **ExploreService** | `services/explore.service.ts` | getTrendingHashtags, search |
| **DraftService** | `services/draft.service.ts` | list, get, create, update, delete |
| **CollectionService** | `services/collection.service.ts` | list, create, update, delete, listSaved |
| **FollowService** | `services/follow.service.ts` | follow, unfollow, listPendingFollowRequests, approve/decline, listFavorites, getFollowStatus |
| **PrivacyService** | `services/privacy.service.ts` | listBlocked, block, unblock, listMuted, mute, unmute, listRestricted, restrict, unrestrict, listHideStoryFrom, etc. |
| **CloseFriendService** | `services/closeFriend.service.ts` | list, add, remove |
| **ReportService** | `services/report.service.ts` | create, createProblemReport |
| **LimitInteractionService** | `services/limitInteraction.service.ts` | get, update |
| **EmergencyContactService** | `services/emergencyContact.service.ts` | list, add, delete, setPrimary |
| **PremiumBlockedMessageService** | `services/premiumBlockedMessage.service.ts` | check, create, action, getGrants |
| **FlowService** | `services/job/flow.service.ts` | getBoards, createBoard, getBoard, createColumn, createCard, moveCard, deleteCard |
| **KnowService** | `services/job/know.service.ts` | getCompanies, getCompanyBySlug, createCompany, getCareerResources, getInterviewPreps, createInterviewPrep |
| **TrackService** | `services/job/track.service.ts` | getApplications, getPipelines, createPipeline, getJobPostings, createJobPosting |

---

## 10. Backend — Middleware & Utils

| Item | Path | Description |
|------|------|-------------|
| **authenticate** | `middleware/auth.ts` | JWT auth; sets req.user (userId, accountId) |
| **optionalAuthenticate** | `middleware/auth.ts` | Same but no 401 when no/invalid token |
| **requireCapability** | `middleware/requireCapability.ts` | Check account capability |
| **errorHandler** | `middleware/errorHandler.ts` | Global error handler |
| **AppError** | `utils/AppError.ts` | Custom error class |
| **getCapabilities** | `constants/capabilities.ts` | getCapabilities(accountType, subscriptionTier) |
| **setupSocketHandlers** | `sockets/index.ts` | Socket.io handlers |

---

## Summary Counts

| Category | Count |
|----------|-------|
| Frontend pages | 60+ |
| Frontend components | 10+ |
| Frontend hooks | 8 |
| Frontend workflows | 15+ |
| Backend route files | 22 |
| Backend service files | 20+ |
| API endpoints | 120+ |

---

*Generated from the MOxE codebase. Update this list when adding or removing features.*
