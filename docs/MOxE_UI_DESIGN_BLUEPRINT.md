# MOxE UI Design Blueprint – MOxE-Aligned

This document is the **single source of truth** for MOxE’s MOxE-style UI: layout, typography, colors, and components. Use it for implementation and design QA.

**References:**
- **MOxE Complete Architectural Deep Dive** – Features, personas, bottom tabs, page layouts, Map tab (Nearby/People/Alerts, SOS), and workflows. MOxE mirrors this spec.
- **MOxE End-to-End Implementation Blueprint** (`MOxE_END_TO_END_BLUEPRINT.md`) – System architecture, frontend/backend/data layers, feature implementation, location deep dive, workflows, and development roadmap. Use it for full-stack planning; the current repo (React web + Node + Prisma) implements the same patterns and can evolve toward that target stack.
- **MOxE Web / Mobile Alignment** (`MOXE_WEB_MOBILE_ALIGNMENT.md`) – Design tokens, bottom nav, and screen layout are aligned between the web app (FRONTEND) and the mobile app (MOBILE). Follow it for consistent UI end-to-end.

---

## 1. Architecture & Navigation (MOxE Pattern)

### 1.1 Shell
- **Container:** Single column, max-width **428px** (mobile-first), centered on larger screens.
- **Background:** `#000000` (dark default).
- **Safe areas:** Top/bottom padding for notched devices via `env(safe-area-inset-*)`.

### 1.2 Top Bar (Global Header)
- **Height:** 48px (12 in 4px grid).
- **Content:** Logo (left), primary actions (right): Create (+), Notifications (bell), Menu (grid).
- **Background:** `#111111` (moxe-surface). Border bottom: `#262626` (moxe-border).
- **No** status text or extra line under the logo (MOxE: logo + icons only).

### 1.3 Bottom Tab Bar (Primary Navigation)
- **Personal:** Home | Explore | Reels | Map | Messages | Profile.
- **Creator:** Home | Explore | Reels | Map | Messages | **Professional** (Creator Studio; Profile via menu).
- **Business:** Home | Explore | **Shop** | Map | Messages | Profile.
- **Job:** Home | Projects | Map | Messages | Profile.
- **Height:** ~56px + safe-area-pb. Icons 24px; labels 10px, medium weight.
- **Active tab:** Primary color (`#0095f6`). Inactive: `#ffffff` (moxe-text).
- **Background:** moxe-surface, border-top: moxe-border.

### 1.4 Secondary Navigation (Stack)
- **Sub-screens:** Back button (left), title (center), optional action (right).
- **Header height:** 48px. Back: ChevronLeft + “Back” (sr-only on small, visible on md+ if desired).
- **Content area:** Full width; horizontal padding **16px** unless fullBleed (Home, Reels).

---

## 2. Layout & Spacing

| Token       | Value | Usage                    |
|------------|-------|---------------------------|
| moxe-xs    | 4px   | Tight gaps, icon padding  |
| moxe-sm    | 8px   | Inline gaps              |
| moxe-md    | 16px  | Content padding, sections |
| moxe-lg    | 24px  | Section spacing          |
| moxe-xl    | 32px  | Large blocks             |

- **Card/input radius:** 8px (moxe-md) or 12px (rounded-xl) for cards.
- **Feed:** No side padding (fullBleed). Stories: horizontal scroll, 16px padding start.

---

## 3. Typography

- **Font stack:** `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif` (no Lobster for UI).
- **Scale:**

| Token         | Size  | Line height | Weight | Use case           |
|---------------|-------|-------------|--------|--------------------|
| moxe-caption  | 12px  | 1.4         | default| Captions, labels   |
| moxe-body     | 14px  | 1.5         | default| Body text          |
| moxe-body-lg  | 16px  | 1.5         | default| Emphasized body    |
| moxe-title    | 18px  | 1.3         | 600    | Screen titles      |
| moxe-title-lg | 20px  | 1.3         | 600    | Large titles       |
| moxe-headline | 24px  | 1.2         | 600    | Hero / empty state |

- **Semantic:** Use `text-moxe-body`, `text-moxe-caption` etc. Avoid raw pixel sizes in components.

---

## 4. Colors (Dark Default – MOxE-Like)

