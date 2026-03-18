# Story, Post, Reels & Live – Bugs Fixed and Architecture Notes

Summary of fixes applied to stories, posts, reels, and live features (functions, architecture, API usage). Use this for troubleshooting and further refactors.

---

## 1. API base (architecture)

**Issue:** Many pages used `const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api'` instead of the shared `getApiBase()` from `services/api`. That can break when the app is served from different origins or when the env contract changes.

**Fix:** All story, post/create, reels, and live pages now use `getApiBase()` (and `getToken()` where auth is needed).

| Area   | Files updated |
|--------|----------------|
| Stories | `StoryViewer.tsx`, `CreateStory.tsx`, `StoryArchive.tsx`, `ManageHighlights.tsx`, `HighlightViewer.tsx` |
| Post/Create | `CreatePost.tsx`, `CommentThread.tsx` |
| Reels  | `CreateReel.tsx` (Reels.tsx already used getApiBase) |
| Live   | `Live.tsx`, `LiveWatch.tsx`, `LiveReplay.tsx` |

**Pattern to use elsewhere:**

```ts
import { getApiBase, getToken } from '../../services/api';
const API_BASE = getApiBase();
// For authenticated requests:
const headers: HeadersInit = {};
const token = getToken();
if (token) headers.Authorization = `Bearer ${token}`;
fetch(`${API_BASE}/your/endpoint`, { headers })
```

---

## 2. Live – auth on requests

**Issue:** `Live.tsx` called `/live` and `/live/replays` with no `Authorization` header, so logged-in users didn’t send auth.

**Fix:** Both fetches now send `Authorization: Bearer <token>` when `getToken()` is present. Same for `LiveWatch.tsx` (live detail) and `LiveReplay.tsx` (replay).

---

## 3. Reels – initial load and “load more”

**Issue:** `loadReels` was in a `useCallback` with `[nextCursor]` in the dependency array. When the first response set `nextCursor`, `loadReels` changed and the `useEffect(() => loadReels(null), [loadReels])` ran again, causing a second initial load.

**Fix:** A ref holds the current `nextCursor`; `loadReels` has an empty dependency array and reads from that ref for the “load more” guard. The initial effect now runs only once; “load more” still uses the latest cursor when the user scrolls.

---

## 4. Story viewer – error and retry

**Issue:** When story load failed, the user saw the error message but had no way to retry.

**Fix:** Added a “Try again” button in the error state. Clicking it clears the error, sets loading, and increments a `retryKey` that is in the `useEffect` dependency list, so the same load effect runs again and refetches stories.

---

## 5. Remaining / follow-up (not changed)

- **StoryViewer / FeedPost size:** Very large components with many `useState` values. Consider splitting into smaller components or custom hooks (e.g. story interactions, poll/question/emoji, likes sheet).
- **FeedPost:** Already uses `getApiBase()` and `getToken()`; no change.
- **PostDetail:** Already uses `getApiBase()` and `getToken()`; no change.
- **Error boundaries:** No global or route-level error boundary was added; consider adding one for story/post/reel/live routes to catch render errors.
- **Loading/empty UI:** Most screens have loading and error state; some could add explicit empty states (e.g. “No stories”) and consistent skeletons.
- **ThemedButton:** StoryViewer uses `ThemedButton` with `onPress`; ensure this component supports `onPress` (React Native–style) or use `onClick` if it’s web-only.

---

## 6. Quick checklist for future changes

When touching story, post, reels, or live:

- [ ] Use `getApiBase()` and `getToken()` from `services/api` for any new fetch.
- [ ] Send `Authorization: Bearer <token>` for endpoints that require auth.
- [ ] Avoid putting frequently changing state (e.g. cursor) in `useCallback` deps if it would retrigger a “load once” effect; use a ref when the callback needs the latest value.
- [ ] On load failure, show an error and a retry (or equivalent) where it makes sense.
- [ ] Prefer extracting large blocks (e.g. story stickers, comment thread) into subcomponents or hooks to keep main components readable and testable.

---

## 7. Files modified (summary)

| File | Change |
|------|--------|
| `pages/stories/StoryViewer.tsx` | getApiBase(); retry key + “Try again” on error |
| `pages/stories/CreateStory.tsx` | getApiBase() |
| `pages/stories/StoryArchive.tsx` | getApiBase() |
| `pages/stories/ManageHighlights.tsx` | getApiBase() |
| `pages/stories/HighlightViewer.tsx` | getApiBase() |
| `pages/create/CreatePost.tsx` | getApiBase() |
| `pages/comments/CommentThread.tsx` | Use getApiBase() instead of env |
| `pages/create/CreateReel.tsx` | getApiBase() |
| `pages/reels/Reels.tsx` | nextCursorRef + stable loadReels (no nextCursor in deps) |
| `pages/live/Live.tsx` | getApiBase(), getToken(), auth headers on /live and /live/replays |
| `pages/live/LiveWatch.tsx` | getApiBase(), getToken(), auth header on live detail |
| `pages/live/LiveReplay.tsx` | getApiBase(), getToken(), auth header on replay |

This should improve consistency, avoid double initial load in Reels, and give users a way to retry when story load fails. For deeper UI/UX or architectural refactors (e.g. splitting StoryViewer or FeedPost), use this doc as a baseline and plan changes incrementally.
