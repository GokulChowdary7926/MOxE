# MOxE Design System – Instagram-Inspired

Same layout for **mobile and web**; no empty states – all screens use populated content.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|--------|
| **Gradient** | #833AB4 → #E1306C → #FCAF45 | Stories ring, logo, accents |
| **Primary blue** | #0095F6 | CTAs, links, Follow button |
| **Background (dark)** | #000000 | App background |
| **Surface / card** | #262626 | Cards, inputs |
| **Border** | #363636 | Borders, separators |
| **Text** | #FFFFFF | Primary text |
| **Text secondary** | #A8A8A8 | Captions, hints |
| **Text muted** | #737373 | Placeholders |
| **Success** | #00C853 | Close Friends ring, success |
| **Error** | #ED4956 | Live badge, errors |
| **Warning** | #FF9800 | Warnings |
| **Business** | #00A86B | Business account accent |
| **Creator** | #FFD700 | Creator account accent |
| **Job** | #8A2BE2 | Job account accent |

---

## Typography

- **Font:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Weights:** Caption 300, Body 400, Semibold 600
- **Sizes:** Caption 12px, Body 14px, Body lg 16px, Title 18px, Headline 24px

---

## Spacing

- **Base unit:** 8px
- **Gutters:** 16px
- **Card padding:** 16px
- **Profile grid:** 3 columns, 2px gap

---

## Components

### Navigation
- **Bottom tab bar:** 5 icons (Home, Search, Reels, Shop/Profile, Profile)
- **Top bar:** Back + title + action (e.g. Select)
- **Story tray:** Horizontal scroll, 56px avatar, gradient (unseen) / gray (seen) / green (Close Friends)

### Buttons
- **Primary:** `bg-[#0095f6]` rounded-lg, white text
- **Secondary:** Gray outline, white text
- **Follow:** Blue when not following, gray outline when following

### Badges
- **Live:** Red #ED4956, "LIVE" uppercase
- **Verified:** Blue checkmark (Personal/Creator), purple (Job)

### Atoms (see `components/atoms/`)
- PrimaryButton, SecondaryButton, FollowButton
- LiveBadge, VerifiedBadge

---

## Breakpoints

- **Mobile:** 320px – 480px
- **Tablet:** 481px – 768px
- **Desktop:** 769px+

---

## Account Types

- **Personal:** Default; blue accent
- **Business:** Green accent; shop, insights, promotions
- **Creator:** Gold accent; supporters, gifts, analytics (all free)
- **Job:** Purple accent; professional profile, executive features

Use `constants/designSystem.ts` and `constants/uiTheme.ts` for tokens and class names.
