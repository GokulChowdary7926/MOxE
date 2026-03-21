# MOxE Job Tools – Implementation & Troubleshooting Summary

Summary of layout/styling fixes and patterns to apply across Job tools.

---

## 1. Core Issues Fixed

### 1.1 Layout & Viewport

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Job shell collapsing** | Content wouldn't fill screen; scroll broken | Root: `min-h-[100dvh] min-h-screen w-full max-w-[428px] mx-auto` |
| **Content overflow** | Scroll not working inside Job tools | Content area: `flex-1 min-h-0 overflow-auto` |
| **Header interfering** | Sticky header breaking scroll | Header: `flex-shrink-0` (not sticky) |
| **More sheet backdrop** | Backdrop only covered content area | Full viewport dimming (no max-w on overlay) |

### 1.2 Padding & Navigation

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Double bottom padding** | Extra gap on Job routes | `MainWithPadding`: `/job/*` → `pb-0`, others → `pb-20` |
| **Job bottom nav** | Inconsistent spacing | Job shell has its own bottom nav with correct padding |

### 1.3 Shared Components

| Component | Purpose |
|-----------|---------|
| **`JobPageContent`** | Consistent wrapper: title, description, error styling, spacing |
| **`getApiBase()`** | Unified API URL from `services/api` (no hardcoded env) |

### 1.4 Styling (MOxE-style tokens)

```css
--text-primary: #172B4D;
--text-secondary: #5E6C84;
--border-color: #DFE1E6;
--primary-blue: #0052CC;
--primary-hover: #2684FF;
--surface-hover: #1D2125;
--surface-bg: #F4F5F7;
--error: #FF5630 / #FFEBE6;
```

---

## 2. Tools Already Updated

| Tool | Updates |
|------|---------|
| **Overview** | `getApiBase()`, correct layout |
| **Track** | `JobPageContent`, loading/empty, modal styling |
| **Flow** | `JobPageContent`, board cards, "New board" button |
| **Recruiter** | JobPageContent, getApiBase, MOxE styling |
| **Agile** | JobPageContent, getApiBase, MOxE styling |
| **Code** | JobPageContent, getApiBase, MOxE styling (repo list, buttons, borders) |
| **Docs** | JobPageContent, getApiBase, MOxE styling (buttons, borders, doc list) |
| **Status** | JobPageContent, getApiBase, MOxE styling |
| **Build** | JobPageContent, getApiBase, MOxE styling |
| **Compass** | JobPageContent, getApiBase |
| **Atlas** | JobPageContent, getApiBase |

---

## 3. Pattern for Remaining Tools

### 3.1 Structure

- Import: `JobPageContent` from `../../components/job/JobPageContent`, `getApiBase` from `../../services/api`.
- Use `getApiBase()` for all fetch URLs.
- Wrap page content in `<JobPageContent title="..." description="...">` and pass `error` when applicable.
- Loading: skeleton with `bg-[#F4F5F7] animate-pulse`.
- Error: message + retry button, `text-[#FF5630]`, `bg-[#FFEBE6]`.
- Empty: short message + primary CTA.
- Cards: `bg-white border border-[#DFE1E6] rounded p-4`.
- Primary buttons: `bg-[#0052CC] hover:bg-[#2684FF] text-white`.
- Inputs: `border border-[#DFE1E6] rounded px-3 py-2 focus:ring-1 focus:ring-[#0052CC]`.

### 3.2 API

```ts
import { getApiBase } from '../../services/api';
const apiBase = getApiBase();
const res = await fetch(`${apiBase}/job/your-endpoint`, { headers });
```

### 3.3 Error / Empty States

- **Error:** Show message in `JobPageContent` with `error` prop; include retry button that calls `refetch()` or equivalent.
- **Empty:** Center message + "Create your first" (or similar) primary button.

---

## 4. Remaining Tools Checklist

| Tool | Path | Priority | Status |
|------|------|----------|--------|
| **Recruiter** | `/job/recruiter` | High | Updated (JobPageContent, getApiBase, styling) |
| **Agile** | `/job/agile` | High | Updated (JobPageContent, getApiBase, styling) |
| **Code** | `/job/code` | Medium | Updated (JobPageContent, getApiBase, styling) |
| **Docs** | `/job/docs` | Medium | Updated (JobPageContent, getApiBase, styling) |
| **Status** | `/job/status` | Low | Updated (JobPageContent, getApiBase, MOxE styling) |
| **Build** | `/job/build` | Low | Updated (JobPageContent, getApiBase, MOxE styling) |
| **Compass** | `/job/compass` | Low | Updated (JobPageContent, getApiBase) |
| **Atlas** | `/job/atlas` | Low | Updated (JobPageContent, getApiBase) |
| **Video** | `/job/video` | Low | ⬜ |
| **Chat** | `/job/chat` | Low | ⬜ |
| **Source** | `/job/source` | Low | ⬜ |
| **Code Search** | `/job/code-search` | Low | ⬜ |
| **AI** | `/job/ai` | Low | ⬜ |
| **Analytics** | `/job/analytics` | Low | ⬜ |
| **Profile** | `/job/profile` | Low | ⬜ |
| **Integration** | `/job/integration` | Low | ⬜ |
| **Scrum** | `/job/scrum` | Low | ⬜ |
| **Teams** | `/job/teams` | Low | ⬜ |

---

## 5. Testing Checklist (per tool)

- [ ] Page loads with correct title and description
- [ ] Loading states show skeleton or clear loading UI
- [ ] Empty states show message + CTA
- [ ] Error states show message + retry
- [ ] Buttons use MOxE primary/secondary colors
- [ ] Cards use border `#DFE1E6`
- [ ] Text: primary `#172B4D`, secondary `#5E6C84`
- [ ] API calls use `getApiBase()`
- [ ] Scroll works inside content area
- [ ] No extra bottom padding on Job routes
- [ ] Back returns to previous Job tool or home
- [ ] Works on mobile viewport (max-width 428px)

---

## 6. Future Improvements

- **Error boundary** around Job routes.
- **Persistent search/filter** (localStorage or URL params).
- **Keyboard shortcuts** for power users.
- **Bulk actions** (checkboxes + action bar).
- **Export** (CSV/PDF) where applicable.
