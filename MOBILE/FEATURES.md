# MOxE Mobile — Features & UI by Account Type

Instagram-style (dark feed, primary #0095f6) + Atlassian-style (grey header/surface) for every account. **Single source of truth for UI:** `docs/MOxE_UI_DESIGN_BLUEPRINT.md` (shell, header, bottom tabs, PageLayout, moxe tokens, key screens). Full architecture: `docs/MOxE_END_TO_END_BLUEPRINT.md`.

---

## Design system

- **Web (primary):** Tailwind with moxe-* tokens; `PageLayout`, `SettingsSection`, `SettingsRow`; `MobileHeader` (Logo, Create, Notifications, Menu); `BottomNav` by account type. See blueprint.
- **MOBILE app (React Native):** `src/theme/theme.ts` — Instagram & Atlassian colors, spacing, typography.
- **Components:**
  - **Instagram:** `MOxEAppHeader`, `InstagramHeader`, `StoryCircle`, `PostCard`.
  - **Atlassian:** `AtlassianHeader`, `AtlassianCard`, `StatusBadge`.
  - **Shared:** `Screen` (variant: instagram | atlassian), `AccountTypeBadge`.

---

## Personal account (Instagram-style)

| Feature | Screen / Component | Sub-features |
|--------|---------------------|--------------|
| **Feed** | `HomeScreen` | Story strip ("Your story" + list), post feed or empty state ("No posts yet") |
| **Explore** | `ExploreScreen` | Search, # Trending Topics pills, Discover grid |
| **Reels** | `ReelsScreen` | Placeholder for short-form video |
| **Create** | `CreatePostScreen`, `CreateStoryScreen` | Media, caption, location, tag people, advanced settings |
| **Post** | `PostDetailScreen` | Post card, comments, comment input |
| **Notifications** | `NotificationsScreen` | List (avatar, from, text, time) |
| **Profile** | `ProfileScreen` | Avatar, stats, account badge, Edit profile, Settings, Switch account, Saved, Archive, Log out |
| **Edit profile** | `EditProfileScreen` | Photo, name, bio |
| **Saved** | `SavedScreen` | Empty state |
| **Archive** | `ArchiveScreen` | Empty state |

---

## Business account (Atlassian-style)

| Feature | Screen / Component | Sub-features |
|--------|---------------------|--------------|
| **Dashboard** | `BusinessDashboardScreen` | Cards: Insights, Commerce, Team, Promotions |
| **Insights** | `InsightsScreen` | Reach/engagement cards, Top posts, Audience |
| **Commerce** | `CommerceScreen` | Products, Orders, Collections |
| **Team** | `TeamScreen` | Member list (avatar, name, role) |
| **Promotions** | `PromotionsScreen` | Active campaigns, Create promotion |

---

## Creator account (Instagram-style)

| Feature | Screen / Component | Sub-features |
|--------|---------------------|--------------|
| **Creator home** | `CreatorHomeScreen` | Subscribers, Earnings, Content, Tools |
| **Subscribers** | `SubscribersScreen` | List (avatar, name, since) |
| **Earnings** | `EarningsScreen` | Balance, This month |
| **Content** | `ContentScreen` | Posts & reels placeholder |
| **Tools** | `ToolsScreen` | Quick replies, Content calendar, Analytics |

---

## Job account (Atlassian-style)

| Feature | Screen / Component | Sub-features |
|--------|---------------------|--------------|
| **Job hub** | `JobHomeScreen` | Track, Know, Flow, Code, Build, Status, Alert |
| **Product list** | `JobListScreen` | Back, list rows (title, status) |
| **Home tab (Job)** | `JobHomePlaceholder` | CTA to Job tab |

---

## Shared (all accounts)

| Feature | Screen / Component | Sub-features |
|--------|---------------------|--------------|
| **Messages** | `MessagesScreen`, `MessageThreadScreen` | Thread list, chat bubbles, input |
| **Map** | `MapScreen` | MOxE Map, Nearby Messaging, SOS Emergency, Proximity Alerts |
| **Settings** | `SettingsScreen` | Search; Your account; How you use MOxE (Saved, Archive, Your activity, Notifications, Time management); Who can see your content |
| **Switch account** | `SwitchAccountScreen` | PERSONAL / BUSINESS / CREATOR / JOB |

---

## Navigation

- **Root:** Auth (Splash → Login → Register) | Main (tabs).
- **Tabs:** Feed (Home stack), Explore, Map, Messages, Profile (stack), Job (stack).
- **Home stack:** Account-aware Main → Notifications, CreatePost, CreateStory, PostDetail, Saved, Insights, Commerce, Team, Promotions, Subscribers, Earnings, Content, Tools.
- **Profile stack:** Profile → Settings, SwitchAccount, EditProfile, Saved, Archive.
- **Job stack:** JobHome → JobList.
- **Messages stack:** MessagesList → MessageThread.

---

## Auth

- **Login / Register** with account type (PERSONAL | BUSINESS | CREATOR | JOB).
- Token + account type stored; Home tab content switches by `accountType`.
