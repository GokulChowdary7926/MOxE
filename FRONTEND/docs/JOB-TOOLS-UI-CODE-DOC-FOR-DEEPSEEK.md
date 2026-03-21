# MOxE Job Tools – User Interface Code Doc (DeepSeek Reference)

This document describes the **Job tools** UI architecture, design system, routing, and patterns in the MOxE frontend. Use it as a single reference for implementing or modifying Job tool screens in a **mobile-application-style** layout.

---

## 1. Overview

- **Entry route**: `/job` (protected; requires account type `JOB`).
- **Layout**: All Job tools render inside **JobMobileLayout**: fixed header, scrollable content, fixed bottom nav + “More” drawer.
- **Design**: **Atlassian-style** tokens (blue `#0052CC` / `#2684FF`, neutrals `#172B4D`, `#5E6C84`, `#DFE1E6`, `#2C333A`). Mobile-first: max-width 428px, 44px+ touch targets, single-column content.
- **Sub-routing**: Each tool is mounted under `path="toolName/*"`. Tools can define their own sub-routes (e.g. `/job/track/applications`, `/job/track/jobs`).

---

## 2. File Structure

```
FRONTEND/
├── components/job/
│   ├── JobMobileLayout.tsx   # Shell: header, main, bottom nav, More sheet
│   ├── jobMobileStyles.ts    # JOB_MOBILE design tokens
│   └── JobPageContent.tsx    # JobPageContent, JobCard, JobSection
├── pages/job/
│   ├── Job.tsx               # Router: Routes for each tool (path="tool/*")
│   ├── Overview.tsx          # Job home / dashboard
│   ├── Track.tsx              # Applications, jobs, pipelines
│   ├── Know.tsx               # Company research, reviews
│   ├── Recruiter.tsx
│   ├── Agile.tsx
│   ├── Code.tsx
│   ├── Video.tsx
│   ├── Chat.tsx
│   ├── Source.tsx
│   ├── CodeSearch.tsx
│   ├── Ai.tsx
│   ├── Strategy.tsx
│   ├── Analytics.tsx
│   ├── Profile.tsx
│   ├── Integration.tsx
│   ├── Scrum.tsx
│   ├── Teams.tsx
│   ├── Docs.tsx
│   ├── Access.tsx
│   ├── Status.tsx
│   ├── Flow.tsx
│   ├── Work.tsx
│   ├── Alert.tsx
│   ├── Build.tsx
│   ├── Compass.tsx
│   └── Atlas.tsx
└── docs/
    └── JOB-TOOLS-UI-CODE-DOC-FOR-DEEPSEEK.md  # this file
```

---

## 3. Routing (Job.tsx)

- **Parent route in app**: `/job/*` → `<Job />` with `<JobMobileLayout>`.
- **Default redirect**: `/job` and `/job/*` (no match) → `/job/overview`.
- **Per-tool routes**: Each tool is a catch-all under its name:

```tsx
<Route path="overview/*" element={<Overview />} />
<Route path="track/*" element={<Track />} />
<Route path="recruiter/*" element={<Recruiter />} />
// ... same for agile, code, video, chat, source, code-search, ai, strategy,
//     analytics, profile, integrations, scrum, teams, docs, access, status,
//     know, flow, work, alert, build, compass, atlas
<Route path="/" element={<Navigate to="/job/overview" replace />} />
<Route path="*" element={<Navigate to="/job/overview" replace />} />
```

- **Tool-level sub-routes**: Inside a tool (e.g. Track), use `<Routes>` + `<Route path="applications" element={...} />` and optional `<Navigate to="applications" replace />` for index. URL then reflects sub-page (e.g. `/job/track/applications`, `/job/track/jobs`).

---

## 4. JobMobileLayout (Shell)

