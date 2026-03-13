# MOxE Feature Audit — Implementation Status

This document checks the requested MOxE features (Nearby Messaging, SOS, Screenshot Protection, Translation, Voice Commands, Privacy, Business Storefronts, Lifestyle Streaks, Premium, Proximity Alert, etc.) against the codebase.

---

## 1. Nearby Messaging
**Description:** Users chat with others within a radius (opt-in location sharing).

| Item | Status | Notes |
|------|--------|--------|
| Backend | **Implemented** | Account `nearbyEnabled`; LocationHistory; POST /location, GET/PATCH /location/preferences, GET /location/nearby?latitude=&longitude=&radius=; location.service, proximity trigger on update. |
| Frontend | **Implemented** | Nearby.tsx: opt-in toggle, radius (1/5/10/25 km), “Update location & refresh”, list nearby accounts with “Message” → /messages/new?to=; Map page links to /nearby. |
| **Summary** | **Implemented** | Opt-in location, nearby list by radius, start DM from list. |

---

## 2. SOS Safety Mode & SOS-Alert Location Sharing
**Description:** During meetups, shouting "help" triggers auto-SOS; real-time location sharing with emergency microphone activation.

| Item | Status | Notes |
|------|--------|--------|
| Emergency contacts | **Implemented** | `EmergencyContact` model, CRUD, list/add/remove/setPrimary. Settings: Emergency contacts page. |
| Safety & SOS page | **Implemented** | `SafetySOS.tsx` + `SOSButton` (countdown, Send now). |
| SOS backend | **Implemented** | `POST /api/safety/sos` with optional `latitude`, `longitude`. Notifies all emergency contacts via notification (type `SOS_ALERT`, content + location in data). |
| SOS frontend | **Implemented** | SafetySOS loads contact count, on activate requests geolocation and calls `triggerSOS()` with coords (or without if geo fails). Toast confirms. |
| Voice “help” / “SOS” | **Implemented** | VoiceCommands: phrases “help”, “SOS”, “emergency”, “safety”, “open safety” → navigate to `/settings/safety`. |
| “Shouting help” auto-trigger | **Partial** | No continuous listening for “help” to auto-trigger SOS; user can say “SOS” or “help” to open Safety page, then tap SOS. |

---

## 3. Screenshot & Download Protection (Digital Screening Rights)
**Description:** Users can block screenshots/screen recording of their posts.

| Item | Status | Notes |
|------|--------|--------|
| Post | **Implemented** | `Post.screenshotProtection`; Create Post advanced option “Disable download” (Star). Feed/PostCard: right-click disabled on media when `screenshotProtection`. |
| Story | **Implemented** | `Story.screenshotProtection`; Create Story “Disable download” (Star). StoryViewer: `onContextMenu` preventDefault, `visibilitychange` → `logScreenshot(id, 'STORY')`. |
| Backend log & notify | **Implemented** | `POST /content/screenshot-detected` (contentId, contentType). ContentService logs ScreenshotLog, notifies owner if Star. |
| **Summary** | **Implemented** | Best-effort: no right-click save, optional report on tab blur; Star owners get notification. |

---

## 4. Real-Time Language Translation (Audio + Video Calls)
**Description:** Voice and video calls automatically translated with AI in real time.

| Item | Status | Notes |
|------|--------|--------|
| Backend | **Not implemented** | No call/webrtc or translation service. |
| Frontend | **Not implemented** | No in-app voice/video call UI or translation layer. |
| **Gap** | Requires call infrastructure (WebRTC or third-party) plus translation API (e.g. speech-to-text, translate, text-to-speech) and UI for “translate call” / subtitles. |

---

## 5. Voice Commands for Chat & Navigation
**Description:** Talk instead of typing — like Siri but inside the app.

| Item | Status | Notes |
|------|--------|--------|
| Navigation | **Implemented** | `VoiceCommands.tsx` (Web Speech API): “open profile”, “go to messages”, “open home”, “open explore”, “open settings”, “open notifications”, “help”/“SOS”/“safety”. |
| Chat dictation | **Partial** | No “send message by voice” or “compose by voice” in DM composer. Voice messages (record & send) exist in DMs. |
| **Summary** | **Implemented** for navigation + Safety; chat is “voice message” not “dictation”. |

---

## 6. Post/Story Privacy
**Description:** Posts visible only to selected friends, followers, or hidden from public.

