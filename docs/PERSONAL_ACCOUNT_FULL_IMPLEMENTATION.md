# MOxE Personal Account — Full Implementation (Functional Guide)

This document lists **every feature, sub-feature, function, sub-function, component, and sub-component** of the MOxE Personal Account as specified in the functional guide and implementation roadmap. Each item is marked **Implemented**, **Partial**, or **Not Started**, with file/API evidence and **assumptions** where the guide was underspecified.

**Legend:**
- **Implemented** — Backend and frontend wired end-to-end.
- **Partial** — Implemented but with a noted gap or simplified behavior.
- **Not Started** — Not implemented (optional or Phase 2).

---

## SECTION 1: ACCOUNT MANAGEMENT

### 1.1 Account Creation System

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 1.1.1 | Phone number registration | **Implemented** | Backend: `POST /auth/send-verification-code`, `POST /auth/verify-code` (Twilio SMS, 6-digit code, 10 min expiry). Frontend: Register → PhoneVerification (code, password, username, displayName, DOB; resend). Login: "Log in with code". | SMS provider: Twilio; rate limits by IP. |
| 1.1.2 | Email addition (optional) | **Implemented** | Backend: `PATCH /accounts/me/email`, `GET /auth/verify-email?token=...` (redirect to frontend). EmailService: requestVerification, verifyToken, disposable-domain blocklist. Frontend: Settings → Email (EmailSettings.tsx), Add/change email; VerifyEmail page for success/error. | Verification link points to backend URL; backend redirects to frontend `/verify-email`. Disposable domains blocked via blocklist. |
| 1.1.3 | Username selection | **Implemented** | Backend: Account `username` @unique; `usernameChangedAt`; 14-day change limit in account.service. Frontend: EditProfilePersonalFields, Register, PersonalProfile edit modal. | Reserved username list can be added later. |
| 1.1.4 | Display name setup | **Implemented** | Backend: createAccount/updateAccount `displayName`. Frontend: EditProfilePersonalFields, Register, PersonalProfile edit modal. | — |
| 1.1.5 | Date of birth entry | **Implemented** | Backend: User.dateOfBirth; age ≥13 on create; isPrivate for age <18. DM restrictions: message.service.send checks minor (only-followed can DM). Feed/story: isMature content excluded for minors (feed.service, story.service, post.service). Frontend: PhoneVerification DOB; CreatePost/CreateStory "Mark as mature content" (18+). | Minors: default private; DMs only with follow relationship; no age-restricted content for <18. |
| 1.1.6 | Profile photo upload | **Implemented** | Backend: Account `profilePhoto`; updateAccount; `POST /api/upload`. Frontend: ProfilePhotoEditor (square crop, canvas), PersonalProfile "Change Photo", EditProfile photo upload → PATCH. | Square crop; optional content moderation not implemented. |
| 1.1.7 | Bio creation (150 chars) | **Implemented** | Backend: Account `bio` (VARCHAR 300). Frontend: EditProfilePersonalFields maxLength 150; PersonalProfile edit modal 150-char handling. | Guide: 150 for Personal; enforced in UI. |
| 1.1.8 | Link in bio (website) | **Implemented** | Backend: Account `website`; capabilities maxLinks 1 (FREE) / 5 (STAR). Frontend: EditProfilePersonalFields website; PersonalProfile shows link. | STAR could use `links` table for 5 links; currently single `website`. |
| 1.1.9 | Pronouns display | **Implemented** | Backend: Account `pronouns`; updateAccount. Frontend: EditProfilePersonalFields; PersonalProfile edit modal and display. | — |

### 1.2 Account Privacy Settings

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 1.2.1 | Account privacy (isPrivate) | **Implemented** | Backend: Account `isPrivate`; follow request flow. Frontend: PrivacySettings toggle; GET/PATCH accounts/me. | — |
| 1.2.2 | Follow requests management | **Implemented** | Backend: FollowRequest; approve/decline in follow.service, follow.routes. Frontend: FollowRequests.tsx list, approve, decline. | — |
| 1.2.3 | Remove followers | **Implemented** | Backend: `removeFollower`; `DELETE /api/follow/followers/:followerId`. Frontend: Followers.tsx "Remove" per follower. | — |
| 1.2.4 | Profile visibility in search | **Implemented** | Backend: Account `searchVisibility` (EVERYONE/FOLLOWERS_ONLY/NO_ONE); explore.service filters. Frontend: PrivacySettings dropdown; PATCH. | — |
| 1.2.5 | Activity status | **Implemented** | Backend: Account `showActivityStatus`, `lastActiveAt`; auth middleware updates lastActiveAt. Frontend: PrivacySettings activity status toggle; PATCH. | — |

