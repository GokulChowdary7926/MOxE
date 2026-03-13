# MOxE – Complete Implementation Plan for All Remaining Features

Based on the latest audit and roadmap, this document lists remaining features and their technical specifications.

**Recently completed:** Temporary Blocking (duration dropdown + expiry in list), Photo Editing Tools (PhotoEditorModal: crop square/4:5/16:9, rotate, flip, brightness/contrast/saturation, filter presets + intensity), Priority Support (ticket detail + replies), Video cover frame (VideoCoverModal + CreatePost), Highlight management (HighlightManage + HighlightEdit), Anonymous Discussion Spaces (spaces, posts, vote, comments, report with reason), Nearby Messaging (location API, nearby list, opt-in, Nearby page), Proximity Alert (model, API, trigger on location, Settings list + "Notify when nearby" on profile).

**Related docs:**
- **[REMAINING_FEATURES_FUNCTIONAL_SPECIFICATION.md](./REMAINING_FEATURES_FUNCTIONAL_SPECIFICATION.md)** – **Single source of truth** for sub-features, functions, sub-functions, components, and 5+ real-world examples per feature (product, engineering, QA).
- [PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md](./PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md) (current status)
- [FEATURE_AUDIT_MOXE.md](./FEATURE_AUDIT_MOXE.md) (audit)

---

## Summary of Remaining Features

| Feature | Priority | Effort | Type | Status |
|---------|----------|--------|------|--------|
| **Photo Editing Tools** (2.1.2) | Medium | 5 days | Phase 2 – Polish | ✅ Done |
| **Video Editing Tools** (2.1.3) | Medium | 6 days | Phase 2 – Polish | ✅ Done (cover frame) |
| **Priority Support** (7.6) | Low | 8 days | Phase 2 – Premium | ✅ Done |
| **Temporary Blocking** | High (quick win) | 2 weeks | Phase 3 – Privacy | ✅ Done |
| **Nearby Messaging** | High | 4–6 weeks | Phase 3 – Location | ✅ Done |
| **Proximity Alert** | Medium | 4 weeks | Phase 3 – Location | ✅ Done |
| **Anonymous Discussion Spaces** | Medium | 6 weeks | Phase 3 – Community | ✅ Done |
| **Real-Time Call Translation** | Low | 8+ weeks | Phase 3 – Communication | Deferred (requires WebRTC/calls) |

**Total estimated effort:** ~30 weeks (if done sequentially). Parallelization possible.

---

## Completion checklist (basic MOxE & personal account)

All balance-todos and remaining features below are **implemented** end-to-end (backend + frontend) unless marked Deferred.

| Area | Sub-features / functions | Status |
|------|---------------------------|--------|
| **Photo editing** | Crop (Square, 4:5, 16:9), rotate, flip, presets (Vibrant, Cool, Warm, Noir), filter intensity, brightness/contrast/saturation, Apply → upload | ✅ |
| **Video editing** | Cover frame selection (VideoCoverModal), coverUrl in media, draft videoCovers | ✅ |
| **Priority support** | Create ticket, list, ticket detail, **replies** (SupportTicketReply, POST reply, thread UI) | ✅ |
| **Temporary blocking** | Duration (Permanent, 24h, 7d, 30d), expiry in Blocked list | ✅ |
| **Highlight management** | List (HighlightManage), Edit (HighlightEdit: rename, reorder, add/remove from archive), Delete | ✅ |
| **Anonymous spaces** | List/create spaces, posts, vote, **comments** (AnonymousComment, list/add), **report with reason** (dropdown) | ✅ |
| **Nearby messaging** | Location update, nearbyEnabled, GET nearby by radius, Nearby page (opt-in, list, message) | ✅ |
| **Proximity alert** | CRUD alerts, trigger on location update, notification, Settings list, **“Notify when nearby” on profile** | ✅ |
| **Real-time call translation** | — | Deferred (requires WebRTC/calls) |