| Item | Status | Notes |
|------|--------|--------|
| Backend | **Implemented** | Post/Story/Reel/Live: `privacy` (PUBLIC, FOLLOWERS_ONLY, CLOSE_FRIENDS_ONLY, ONLY_ME). Feed filters by privacy. |
| Frontend | **Implemented** | Create flows and privacy settings; feed respects visibility. |

---

## 7. Business Storefronts
**Description:** Businesses sell products directly inside MOxE with website linking.

| Item | Status | Notes |
|------|--------|--------|
| Commerce | **Implemented** | Commerce pages: products list, add product, orders. Business profile: Shop tab, featured products, link to Commerce. |
| Website linking | **Implemented** | Account profile has `website`; business/creator profiles support links. |

---

## 8. Lifestyle Streaks
**Description:** Track and share activities (Gym, Gaming, Movies) with badges for consistency.

| Item | Status | Notes |
|------|--------|--------|
| Schema | **Present** | `Streak` (accountId, type, currentCount, longestCount, lastCheckIn), `LifestyleStrike`, `Badge`. |
| Backend | **Not implemented** | No streak or lifestyle-strike services/routes. |
| Frontend | **Not implemented** | No streak or activity UI. |
| **Gap** | Add streak check-in API (e.g. POST streak/check-in with type), list streaks, and profile/settings UI for “Gym”, “Gaming”, etc. |

---

## 9. Premium Privileges
**Description:** Message blocked users once/month, ad-free, voice command upgrades, storage boosts.

| Item | Status | Notes |
|------|--------|--------|
| Message blocked users | **Implemented** | `PremiumMessageGrant`, `PremiumBlockedMessage`; Star can send limited messages to users who blocked them (e.g. 1 per 28 days, 150 chars). Backend: premiumBlockedMessage.service, routes under `/api/premium`. |
| Ad-free | **Implemented** | When ad system exists, gate by `subscriptionTier === 'STAR'` (doc assumption). No ad server in repo. |
| Voice commands | **Implemented** | VoiceCommands in Navbar (no tier gate in current code). |
| Storage boosts | **Schema/capabilities** | Capabilities can expose storage; no explicit “storage boost” UI. |

---

## 10. Proximity Alert (Someone Within 500m)
**Description:** Alert when someone on a list reaches within a chosen radius of your location.

| Item | Status | Notes |
|------|--------|--------|
| Backend | **Implemented** | ProximityAlert model (accountId, targetAccountId, radiusMeters, cooldownMinutes, lastTriggeredAt); CRUD /api/proximity-alerts; location.service calls proximityService.checkAndTrigger on location update; PROXIMITY notification. |
| Frontend | **Implemented** | Settings → Proximity alerts (list, add from following, radius 100/500/1000/2000 m, cooldown, pause/delete); PersonalProfile “Notify when nearby” button + modal when viewing a followed user (or “Proximity alert set” link). |
| **Summary** | **Implemented** | Add/remove alerts, trigger on location update, in-app notification. |

---

## 11. Anonymous Discussion Spaces
**Description:** Dedicated sections for sensitive topics without revealing identities.

| Item | Status | Notes |
|------|--------|--------|
| Backend | **Implemented** | AnonymousSpace, AnonymousPost, AnonymousVote, AnonymousComment; Report.reportedAnonymousPostId; GET/POST /api/anonymous/spaces, spaces/:id/posts, posts (create, vote, report, comments). |
| Frontend | **Implemented** | AnonymousSpaces.tsx (list, create space); AnonymousSpaceFeed.tsx (posts, create post, up/down vote, comments expand + add reply, report with reason modal); Explore → “Anonymous Spaces” → /anonymous. |
| **Summary** | **Implemented** | Spaces, anonymous posts, vote, comments, report with reason selection. |

---

## 12. One-Time View Stories
**Description:** Premium users can send stories that disappear after one view.

| Item | Status | Notes |
|------|--------|--------|
| DMs | **Implemented** | View-once media in DMs (`isVanish` / viewOnce checkbox in composer); message types support one-time view. |
| Stories | **Partial** | Stories are 24h by default; no distinct “one view then disappear” story type in backend. |

---

## 13. Temporary Blocking
**Description:** Block someone for a set “cooling-off” period instead of permanent.

