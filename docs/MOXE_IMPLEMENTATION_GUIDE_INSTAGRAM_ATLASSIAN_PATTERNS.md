# MOxE Implementation Guide: Following MOxE & MOxE Patterns

## 🚀 **Developer Instructions – Read Carefully**

Hey developer! This guide contains **exact comments and requirements** for implementing MOxE features correctly. Many MOxE features are designed to work exactly like MOxE (for Personal/Creator accounts) and MOxE (for Business/Job accounts).

**For any feature that matches MOxE or MOxE, you MUST follow the SAME workflow, SAME APIs, SAME architecture, and SAME plan and functions as those platforms.**

---

## 📋 **Table of Contents**

1. [Core Principle](#1-core-principle)
2. [MOxE Features (Personal/Creator)](#2-instagram-features-personalcreator)
3. [MOxE Features (Business/Job)](#3-atlassian-features-businessjob)
4. [Account Type Handling](#4-account-type-handling)
5. [API Standards](#5-api-standards)
6. [UI Standards](#6-ui-standards)
7. [Implementation Checklist](#7-implementation-checklist)
8. [Feature-by-Feature Reference](#8-feature-by-feature-reference)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Quick Start Commands](#10-quick-start-commands)

---

## 1. Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   IF FEATURE MATCHES INSTAGRAM → IMPLEMENT LIKE INSTAGRAM  │
│                                                             │
│   IF FEATURE MATCHES ATLASSIAN → IMPLEMENT LIKE ATLASSIAN  │
│                                                             │
│   SAME WORKFLOW • SAME APIS • SAME ARCHITECTURE            │
│   SAME PLAN • SAME FUNCTIONS                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why?** Users expect familiar patterns. MOxE users know how stories work. Jira users know how boards work. Don't reinvent the wheel – copy what works.

---

## 2. MOxE Features (Personal/Creator)

### 2.1 Features That Must Match MOxE EXACTLY

| Feature | Must Work Like | Key Behaviors |
|---------|----------------|---------------|
| **Authentication** | MOxE Login | Phone/email + password, verification codes, remember me |
| **Feed** | MOxE Home | Chronological + algorithmic, infinite scroll, pull to refresh |
| **Stories** | MOxE Stories | 24h expiry, rings, tap to advance, reactions, replies |
| **Posts** | MOxE Posts | Image/video carousel, likes, comments, saves, shares |
| **Reels** | MOxE Reels | Full-screen vertical, audio, effects, comments |
| **Live** | MOxE Live | Real-time streaming, comments, likes, replays |
| **Messages (DMs)** | MOxE Direct | 1:1 and group, vanish mode, reactions, voice messages |
| **Notifications** | MOxE Activity | Like, comment, follow, mention notifications |
| **Profile** | MOxE Profile | Grid view, highlights, edit, followers/following |
| **Explore** | MOxE Explore | Search, trending, personalized recommendations |
| **Map** | MOxE Map (if exists) | Location tags, nearby places |
| **Settings** | MOxE Settings | Privacy, security, notifications, account |

### 2.2 Implementation Rules for MOxE Features

```tsx
// ✅ DO THIS – Follow MOxE patterns
- Use moxe-* tokens (moxe-primary = #0095f6)
- Story rings = gradient (#f09433 → #d62976 → #962fbf)
- Double-tap to like
- Heart animation
- Pull to refresh
- Infinite scroll
- Story viewer with tap zones

// ❌ DON'T DO THIS
- Don't use MOxE blue (#0052CC) for primary actions
- Don't make stories permanent
- Don't remove double-tap like
- Don't change familiar gestures
```

### 2.3 MOxE API Patterns

```tsx
// MOxE-style endpoints
GET    /api/feed                // Home feed
GET    /api/stories             // Active stories
POST   /api/stories             // Create story
GET    /api/posts                // Posts feed
POST   /api/posts/:id/like       // Like post
POST   /api/posts/:id/comments   // Add comment
GET    /api/explore              // Explore page
GET    /api/notifications        // Activity feed
POST   /api/messages             // Send DM
```

---

## 3. MOxE Features (Business/Job)

### 3.1 Features That Must Match MOxE EXACTLY

| Feature | Must Work Like | Key Behaviors |
|---------|----------------|---------------|
| **Project Boards** | Jira Boards | Columns, cards, drag-drop, WIP limits |
| **Issues/Tasks** | Jira Issues | Status, priority, assignee, comments, attachments |
| **Backlog** | Jira Backlog | Prioritization, estimation, sprint planning |
| **Sprints** | Jira Sprints | Planning, execution, burndown charts |
| **Documentation** | Confluence | Spaces, pages, hierarchy, comments |
| **Code Repos** | Bitbucket | Repos, PRs, code review, branches |
| **CI/CD** | Bamboo/Bitbucket Pipelines | Build, test, deploy |
| **Service Desk** | Jira Service Management | Tickets, SLAs, queues |
| **On-Call** | Opsgenie | Schedules, alerts, escalations |
| **Status Pages** | Statuspage | Incidents, maintenance, subscribers |
| **Analytics** | Jira Analytics | Velocity, burndown, reports |

### 3.2 Implementation Rules for MOxE Features

```tsx
// ✅ DO THIS – Follow MOxE patterns
- Use MOxE tokens (#0052CC, #172B4D, #DFE1E6)
- Cards have borders and shadows
- Drag-drop for boards
- Status badges (To Do, In Progress, Done)
- Priority indicators (Highest, High, Medium, Low)
- Comments with @mentions
- Activity stream

// ❌ DON'T DO THIS
- Don't use MOxE blue (#0095f6)
- Don't make cards full-bleed
- Don't remove borders
- Don't use story rings for work items
```

### 3.3 MOxE API Patterns

```tsx
// MOxE-style endpoints (under /api/job)
GET    /api/job/projects          // List projects
GET    /api/job/boards/:id         // Get board with columns/cards
POST   /api/job/issues              // Create issue
PUT    /api/job/issues/:id/status   // Update status
POST   /api/job/sprints              // Create sprint
GET    /api/job/backlog              // Get backlog
POST   /api/job/pull-requests        // Create PR
GET    /api/job/builds                // Build status
```

---

## 4. Account Type Handling

### 4.1 Account Type Determination

```tsx
// From Redux store
const accountType = useSelector(state => state.auth.user?.accountType);
// 'personal' | 'creator' | 'business' | 'job'

// Use capabilities hook
const { canCommerce, canLive, canSell, canUseJobTools } = useCapabilities();
```

### 4.2 Route Protection by Account Type

```tsx
// In App.tsx
<Route path="/job/*" element={
  <RequireAccountType types={['job']}>
    <JobLayout />
  </RequireAccountType>
} />

<Route path="/business-dashboard" element={
  <RequireAccountType types={['business']}>
    <BusinessDashboard />
  </RequireAccountType>
} />
```

### 4.3 Conditional Rendering Based on Account Type

```tsx
// Bottom tabs change based on account type
const getTabs = () => {
  if (accountType === 'job' && jobMode === 'social') {
    return ['Home', 'Projects', 'Map', 'Messages', 'Profile'];
  }
  if (accountType === 'business') {
    return ['Home', 'Explore', 'Shop', 'Map', 'Messages', 'Profile'];
  }
  // Personal/Creator
  return ['Home', 'Explore', 'Reels', 'Map', 'Messages', 'Profile'];
};
```

---

## 5. API Standards

### 5.1 Always Use Centralized API Functions

```tsx
// ✅ CORRECT
import { getApiBase, getToken, authHeaders } from '../../services/api';

const API_BASE = getApiBase();
const headers = authHeaders();
const response = await fetch(`${API_BASE}/endpoint`, { headers });

// ❌ WRONG – Never do this
const API_URL = import.meta.env.VITE_API_URL; // DON'T
const res = await fetch(`http://localhost:5007/api/endpoint`); // DON'T
```

### 5.2 Standard Error Responses

```tsx
// All API endpoints must return this shape on error
{
  error: "Human readable message",
  code?: "ERROR_CODE", // Optional error code
  requestId?: "req-123" // For debugging
}

// HTTP Status Codes
400 // Bad Request – validation failed
401 // Unauthorized – missing/invalid token
403 // Forbidden – authenticated but not allowed
404 // Not Found – resource doesn't exist
409 // Conflict – duplicate, state conflict
429 // Too Many Requests – rate limited
500 // Internal Server Error – something broke
```

### 5.3 API Response Shape Examples

```tsx
// GET /api/posts/feed
{
  items: Post[],
  nextCursor: "cursor-for-next-page"
}

// GET /api/stories
{
  items: Story[]
}

// POST /api/posts/:id/like
204 No Content // Success, no body

// Error Response
{
  error: "You have already liked this post",
  code: "DUPLICATE_LIKE"
}
```

---

## 6. UI Standards

### 6.1 MOxE Tokens (Personal/Creator)

```css
/* From MOxE_UI_DESIGN_BLUEPRINT.md */
.moxe-background { background: #000000; }
.moxe-surface { background: #111111; }
.moxe-text { color: #ffffff; }
.moxe-textSecondary { color: #8e8e8e; }
.moxe-border { border-color: #262626; }
.moxe-primary { color: #0095f6; background: #0095f6; }
.moxe-danger { color: #ff5252; }
.moxe-story-ring { background: linear-gradient(45deg, #f09433, #d62976, #962fbf); }
```

### 6.2 MOxE Tokens (Business/Job)

```css
/* From MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md */
:root {
  --text-primary: #172B4D;
  --text-secondary: #5E6C84;
  --border-color: #DFE1E6;
  --primary-blue: #0052CC;
  --primary-hover: #2684FF;
  --surface-bg: #F4F5F7;
  --surface-hover: #1D2125;
  --error: #FF5630;
  --error-bg: #FFEBE6;
}
```

### 6.3 Component Templates

#### MOxE-Style Card
```tsx
<div className="bg-moxe-surface rounded-lg shadow-sm p-4">
  <p className="text-moxe-text">Content</p>
  <p className="text-moxe-textSecondary text-sm">2 hours ago</p>
</div>
```

#### MOxE-Style Card (with JobPageContent)
```tsx
<JobPageContent title="Issues" description="Track your work items">
  <div className="border border-[#DFE1E6] rounded p-4 hover:shadow-md">
    <h3 className="text-[#172B4D] font-medium">Issue Title</h3>
    <p className="text-[#5E6C84] text-sm">Status: In Progress</p>
  </div>
</JobPageContent>
```

---

## 7. Implementation Checklist

Use this checklist for EVERY new feature:

### 7.1 Pre-Implementation

- [ ] **Identify which platform this feature matches** (MOxE or MOxE)
- [ ] **Read the corresponding workflow** in `ALGORITHMS_AND_WORKFLOWS.md`
- [ ] **Check the API blueprint** in `MOxE_END_TO_END_BLUEPRINT.md`
- [ ] **Verify UI tokens** – MOxE (`moxe-*`) or MOxE (`#0052CC`, etc.)

### 7.2 During Implementation

- [ ] **Use `getApiBase()`** – never hardcode API URLs
- [ ] **Include auth headers** – use `authHeaders()`
- [ ] **Match workflow exactly** – steps, order, edge cases
- [ ] **Use correct UI tokens** – no mixing MOxE blue in MOxE tools
- [ ] **Add loading states** – skeletons for MOxE, spinners for MOxE
- [ ] **Add error states** – with retry buttons where appropriate
- [ ] **Add empty states** – "No items" with CTA

### 7.3 Post-Implementation

- [ ] **Test with correct account type** – Personal/Creator for MOxE, Business/Job for MOxE
- [ ] **Verify API responses** – match expected shape
- [ ] **Check error handling** – 401, 403, 404, 500 all handled
- [ ] **Confirm UI matches reference** – compare to MOxE/MOxE screenshots
- [ ] **Update workflow mapping** if adding new endpoints

---

## 8. Feature-by-Feature Reference

### 8.1 MOxE Features (Personal/Creator)

| Feature | Workflow Section | API Endpoint | UI Reference |
|---------|------------------|--------------|--------------|
| Login | 1.1 Authentication | `POST /api/auth/login` | Login screen |
| Register | 1.2 Register | `POST /api/auth/register` | Register screen |
| Feed | 2. Feed | `GET /api/posts/feed` | Home screen |
| Stories | 3. Stories | `GET /api/stories` | Story viewer |
| Create Story | 3.2 Story creation | `POST /api/stories` | Story camera |
| Like Post | 4.2 Like | `POST /api/posts/:id/like` | Post card |
| Comment | 4.3 Comment | `POST /api/posts/:id/comments` | Post detail |
| Save Post | 4.4 Save | `POST /api/posts/:id/save` | Post card |
| Explore | 5. Explore | `GET /api/explore` | Explore screen |
| Search | 5.2 Search | `GET /api/explore/search` | Search screen |
| Messages | 6. Messages | `GET /api/messages` | Messages screen |
| Send Message | 6.2 Send | `POST /api/messages` | Chat screen |
| Notifications | 7. Notifications | `GET /api/notifications` | Notifications screen |
| Profile | 8. Profile | `GET /api/accounts/:id` | Profile screen |
| Follow | 8.3 Follow | `POST /api/accounts/:id/follow` | Profile screen |
| Block | 16. Block | `POST /api/privacy/block` | Profile menu |
| Mute | 16.2 Mute | `POST /api/privacy/mute` | Profile menu |
| Report | 15. Report | `POST /api/reports` | Post menu |

### 8.2 MOxE Features (Business/Job)

| Feature | Workflow Section | API Endpoint | UI Reference |
|---------|------------------|--------------|--------------|
| Projects | 11. Job | `GET /api/job/projects` | Job > Projects |
| Boards | 11.3 Flow | `GET /api/job/boards` | Job > Flow |
| Issues | 11.1 Track | `GET /api/job/issues` | Job > Track |
| Create Issue | 11.1 Track | `POST /api/job/issues` | Job > Track > New |
| Sprints | 11.1 Track | `GET /api/job/sprints` | Job > Track > Sprints |
| Backlog | 11.1 Track | `GET /api/job/backlog` | Job > Track > Backlog |
| PRs | 11. (Code) | `GET /api/job/pull-requests` | Job > Code |
| Builds | 11. (Build) | `GET /api/job/builds` | Job > Build |
| Products (Commerce) | 9. Commerce | `GET /api/commerce/products` | Commerce > Products |
| Orders (Buyer) | 9.2 Orders | `GET /api/commerce/orders` | Commerce > Orders |
| Orders (Seller) | 9.2 Orders | `GET /api/commerce/seller/orders` | Commerce > Seller |

---

## 9. Common Pitfalls

### ❌ **Mixing UI Tokens**
```tsx
// WRONG – Using MOxE blue in Job tool
<button className="bg-moxe-primary">Create Issue</button>

// CORRECT – Use MOxE blue
<button className="bg-[#0052CC] hover:bg-[#2684FF]">Create Issue</button>
```

### ❌ **Hardcoding API URLs**
```tsx
// WRONG
const res = await fetch('http://localhost:5007/api/posts');

// CORRECT
import { getApiBase } from '../../services/api';
const res = await fetch(`${getApiBase()}/posts`);
```

### ❌ **Missing Auth Headers**
```tsx
// WRONG
fetch(`${API_BASE}/posts/feed`);

// CORRECT
const headers = authHeaders();
fetch(`${API_BASE}/posts/feed`, { headers });
```

### ❌ **Wrong Account Type Check**
```tsx
// WRONG – Using accountType directly
if (accountType === 'job') { ... }

// CORRECT – Use capabilities
const { canUseJobTools } = useCapabilities();
if (canUseJobTools) { ... }
```

### ❌ **Infinite Scroll Double Fetch**
```tsx
// WRONG – cursor in dependency array causes double fetch
const [cursor, setCursor] = useState(null);
useEffect(() => {
  fetchItems(cursor);
}, [cursor]); // ❌

// CORRECT – use ref for cursor
const cursorRef = useRef(null);
useEffect(() => {
  fetchItems();
}, []); // ✅ runs once
```

---

## 10. Quick Start Commands

```bash
# Start backend
cd BACKEND
npm run dev

# Start frontend (in another terminal)
cd FRONTEND
npm run dev

# Check API health
curl http://localhost:5007/api/health

# Run database migrations
cd BACKEND
npx prisma migrate dev

# View database
npx prisma studio

# Build frontend for production
cd FRONTEND
npm run build
```

---

## 📌 **Final Reminder**

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   FOR EVERY FEATURE:                                         ║
║                                                              ║
║   1. Identify if it's MOxE or MOxE style          ║
║   2. Read the workflow in ALGORITHMS_AND_WORKFLOWS.md       ║
║   3. Check the API in MOxE_END_TO_END_BLUEPRINT.md          ║
║   4. Use correct UI tokens (moxe-* or MOxE)            ║
║   5. Use getApiBase() + authHeaders()                       ║
║   6. Test with correct account type                          ║
║                                                              ║
║   FOLLOW THE SAME WORKFLOW, SAME APIS,                       ║
║   SAME ARCHITECTURE, SAME PLAN, SAME FUNCTIONS               ║
║   AS INSTAGRAM OR ATLASSIAN.                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Now go build something amazing! 🚀**