- **Path**: `components/job/JobMobileLayout.tsx`.
- **Props**: `{ children: React.ReactNode }`.
- **Structure**:
  1. **Header** (fixed top): Back link to `/`, title “MOxE Job”, spacer. Uses `JOB_MOBILE.header`, `JOB_MOBILE.touchMin` / `touchPadding` for Back.
  2. **Main**: Scrollable area; `children` (tool content). Uses `JOB_MOBILE.content` (includes `pb-28` for nav clearance).
  3. **Bottom nav**: 4 items – Home (`/job/overview`), Work (`/job/track`), Recruit (`/job/recruiter`), More (opens sheet). Each nav item min-height 56px. Active state: `path === tabPath || path.startsWith(tabPath)` (except overview).
  4. **More sheet**: Overlay + bottom drawer. List of all tools (Agile, Scrum, Code, Video, Chat, Source, Code Search, AI, Strategy, Analytics, Profile, Integrations, Teams, Docs, Access, Status, Know, Flow, Work, Alert, Build, Compass, Goals/Atlas). Each item links to `/job/<tool>`, closes sheet on click. Uses `JOB_MOBILE.sheet*` tokens.

**Active tab logic**: `isActive(tabPath)` → `path === tabPath || (tabPath !== "/job/overview" && path.startsWith(tabPath))`.

---

## 5. Design Tokens (jobMobileStyles.ts)

Import: `import { JOB_MOBILE } from '../../components/job/jobMobileStyles';`

| Token | Purpose |
|-------|--------|
| `shell` | Root container: min-h 100dvh, max-w 428px, centered, bg |
| `header` | Top bar (flex, padding, border) |
| `headerHeight` | 56 (for minHeight) |
| `content` | Main scroll area (flex-1, overflow-auto, px-4 py-4 pb-28) |
| `nav` | Bottom nav container (fixed, z-30, border-t, safe-area-pb) |
| `navHeight` | 56 |
| `touchMin` | min-h-[44px] min-w-[44px] |
| `touchPadding` | px-4 py-3 |
| `pageTitle` | H1: text-lg font-semibold, primary text color |
| `pageDesc` | Subtitle: text-sm, secondary color, mb-4 |
| `card` | Rounded-xl, border, bg (card surface) |
| `cardPadding` | p-4 |
| `cardSection` | Same as card + p-4 (card with label area) |
| `tab` | Tab strip: flex gap-1 p-1 rounded-xl bg (pill container) |
| `tabButton` | Single tab: flex-1, min-h 44px, rounded-lg |
| `tabActive` | Active tab: white/dark surface, blue text, shadow |
| `tabInactive` | Inactive: secondary text, active:opacity-80 |
| `input` | Full-width input: px-4 py-3, rounded-xl, border, focus ring blue |
| `btnPrimary` | Full-width primary button: blue bg, white text, min-h 44px |
| `btnSecondary` | Secondary button: border, surface bg, min-h 44px |
| `btnLink` | Text link: blue, min-h 44px |
| `listRow` | Tappable row: flex items-center gap-3 px-4 py-3, min-h 52px, rounded-xl |
| `listRowBorder` | Optional border-b between rows |
| `label` | Small uppercase label (e.g. section title) |
| `meta` | Secondary/small text |
| `error` | Error box: red tint bg, red text, rounded-xl |
| `success` | Success box: green tint |
| `sheetOverlay` | Full-screen overlay for More |
| `sheet` | Bottom drawer container |
| `sheetHeader` | Drawer header row |
| `sheetTitle` | Drawer title text |
| `sheetItem` | One tool row in drawer (min-h 52px) |
| `sheetItemActive` | Background for current tool |

**Colors (Atlassian)**  
- Primary blue: `#0052CC` (light), `#2684FF` (dark).  
- Text: `#172B4D` / `#E6EDF3`.  
- Secondary: `#5E6C84` / `#8C9BAB`.  
- Border: `#DFE1E6` / `#2C333A`.  
- Surface/card: `#F4F5F7` / `#161A1D` (bg), `#1D2125` (cards).  

Use these via Tailwind or the token classes so light/dark stay consistent.

---

## 6. JobPageContent, JobCard, JobSection (JobPageContent.tsx)

Use these so every tool page has the same structure and tokens.

### JobPageContent