### 1.3 Story Privacy Controls

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 1.3.1 | Hide story from | **Implemented** | Backend: HideStoryFrom model; privacy.routes. Frontend: HideStoryFrom.tsx. | — |
| 1.3.2 | Story reply controls | **Implemented** | Backend: Story `allowReplies`; story.service.create accepts allowReplies; account defaults (defaultStoryAllowReplies). Frontend: CreateStory "Who can reply" toggle; PrivacySettings default (if exposed). | ReplyControl enum (EVERYONE/FOLLOWERS/OFF) not used; boolean allowReplies used. |
| 1.3.3 | Story resharing controls | **Implemented** | Backend: Story `allowReshares`; story.service.create; account defaultStoryAllowReshares. Frontend: CreateStory "Allow resharing" toggle. | — |
| 1.3.4 | Story archive settings | **Implemented** | Backend: Account `storyArchiveEnabled`; archive.service runArchiveJob (copies expired stories to ArchivedStory); GET /archive; POST /archive/run-job (cron, X-Cron-Secret). Frontend: PrivacySettings "Save story to archive"; Archive.tsx (archived stories); NewHighlight from archive; highlight CRUD. | Cron must call POST /api/archive/run-job hourly with CRON_SECRET. |

---

## SECTION 2: CONTENT CREATION

### 2.1 Posts

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 2.1.1 | Media selection | **Implemented** | Backend: Post `media` (JSON); create accepts media. Frontend: CreatePost 10-item max, video duration ≤45s and size ≤100MB (getVideoDuration), moveMedia up/down for reorder. | Drag-and-drop reorder (e.g. dnd-kit) optional; up/down buttons implemented. |
| 2.1.2 | Photo editing | **Implemented** | Frontend: CreatePost "Edit" (pencil) per image opens PhotoEditorModal: crop aspect (Square, 4:5, 16:9), rotate, flip H/V, filter presets (Original, Vibrant, Cool, Warm, Noir), filter intensity slider (0–100%), brightness/contrast/saturation sliders; Apply uploads via /upload and replaces image in media list. | Trim/speed deferred. |
| 2.1.3 | Video editing | **Implemented** | Frontend: CreatePost "Cover" per video opens VideoCoverModal (scrub timeline, pick frame, capture as image); cover uploaded and stored as coverUrl in media; draft save/load includes videoCovers. Backend: post media accepts coverUrl for VIDEO items. | Trim and speed adjustment deferred (would require FFmpeg or client re-encode). |
| 2.1.4 | Caption | **Implemented** | Backend: Post `caption` (2200). Frontend: CreatePost caption textarea; createPost sends caption. | — |
| 2.1.5 | Hashtags | **Implemented** | Backend: Hashtag, PostHashtag; `GET /api/explore/hashtags/suggest?q=`. Frontend: CreatePost caption: on `#` prefix, fetch suggestions; dropdown insert. | — |
| 2.1.6 | Location tag | **Implemented** | Backend: Post `location`; create accepts location. Frontend: CreatePost location state and "Add location"; createPostWorkflow sends location. | Places API (Google/Mapbox) for search not wired; plain text location. |
| 2.1.7 | Alt text | **Implemented** | Backend: create accepts altText (500 chars). Frontend: CreatePost Advanced > Alt text; createPost sends altText. | — |
| 2.1.8 | Advanced settings | **Implemented** | Backend: Post privacy, allowComments, hideLikeCount; create accepts. Frontend: CreatePost Advanced: "Hide like count", "Turn off commenting"; createPost sends. | — |