**All partial (Personal Account) – implemented:** Story camera: Hands-free, Layout, Boomerang, **Go Live** (link to /live → createLive + navigate). Stickers: Poll, GIF, Countdown, Link, Questions, Emoji Slider, **Add Yours** (prompt, link to create with addYoursParentId, Browse responses page), **Music** (track/artist/preview URL, play in viewer), **Donation** (cause + link). Ad-free: `useAdFree()` / `AdSlot`. Live: createLive, /live/:id viewer page.

See **PERSONAL_ACCOUNT_FULL_IMPLEMENTATION.md** for full personal-account checklist and **FEATURE_AUDIT_MOXE.md** for audit status.

---

## Detailed Implementation Specifications

### 1. Photo Editing Tools (2.1.2)

**Goal:** Add in-app photo editing (filters, brightness, contrast, saturation, crop, rotate) after image selection in CreatePost.

#### Database
No changes.

#### Backend
No changes; edited image is uploaded as a new file via existing `/api/upload`.

#### Frontend
- Use `fabric.js` or `react-image-crop` + CSS filters.
- Add an "Edit" button next to each selected image in CreatePost.
- On click, open a modal with:
  - Image canvas (fabric.js) with controls:
    - Filter presets (Vibrant, Cool, Warm, Noir, etc.) – apply via `fabric.Image.filters`.
    - Sliders for brightness, contrast, saturation, warmth, sharpness, fade, highlights, shadows, vignette.
    - Crop tool (square or free) – use `react-image-crop` or fabric crop zone.
    - Rotate left/right, flip horizontal.
  - "Apply" button to save changes and replace the original image in the media list.
- After editing, upload the new image (canvas `toDataURL` or blob) and update the media array.

**Dependencies:** `fabric.js`, `react-image-crop`.

**Effort:** 5 days (FE).

---

### 2. Video Editing Tools (2.1.3)

**Goal:** Add basic video editing (trim, cover frame selection, speed adjustment) for videos in CreatePost.

#### Options
- **Client-side:** Use `ffmpeg.wasm` (heavy but possible) for trim and speed.
- **Server-side:** Upload video, then queue a background job (FFmpeg) to process.

We recommend a **hybrid** approach: client-side trim (using `MediaRecorder` or `WebCodecs`) for simplicity, and server-side for heavy processing if needed. Start with client-side trim and cover frame.

#### Backend
- Extend `POST /api/upload` to accept video and return URL.
- If server-side processing is added later, create a job queue (Bull) and a video processing service.

#### Frontend
- Add "Edit Video" button next to video thumbnails in CreatePost.
- Open modal with:
  - Video preview and timeline.
  - **Trim:** draggable handles to select start/end. Use `HTML5 video` + `currentTime` and capture via `MediaRecorder` (challenge: re-encoding). Simpler: store trim metadata (`start`, `end`) and apply on server during final processing.
  - **Cover frame:** scroll through video frames, pick one, capture via canvas.
  - **Speed slider:** 0.5x – 2x (can be applied client-side via `playbackRate` when viewing).
- On save, upload the video (if re-encoded) or store metadata. For now, we can store trim metadata in the post's `media` object and apply on playback (but this requires video support in player). Simpler: require server-side processing for final cut.

Given complexity, we may defer full video editing to a later phase and implement only cover frame selection (which can be done client-side without re-encoding). The user can then upload the whole video and choose a cover.

**Revised scope for Phase 2:**
- Cover frame selection (client-side) – save as `coverUrl` in media object.
- Trim – defer to later (or use server-side FFmpeg job).

**Effort:** 6 days (FE + BE if server processing).

---

### 3. Priority Support (7.6)

**Goal:** Provide Star users with priority support (4h SLA) via a ticketing system.

#### Options
- **Integrate third-party** (Zendesk, Freshdesk) – faster, but requires API integration and webhooks.
- **Build in-house** – more control but more work.

We'll outline an in-house solution for completeness.

#### Database
```prisma
model SupportTicket {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  subject     String
  message     String
  status      TicketStatus @default(OPEN)
  priority    TicketPriority @default(NORMAL) // HIGH for Star
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resolvedAt  DateTime?
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum TicketPriority {
  NORMAL
  HIGH
}
```

