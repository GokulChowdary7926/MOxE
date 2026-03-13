# Personal Account — Assumptions and Gaps (Functional Guide)

This document records **assumptions** and **schema/API gaps** when implementing the MOxE Personal Account from the **Complete MOxE Personal Account Functional Guide**. It complements [MOXE_PERSONAL_ACCOUNT_IMPLEMENTATION_ROADMAP.md](./MOXE_PERSONAL_ACCOUNT_IMPLEMENTATION_ROADMAP.md).

---

## 1. Assumptions (reasonable defaults where guide is underspecified)

| Area | Assumption |
|------|------------|
| **SMS verification** | Use a provider such as Twilio (or similar); 6-digit code, 10-minute expiry; rate limit by IP (e.g. 3 attempts/hour). |
| **Email verification** | Send link with token; 24-hour expiry; block disposable domains via blocklist or allowlist. |
| **Username change limit** | Enforce “once per 14 days” using a new field `usernameChangedAt` on Account; reserved usernames from config/DB. |
| **Minors (13–17)** | Derive age from `User.dateOfBirth`; default new accounts to private; restrict DMs to “people you follow”; no monetization; optional parental controls later. |
| **Profile photo** | Square crop (e.g. 180×180 min); optional content moderation (e.g. cloud API); multiple sizes generated on upload. |
| **Bio** | 150 characters for Personal (guide); schema has 300 — enforce 150 in validation and UI. |
| **Link in bio** | FREE: 1 link (`Account.website`); STAR: up to 5 (use `Link` table like Business). |
| **Story stickers** | Store as JSON on `Story.stickers`; poll/quiz/countdown need server-side vote/reminder logic; Music/GIF via third-party (licensed catalog, GIPHY). |
| **Story archive** | When “archive” is ON, copy story media to an archive store on expiry; Highlights created from archived items. |
| **Anonymous story view** | Limit (e.g. 2/day) stored per account; “view anonymously” does not write viewerId (or uses a flag). |
| **Download/screenshot protection** | Best-effort on client (disable right-click, detect screenshot where possible); notify poster when screenshot detected (Star). |
| **Voice commands** | Client-side speech-to-intent; map phrases to actions (e.g. “Open profile”, “Message Sarah”). |
| **Priority support** | Support ticket system with a “priority” queue for Star; target 4h response. |
| **Message blocked user (Star)** | 1 message per 28 days to a user who blocked you; 150 chars; message expires in 14 days; recipient sees “from blocked user”. |

---

## 2. Schema gaps (additions needed)

| Feature | Current state | Suggested addition |
|--------|----------------|---------------------|
| Username change limit | No field | `Account.usernameChangedAt DateTime?` |
| Search visibility | Not present | `Account.searchVisibility Enum?` (EVERYONE, FOLLOWERS_ONLY, NO_ONE) or reuse privacy level |
| Activity status | Not present | `Account.showActivityStatus Boolean`; track `lastActiveAt` (Session or Account) |
| Story archive setting | Not present | `Account.storyArchiveEnabled Boolean`; optional ArchiveStory/archived_media store |
| Post alt text | Not present | `Post.altText String?` |
| Comment edit window | Comment has updatedAt | Enforce “edit within 15 min” in service; optional `editedAt` or use updatedAt |
| DM mute | Not present | `MessageRecipient.mutedUntil DateTime?` or Thread.mutedUntil |
| Profile visitors (Star) | Not present | `ProfileView` or `AnalyticsEvent` with type PROFILE_VIEW; viewerId, accountId, createdAt |
| Anonymous story view limit | Not present | `Account.anonymousStoryViewsUsed Int` + reset window (e.g. daily) |

---

## 3. External dependencies (not in repo)

| Dependency | Purpose |
|------------|---------|
| SMS provider (e.g. Twilio) | Phone verification codes |
| Email sending (e.g. SendGrid, SES) | Verification links, password reset |
| GIPHY (or similar) | GIF stickers in Stories and DMs |
| Music licensing | Story music sticker (licensed catalog) |
| Content moderation (optional) | Profile photo and post media scan |
| Payment / subscription | Star tier billing ($1/month) |

---

## 4. Implemented in this pass

- **Pronouns** on Personal profile: in-profile edit modal includes Pronouns (list + custom up to 20 chars); PATCH `/accounts/:id` sends `pronouns`; backend already supports it.
- **Roadmap** doc: section-by-section status (Done / Partial / Not Started), backend/frontend notes, and next steps.

---

*Update this file as assumptions are confirmed or schema/APIs are added.*
