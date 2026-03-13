# MOxE: Complete End-to-End Implementation Blueprint

## An Instagram-Aligned Social Platform with Location Intelligence

---

**Relationship to other docs**

- **Instagram Architectural Deep Dive** – Reference spec for features, personas, tabs, page layouts, Map (Nearby/People/Alerts, SOS), and workflows.
- **MOxE UI Design Blueprint** – Single source of truth for UI tokens, shell, and components (see `MOxE_UI_DESIGN_BLUEPRINT.md`).
- **Current codebase** – React (web) + Node/Express + Prisma + REST. This blueprint describes the target architecture; the repo implements the same patterns and can evolve toward the full stack below (e.g. React Native, microservices, polyglot persistence) per the roadmap.

---

# Table of Contents

1. [Introduction](#introduction)
2. [Current codebase vs blueprint](#current-codebase-vs-blueprint)
3. [Part 1: System Architecture](#part-1-system-architecture)
4. [Part 2: Frontend Implementation](#part-2-frontend-implementation)
5. [Part 3: Backend Microservices](#part-3-backend-microservices)
6. [Part 4: Data Layer](#part-4-data-layer)
7. [Part 5: Feature-by-Feature Implementation](#part-5-feature-by-feature-implementation)
8. [Part 6: Location-Based Features Deep Dive](#part-6-location-based-features)
9. [Part 7: Workflows and Patterns](#part-7-workflows)
10. [Part 8: Development Roadmap](#part-8-development-roadmap)
11. [Conclusion](#conclusion)

---

# Introduction

MOxE is a next-generation social platform built using Instagram’s architectural patterns, with a **unifying focus on location-based experiences**. It serves five personas (Emma, Marcus, Lena, David, Chief) through a single, adaptive codebase.

This blueprint covers:

- **Frontend** – Structure, design system (MOxE UI tokens), component library, navigation (account-aware tabs), state management.
- **Backend** – Microservices (Auth, User, Post, Feed, Story, Reels, Message, Location, Notification, Search, Analytics, Shop), API gateway, inter-service communication.
- **Data** – Polyglot persistence (PostgreSQL, Cassandra, Redis, Elasticsearch, PostGIS, Redis Geo, etc.), caching, object storage/CDN.
- **Features** – Home, Explore, Reels, Map (MOxE core), Messages, Profile, Camera/Creation, Activity, Settings.
- **Location** – MOxE Map, Nearby Places, Nearby Messaging, SOS, Proximity Alert.
- **Workflows** – Content creation/consumption, social interaction, discovery, commerce, privacy/safety.
- **Roadmap** – Phased development from MVP to scale.

---

# Current codebase vs blueprint

The repo implements the same domains as the blueprint inside a **single Node/Express app** with **Prisma** as the main data layer. Below is the mapping from blueprint “services” to current routes and backend modules.

## Backend: API routes and services

| Blueprint service / domain | Current route(s) | Current service / module |
|----------------------------|------------------|---------------------------|
| **Auth** | `/api/auth` | auth routes |
| **User / Account** | `/api/accounts`, `/api/users` | account.service, user routes |
| **Post** | `/api/posts` | post.service |
| **Feed** | (used by posts/feed) | feed.service |
| **Story** | `/api/stories` | story.service |
| **Reels** | `/api/reels` | reel.service |
| **Live** | `/api/live` | live.service |
| **Message** | `/api/messages`, `/api/message_requests` | message.service |
| **Location (MOxE Map)** | `/api/location`, `/api/map` | location.service |
| **Proximity alerts** | `/api/proximity-alerts` | proximity.service |
| **SOS / Safety** | `/api/safety`, `/api/emergency-contacts` | safety.service, emergencyContact.service |
| **Notification** | `/api/notifications` | notification.service |
| **Explore / Search** | `/api/explore` | explore.service |
| **Analytics** | `/api/analytics` | analytics.service |
| **Commerce / Shop** | `/api/commerce` | commerce.service |
| **Collections / Saved** | `/api/collections` | collection.service |
| **Privacy** | `/api/privacy` | privacy.service |
| **Follow** | `/api/follow` | follow.service |
| **Creator** | `/api/creator` | creatorSubscription.service, creatorTools.service |
| **Business** | `/api/business` | (business routes) |
| **Job (Track/Know/Flow)** | `/api/job` | job/* (flow, etc.) |
| **Drafts** | `/api/drafts` | draft.service |
| **Archive** | `/api/archive` | archive.service |
| **Highlights** | `/api/highlights` | highlight.service |
| **Reports** | `/api/reports` | report.service |
| **Ads** | `/api/ads` | ad.service, ad-billing.service |
| **Upload / Media** | `/api/upload` | upload routes |
| **Close friends** | `/api/close-friends` | closeFriend.service |
| **Groups** | `/api/groups` | group.service |
| **Support** | `/api/support` | support.service |
| **Content moderation** | `/api/content` | content.service |
| **Streaks** | `/api/streaks` | streak.service |
| **Translation** | `/api/translate` | translation.service |
| **Config / Features** | `/api/config`, `/api/features` | config, features routes |

## Frontend

- **Stack:** React (web), React Router, Redux. No React Native in repo today.
- **Shell / nav:** `MobileHeader`, `BottomNav` (account-aware: Personal, Creator, Business, Job). See `MOxE_UI_DESIGN_BLUEPRINT.md`.
- **Screens:** Home, Explore, Reels, Map (Nearby/People/Alerts + SOS), Messages, Profile, Activity/Notifications, Settings, Creator Studio, Commerce, Job (Track/Know/Flow), etc.
- **Design tokens:** moxe-* (colors, spacing, typography) in Tailwind; `PageLayout`, `SettingsSection`, `SettingsRow`, empty/error states.

## Data

- **Primary store:** Prisma (PostgreSQL or current DB).
- **No separate** Cassandra, Neo4j, Elasticsearch, or Redis Geo in repo; feed/cache logic lives in services. Evolution toward the blueprint’s polyglot persistence can follow Part 4 and the roadmap.

## Location (Map tab)

- **Implemented:** Location update, nearby users (opt-in), proximity alerts (create/list/toggle/delete), SOS (trigger + emergency contacts), location preferences (e.g. nearby on/off). Map UI: bottom sheet tabs [Nearby] [People] [Alerts], floating SOS button.
- **Not yet:** Real map tiles (e.g. Mapbox/Google), nearby *places* from a places API, Redis Geo–style real-time layer. These are natural next steps per Part 6.

Use this table to trace blueprint capabilities to existing code and to plan splits (e.g. extract Location or Feed into a separate service) when moving toward the target architecture.

---

# Part 1: System Architecture

## 1.1 High-Level Architecture

- **Client layer:** iOS, Android, Web, API clients.
- **Edge:** CDN, load balancers, API gateway.
- **Application layer:** Auth, User, Post, Feed, Story, Reels, Message, Location, Notification, Search, Analytics, Shop (and other domain services).
- **Data layer:** SQL (PostgreSQL), NoSQL (e.g. Cassandra), graph (e.g. Neo4j), search (Elasticsearch), cache (Redis), message queue (Kafka), object storage (S3), time-series as needed. Geospatial: PostGIS + Redis Geo.

## 1.2 Technology Stack (Target)

| Layer | Technology |
|-------|------------|
| Frontend (mobile) | React Native |
| Frontend (web) | React, Next.js (SSR) |
| API | GraphQL + REST |
| Backend | Python (FastAPI), Go for high-throughput |
| Relational | PostgreSQL |
| NoSQL / feeds | Apache Cassandra |
| Social graph | Neo4j |
| Search | Elasticsearch |
| Cache | Redis |
| Message queue | Apache Kafka |
| Object storage | S3 / MinIO |
| Geospatial | PostGIS, Redis Geo |

## 1.3 Scaling Estimates

- DAU: 100K → 10M; posts/day ~200K; stories ~1M; reels ~50K; messages ~5M; location updates ~10M.

---

# Part 2: Frontend Implementation

## 2.1 Project Structure (Reference)

- `components/` – common, feed, map, profile.
- `screens/` – Home, Explore, Map, Messages, Profile, etc.
- `navigation/` – account-aware bottom tabs + stacks.
- `services/` – API clients (GraphQL/REST).
- `store/` – Redux slices (auth, account, feed, location, etc.).
- `constants/` – theme (MOxE UI blueprint tokens).

## 2.2 Design System (MOxE UI Blueprint)

Use the tokens from **MOxE_UI_DESIGN_BLUEPRINT.md**: colors (background, surface, text, primary, danger, etc.), spacing (xs–xl), typography (caption, body, title, headline), radii. Implement as theme constants (e.g. `theme.colors`, `theme.spacing`, `theme.typography`).

## 2.3 Key Components

- **PageLayout** – Back, title, right slot; content area with optional padding.
- **SettingsSection / SettingsRow** – Section title + card; rows with label, value, chevron.
- **EmptyState** – Icon, title, message, optional CTA.
- **Bottom tab bar** – Account-aware: Personal (Home, Explore, Create+, Reels, Profile); Creator (Professional instead of Profile); Business (Shop instead of Reels); Job (Projects, Map, Message, Profile).

## 2.4 Navigation

- Bottom tab navigator switches tabs by account type (Personal, Creator, Business, Job).
- Each tab can have its own stack (e.g. HomeStack, MapStack, MessagesStack).
- Map tab: same for all when enabled; respects Ghost Mode / privacy.

## 2.5 State Management

- Redux (or equivalent): auth, account (current account + capabilities), feed, messages, location (user location, nearby places/users, proximity alerts, ghost mode).
- Async flows: createAsyncThunk for API calls; reducers for local state (e.g. setGhostMode, addProximityAlert).

---

# Part 3: Backend Microservices

## 3.1 Service Decomposition

| Service | Responsibility |
|---------|----------------|
| Auth | Login, tokens, sessions |
| User | Profiles, settings, account type |
| Post | Posts, media metadata |
| Feed | Feed generation (e.g. hybrid fanout) |
| Story | 24h stories |
| Reels | Video upload/processing |
| Message | DMs, real-time (WebSocket) |
| Location | Geospatial, nearby places/users, SOS, proximity |
| Notification | Push, email, SMS |
| Search | User, hashtag, place search |
| Analytics | Insights |
| Shop | Products, orders |

## 3.2 Location Service (Core for MOxE Map)

- **Update location:** Store in Redis Geo for real-time; PostGIS for history.
- **Nearby places:** PostGIS `ST_DWithin` (radius); return name, category, distance, rating.
- **Nearby users:** Redis Geo; exclude self and Ghost Mode users; opt-in only.
- **SOS:** Load emergency contacts; send notification + SMS with location and “I need help”; optional nearby emergency services.
- **Proximity alerts:** On location update, check watchers (Redis set); if within radius, send proximity notification.

## 3.3 Inter-Service Communication

- Sync: REST/GraphQL via API gateway.
- Async: Kafka (e.g. post created → feed fanout, notification, search index; location update → proximity check).

## 3.4 API Gateway

- Auth middleware: validate JWT, attach `user_id` to request.
- Route to correct service by path prefix (e.g. `/api/location` → location service).

---

# Part 4: Data Layer

## 4.1 Polyglot Persistence (Target)

| Data | Store |
|------|--------|
| User profiles | PostgreSQL |
| Auth/sessions | PostgreSQL + Redis |
| Posts / feeds | Cassandra, Redis cache |
| Social graph | Neo4j |
| Messages | Cassandra |
| Location history | PostgreSQL (PostGIS) |
| Real-time location | Redis Geo |
| Search | Elasticsearch |
| Media | S3 + CDN |

## 4.2 Schemas (Representative)

- **PostgreSQL:** `users` (user_id, email, username, bio, account_type, …); `user_locations` (user_id, location GEOMETRY, updated_at); `places` (id, name, category, location, address, rating).
- **Cassandra:** `posts_by_user`, `posts_by_time`; `messages` by conversation.
- **Neo4j:** User nodes, FOLLOWS relationships.
- **Redis:** feed cache, session, `user_locations` geoset, proximity watchers.

## 4.3 Caching (Redis)

- Feed cache per user with TTL.
- Optional live feed sorted set (e.g. last 500 items).

## 4.4 Object Storage / CDN

- Presigned upload URLs; serve via CDN with optional size variants.

---

# Part 5: Feature-by-Feature Implementation

- **Home:** Story tray + feed list; feed service (e.g. hybrid fanout); pull-to-refresh, infinite scroll.
- **Explore:** Search bar, category chips, grid gallery; search + recommendation APIs.
- **Reels:** Fullscreen vertical pager; reels service; preload next.
- **Map (MOxE core):** Map view, markers (user, places, users), SOS button, bottom sheet [Nearby] [People] [Alerts]; location service.
- **Messages:** Inbox + thread; message service + WebSocket; vanish mode, themes.
- **Profile:** Header, stats, highlights, content toggle (Posts/Reels/Mentions/Shop), grid; user + post services.
- **Camera/Creation:** Mode (Post/Story/Reels/Live), capture, edit, caption, tag, schedule/draft; media + post services.
- **Activity:** Notification list (like, comment, follow, etc.); notification service.
- **Settings:** Sections (Your activity, Privacy, Professional, Help); user/preferences APIs.

---

# Part 6: Location-Based Features Deep Dive

## 6.1 MOxE Map

- Full-screen map (e.g. Google Maps / Mapbox).
- User location (blue dot), place markers, user markers (opt-in, no Ghost Mode).
- SOS button (always visible) → confirm → send to emergency contacts.
- Bottom sheet: tabs **Nearby** (places), **People** (nearby users + Message), **Alerts** (proximity list).

## 6.2 Nearby Places

- Backend: PostGIS query within radius; return PlaceCard data (name, category, distance, rating).
- Frontend: list + map pins; tap → place page (posts, info, directions).

## 6.3 Nearby Messaging

- Backend: nearby users from Redis Geo; message service to create thread or send request.
- Privacy: message controls; if not allowed, message goes to requests.

## 6.4 SOS Emergency

- Emergency contacts from settings; on confirm, send location + “I need help” (notification + SMS).
- Optional: show nearby police/hospitals on map.

## 6.5 Proximity Alert

- User selects friends to “notify when nearby”; both opt-in.
- On location update, check distance; if within threshold, send “X is nearby” (in-app + push).
- Respect Ghost Mode (no alerts if either user in Ghost Mode).

---

# Part 7: Workflows and Patterns

- **Content creation:** Create+ → mode → capture/edit → caption/tag/location → post/schedule/draft.
- **Content consumption:** Open feed/Explore/Reels → scroll → like/comment/save/share; story viewer.
- **Social:** Notifications → post/profile/DM; DM with real-time delivery and read receipts.
- **Discovery:** Search (users, tags, places); follow; use audio (Reels).
- **Commerce:** Product tags → product page → checkout; seller: orders, fulfill, reviews.
- **Privacy/safety:** Report → reason → moderation; block/restrict/mute/limit.

---

# Part 8: Development Roadmap

## Phase 1: MVP Foundation (Months 1–3)

- Auth, user profiles, account types.
- Basic posts (images), chronological feed.
- Likes, comments, follow system.

## Phase 2: Core Social (Months 4–6)

- Stories (24h), DMs, search (users, hashtags).
- Notifications, Explore (simple).

## Phase 3: Location Intelligence (Months 7–9)

- Map tab: MOxE Map, nearby places/users, SOS, proximity alerts.
- Geotagging on posts.

## Phase 4: Monetization & Scale (Months 10–12)

- Reels, algorithmic feed, creator subscriptions, shopping, analytics.

---

# Conclusion

MOxE applies Instagram’s architecture and adds location intelligence across the stack. Use this blueprint together with:

- **Instagram Architectural Deep Dive** – for product/UX and feature list.
- **MOxE_UI_DESIGN_BLUEPRINT.md** – for UI shell, tokens, and components.

The current codebase (React web + Node + Prisma) implements the same UX and patterns; evolution toward the full target stack (e.g. React Native, microservices, polyglot persistence) can follow this roadmap.
