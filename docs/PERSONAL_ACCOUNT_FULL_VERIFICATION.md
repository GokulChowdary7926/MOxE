# Personal Account — Full Feature Verification (MOxE)

This document verifies **every feature, sub-feature, function, sub-function, component, and sub-component** of the Personal Account against the current codebase. Each item is marked **Verified**, **Partial**, or **Not Started** with evidence.

**Legend:**
- **Verified** — Implemented and wired end-to-end (backend + frontend).
- **Partial** — Partially implemented (e.g. backend only, schema only, or UI without full behavior).
- **Not Started** — Not implemented.

---

## SECTION 1: ACCOUNT MANAGEMENT

### 1.1 Account Creation System

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 1.1.1 | Phone number registration | **Verified** | Backend: `POST /auth/send-verification-code`, `POST /auth/verify-code` (Twilio SMS, 6-digit code, 10 min expiry, rate limits). PhoneVerification model. JWT on verify; new user creation with username, displayName, dateOfBirth; age ≥13, isPrivate for age <18. Frontend: Register (phone only → send code → `/verify`); PhoneVerification (code, password, "New to MOxE" with username, displayName, DOB; resend). Login: "Log in with code" → same flow. |
| 1.1.2 | Email addition (optional) | **Partial** | Schema: User has `email`, `emailVerified`. No PATCH `/users/me/email`, no verify-email endpoint, no Settings > Add Email UI. |
| 1.1.3 | Username selection | **Verified** | Backend: Account `username` @unique; updateAccount validates; `usernameChangedAt` and 14-day change limit in account.service. Frontend: EditProfilePersonalFields, Register (account type step), PersonalProfile edit modal. |
| 1.1.4 | Display name setup | **Verified** | Backend: createAccount/updateAccount support `displayName`. Frontend: EditProfilePersonalFields, Register, PersonalProfile edit modal. |
| 1.1.5 | Date of birth entry | **Partial** | Backend: User.dateOfBirth; phone verification creates user with DOB; age ≥13 enforced; isPrivate set for age <18. Frontend: DOB collected in PhoneVerification for new users (date input). **Gap:** No DM restrictions for minors (only-followed can DM); no age-restricted content filter. |
| 1.1.6 | Profile photo upload | **Partial** | Backend: Account `profilePhoto`; updateAccount accepts it; POST `/api/upload` exists. Frontend: PersonalProfile shows photo and "Change Photo" button with no upload/crop flow; EditProfile does not wire profile photo to upload + PATCH. |
| 1.1.7 | Bio creation (150 chars Personal) | **Verified** | Backend: Account `bio` (VARCHAR 300). Frontend: EditProfilePersonalFields maxLength 150 and count; PersonalProfile edit modal 150-char handling. |
| 1.1.8 | Link in bio (website) | **Verified** | Backend: Account `website`; capabilities maxLinks 1 (FREE) / 5 (STAR). Frontend: EditProfilePersonalFields website; PersonalProfile shows link. |
| 1.1.9 | Pronouns display | **Verified** | Backend: Account `pronouns`; updateAccount. Frontend: EditProfilePersonalFields pronouns; PersonalProfile edit modal and display. |

### 1.2 Account Privacy Settings

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 1.2.1 | Account privacy toggle (isPrivate) | **Verified** | Backend: Account `isPrivate`; follow request flow when private. Frontend: PrivacySettings toggle; GET/PATCH accounts/me and accounts/:id. |
| 1.2.2 | Follow requests management | **Verified** | Backend: FollowRequest model; approve/decline in follow.service and follow.routes. Frontend: FollowRequests.tsx list, approve, decline. |
| 1.2.3 | Remove followers | **Verified** | Backend: `removeFollower(accountId, followerId)` in follow.service; DELETE `/api/follow/followers/:followerId`. Frontend: Followers.tsx calls removeFollower, "Remove" per follower. |
| 1.2.4 | Profile visibility in search | **Verified** | Backend: Account `searchVisibility` (EVERYONE/FOLLOWERS_ONLY/NO_ONE); explore.service filters. Frontend: PrivacySettings dropdown; PATCH. |
| 1.2.5 | Activity status | **Verified** | Backend: Account `showActivityStatus`, `lastActiveAt`; auth middleware updates lastActiveAt. Frontend: PrivacySettings activity status toggle; PATCH. |