- **Props**: `title`, `description?`, `error?`, `children`, `className?`.
- **Renders**: Wrapper div; H1 with `JOB_MOBILE.pageTitle`; optional description with `pageDesc`; optional error block with `JOB_MOBILE.error`; then `children`.
- **Usage**: Wrap the main content of any Job tool page.

```tsx
<JobPageContent
  title="MOxE Track"
  description="Manage job applications and recruitment pipelines."
  error={error}
>
  {/* tabs, lists, forms */}
</JobPageContent>
```

### JobCard

- **Props**: `children`, `className?`.
- **Renders**: Div with `JOB_MOBILE.card` + `cardPadding` (+ optional `className`). Use for any card block (e.g. stat block, form, detail panel).

```tsx
<JobCard>
  <p className="text-xl font-semibold ...">42</p>
  <p className={JOB_MOBILE.meta}>Applications</p>
</JobCard>
```

### JobSection

- **Props**: `label`, `children`, `className?`.
- **Renders**: Div with `JOB_MOBILE.cardSection`; label with `JOB_MOBILE.label`; then `children`. Use for labeled sections (e.g. “Goals (Atlas)”, “Pipelines”).

```tsx
<JobSection label="Goals (Atlas)" className="!p-4">
  <p className="text-xl font-semibold ...">{totalObjectives}</p>
  <p className={JOB_MOBILE.meta}>Avg progress: 50%</p>
</JobSection>
```

---

## 7. Mobile UI Patterns

- **Single column**: No multi-column layouts in main content; stack cards and sections vertically.
- **Touch targets**: Buttons and tappable rows use `JOB_MOBILE.touchMin` or min-h 44px/52px from tokens.
- **Tabs**: Use `JOB_MOBILE.tab` for the container and `tabButton` + `tabActive`/`tabInactive` for each tab. For URL-backed tabs, use `useNavigate` to push `/job/tool/sub` and sync tab state from `useLocation().pathname`.
- **Lists**: Use `JobCard` per item or `JOB_MOBILE.listRow` + `card` for tappable rows. Avoid tiny click areas.
- **Forms**: Use `JOB_MOBILE.input` for inputs/textarea and `btnPrimary`/`btnSecondary` for actions. Use `JobCard` for form containers when needed.
- **Loading / empty / error**: Prefer `JOB_MOBILE.meta` for loading/empty text and `JOB_MOBILE.error` for error messages. Optionally wrap in `JobPageContent` with `error={error}`.

---

## 8. Tool List and Suggested Sub-Routes

| Tool | Route | Main purpose | Suggested sub-routes (optional) |
|------|--------|--------------|----------------------------------|
| Overview | `/job/overview` | Dashboard (goals, apps, pipelines, services, alerts) | `home` (default) |
| Track | `/job/track` | Applications, job search, pipelines | `applications`, `jobs`, `pipelines` |
| Recruiter | `/job/recruiter` | Recruitment / candidates | e.g. `home`, `jobs`, `candidates` |
| Know | `/job/know` | Company research, reviews | `home`, detail by slug or id |
| Agile | `/job/agile` | Boards / backlog | e.g. `boards`, `backlog` |
| Scrum | `/job/scrum` | Sprints, ceremonies | e.g. `sprints`, `ceremonies` |
| Code | `/job/code` | Repos, branches, PRs | e.g. `repos`, `branches` |
| Video | `/job/video` | Video / meetings | e.g. `home`, `recordings` |
| Chat | `/job/chat` | Team chat / threads | e.g. `threads`, `thread/:id` |
| Source | `/job/source` | Source / commits | e.g. `repos`, `commits` |
| Code Search | `/job/code-search` | Search code | e.g. `home`, `results` |
| AI | `/job/ai` | AI assistant | e.g. `home`, `history` |
| Strategy | `/job/strategy` | Strategy / OKRs | e.g. `home`, `objectives` |
| Analytics | `/job/analytics` | Job analytics | e.g. `home`, `reports` |
| Profile | `/job/profile` | Job profile | e.g. `home`, `edit` |
| Integrations | `/job/integrations` | Connected apps | e.g. `home`, `add` |
| Teams | `/job/teams` | Teams / members | e.g. `home`, `team/:id` |
| Docs | `/job/docs` | Documentation | e.g. `home`, `doc/:id` |
| Access | `/job/access` | Permissions / access | e.g. `home`, `roles` |
| Status | `/job/status` | Status pages, incidents | e.g. `pages`, `incidents` |
| Flow | `/job/flow` | Workflows / automation | e.g. `home`, `flows` |
| Work | `/job/work` | Tasks / work items | e.g. `home`, `tasks` |
| Alert | `/job/alert` | Alerts / on-call | e.g. `schedules`, `incidents` |
| Build | `/job/build` | CI/CD pipelines | e.g. `pipelines`, `pipeline/:id` |
| Compass | `/job/compass` | Services / health | e.g. `services`, `service/:id` |
| Atlas | `/job/atlas` | Goals / OKRs | e.g. `objectives`, `objective/:id` |

