# MOxE Personal Account — Implementation Roadmap (from Functional Guide)

This document maps the **Complete MOxE Personal Account Functional Guide** to the current codebase: what is implemented, what is partial, and what remains to be built. Assumptions and schema notes are documented so implementation can proceed in phases.

**Legend:**
- **Done** — Implemented and wired (backend + frontend).
- **Partial** — Partially implemented (e.g. backend only, or UI without full behavior).
- **Not Started** — Not implemented; guide specifies full behavior.

---

## SECTION 1: ACCOUNT MANAGEMENT

### Component 1.1: Account Creation System

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **1.1.1 Phone Number Registration** | Done | Twilio SMS: `POST /auth/send-verification-code`, `POST /auth/verify-code`. PhoneVerification model; rate limits; JWT on verify. Register/login return 501 with message to use phone flow. | Register: phone only → send code → `/verify`. PhoneVerification: code + password; "New to MOxE" for username/displayName/DOB; resend. Login: "Log in with code" → same flow. | **Security:** Twilio credentials only in backend `.env` (see `.env.example`); never commit real values. |
| **1.1.2 Email Addition (Optional)** | Partial | User has `email`, `emailVerified`. No dedicated “add email” or “verify email” endpoints. | No Settings > Add Email UI. | **Assumption:** Add PATCH `/api/users/me/email` (validate, send verification link), GET verify-email?token=; block disposable domains via allowlist or blocklist. |
| **1.1.3 Username Selection** | Done | Account has `username` @unique. createAccount/updateAccount validate. No 14-day change limit. | Register + Edit Profile set username. | **Assumption:** Add `usernameChangedAt` on Account and enforce “change once per 14 days” in updateAccount. |
| **1.1.4 Display Name Setup** | Done | Account has `displayName`; create/update support it. | Register, Edit Profile, PersonalProfile modal. | None. |
| **1.1.5 Date of Birth Entry** | Partial | User has `dateOfBirth`. Phone verification creates user with DOB; age ≥13 enforced; isPrivate for age <18. | PhoneVerification collects DOB for new users. | **Gap:** DM restrictions for minors (only-followed can DM) and age-restricted content filter not applied. |
| **1.1.6 Profile Photo Upload** | Partial | Account has `profilePhoto`; updateAccount allows it. Upload route: POST `/api/upload`. | Edit profile can set photo if wired; PersonalProfile modal has “Change Photo” but no upload flow. | **Assumption:** Wire “Change Photo” to upload endpoint and PATCH profilePhoto; add crop (e.g. square); optional content moderation. |
| **1.1.7 Bio Creation** | Done | Account has `bio` (VARCHAR 300). Edit Profile and PersonalProfile limit to 150 for Personal. | EditProfilePersonalFields + PersonalProfile modal (150 chars). | Guide says 150 chars for Personal — already enforced in UI. |
| **1.1.8 Link in Bio** | Done | Personal: Account has `website` (1 link). Capabilities: maxLinks 1 (FREE) / 5 (STAR). | Edit profile: website field. PersonalProfile shows website link. | STAR tier could use `links` table (like Business) for up to 5; currently Personal uses single `website`. |
| **1.1.9 Pronouns Display** | Done | Account has `pronouns`. Update allowed. | EditProfilePersonalFields has pronouns; profile shows them. PersonalProfile in-profile modal to add pronouns (see implementation below). | Optional: add visibility (Public / Followers / Off) in schema if needed. |