#### Backend Endpoints
- `POST /api/support/tickets` – create ticket (subject, message). If user is Star, set priority = HIGH.
- `GET /api/support/tickets` – list user's tickets.
- `GET /api/support/tickets/:id` – view ticket with replies.
- `POST /api/support/tickets/:id/reply` – add reply (user or admin).
- Admin endpoints (protected by admin role) to list all tickets, update status, assign, reply.

#### Notifications
- Send email to support team for new high-priority tickets.
- Notify user when ticket is updated.

#### Frontend
- Settings → Support → "Contact Support" form (subject, message).
- List of user's tickets with status.
- Ticket detail with reply thread.

**Effort:** 8 days (BE + FE).

---

### 4. Temporary Blocking

**Goal:** Allow users to block someone for a specific duration (e.g., 24h, 7 days, 30 days) instead of permanently.

#### Database
Add to `Block` model:
```prisma
model Block {
  // ...
  expiresAt DateTime? // if set, block automatically lifts after this time
}
```

#### Backend
- Modify `POST /blocks` to accept optional `duration` (e.g., "24h", "7d", "30d"). Convert to `expiresAt`.
- In all block checks (`isBlocked`), consider block expired if `expiresAt < now()`.
- Add a cron job to remove expired blocks (or ignore them in queries).

#### Frontend
- In block dialog (from profile or messages), add a dropdown: "Duration" with options "Permanent", "24 hours", "7 days", "30 days".
- On block, send duration to API.

**Effort:** 2 weeks (BE + FE).

---

### 5. Nearby Messaging

**Goal:** Users can discover and chat with others within a configurable radius (500m – 5km) based on real-time location.

#### Infrastructure
- Requires **opt-in location sharing**.
- Use **geospatial indexing** (PostGIS, MongoDB geospatial, or Redis Geoset) to store user's last known location and query nearby users.
- Real-time location updates via WebSocket (optional; can be periodic).

#### Database (PostGIS)
Add `location` column to `Account` (or separate `LocationHistory`):
```sql
SELECT AddGeometryColumn('public', 'Account', 'location', 4326, 'POINT', 2);
CREATE INDEX idx_account_location ON Account USING GIST (location);
```
In Prisma, use `Unsupported` or raw queries.

#### Backend
- **Location update endpoint:** `POST /api/location` – accepts `latitude`, `longitude` (from client). Store in `Account.location` (if user opted in).
- **Nearby users endpoint:** `GET /api/nearby?radius=2000` – returns users within radius (in meters) using PostGIS `ST_DWithin`. Exclude blocked/blocked-by, respect privacy settings.
- **Chat initiation:** When user wants to message a nearby user, create a DM thread if they are within radius (re-check at send time).
- Optionally, allow users to set a persistent radius preference.

#### Privacy
- Users must **opt in** to location sharing for nearby discovery.
- They can set visibility: "Everyone", "Followers Only", "Off".
- Location is only stored when app is in foreground (or background with permission).

#### Frontend
- Settings → Privacy → "Nearby discovery" toggle, radius slider.
- New tab "Nearby" in main navigation (or in Messages) showing list of users within radius with distance.
- Click on user → view profile → start DM (if within radius).
- Real-time updates via polling or WebSocket.

**Effort:** 4–6 weeks (BE + FE + DevOps for PostGIS).

---

### 6. Proximity Alert

**Goal:** Notify a user when a specific contact (e.g., friend, family) enters a defined radius (e.g., 500m).

#### Backend
- Build on the location infrastructure from Nearby Messaging.
- Add a `ProximityAlert` model: `userId`, `targetUserId`, `radius`, `lastTriggeredAt` (to avoid spam).
- When a user's location updates, check all proximity alerts where they are the target. If distance ≤ radius and cooldown passed, send a notification to the alert owner.
- Notifications: use existing push notification system.

#### Frontend
- In a user's profile, add "Notify me when nearby" button (if they follow each other or are contacts).
- Modal to set radius (e.g., 500m, 1km, 5km).
- List of active proximity alerts in Settings.

