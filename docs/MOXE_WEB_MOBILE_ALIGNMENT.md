# MOxE Web / Mobile UI Alignment

The **MOxE web app** (FRONTEND) is aligned with the **MOxE mobile app** (MOBILE) so that layout, style, and navigation match end-to-end. Use this doc when adding or changing UI.

## Design tokens (shared)

Web Tailwind tokens map to mobile theme:

| Mobile (`MOBILE/src/theme/`) | Web (Tailwind) |
|-----------------------------|----------------|
| `theme.colors.background`   | `bg-moxe-background` (#000000) |
| `theme.colors.surface`      | `bg-moxe-surface` (#111111) |
| `theme.colors.text`         | `text-moxe-text` (#ffffff) |
| `theme.colors.textSecondary` | `text-moxe-textSecondary` (#8e8e8e) |
| `theme.colors.border`       | `border-moxe-border` (#262626) |
| `theme.colors.primary`      | `text-moxe-primary` / `bg-moxe-primary` (#0095f6) |
| `theme.colors.accent`       | `text-moxe-accent` (#e1306c) |
| `theme.colors.danger`       | `text-moxe-danger` (#ff5252) |
| `theme.spacing.md` (16)     | `moxe-md` (16px) |
| `theme.spacing.sm` (8)      | `moxe-sm` (8px) |
| `theme.radius.md` (8)       | `rounded-moxe-md` (8px) |
| `theme.typography.body` (14)| `text-moxe-body` (14px) |
| `theme.typography.title` (18) | `text-moxe-title` (18px, semibold) |

Web: `tailwind.config.js` and `docs/MOxE_UI_DESIGN_BLUEPRINT.md`.  
Mobile: `MOBILE/src/theme/ThemeContext.tsx` and `tokens.ts`.

## Bottom navigation (same 5 tabs)

Both apps use the same tab order and labels:

- **Home** (Feed)
- **Explore** (or **Projects** for Job accounts)
- **Map**
- **Message**
- **Profile**

Web: `FRONTEND/components/layout/BottomNav.tsx`.  
Mobile: `MOBILE/src/navigation/MainTabs.tsx`.

## Screen layout parity

- **Home:** Story tray (horizontal) then feed. Header: logo/title + right actions (create, shop, notifications, menu, voice).
- **Profile:** Header with username + ChevronDown left; Plus and Menu right. Stats row (Posts / Followers / Following). Primary actions: Edit Profile, Promotions, Insights. Highlights row; Grid / Tagged tabs; 3-column grid.
- **Settings:** Back + title "Settings". Sections with rows (label, optional value, chevron). Same section names and order where applicable.
- **Map:** Title "Map". Sections: MOxE Map, Nearby Places, Nearby Messaging, SOS, Proximity Alerts (web cards; mobile toggles/sections).
- **Messages:** Inbox list; thread view with bubbles and input.

## Components

- **ThemedView / ThemedText / ThemedHeader / ThemedButton / ThemedInput** – Same semantics; web uses Tailwind classes, mobile uses StyleSheet with theme.
- **StoryCircle** – Avatar + label; optional “add” state; gradient ring for unseen.
- **FeedPost** – Header (avatar, username, location), media, actions (like, comment, share, save), counts, caption.

## API usage

Web uses a central API client: `FRONTEND/services/api.ts` (`getApiBase()`, `getToken()`, `fetchApi()`). All data-fetching screens use it and follow **API-first with mock fallback** so the app stays usable when the backend is down or the user is not logged in.