### Component 1.2: Account Privacy Settings

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **1.2.1 Account Privacy Toggle** | Done | Account has `isPrivate`. Follow requests when private. | Privacy settings; follow request approve/decline. | None. |
| **1.2.2 Follow Requests Management** | Done | FollowRequest model; approve/decline endpoints. | FollowRequests page. | None. |
| **1.2.3 Remove Followers** | Partial | Can unfollow; no dedicated “remove follower” (removes self from their following list). | Not exposed as “Remove follower” in UI. | **Assumption:** Add “Remove follower” that deletes Follow where followingId = me and followerId = them (no notification). |
| **1.2.4 Profile Visibility in Search** | Done | Account.searchVisibility (EVERYONE / FOLLOWERS_ONLY / NO_ONE); explore service filters by visibility and follow. | Privacy Settings: Search visibility dropdown; load/save via GET/PATCH /accounts/me and /accounts/:id. | None. |
| **1.2.5 Activity Status** | Partial | Account.showActivityStatus and lastActiveAt; auth middleware updates lastActiveAt on each request. | Privacy Settings: Activity status toggle; load/save via PATCH. | Expose lastActiveAt in API for “last active” in DMs; optional. |

### Component 1.3: Story Privacy Controls

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **1.3.1 Hide Story From** | Done | HideStoryFrom model; privacy routes. | HideStoryFrom settings page. | None. |
| **1.3.2 Story Reply Controls** | Partial | Story has `allowReplies` (boolean). | No per-account default or per-story UI in create flow. | **Assumption:** Use allowReplies on Story when creating; optional account-level default in settings. |
| **1.3.3 Story Resharing Controls** | Partial | Story has `allowReshares`. | No UI to set when creating story. | **Assumption:** Add to Create Story UI and/or account default. |
| **1.3.4 Story Archive Settings** | Partial | Account.storyArchiveEnabled. | Privacy Settings: “Save story to archive” toggle; load/save via PATCH. | Backend job to copy story to archive on expire; Highlights from archive not yet wired. |

---

## SECTION 2: CONTENT CREATION

### Component 2.1: Posts

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **2.1.1 Media Selection** | Partial | Post has `media` (JSON), carousel. Create post accepts media. | CreatePost: media selection; carousel order. | **Assumption:** Enforce 10 items max, reorder; support video (e.g. 45s, 100MB) per guide. |
| **2.1.2 Photo Editing** | Not Started | No server-side editing. | No in-app filters/brightness/contrast/crop. | **Assumption:** Client-side only: filter library, sliders (brightness, contrast, etc.), crop/rotate; or integrate third-party editor. |
| **2.1.3 Video Editing** | Not Started | No trim/cover/speed. | No trim or cover frame in create. | **Assumption:** Add trim (start/end), cover frame selection, mute, speed in CreatePost for video. |
| **2.1.4 Caption** | Done | Post has `caption` (2200). | CreatePost caption; character count. | None. |
| **2.1.5 Hashtags** | Partial | Hashtag/PostHashtag models; caption can include #. | Caption supports #; no suggestion API. | **Assumption:** Add search/suggestions for hashtags (e.g. from explore or dedicated endpoint). |
| **2.1.6 Location Tag** | Partial | Post has `location` (string). | May not be in create UI. | **Assumption:** Add location picker (GPS + search) in CreatePost and save to Post.location. |
| **2.1.7 Alt Text** | Done | Post has `altText`; create accepts altText (500 chars). | CreatePost can send altText in body (add Advanced > Alt text in UI if missing). | Backend done. |
| **2.1.8 Advanced Settings** | Partial | Post has privacy, allowComments, hideLikeCount. | Create post may not expose hide like count / disable comments. | **Assumption:** Expose hideLikeCount, allowComments, and per-post audience in CreatePost advanced section. |

### Component 2.2: Stories

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **2.2.1 Story Camera** | Partial | Story create with media, type. | CreateStory exists; modes (photo, video, boomerang, layout) may be limited. | **Assumption:** Add modes: Boomerang, Layout, Hands-free (timer), Live; AR effects via client or SDK. |
| **2.2.2–2.2.13 Text, Drawing, Stickers** | Partial | Story has `stickers`, `textOverlay`, `drawings` (JSON). | CreateStory likely minimal. | **Assumption:** Implement sticker types (Poll, Questions, Emoji Slider, Countdown, Add Yours, Music, GIF, Link, Donation) as structured JSON; integrate GIPHY for GIF; music from licensed catalog. |