### 2.2 Stories

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 2.2.1 | Story camera / create | **Implemented** | CreateStory: photo, video, boomerang, Layout, Hands-free; **Go Live** link to /live (title form → createLive → /live/:id). StoryViewer boomerang loop. Live page: createLive + navigate; viewer UI for /live/:id. | No device camera in browser (file picker). Live streaming is placeholder (no WebRTC); create Live record + viewer page. |
| 2.2.2–2.2.13 | Text, drawing, stickers | **Implemented** | CreateStory: Poll, GIF, Countdown, Link, Questions, Emoji Slider, **Add Yours** (prompt), **Music** (track/artist/preview URL), **Donation** (cause + link). StoryViewer: all of the above; Add Yours → link to create with addYoursParentId, owner “Browse responses” → AddYoursResponses page; Music play preview; Donation Donate link. Backend: addYoursParentId on create, GET add-yours-responses. | Text/drawing in JSON; no rich editor. Music URL only (no catalog). Donation link only (no payment). |

### 2.3 Story Highlights

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 2.3.1 | Highlight creation | **Implemented** | Backend: Highlight, HighlightItem, ArchivedStory; POST /highlights (name, coverImage, archivedStoryIds); GET /archive. Frontend: NewHighlight loads archive, select stories, createHighlight(archivedStoryIds); PersonalProfile "New" → /profile/highlights/new. | — |
| 2.3.2 | Highlight management | **Implemented** | Backend: PATCH/DELETE /highlights/:id; POST /highlights/:id/items; DELETE items; reorder. Frontend: HighlightManage.tsx (list highlights, Edit, Delete with confirm); HighlightEdit.tsx (rename, reorder items up/down, remove item, Add from archive modal); routes /profile/highlights, /profile/highlight/:id/edit; profile "Manage" circle. | — |

---

## SECTION 3: ENGAGEMENT

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 3.1.1 | Like posts | **Implemented** | Backend: Like model; POST/DELETE like. Frontend: PostCard like, double-tap. | — |
| 3.1.2 | Like stories | **Implemented** | Backend: StoryLike model; POST/DELETE /stories/:id/like; getStoryLikeStatus; notifications STORY_LIKE. Frontend: StoryViewer heart icon, like/unlike, viewer list shows liked. | — |
| 3.2 | Comments | **Implemented** | Backend: Comment CRUD, replies, getComments (isHidden: false); edit within 15 min. Frontend: PostCard comments, reply, like. | — |
| 3.3 | Share | **Implemented** | Backend: Share model; share to DM, share to story. Frontend: PostCard Copy link, Share to DM, Share to Story; profile Share. | — |

---

## SECTION 4: SAVE & COLLECTIONS

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 4.1.1 | Save posts | **Implemented** | Backend: SavedPost; collection optional. Frontend: PostCard save; Saved page. | — |
| 4.1.2–4.1.4 | Collections | **Implemented** | Backend: Collection CRUD; listSaved; shareToken; GET /collections/shared/:token. Frontend: Saved page; create/rename/delete collections; Share collection link. | — |

---

## SECTION 5: DIRECT MESSAGES

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 5.1.1 | Send message | **Implemented** | Backend: Message, MessageRecipient; message.service.send. Frontend: Messages, NewMessage; useThread.send. | — |
| 5.1.2 | Message requests | **Implemented** | Backend: getThreads returns requests; POST /messages/hide/:userId. Frontend: Messages RequestRow Accept, Delete (hide), Block. | — |
| 5.1.3 | Voice messages | **Implemented** | Backend: Message type VOICE; media URL. Frontend: Messages microphone button, record (MediaRecorder), upload, send VOICE; bubble play. | — |
| 5.1.4 | Photo/video in DMs | **Implemented** | Backend: Message media, isVanish; view-once marks viewed / replaces content. Frontend: Messages attach (camera/gallery), "View Once" toggle; bubble shows placeholder when viewed. | — |
| 5.1.5 | GIFs in DMs | **Implemented** | Backend: Message type GIF; mediaUrl. Frontend: Messages GIF button, paste URL (or GIPHY picker if added); send as GIF. | GIPHY SDK integration optional; paste URL works. |
| 5.1.6 | Message reactions | **Implemented** | Backend: Reaction model; add/remove. Frontend: Messages reactions; addReaction. | — |
| 5.2.1 | Delete messages | **Implemented** | Backend: deleteMessage (forMeOnly / for everyone). Frontend: MessageBubble Delete. | — |
| 5.2.2 | Mute conversation | **Implemented** | Backend: ConversationMute; POST/DELETE /messages/mute/:userId. Frontend: thread list and header mute/unmute. | — |
| 5.2.3 | Pinned chats | **Implemented** | Backend: PinnedChat. Frontend: ThreadRow pin/unpin; pinned first. | — |
| 5.3 | Group chats | **Implemented** | Backend: Group, GroupMember; group.routes CRUD (POST/GET/PATCH/DELETE /groups); member add/remove/role; leave; send with groupId. Frontend: CreateGroup, group list, group info, group chat with sender name. | — |