**Effort:** 4 weeks (BE + FE).

---

### 7. Anonymous Discussion Spaces

**Goal:** Create spaces where users can post anonymously (or with pseudonyms) without revealing their identity.

#### Database
```prisma
model AnonymousSpace {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdBy   String?
  createdAt   DateTime @default(now())
  isActive    Boolean  @default(true)
}

model AnonymousPost {
  id          String   @id @default(cuid())
  spaceId     String
  content     String
  authorId    String?
  createdAt   DateTime @default(now())
  isHidden    Boolean  @default(false)
  reportCount Int      @default(0)
}

model AnonymousVote {
  id        String @id @default(cuid())
  postId    String
  voterId   String
  value     Int
  @@unique([postId, voterId])
}
```

#### Backend
- CRUD for spaces (admin only or user-created with moderation).
- `GET /api/anonymous/spaces` – list public spaces.
- `POST /api/anonymous/spaces/:spaceId/posts` – create anonymous post (no author association).
- `GET /api/anonymous/spaces/:spaceId/posts` – list posts (paginated).
- Voting endpoints.
- Reporting endpoint – flags post for moderation.

#### Anonymization
- No user ID attached to posts (or store internally for moderation only, never expose).

#### Frontend
- New section "Anonymous" in main navigation.
- List of spaces; click to enter.
- Within space, feed of anonymous posts (no usernames, maybe random avatars).
- Compose post (no identity shown).
- Vote up/down.

**Effort:** 6 weeks (BE + FE).

---

### 8. Real-Time Call Translation

**Goal:** During audio/video calls, provide real-time translation of speech into the user's preferred language.

#### Prerequisites
- WebRTC call infrastructure (not currently present). This feature depends on having audio/video calls first.
- Translation API (e.g., Google Cloud Speech-to-Text, Translation, Text-to-Speech).

#### Architecture
1. User A speaks in language L1.
2. Audio is sent to a media server (or directly to peers) and also streamed to a speech-to-text service.
3. Text is translated to user B's preferred language (L2).
4. Translated text is either displayed as subtitles or converted back to speech (TTS) and injected into the audio stream.

This is complex and requires a dedicated media server (e.g., LiveKit, Janus) and integration with translation APIs.

#### Simplified approach
- Start with **subtitles only**: during a call, each user can enable translation subtitles. The app sends the local user's speech to STT, translates, and sends the translated text as a data channel message to the remote peer, which displays it as subtitles.

#### Implementation outline
- Add a "Translate" toggle in call UI.
- When enabled, capture microphone audio (via WebRTC local track) and send to backend STT service (e.g., Google Cloud Speech-to-Text).
- Backend streams translated text to the other participant(s) via WebSocket.
- Frontend displays subtitles.

**Effort:** 8+ weeks (WebRTC expertise + API integration).

---

## Recommended Implementation Order

| Phase | Order | Feature | Effort |
|-------|-------|---------|--------|
| **Phase 2 (Polish)** | 1 | Photo Editing Tools | 5 days |
| | 2 | Priority Support | 8 days (can parallelize) |
| **Phase 3.1 (Quick win)** | 3 | Temporary Blocking | 2 weeks |
| **Phase 3.2 (Location)** | 4 | Nearby Messaging | 4–6 weeks |
| | 5 | Proximity Alert | 4 weeks |
| **Phase 3.3 (Community)** | 6 | Anonymous Discussion Spaces | 6 weeks |
| **Phase 3.4 (Communication)** | 7 | Real-Time Call Translation | 8+ weeks (defer until calls exist) |

**Video Editing Tools** (cover frame first, then trim) can be added as a separate polish item after Photo Editing.

---

## Deliverables (per feature)

- PR-ready code with tests.
- Documentation for API endpoints.
- Frontend components integrated into existing UI.
- Updated feature audit (mark item as Implemented).

---

*To start implementation, confirm the order and which feature to begin with. Suggested first: **Photo Editing Tools** (high impact, FE-only) or **Temporary Blocking** (quick win, 2 weeks).*