### Component 2.3: Story Highlights

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **2.3.1 Highlight Creation** | Partial | Highlight + HighlightItem models. | PersonalProfile shows static highlight circles; no create from archive. | **Assumption:** Highlight creation from archived stories; name, cover selection; display on profile. |
| **2.3.2 Highlight Management** | Not Started | Highlight update/delete. | No manage UI. | **Assumption:** Settings or profile “Manage highlights”: rename, reorder, add/remove stories, delete. |

---

## SECTION 3: ENGAGEMENT

| Component | Status | Backend | Frontend | Assumptions / Notes |
|-----------|--------|---------|----------|---------------------|
| **3.1.1 Like Posts** | Done | Like model; POST/DELETE like. | PostCard; double-tap. | None. |
| **3.1.2 Like Stories** | Partial | StoryView; no separate “story like”. | May not have heart on story. | **Assumption:** Add StoryLike or store like in StoryView; show heart in viewer list. |
| **3.2 Comments** | Done | Comment CRUD, replies. | Comment UI, reply, like. | Add edit comment (15 min) and “edited” indicator if not present. |
| **3.3 Share** | Done | Share model; POST /messages/share-post, POST /stories/share-post. | PostCard: Copy link, Share to DM (user search + send), Share to Story; profile Share (Web Share + copy + toast). | None. |

---

## SECTION 4: SAVE & COLLECTIONS

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **4.1.1 Save Posts** | Done | SavedPost; collection optional. | Save to collection or default. | None. |
| **4.1.2–4.1.4 Collections** | Done | Collection CRUD; listSaved. | Saved page; create/manage collections. | **Assumption:** Share collection: generate link or “Share to DM” (view-only link or snapshot). |

---

## SECTION 5: DIRECT MESSAGES

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **5.1.1 Send Message** | Done | Message, MessageRecipient; send. | Messages, NewMessage. | None. |
| **5.1.2 Message Requests** | Done | getThreads returns threads + requests (by follow); POST /messages/hide/:userId to hide conversation. | Messages: request row with Accept (follow), Delete (hide), Block (block). | None. |
| **5.1.3 Voice Messages** | Not Started | No voice message type or storage. | No record/send voice. | **Assumption:** New message type or attachment; record up to 1 min; store file (e.g. upload); play in thread. |
| **5.1.4 Photo/Video in DMs** | Partial | Messages may support attachment. | May need attach button + view once. | **Assumption:** Attach media to message; optional “view once” (delete after first open). |
| **5.1.5 GIFs in DMs** | Not Started | No GIF attachment. | No GIPHY in composer. | **Assumption:** GIPHY picker in DM composer; send as message type or URL. |
| **5.1.6 Message Reactions** | Done | Reaction model. | Reactions in Messages. | None. |
| **5.2.1 Delete Messages** | Done | Delete message; “unsend” if recent. | Delete for me / for everyone. | **Assumption:** “Delete for everyone” within 1 hour; show “Message unsent” to recipient. |
| **5.2.2 Mute Conversation** | Done | ConversationMute model; POST/DELETE /messages/mute/:userId (duration: 15m/1h/8h/24h/always); getThreads returns mutedUntil. | Messages: mute/unmute in thread list and thread header (options menu). | None. |
| **5.2.3 Pinned Chats** | Done | PinnedChat model. | Pin in inbox. | None. |
| **5.3 Group Chats** | Partial | Group, GroupMember models. | May have basic group UI. | **Assumption:** Create group (2–50), name, photo; group polls (message type or separate); admin add/remove/rename; leave group. |

---

## SECTION 6: PRIVACY & SAFETY

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **6.1 Block** | Done | Block model; block list. | BlockedAccounts; block from profile. | **Assumption:** “Block new accounts from this user” option (store and check when new account created by same user). |
| **6.2 Restrict** | Partial | Restrict model; restrict/unrestrict. | RestrictedAccounts; restrict from profile. **Gap:** Comment approval (isHidden, queue, approve UI) not implemented. | **Assumption:** Comment approval queue for restricted users’ comments (visible only to commenter until approved). |
| **6.3 Mute** | Done | Mute model. | MutedAccounts; mute posts/stories. | None. |

