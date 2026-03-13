# MOxE — Personal Account: Features, Functions & Components

This document lists **each and every feature, function, and component** implemented for the **Personal account** in MOxE.

---

## Table of Contents

1. [Personal Account — Features Overview](#1-personal-account--features-overview)
2. [Capabilities (FREE vs STAR)](#2-capabilities-free-vs-star)
3. [Frontend — Personal-Specific Components](#3-frontend--personal-specific-components)
4. [Frontend — Components Used by Personal](#4-frontend--components-used-by-personal)
5. [Frontend — Functions & Workflows Used by Personal](#5-frontend--functions--workflows-used-by-personal)
6. [Backend — API Endpoints Used by Personal](#6-backend--api-endpoints-used-by-personal)
7. [Backend — Service Functions Relevant to Personal](#7-backend--service-functions-relevant-to-personal)

---

## 1. Personal Account — Features Overview

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Account type** | Personal is one of four account types (PERSONAL, BUSINESS, CREATOR, JOB). Default in registration. |
| 2 | **Registration** | Create Personal account with username, display name, bio, pronouns, website (1 link). |
| 3 | **Profile view** | Instagram-style profile: avatar, display name, @username, “Personal” badge, posts/followers/following counts, bio, pronouns, website link, story highlights, Posts/Reels/Tagged tabs, media grid. |
| 4 | **Edit profile** | Edit display name, username, bio (150 chars), pronouns, website. Via Edit Profile page or in-profile modal (PersonalProfile). |
| 5 | **In-profile edit modal** | On own profile: Edit profile button opens modal with displayName, username, bio, link; save via PATCH /accounts/:id. |
| 6 | **Follow / Unfollow** | On others’ profiles: Follow, Following, Unfollow. |
| 7 | **Message** | Link to start DM with profile user. |
| 8 | **Favorites** | Add/remove account to Favorites (when following). |
| 9 | **Share profile** | Share profile URL (Web Share API or copy to clipboard). |
| 10 | **Profile posts grid** | Load and show posts by account (posts tab). |
| 11 | **Profile reels grid** | Load and show reels by account (reels tab). |
| 12 | **Tagged tab** | Placeholder “Tagged — coming soon”. |
| 13 | **Story highlights** | Static highlights (Travel, Food, Fitness, Friends) on profile. |
| 14 | **Convert to Business** | Only for Personal: link on Settings → Accounts to convert current account to Business. |
| 15 | **Feed** | Main feed and favorites feed (Personal uses same feed as other types). |
| 16 | **Posts** | Create, like, comment, save, archive, delete, restore (Personal can do all). |
| 17 | **Stories** | Create, view (Personal can do all). |
| 18 | **Reels** | Create, view (Personal can do all). |
| 19 | **Messages (DMs)** | Threads, send, read, delete, reactions, pin (Personal can do all). |
| 20 | **Notifications** | List, mark read (Personal can do all). |
| 21 | **Explore & search** | Trending, search (Personal can do all). |
| 22 | **Follow system** | Follow, unfollow, follow requests, favorites (Personal can do all). |
| 23 | **Privacy** | Block, mute, restrict, hide story from, limit interactions (Personal can do all). |
| 24 | **Close friends** | List, add, remove (Personal has access). |
| 25 | **Saved & collections** | Saved posts, collections CRUD (Personal has access). |
| 26 | **Drafts** | List, create, update, delete drafts (Personal can do all). |
| 27 | **Archive** | View archived posts (Personal can do all). |
| 28 | **Scheduling** | Post/reel scheduling **only when subscription tier is STAR**. |
| 29 | **Insights** | **Only when subscription tier is STAR.** |
| 30 | **Links** | 1 link (website) on FREE; up to 5 links on STAR (via account capabilities). |

---

## 2. Capabilities (FREE vs STAR)

Personal account capabilities (backend: `constants/capabilities.ts`):

| Capability | Personal FREE | Personal STAR |
|------------|----------------|---------------|
| canPost | ✅ | ✅ |
| canStory | ✅ | ✅ |
| canReel | ✅ | ✅ |
| canLive | ❌ | ❌ |
| canSchedulePosts | ❌ | ✅ |
| maxLinks | 1 | 5 |
| canDm | ✅ | ✅ |
| canExplore | ✅ | ✅ |
| canCloseFriends | ✅ | ✅ |
| canSavedCollections | ✅ | ✅ |
| canCommerce | ❌ | ❌ |
| canSubscriptions | ❌ | ❌ |
| canBadgesGifts | ❌ | ❌ |
| canBusinessHours | ❌ | ❌ |
| canActionButtons | ❌ | ❌ |
| canAnalytics | ❌ | ✅ |
| label | "Personal" | "Personal (Star)" |
| description | "Free: feed, posts, stories, DMs, 1 link" | "Star: scheduling, insights, close friends, collections" |

---

## 3. Frontend — Personal-Specific Components

Components that exist **only for or are specific to** Personal account:

| Component | Path | Description |
|-----------|------|-------------|
| **PersonalProfile** | `pages/personal/PersonalProfile.tsx` | Personal account profile UI: avatar, stats, bio, pronouns, website, story highlights, Edit/Share buttons (own) or Follow/Message/Favorites/Share (visitor), Posts/Reels/Tagged tabs, posts/reels grid, in-profile Edit modal (displayName, username, bio, link, 150-char bio). |
| **EditProfilePersonalFields** | `pages/profile/edit/EditProfilePersonalFields.tsx` | Edit profile form fields for Personal: display name, username, bio (150), pronouns, website. Used on `/profile/edit` when account type is PERSONAL. |
| **RegisterPersonalForm** | `pages/auth/register/RegisterPersonalForm.tsx` | Registration form for Personal: username*, display name*, bio, pronouns, website (1 link). |
| **ConvertToBusiness** | `pages/settings/ConvertToBusiness.tsx` | Shown only when current account is PERSONAL. Form to convert to Business (display name, username, bio, category, contact). PATCH `/accounts/:accountId` with `accountType: 'BUSINESS'`. |

**Exports:**

| Export | Path |
|--------|------|
| PersonalProfile | `pages/personal/index.ts` |
| EditProfilePersonalFields, EditProfilePersonalForm | `pages/profile/edit/index.ts` |
| RegisterPersonalForm | `pages/auth/register/index.ts` |

---

## 4. Frontend — Components Used by Personal

Shared components that Personal account **uses** (same as other account types where applicable):

| Component | Path | Use in Personal |
|-----------|------|-----------------|
| Profile | `pages/profile/Profile.tsx` | Routes to `PersonalProfile` when `profile.accountType === 'PERSONAL'`. |
| EditProfile | `pages/profile/EditProfile.tsx` | When `accountType === 'PERSONAL'` renders `EditProfilePersonalFields` and submits personal fields (displayName, username, bio, pronouns, website). |
| Register | `pages/auth/Register.tsx` | When `accountType === 'PERSONAL'` uses `RegisterPersonalForm` and submits personal payload. |
| RegisterLanding | `pages/auth/RegisterLanding.tsx` | Offers Personal option: "Feed, posts, stories, DMs. Free or Star tier." |
| SwitchAccount | `pages/settings/SwitchAccount.tsx` | Shows "Convert current account to Business" link only when `currentAccount.accountType === 'PERSONAL'`. |
| ProtectedRoute | `components/auth/ProtectedRoute.tsx` | Guards routes for any logged-in user (including Personal). |
| Navbar | `components/layout/Navbar.tsx` | Used for all accounts. |
| BottomNav | `components/layout/BottomNav.tsx` | Used for all accounts. |
| AccountSwitcher | `components/layout/AccountSwitcher.tsx` | Uses `getAccountColor('PERSONAL')` for Personal. |
| PostCard | `components/feed/PostCard.tsx` | Shows account type badge when `post.accountType !== 'PERSONAL'` (i.e. Personal posts can hide type). |
| StoryTray | `components/feed/StoryTray.tsx` | Feed stories. |
| StoryViewer | `components/feed/StoryViewer.tsx` | View stories. |

---

## 5. Frontend — Functions & Workflows Used by Personal

Functions and workflows used **by PersonalProfile and/or Personal flows**:

| Function / Workflow | Path | Use in Personal |
|---------------------|------|-----------------|
| getFollowStatus | `workflows/followWorkflow.ts` | PersonalProfile: get follow/favorite status for visited profile. |
| followAccount | `workflows/followWorkflow.ts` | PersonalProfile: Follow button. |
| unfollowAccount | `workflows/followWorkflow.ts` | PersonalProfile: Unfollow button. |
| addToFavorites | `workflows/followWorkflow.ts` | PersonalProfile: Add to Favorites. |
| removeFromFavorites | `workflows/followWorkflow.ts` | PersonalProfile: Remove from Favorites. |
| getPostsByAccount | `workflows/feedWorkflow.ts` | PersonalProfile: load posts for profile grid (posts tab). |
| getReelsByAccount | `workflows/feedWorkflow.ts` | PersonalProfile: load reels for profile grid (reels tab). |
| apiPatch | `services/api.ts` | PersonalProfile: in-profile edit modal PATCH `/accounts/:id` (displayName, username, bio, website). |

**Edit profile (full page)** builds payload for PERSONAL in `EditProfile.tsx`:

- `displayName`, `username`, `bio`, `pronouns`, `website` sent via PATCH `/accounts/:accountId`.

**Registration** builds payload for PERSONAL in `Register.tsx`:

- Personal form: `displayName`, `username`, `bio`, `pronouns`, `website`; accountType `'PERSONAL'`; submitted to registration API.

---

## 6. Backend — API Endpoints Used by Personal

Personal account uses the **same** APIs as other types for feed, posts, stories, reels, messages, follow, privacy, etc. Endpoints that **explicitly treat or restrict by account type**:

| Method | Path | Relevance to Personal |
|--------|------|------------------------|
| GET | `/api/accounts/me` | Returns current account (including PERSONAL) and capabilities. |
| GET | `/api/accounts/list` | Lists user’s accounts (includes Personal). |
| GET | `/api/accounts/capabilities` | Returns capabilities (for Personal: FREE vs STAR). |
| GET | `/api/accounts/:accountId` | Get account by ID (Personal account data). |
| GET | `/api/accounts/username/:username` | Get account by username (used for profile; returns Personal profile data). |
| POST | `/api/accounts` | Create account (can create PERSONAL). |
| PATCH | `/api/accounts/:accountId` | Update account. For Personal: `displayName`, `username`, `bio`, `pronouns`, `website` (and optionally `profilePhoto`, etc.). Used by Edit Profile and Convert to Business (which then sets `accountType: 'BUSINESS'`). |
| POST | `/api/follow` | Follow (Personal can follow). |
| DELETE | `/api/follow/:accountId` | Unfollow. |
| GET | `/api/follow/status/:accountId` | Follow status (used by PersonalProfile). |
| GET | `/api/follow/favorites` | Favorites list. |
| PATCH | `/api/follow/:accountId/favorite` | Add/remove favorite. |
| GET | `/api/posts?accountId=...` | List posts by account (PersonalProfile posts grid). |
| GET | `/api/reels?accountId=...` | List reels by account (PersonalProfile reels grid). |
| GET | `/api/posts/feed` | Main feed. |
| GET | `/api/posts/feed/favorites` | Favorites feed. |
| POST | `/api/posts` | Create post. |
| POST/DELETE | `/api/posts/:postId/like` | Like/unlike. |
| POST | `/api/posts/:postId/comments` | Comment. |
| GET | `/api/posts/:postId/comments` | List comments. |
| POST | `/api/posts/:postId/save` | Save post. |
| DELETE | `/api/posts/:postId/save` | Unsave. |
| POST | `/api/posts/:postId/archive` | Archive. |
| POST | `/api/posts/:postId/unarchive` | Unarchive. |
| POST | `/api/stories` | Create story. |
| GET | `/api/stories` | List stories for feed. |
| POST | `/api/reels` | Create reel. |
| GET | `/api/reels` | List reels. |
| GET | `/api/messages/threads` | DM threads. |
| GET | `/api/messages` | Messages in thread. |
| POST | `/api/messages` | Send message. |
| GET | `/api/notifications` | Notifications. |
| GET | `/api/explore/trending` | Trending. |
| GET | `/api/explore/search` | Search. |
| GET/POST/DELETE | `/api/close-friends/*` | Close friends (Personal has access). |
| GET | `/api/collections` | Collections. |
| GET | `/api/collections/saved` | Saved posts. |
| GET/POST/PATCH/DELETE | `/api/privacy/*` | Block, mute, restrict, hide story, limit interactions. |
| GET/POST/DELETE | `/api/drafts/*` | Drafts. |
| GET | `/api/posts/archived` | Archived posts. |

Personal does **not** use (or is restricted from):

- `/api/business/*` (Business only)
- `/api/commerce/*` (Business only)
- `/api/analytics/insights` (Business/Creator or STAR; Personal STAR can use analytics)
- `/api/job/*` (Job only)

---

## 7. Backend — Service Functions Relevant to Personal

| Service | Function | Relevance to Personal |
|---------|----------|------------------------|
| **AccountService** | getAccountById | Load account (e.g. Personal) by ID. |
| **AccountService** | getAccountByUsername | Load profile by username (Personal profile). |
| **AccountService** | listAccountsByUser | List user’s accounts (includes Personal). |
| **AccountService** | getCapabilities | Returns capabilities; for PERSONAL, applies FREE vs STAR rules. |
| **AccountService** | createAccount | Create PERSONAL account (with pronouns, website, etc.). |
| **AccountService** | updateAccount | Update account; for Personal, allows displayName, username, bio, pronouns, website, profilePhoto, etc. Handles conversion to BUSINESS when requested. |
| **FollowService** | follow, unfollow, getFollowStatus | Follow/unfollow and status (PersonalProfile). |
| **FollowService** | listFavorites, toggle favorite | Favorites (PersonalProfile). |
| **PostService** | listByAccount | Posts for profile grid (PersonalProfile). |
| **ReelService** | listByAccount | Reels for profile grid (PersonalProfile). |
| **FeedService** | getFeed, getFavoritesFeed | Main and favorites feed. |
| **PostService** | create, getComments, like, save, archive, etc. | Posts, comments, likes, save, archive. |
| **StoryService** | create, listForFeed | Stories. |
| **ReelService** | create, list | Reels. |
| **MessageService** | getThreads, getThread, sendMessage | DMs. |
| **NotificationService** | list | Notifications. |
| **ExploreService** | getTrendingHashtags, search | Explore & search. |
| **PrivacyService** | listBlocked, block, mute, restrict, etc. | Block, mute, restrict, hide story. |
| **CloseFriendService** | list, add, remove | Close friends. |
| **CollectionService** | list, create, listSaved, etc. | Saved & collections. |
| **DraftService** | list, get, create, update, delete | Drafts. |

---

## Summary — Personal Account

| Category | Count / Notes |
|----------|----------------|
| Personal-specific pages/components | 4 (PersonalProfile, EditProfilePersonalFields, RegisterPersonalForm, ConvertToBusiness) |
| Shared components used by Personal | Profile, EditProfile, Register, SwitchAccount, Navbar, BottomNav, PostCard, StoryTray, StoryViewer, etc. |
| Frontend workflows used by Personal | followWorkflow (getFollowStatus, followAccount, unfollowAccount, addToFavorites, removeFromFavorites), feedWorkflow (getPostsByAccount, getReelsByAccount), api (apiPatch) |
| Backend capabilities | PERSONAL + FREE or STAR (see table above) |
| API endpoints used | Accounts (me, list, capabilities, by id/username, create, update), Follow, Posts, Reels, Stories, Messages, Notifications, Explore, Privacy, Close friends, Collections, Drafts, etc. |

---

*This list covers all features, functions, and components implemented for the **Personal account** in MOxE.*