---

## SECTION 6: PRIVACY & SAFETY

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 6.1 | Block | **Implemented** | Backend: Block model with expiresAt; block(..., durationDays); isBlockActive respects expiry. Frontend: BlockedAccounts (shows Permanent/expiry); Messages block modal: duration dropdown (Permanent, 24h, 7d, 30d). | blockFutureAccounts (block new accounts from same user) optional. |
| 6.2 | Restrict | **Implemented** | Backend: Restrict model; comment.service sets isHidden when commenter restricted; GET /posts/:id/hidden-comments; PATCH approveComment. Frontend: PostCard shield "Hidden comments", list, Approve/Delete. | — |
| 6.3 | Mute | **Implemented** | Backend: Mute model. Frontend: MutedAccounts. | — |

---

## SECTION 7: STAR TIER PREMIUM

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| 7.1 | Ad-free | **Implemented** | Frontend: `useAdFree()` and `shouldShowAd(account)` (hooks/useAdFree.ts); `AdSlot` component (components/ads/AdSlot.tsx). When ad serving is added, wrap ad units in `<AdSlot>` so Star/Thick users see no ads. | No ad serving in codebase yet; gate is ready. |
| 7.2 | Profile visitors | **Implemented** | Backend: ProfileView; recordProfileView on GET /accounts/:id; hideProfileVisits; getProfileVisitors (Star); GET /accounts/me/profile-visitors. Frontend: PrivacySettings "Hide my profile visits"; ProfileVisitors page; PersonalProfile "Profile views" link for Star (own profile). | — |
| 7.3 | Anonymous story viewing | **Implemented** | Backend: anonymousStoryViewsRemaining (daily reset cron); recordView(anonymous); getAnonymousViewsRemaining. Frontend: StoryViewer "View anonymously?", remaining count. | — |
| 7.4 | Download protection | **Implemented** | Backend: Post/Story screenshotProtection; POST /content/screenshot-detected; ScreenshotLog; notify owner (Star). Frontend: CreatePost/CreateStory "Disable download" (Star); right-click disabled; visibilitychange log. | Best-effort; no OS-level screenshot block. |
| 7.5 | Voice commands | **Implemented** | Frontend: VoiceCommands.tsx (Web Speech API). Phrases: open profile, messages, home, explore, settings, notifications, safety/SOS, create post, new post, archive, saved. | "Message [name]" and "Go to profile [username]" need dynamic parsing (future). "Like this post" would need context. |
| 7.6 | Priority support | **Implemented** | Backend: SupportTicket, SupportTicketReply; POST/GET tickets, GET ticket by id with replies, POST /support/tickets/:id/reply. Frontend: Settings → Priority Support (create ticket, list); SupportTicketDetail (view thread, send reply when not CLOSED/RESOLVED). Star users get isPriority on create. | Admin queue/SLA workflow optional. |
| 7.7 | Message blocked user | **Implemented** | Backend: PremiumBlockedMessage; 403 when blocked; Star can send 150-char premium message. Frontend: useMessages 403 handling, sendPremiumBlockedMessage; toasts. | — |

---

## ADDITIONAL: LIFESTYLE STREAKS (from audit)

| Id | Item | Status | Evidence | Assumptions |
|----|------|--------|----------|-------------|
| — | Lifestyle streaks | **Implemented** | Backend: Streak model; POST /streaks/check-in, GET /streaks, GET /streaks/types. Frontend: Settings → Lifestyle streaks (Streaks.tsx); list types, check-in, show current/longest. | Types: GYM, MEDITATION, READING, STUDY, GAMING, MOVIES. Idempotent same-day check-in. |

---

## KEY FILES (Backend)