Implementing sub-routes: inside each tool component, render `<Routes>` and `<Route path="sub" element={...} />`, and use `<Route index element={<Navigate to="home" replace />} />` or equivalent so `/job/tool` redirects to `/job/tool/home` (or the tool’s default sub-page).

---

## 9. Example: Tool with Sub-Routes (Track)

- **Route in Job.tsx**: `<Route path="track/*" element={<Track />} />`.
- **Inside Track**:  
  - Use `useLocation()` and `useNavigate()`.  
  - Tab state can sync from path: e.g. `path.includes('/job/track/jobs')` → tab “jobs”.  
  - On tab click: `navigate('/job/track/jobs', { replace: true })`.  
  - Render:

```tsx
<Routes>
  <Route index element={<Navigate to="applications" replace />} />
  <Route path="applications" element={<TrackHome />} />
  <Route path="jobs" element={<TrackHome />} />
  <Route path="pipelines" element={<TrackHome />} />
  <Route path="*" element={<Navigate to="applications" replace />} />
</Routes>
```

- **TrackHome**: Same UI as before (tabs + content); tab state derived from `location.pathname` so URL and UI stay in sync.

---

## 10. API and Auth

- **Base URL**: From `getApiBase()` in `services/api` (e.g. `VITE_API_URL` or `http://localhost:5007/api`).
- **Auth**: `getToken()` from `services/api`; send `Authorization: Bearer <token>` for protected Job endpoints.
- **Job APIs**: Under `/api/job/*`, `/api/atlas/*`, `/api/build/*`, `/api/compass/*`, `/api/alert/*`, etc. (see backend routes). Use fetch or your app’s `fetchApi` with these paths.

---

## 11. Checklist for Adding or Changing a Job Tool

1. **Route**: In `Job.tsx`, ensure `<Route path="toolName/*" element={<ToolName />} />` exists.
2. **Nav**: In `JobMobileLayout`, add the tool to `MAIN_TABS` or `MORE_ITEMS` with path `/job/toolName` and an icon.
3. **Page**: Use `JobPageContent` for title/description/error; use `JobCard` / `JobSection` and `JOB_MOBILE` tokens for content.
4. **Sub-pages**: If the tool has sections, add `<Routes>` + `<Route path="sub" element={...} />` and default `<Navigate to="defaultSub" replace />`.
5. **Touch**: Buttons and list rows at least 44px tall; use `JOB_MOBILE.btnPrimary` / `btnSecondary` / `listRow` where appropriate.
6. **Loading/error**: Use `JOB_MOBILE.meta` for loading/empty and `JOB_MOBILE.error` or `JobPageContent`’s `error` prop for errors.

---

## 12. Quick Reference: Imports

```ts
// Design tokens
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

// Layout components (for page structure)
import { JobPageContent, JobCard, JobSection } from '../../components/job/JobPageContent';

// Routing (inside a tool)
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// API
import { getApiBase, getToken } from '../../services/api';
```

Use this doc as the single source of truth for Job tools UI when prompting DeepSeek (or any AI) to implement or refactor Job tool screens and navigation.