| Role           | Token            | Hex       | Use                    |
|----------------|------------------|-----------|------------------------|
| Background     | moxe-background  | #000000   | Page, shell            |
| Surface        | moxe-surface     | #111111   | Header, cards, inputs  |
| Text primary   | moxe-text        | #ffffff   | Body, titles           |
| Text secondary | moxe-textSecondary| #8e8e8e  | Captions, hints        |
| Border         | moxe-border      | #262626   | Dividers, inputs       |
| Primary        | moxe-primary     | #0095f6   | Links, active tab, CTAs|
| Accent         | moxe-accent      | #e1306c   | Likes, highlights     |
| Success        | moxe-success     | #00c853   | Success state          |
| Danger         | moxe-danger      | #ff5252   | Errors, destructive    |
| Story ring     | moxe-storyRing   | #f09433   | Story avatar gradient  |

- Prefer semantic classes: `bg-moxe-surface`, `text-moxe-textSecondary`, `border-moxe-border`.

---

## 5. Key Screens (MOxE Parity)

### 5.1 Home
- **Layout:** Full-bleed. Story tray (horizontal scroll) → Feed (vertical list).
- **Story tray:** “Your Story” (add) + circles (64px) with labels; gradient ring for unseen.
- **Feed:** Post cards (avatar, header, media, actions). No side padding.

### 5.2 Explore
- **Layout:** Search bar, then grid (e.g. 3 columns) or mixed content. Rounded corners (rounded-xl) on tiles.

### 5.3 Reels
- **Layout:** Full-bleed vertical scroll. Sticky header: Back + “Reels”. Player per reel.

### 5.4 Map (MOxE – MOxE-style location)
- **Layout:** Search bar (places/users) → map canvas → **floating SOS button** (always visible) → bottom sheet tabs **[Nearby] [People] [Alerts]**.
- **Nearby:** Nearby places (businesses, landmarks); list + map pins when available.
- **People:** Nearby people (opt-in); list with Message action; respects Ghost Mode.
- **Alerts:** Proximity alerts (trusted contacts, radius, cooldown).
- **SOS:** Red floating button on map; tap → confirm → send location to emergency contacts.

### 5.5 Profile
- **Layout:** Header (username, menu). Stats row (Posts / Followers / Following). Bio. Content tabs (Grid / Tagged). Grid: 3 columns, equal aspect or 1:1.

### 5.6 Messages
- **Layout:** List of conversations; search at top. Thread: bubbles, input at bottom.

### 5.7 Notifications / Activity
- **Layout:** Back + title “Notifications” or “Activity”. List of items (like, comment, follow). Empty state: icon + “No notifications yet” + short copy.

### 5.8 Settings
- **Layout:** Back + “Settings”. Search settings (optional). Sections: “Your account”, “How you use MOxE”, “Privacy & safety”. Each section: card (rounded-xl) with rows (label, value, chevron). Rows: py-3 px-4, border-b last:border-b-0.

### 5.9 Create (Post / Story / Reel)
- **Layout:** Back + “Create …” + “Share”/“Post”. Media area, caption, location, tag people, advanced settings. Same header pattern as other stacks.

---

## Architecture map (MOxE doc → MOxE)