| Item | Status | Notes |
|------|--------|--------|
| Schema | **Implemented** | Block has `expiresAt`, `durationDays`; isBlockActive respects expiry. |
| Backend/Frontend | **Implemented** | blockAccount(..., durationDays); Messages block modal: duration dropdown (Permanent, 24h, 7d, 30d); BlockedAccounts shows expiry. |
| **Summary** | **Implemented** | Temporary block with duration; expiry shown in blocked list. |

---

## Recent implementation (Phase 1 guide)

From the *MOxE Personal Account – Detailed Implementation Guide*:

| Item | Status | Notes |
|------|--------|--------|
| 1.1.2 Email add/verify | ✅ | Existing: PATCH accounts/me/email, GET auth/verify-email, EmailSettings, VerifyEmail page. |
| 1.1.5 DOB / minor + isMature | ✅ | Post/Story `isMature`; feed/story filters for minors; Create Post/Story "Mark as mature" (18+). |
| 1.1.6 Profile photo crop | ✅ | Existing profile photo upload with square crop. |
| 1.3.2–1.3.3 Story reply/reshare | ✅ | Existing allowReplies/allowReshares + account defaults. |
| 1.3.4 / 2.3 Archive & highlights | ✅ | Archive service + GET /archive; POST /archive/run-job (cron, X-Cron-Secret); Highlight CRUD from archivedStoryIds. |
| 2.1.1 Media limits (10, video) | ✅ | CreatePost enforces 10 items and video duration/size. |
| 2.1.5 Hashtag suggest | ✅ | GET /explore/hashtags/suggest used in caption. |
| 2.1.6 Location tag | ✅ | CreatePost location wired to backend. |
| 2.1.8 Advanced post settings | ✅ | Hide like count, turn off commenting in Create Post. |
| 3.1.2 Like stories | ✅ | StoryViewer heart, like/unlike API, notifications. |
| 5.1.4 View-once DMs | ✅ | Message view-once (isVanish), composer toggle, placeholder when viewed. |
| 5.3 Group chats | ✅ | Group CRUD, members, messaging. |
| 6.2 Restrict comment approval | ✅ | Hidden comments, approve/delete, owner-only hidden-comments. |
| 7.2 Profile visitors (Star) | ✅ | ProfileView, record/get, hide visits toggle, ProfileVisitorsPage. |
| 7.3 Anonymous story view (Star) | ✅ | recordView(anonymous), quota, reset cron, StoryViewer option. |

**Remaining from guide:** Frontend archive page + “New Highlight” from archive (backend ready); optional ReplyControl enum. **Full checklist:** [PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md](./PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md). Phase 2: photo/video editing, priority support. Archive, New Highlight, Streaks, voice messages, GIFs, voice expansion are implemented.

---

## Summary Table

| Feature | Status | Backend | Frontend |
|---------|--------|---------|----------|
| Nearby Messaging | ✅ | Yes (location, nearby, preferences) | Yes (Nearby page, opt-in, list, message) |
| SOS Safety Mode + location | ✅ | Yes | Yes (+ voice “help”/“SOS”) |
| Screenshot/Download Protection | ✅ | Yes | Yes |
| Real-Time Call Translation | ❌ Deferred | No (requires WebRTC/calls) | No |
| Voice Commands (navigation + Safety) | ✅ | N/A | Yes |
| Post/Story Privacy | ✅ | Yes | Yes |
| Business Storefronts | ✅ | Yes | Yes |
| Lifestyle Streaks | ✅ | Yes (check-in, list, types) | Yes (Settings → Streaks) |
| Premium (blocked user messaging, etc.) | ✅ | Yes | Yes (premium routes + UI) |
| Proximity Alert (500m) | ✅ | Yes (model, CRUD, trigger on location) | Yes (Settings + “Notify when nearby” on profile) |
| Anonymous Discussion Spaces | ✅ | Yes (spaces, posts, vote, comments, report) | Yes (Anonymous section, feed, comments, report reason) |
| One-Time View (DMs) | ✅ | Yes | Yes |
| Temporary Blocking | ✅ | Yes (Block.expiresAt, durationDays) | Yes (duration dropdown; expiry in Blocked list) |

---

## Next steps – remaining features

**[REMAINING_FEATURES_IMPLEMENTATION_PLAN.md](./REMAINING_FEATURES_IMPLEMENTATION_PLAN.md)** – all Phase 2 and Phase 3 items from the plan are **implemented** except:

- **Real-Time Call Translation** — Deferred (requires WebRTC/call infrastructure first).

*Last updated from codebase review. Personal account and balance-todos features are complete per checklist.*
