# Ownership vs Other Users – UI & Data Patterns

This document defines how the app differentiates **own account** (current user) from **other users** across all features and components. Use it to keep behavior and UI consistent.

> **Deep dive (v2):** [`docs/MOXE_OWNERSHIP_AND_OTHERS.md`](../../docs/MOXE_OWNERSHIP_AND_OTHERS.md) — JWT, Prisma, sockets, privacy, testing. **Platform overview:** [`docs/MOXE_PLATFORM_OVERVIEW.md`](../../docs/MOXE_PLATFORM_OVERVIEW.md).

## 1. Detecting ownership

- **Profile / identity**
  - **Own:** `!username || currentAccount?.username === username` (no param = own; or same username).
  - **Other:** `username && currentAccount?.username !== username`.
- **Content (post, story, reel, message)**
  - **Own:** `authorId === currentAccount?.id` or `accountId === currentAccount?.id` (or equivalent from API).
  - **Other:** IDs differ.
- **Lists (followers, following, blocked, muted)**
  - **Own list:** Viewing *my* followers/following (e.g. from my profile).
  - **Other’s list:** Viewing another user’s followers/following (from their profile).

Use a single derived flag per screen, e.g. `isOwn`, `isOwnProfile`, `isOwnPost`, and branch UI and actions on that.

## 2. UI rules by context

### Profile
- **Own:** Show “Edit profile”, “Settings”/“Accounts”, “Your story”/“Add story”, “New” highlight, account-type actions (Insights, Promotions, etc.). Do **not** show Follow, Message (as “message this user”), or Subscribe.
- **Other:** Show Follow/Following, Message, Subscribe (if creator). Show Block in header/menu. Do **not** show Edit, Settings, or “New” highlight. Optional: “Share profile”, “Report”.

### Posts / feed / reels
- **Own:** Show Edit/Delete in post menu; “…” or “More” can include “Edit”, “Delete”, “Archive”. Like/comment/share are normal.
- **Other:** No Edit/Delete. Show Report, Share, “Not interested”, etc. Like/comment/share unchanged.

### Messages / DMs
- **Own message:** Align right (or “me” style); optional “Edit”/“Unsend” in bubble menu.
- **Other’s message:** Align left; no Edit/Unsend. Show report/block if needed.

### Nearby messaging
- **Own post:** Header shows your display name and @username; menu can include “Delete” (when supported).
- **Other’s post:** Header shows their name/handle; menu can include “Report”, “Block”, no Delete.

### Settings / account
- All settings screens are **own only**. If reached with another user’s context, redirect to own profile or show “You can’t edit this account”.

### Lists (followers, following, blocked, muted)
- **Own list:** “Remove”/“Unblock”/“Unmute” etc. as appropriate; manage list.
- **Other’s list:** Read-only; no remove/unblock for *their* list.

## 3. Data loading

- **Own:** Prefer `currentAccount` from Redux for immediate display; refresh from `/accounts/me` (and related APIs) for counts and details.
- **Other:** Load only from API by `username` or `accountId` (e.g. `/accounts/username/:username`). Do **not** use `currentAccount` for another user. Do **not** fall back to mock users for “other” profiles.
- **Content lists:** Always prefer API (feed, posts, reels, messages). Use mock/placeholder only for **own** empty state or dev fallback, and never present mock data as another user’s real data.

## 4. Real-time and counts

- **Own:** Subscribe to account-scoped events (e.g. `account:${accountId}`) for notifications, DMs, and own content updates.
- **Other:** No real-time subscription for *their* account; refetch when viewing their profile or opening their content.

## 5. Icons and labels

- Use the same icon set (e.g. Lucide) app-wide. “Edit” = Pencil; “Delete” = Trash2; “More” = MoreHorizontal; “Settings” = Settings.
- **Own:** “Edit profile”, “Your story”, “Add”, “New”.
- **Other:** “Follow”/“Following”, “Message”, “Report”, “Block”, “Share profile”.

## 6. Checklist for new features

- [ ] Define `isOwn` (or equivalent) from `currentAccount` and route/params.
- [ ] Own view: show edit/delete/settings where appropriate; hide follow/message-as-stranger.
- [ ] Other view: show follow, message, report/block; hide edit/delete for their content.
- [ ] Data: own can use Redux + API; other must use API only, no mock for other.
- [ ] Real-time: only subscribe for own account or shared rooms (e.g. DMs, nearby).