| Layer | MOxE | MOxE |
|-------|-----------|------|
| **Presentation** | React Native UI components | React (web) – ThemedView, PageLayout, FeedPost, StoryCircle, etc. |
| **Application** | Redux/MobX, tab/stack nav | Redux (auth, account), React Router, BottomNav by account type |
| **Domain** | Feed algorithm, ranking, moderation | feed.service, post.service, reel.service, analytics, job/*, map/location |
| **Data** | GraphQL, REST, WebSocket | REST under /api/*, WebSocket for DMs/Live |
| **Account types** | Personal, Creator, Business, Job | PERSONAL, CREATOR, BUSINESS, JOB (useAccountType, capabilities) |
| **Map tab** | [Nearby] [People] [Alerts], SOS floating | Map.tsx: same tabs; SOS floating button + confirm modal |
| **Bottom tabs** | Personal: 5; Creator: Professional; Business: Shop; Job: Projects | BottomNav.tsx: Shop for Business, Professional for Creator |

---

## 6. Components

- **PageLayout:** Optional back + title + right; content area with optional px-4 and pb-20. Use for all stack/sub-screens (Settings, Activity, Notifications, Saved, Advanced, Safety, etc.). **Equivalent:** ThemedHeader with back link + title + content area (same pattern).
- **SettingsSection:** Section title (11px, uppercase, tracking) + card (rounded-xl, moxe-surface, moxe-border).
- **SettingsRow:** Label (left) + value/chevron (right); tappable row.
- **Empty state:** Centered icon + title + short description; primary CTA when needed.
- **Error state:** Short message + “Try again” (or retry) where applicable (feed, saved, profile).

---

## 7. Workflows

- **Auth:** Login / Register → (optional) Verify → Home. No header/nav until authenticated.
- **Content creation:** Tab/header “+” → type (post/story/reel) → capture/upload → caption/settings → Share.
- **Profile:** Tap avatar/username → Profile. Edit → Settings > Account. Followers/Following → list.
- **Activity:** Header bell → Notifications (or Activity). Filter: All / Mentions if supported.
- **Settings:** Profile menu (grid) → Settings. Sub-screens: Back + title; same row/card pattern.

---

## 8. Consistency Checklist (MOxE parity)

- [x] **Shell:** max-width 428px, centered, `.mobile-shell` in CSS; safe-area-pt/pb on header and main.
- [x] **Top bar:** Logo (left), Create (+), Notifications (bell), Menu (grid) only; no status text under logo. Shop / Voice in menu.
- [x] **Bottom nav:** Account-aware (Personal: Home, Explore, Reels, Map, Messages, Profile; Creator: Professional instead of Profile; Business: Shop instead of Reels; Job: Projects, Map, Messages, Profile).
- [x] **PageLayout:** Used for Explore, Settings, Notifications, Activity, Map, Saved, etc.; back + title + content with px-4 or fullBleed.
- [x] **Home / Reels:** fullBleed where specified; Story tray + feed on Home.
- [x] **Map:** Tabs [Nearby] [People] [Alerts]; SOS floating button + confirm modal.
- [ ] All main screens use PageLayout or equivalent (back + title + content padding).
- [ ] Typography uses moxe-* tokens; no ad-hoc font sizes.
- [ ] Colors use moxe-* semantic tokens; no raw hex in components.
- [x] Empty and error states: message + "Try again" on feed, saved, profile, activity where applicable.

---

## 9. MOxE UI reference – Settings & sub-features (from reference screens)

Use these patterns so MOxE settings and sub-features match MOxE's look and behaviour.

### 9.1 Settings sub-screens (stack)
- **Header:** Back (chevron left), **title centered**, no right icon unless needed.
- **Background:** Dark (moxe-background); content uses moxe-text / moxe-textSecondary.

### 9.2 Account privacy
- **Title:** "Account privacy".
- **Block:** "Private account" label (bold) with a **horizontal toggle** on the right (off = public, on = private). Toggle: capsule track, round thumb; primary color when on.
- **Copy (below toggle):** Two short paragraphs: (1) Public: "When your account is public, your profile and posts can be seen by anyone, on or off MOxE, even if they don't have an account." (2) Private: "When your account is private, only the followers that you approve can see what you share, including your photos or videos on hashtag and location pages, and your followers and following lists. Certain info on your profile, such as your profile picture and username, is visible to everyone on and off MOxE."
- **Link:** "Learn more" in primary color (moxe-primary).

### 9.3 Notification / preference sub-screens (e.g. "Posts, stories and comments", "Following and followers", "Messages", "Email notifications", "From MOxE", "Live and reels")
- **Sections:** Bold section heading; then **radio options** (Off / On, or Off / From profiles I follow / From everyone, etc.); **example/helper text** below in lighter grey (e.g. "johnappleseed added your photo to their post.").
- **Radio:** Circle outline; selected = filled inner circle; options on the right of each row.

### 9.4 Story viewer (full-screen)
- **Top:** Segmented progress bar; **header row:** avatar + username + time; "Watch Full Reel >"; more (⋯) and close (X); duration. **Reactions:** quick bubbles or emoji grid; "Send message..." input at bottom; tap zones for prev/next and like.

### 9.5 Time management – Daily limit
- **Title:** "Daily limit". **Description:** one short paragraph. **Options:** radio list: "15 minutes", "30 minutes", "45 minutes", "1 hour", "2 hours", "Off".

### 9.6 Not interested / Your activity
- **Header:** Back + title; optional "Select". **Toolbar:** sort dropdown; "Remove multiple" action. **Body:** explanatory paragraph; grid of thumbnails (play icon for video).

### 9.7 Music selection (Reels/Stories)
- **Search:** "Search music". **Tabs:** "For you" | "Trending" | "Saved". **Integration card** (e.g. Spotify). **List:** cover, title, artist, "X reels", duration, bookmark.

### 9.8 Components to use
- **PageLayout** for all; **SettingsRadioSection** (heading + radio options + example text); **Toggle** (capsule + thumb) for binary; typography: section titles bold, options moxe-body, example text moxe-caption/moxe-textSecondary.