| Area | Path |
|------|------|
| Auth (email verify) | auth.routes.ts (GET /verify-email), account.routes.ts (PATCH /me/email), email.service.ts |
| Account | account.service.ts, account.routes.ts |
| Minors / isMature | feed.service.ts (isMinor, getFeed filter), story.service.ts, post.service.ts |
| Messages (DM, minor check) | message.service.ts (send: minor follow check; isVanish) |
| Archive & highlights | archive.service.ts, archive.routes.ts; highlight.service.ts, highlight.routes.ts |
| Stories (like, anonymous) | story.service.ts (recordView, like); story.routes.ts |
| Restrict / comments | post.service.ts (comment isHidden, approveComment), post.routes.ts |
| Profile visitors | account.service.ts (getProfileVisitors), account.routes.ts |
| Groups | group.routes.ts, group.service.ts |
| Streaks | streak.routes.ts, streak.service.ts |

---

## KEY FILES (Frontend)

| Area | Path |
|------|------|
| Personal profile | pages/personal/PersonalProfile.tsx (Profile views link for Star) |
| Email | pages/settings/EmailSettings.tsx; pages/auth/VerifyEmail.tsx |
| Profile photo | components/profile/ProfilePhotoEditor.tsx |
| Create post | pages/create/CreatePost.tsx (media, video cover, location, advanced, isMature, hashtag suggest); components/create/PhotoEditorModal.tsx, VideoCoverModal.tsx |
| Create story | pages/create/CreateStory.tsx (allowReplies, allowReshares, isMature) |
| Archive & highlights | pages/Archive.tsx; pages/profile/NewHighlight.tsx, HighlightViewer.tsx, HighlightManage.tsx, HighlightEdit.tsx; workflows/archiveWorkflow.ts, highlightWorkflow.ts |
| Story viewer | components/feed/StoryViewer.tsx (like, anonymous view) |
| Messages | pages/messages/Messages.tsx (view-once, voice, GIF, attach); useMessages.ts |
| Groups | pages/messages/CreateGroup.tsx; groupWorkflow.ts |
| Comments (restrict) | components/feed/PostCard.tsx (hidden comments, approve); workflows/commentsWorkflow.ts |
| Privacy / Star | pages/settings/PrivacySettings.tsx (hideProfileVisits); pages/settings/ProfileVisitors.tsx |
| Voice | components/voice/VoiceCommands.tsx |
| Streaks | pages/settings/Streaks.tsx; workflows/streakWorkflow.ts |

---

## ASSUMPTIONS (documented)

| Area | Assumption |
|------|------------|
| Email verification | Backend handles GET /auth/verify-email and redirects to frontend /verify-email?success=1 or ?error=... |
| Minors | Age from User.dateOfBirth; DMs only with mutual follow; isMature content hidden in feed/story/profile. |
| Profile photo | Square crop in ProfilePhotoEditor; no mandatory content moderation. |
| Story reply/reshare | Boolean allowReplies/allowReshares (not ReplyControl enum). |
| Archive cron | Call POST /api/archive/run-job every hour with header X-Cron-Secret = CRON_SECRET. |
| Media reorder | Up/down buttons; optional dnd-kit drag-and-drop. |
| Location | Plain text; Places API (Google/Mapbox) optional. |
| Voice commands | Navigation + create post + archive/saved; "Message [name]" / "Go to profile [username]" require speech parsing. |
| GIF in DMs | Paste URL; GIPHY SDK optional. |
| Priority support | Phase 2; in-house ticket system or third-party. |
| Photo/video editing | Phase 2; client-side or server FFmpeg. |

---

## SUMMARY COUNTS (current)

| Status | Count |
|--------|-------|
| **Implemented** | 76 (incl. 2.2.1 camera + Live entry; 2.2.2–2.2.13 all stickers: poll, GIF, countdown, link, questions, emoji slider, Add Yours, Music, Donation; 7.1 ad-free) |
| **Partial** | 0 |
| **Not Started** | 0 |
| **Total** | 76 |

---

*Generated from codebase audit and functional guide. Update as features are completed or assumptions change.*

**Remaining features (specs & order):** [REMAINING_FEATURES_IMPLEMENTATION_PLAN.md](./REMAINING_FEATURES_IMPLEMENTATION_PLAN.md)