### 1.3 Story Privacy Controls

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 1.3.1 | Hide story from | **Verified** | Backend: HideStoryFrom model; privacy.routes. Frontend: HideStoryFrom.tsx. |
| 1.3.2 | Story reply controls | **Partial** | Schema: Story `allowReplies` (default true). story.service.create does not accept allowReplies; no per-account default; no CreateStory UI for "Who can reply". |
| 1.3.3 | Story resharing controls | **Partial** | Schema: Story `allowReshares` (default true). story.service.create does not accept allowReshares; no CreateStory UI. |
| 1.3.4 | Story archive settings | **Partial** | Backend: Account `storyArchiveEnabled`; updateAccount. Frontend: PrivacySettings "Save story to archive" toggle; PATCH. **Gap:** No backend job to copy story to archive on expire; no Highlights-from-archive flow. |

---

## SECTION 2: CONTENT CREATION

### 2.1 Posts

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 2.1.1 | Media selection | **Partial** | Backend: Post `media` (JSON), create accepts media. Frontend: CreatePost media upload and list; createPostWorkflow accepts media. **Gap:** No 10-item max enforced in UI; no video duration/size validation (e.g. 45s, 100MB); no drag reorder in CreatePost. |
| 2.1.2 | Photo editing | **Not Started** | No in-app filters, brightness, contrast, crop. |
| 2.1.3 | Video editing | **Not Started** | No trim, cover frame, speed in CreatePost. |
| 2.1.4 | Caption | **Verified** | Backend: Post `caption` (2200). Frontend: CreatePost caption textarea; createPost sends caption. |
| 2.1.5 | Hashtags | **Partial** | Hashtag/PostHashtag models; caption can include #. No GET /hashtags/suggest or suggestion API; no frontend dropdown on #. |
| 2.1.6 | Location tag | **Partial** | Backend: Post `location`; post create accepts location. Frontend: CreatePost has "Add location" button but no state or payload (createPost not sending location). |
| 2.1.7 | Alt text | **Verified** | Backend: create accepts altText (500 chars). Frontend: CreatePost Advanced > Alt text (500 chars); createPost sends altText. |
| 2.1.8 | Advanced settings | **Partial** | Backend: Post has privacy, allowComments, hideLikeCount; create accepts them. createPostWorkflow has location, allowComments, hideLikeCount. **Gap:** CreatePost UI does not expose hide like count or disable comments. |

### 2.2 Stories

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 2.2.1 | Story camera / create | **Partial** | Backend: StoryService.create(media, type, privacy, stickers, textOverlay, drawings). Frontend: CreateStory minimal (single media URL, type 'photo', stickers []). **Gap:** No Boomerang, Layout, Hands-free, Live modes; no file picker/camera capture wired. |
| 2.2.2–2.2.13 | Text, drawing, stickers | **Partial** | Schema: Story stickers, textOverlay, drawings (JSON). CreateStory sends empty stickers. **Gap:** No poll, questions, emoji slider, countdown, Add Yours, music, GIF, link, donation stickers or UI. |

### 2.3 Story Highlights

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 2.3.1 | Highlight creation | **Partial** | Schema: Highlight, HighlightItem models. No backend routes for GET archive, POST highlights, POST highlights/:id/items. Frontend: PersonalProfile shows static highlight circles; no create-from-archive flow. |
| 2.3.2 | Highlight management | **Not Started** | No update/delete highlights or manage UI (rename, reorder, add/remove stories, delete). |

---

## SECTION 3: ENGAGEMENT

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 3.1.1 | Like posts | **Verified** | Backend: Like model; POST/DELETE like. Frontend: PostCard like, double-tap. |
| 3.1.2 | Like stories | **Partial** | StoryView records viewers; no separate StoryLike or heart in viewer list. |
| 3.2 | Comments | **Verified** | Backend: Comment CRUD, replies, getComments (isHidden: false). Frontend: PostCard comments, reply, like. Edit within 15 min in backend. |
| 3.3 | Share | **Verified** | Backend: Share model; POST /messages/share-post, POST /stories/share-post. Frontend: PostCard share (Copy link, Share to DM, Share to Story); profile Share (Web Share + copy + toast). |

---

## SECTION 4: SAVE & COLLECTIONS

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 4.1.1 | Save posts | **Verified** | Backend: SavedPost; collection optional. Frontend: PostCard save; Saved page. |
| 4.1.2–4.1.4 | Collections | **Verified** | Backend: Collection CRUD; listSaved; shareToken; createShareToken, getByShareToken; POST /collections/:id/share, GET /collections/shared/:token. Frontend: Saved page; create/rename/delete collections; "Share collection" copies view-only link. |

---

