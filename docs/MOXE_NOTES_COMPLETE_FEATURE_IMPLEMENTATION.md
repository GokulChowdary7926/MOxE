# MOxE Notes - Complete Feature Implementation

## A Modern, Enhanced Version of Notes for MOxE

## Executive Summary

MOxE Notes is an ephemeral messaging feature for short updates shown in the Direct Message area.
It is designed for all MOxE account types (Personal, Business, Creator, Job) with privacy-first controls,
tiered limits, and professional tools for paid tiers.

Key differentiators:
- Tier-based character limits and duration.
- Audience controls (mutuals, close friends, custom lists).
- Scheduling and analytics for premium tiers.
- Support for multiple note types (text, music, video, poll, link).

## Feature Overview

MOxE Notes are temporary updates shown near the top of messaging surfaces.

Core characteristics:
- Location: DM context.
- Duration: 24h default, extendable by tier.
- Character limit: tier-based (Free/Star/Thick).
- Format: text plus optional rich note types.
- Audience: mutual followers, close friends, and custom lists.
- Interactions: likes, replies (DM thread), reactions.

## Account Tier Matrix

| Feature | Free | Star | Thick |
|---|---:|---:|---:|
| Character limit | 60 | 120 | 200 |
| Duration | 24h | 48h | 72h |
| Scheduled notes | No | Yes | Yes |
| Max active/scheduled notes | 1 | 3 | 5 |
| Custom list audience | No | Job only | Yes |
| Poll notes | No | Business/Creator/Job | Business/Creator/Job |
| Analytics | No | Limited | Full |
| Promoted notes | No | Optional | Optional |

## Note Types

- `text`: short update with optional emoji/background.
- `music`: selected clip + artist metadata.
- `video`: short looping clip.
- `poll`: quick options with one-vote-per-user.
- `link`: URL with preview metadata.

## Backend Implementation (MOxE Stack)

### Data Model (Prisma-aligned guidance)

Create a `Note` model and related models in Prisma (instead of Mongoose), for example:
- `Note`: owner, type, content JSON, appearance, audience, schedule, status.
- `NoteLike`: noteId + accountId unique pair.
- `NotePollVote`: noteId + accountId unique pair + chosen option.
- `NoteAnalyticsHourly`: optional aggregated analytics rows.

Recommended fields:
- `id`, `accountId`, `accountType`, `tier`.
- `type` (`TEXT`, `MUSIC`, `VIDEO`, `POLL`, `LINK`).
- `contentJson` (JSON), `appearanceJson` (JSON), `audienceJson` (JSON).
- `publishAt`, `expiresAt`, `status` (`ACTIVE`, `SCHEDULED`, `EXPIRED`, `DELETED`).
- `createdAt`, `updatedAt`.

Indexes:
- `(accountId, status)`
- `(publishAt, status)`
- `(expiresAt, status)`

### API Endpoints

Suggested REST endpoints:
- `POST /api/notes` create note.
- `GET /api/notes` list visible notes.
- `GET /api/notes/my` fetch own active note.
- `DELETE /api/notes/:id` delete note.
- `POST /api/notes/:id/like` like note.
- `POST /api/notes/:id/reply` reply via DM.
- `POST /api/notes/:id/poll` poll vote.
- `POST /api/notes/:id/schedule` schedule note (premium).
- `GET /api/notes/:id/analytics` analytics (premium).
- `POST /api/notes/:id/promote` promote note (premium).

### Validation Rules

- Enforce tier char limit before create/update.
- Enforce note count limits for scheduled/active notes.
- Enforce audience eligibility on read.
- Enforce expiry and scheduled publish timestamps.
- Enforce one-like and one-vote constraints.

### Real-Time Events

Emit socket events for:
- `note:created`
- `note:expired`
- `note:liked`
- `note:deleted`

Use account-scoped rooms so only eligible viewers receive note events.

## Frontend Implementation

### Routes

- `/notes` note hub.
- `/notes/new` new note composer.
- Optional child routes for location/song/share setup.

### Components

- `NotesSection`: horizontal note row + create action.
- `NoteBubble`: note rendering + interactions.
- `CreateNoteModal`: type selection + audience + schedule.
- `NoteAnalytics` (premium): impressions, likes, replies, rates.

### UX Rules

- Show "Your note" first.
- Show remaining characters live.
- Disable submit when invalid/empty.
- Respect audience and tier constraints from backend response.
- Display premium upsell copy when feature is locked.

## Privacy and Safety

- Default audience is account privacy-aware.
- Allow muting notes from specific users.
- Hide blocked users' notes.
- Teen account restrictions can narrow visibility to approved audiences.

## Rollout Plan

1. **Phase 1 (Core):** text notes + 24h expiry + mutual/close friends.
2. **Phase 2 (Premium):** tier limits + scheduling + poll/link notes.
3. **Phase 3 (Advanced):** analytics, promotion, custom audiences.
4. **Phase 4 (Scale):** optimization, moderation tooling, A/B experiments.

## Current Project Alignment

This repository already contains:
- Notes routes/pages on frontend (`/notes`, `/notes/new`).
- Message page integration points for Notes UX.

Next engineering step is implementing the backend note API and Prisma models,
then wiring frontend notes pages from static UI to API-backed real-time data.