---

## SECTION 7: STAR TIER PREMIUM ($1/MONTH)

| Sub-Component | Status | Backend | Frontend | Assumptions / Notes |
|---------------|--------|---------|----------|---------------------|
| **7.1 Ad-Free** | Not Started | No ad serving in codebase. | No ads. | **Assumption:** When ads are added, gate by subscriptionTier === 'STAR'. |
| **7.2 Profile Visitors** | Partial | ProfileView; recordProfileView on GET /accounts/:id; hideProfileVisits; getProfileVisitors (Star); GET /accounts/me/profile-visitors. | No “Who viewed” UI. | **Assumption:** AnalyticsEvent or ProfileView model; record view on profile load; Star-only endpoint; “Hide my visits” (reciprocal). |
| **7.3 Anonymous Story Viewing** | Not Started | StoryView identifies viewer. | No anonymous option. | **Assumption:** Allow “view anonymously” (e.g. 2/day); don’t write viewerId or use anonymous flag. |
| **7.4 Download Protection** | Not Started | No screenshot detection or download flag. | No setting. | **Assumption:** Per-post “disable download”; client-side screenshot detection (best-effort); notify on screenshot (Star). |
| **7.5 Voice Commands** | Not Started | N/A. | N/A. | **Assumption:** Client-side speech-to-intent; map to navigation/post/message actions. |
| **7.6 Priority Support** | Not Started | No ticket system. | No priority queue. | **Assumption:** Support ticket system; Star users get priority queue and 4h SLA. |
| **7.7 Message Blocked User** | Partial | PremiumBlockedMessage exists. | May not be wired for “send to blocked user”. | **Assumption:** 1 message per 28 days to blocked user, 150 chars; recipient sees “from blocked user”; expires 14 days. |

---

## IMPLEMENTATION ASSUMPTIONS (GLOBAL)

1. **Auth:** Phone verification and JWT login/register are implemented or will be; guide’s rate limits and code expiry (e.g. 10 min) apply.
2. **Tiers:** Personal FREE vs STAR is driven by `subscriptionTier`; capabilities (maxLinks, canSchedulePosts, canAnalytics) already differ.
3. **Minors:** Age from User.dateOfBirth; apply default private, DM restrictions, and content filters when age < 18.
4. **Username:** Reserve list and 14-day change limit to be added.
5. **Stories:** Sticker types (poll, quiz, countdown, etc.) stored as JSON; clients render them; some need backend (e.g. poll votes).
6. **Highlights:** Created from archived stories; archive implied by Story lifecycle or explicit “save to archive” when archive setting ON.
7. **Star features:** Gated by subscriptionTier === 'STAR' and, where needed, by feature flags.

---

## NEXT STEPS (PRIORITY)

1. **High:** Add pronouns to PersonalProfile in-profile edit modal and PATCH (done in code below).
2. **High:** Implement phone verification and register/login (replace 501).
3. **High:** Remove follower (backend + Settings UI).
4. **Medium:** Story creation: reply/reshare toggles, sticker types (poll, countdown, link).
5. **Medium:** Profile visitors (Star): track + endpoint + “hide my visits”.
6. **Medium:** Message requests folder and accept/delete/block.
7. **Lower:** Photo/video editing in-app, voice messages, anonymous story view, download protection.

---

*This roadmap should be updated as features are implemented. Refer to the Functional Guide for full behavior and examples.*

**See also:** [PERSONAL_ACCOUNT_ASSUMPTIONS_AND_GAPS.md](./PERSONAL_ACCOUNT_ASSUMPTIONS_AND_GAPS.md) for assumptions, schema gaps, and external dependencies.