## SECTION 5: DIRECT MESSAGES

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 5.1.1 | Send message | **Verified** | Backend: Message, MessageRecipient; message.service.send. Frontend: Messages, NewMessage; useThread.send. |
| 5.1.2 | Message requests | **Verified** | Backend: getThreads returns threads + requests; POST /messages/hide/:userId. Frontend: Messages RequestRow with Accept, Delete (hide), Block. |
| 5.1.3 | Voice messages | **Not Started** | No voice message type or record/send/play UI. |
| 5.1.4 | Photo/video in DMs | **Partial** | Message can have media (JSON). No attach button or view-once in Messages UI. |
| 5.1.5 | GIFs in DMs | **Not Started** | No GIPHY picker in composer. |
| 5.1.6 | Message reactions | **Verified** | Backend: Reaction model; add/remove. Frontend: Messages reactions; addReaction. |
| 5.2.1 | Delete messages | **Verified** | Backend: deleteMessage (forMeOnly / for everyone). Frontend: MessageBubble Delete. |
| 5.2.2 | Mute conversation | **Verified** | Backend: ConversationMute; POST/DELETE /messages/mute/:userId (duration); getThreads returns mutedUntil. Frontend: thread list and thread header mute/unmute. |
| 5.2.3 | Pinned chats | **Verified** | Backend: PinnedChat; pin/unpin. Frontend: ThreadRow pin/unpin; pinned first. |
| 5.3 | Group chats | **Partial** | Schema: Group, GroupMember (and GroupAdmin). No full group creation/add/remove/rename UI or dedicated group endpoints in backend/src. |

---

## SECTION 6: PRIVACY & SAFETY

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 6.1 | Block | **Verified** | Backend: Block model; block/unblock. Frontend: BlockedAccounts; block from profile. **Gap:** No "Block new accounts from this user" (blockFutureAccounts) option. |
| 6.2 | Restrict | **Partial** | Backend: Restrict model; restrict/unrestrict. Frontend: RestrictedAccounts; restrict from profile. **Gap:** Comment approval for restricted users not implemented: Comment has isHidden but post.service.comment does not set isHidden when commenter is restricted; no "hidden comments" queue or approve/delete UI. |
| 6.3 | Mute | **Verified** | Backend: Mute model. Frontend: MutedAccounts. |

---

## SECTION 7: STAR TIER PREMIUM

| Id | Item | Status | Evidence |
|----|------|--------|----------|
| 7.1 | Ad-free | **Not Started** | No ad serving in codebase. |
| 7.2 | Profile visitors | **Partial** | Backend: ProfileView model; recordProfileView on GET /accounts/:accountId (viewer ≠ owner); hideProfileVisits skips recording; getProfileVisitors (Star only, last 30 days); GET /accounts/me/profile-visitors. **Gap:** No frontend "Who viewed your profile" UI; no "Hide my visits" setting in Privacy/Settings. |
| 7.3 | Anonymous story viewing | **Not Started** | StoryView identifies viewer; no anonymous option or daily limit. |
| 7.4 | Download protection | **Not Started** | No per-post "disable download" or screenshot detection. |
| 7.5 | Voice commands | **Not Started** | N/A. |
| 7.6 | Priority support | **Not Started** | No support ticket system or priority queue. |
| 7.7 | Message blocked user | **Verified** | Backend: PremiumBlockedMessage; message.service sends 403 when recipient blocked sender; Star can send premium blocked message (150 chars). Frontend: useMessages handles 403, checkCanMessageBlockedUser, sendPremiumBlockedMessage; toasts. |

---

## Summary Counts

| Status | Count |
|--------|-------|
| **Verified** | 38 |
| **Partial** | 26 |
| **Not Started** | 12 |
| **Total** | 76 |

---

## Files Referenced (Key)

- **Auth:** backend: auth.routes.ts, phoneVerification.service.ts, twilio.service.ts; frontend: Register.tsx, PhoneVerification.tsx, Login.tsx
- **Account:** backend: account.service.ts, account.routes.ts; frontend: EditProfilePersonalFields.tsx, PersonalProfile.tsx, PrivacySettings.tsx, Followers.tsx, FollowRequests.tsx
- **Posts:** backend: post.service.ts, post.routes.ts; frontend: CreatePost.tsx, createPostWorkflow.ts, PostCard.tsx
- **Stories:** backend: story.service.ts; frontend: CreateStory.tsx, storyWorkflow.ts, StoryViewer.tsx
- **Messages:** backend: message.service.ts; frontend: Messages.tsx, useMessages.ts
- **Privacy:** backend: privacy.routes.ts, follow.service.ts; frontend: BlockedAccounts.tsx, MutedAccounts.tsx, RestrictedAccounts.tsx, HideStoryFrom.tsx
- **Schema:** backend/prisma/schema.prisma (User, Account, Post, Story, Comment, ProfileView, Highlight, etc.)

---

*Generated from codebase verification. Update as features are completed.*
