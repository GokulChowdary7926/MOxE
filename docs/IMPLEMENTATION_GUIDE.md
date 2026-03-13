# Start Coding MOxE: Implementation Guide (Aligned with Repo)

This guide maps the **MOxE UI Design Blueprint** and the **Step-by-Step Coding Guide** to the **existing MOxE codebase** (web + mobile) and gives concrete next steps.

---

## 1. Current Tech Stack

| Layer | Web (FRONTEND) | Mobile (MOBILE) |
|-------|-----------------|------------------|
| **Framework** | Vite + React 18 | Expo (React Native) |
| **Language** | TypeScript | TypeScript |
| **Navigation** | React Router v6 | React Navigation (stack, bottom-tabs, drawer) |
| **State** | Redux Toolkit (auth, account) | AuthContext + AsyncStorage |
| **API** | `services/api.ts` (fetch) + workflow modules | `config/api.ts` (API_BASE) + fetch |
| **Styling** | Tailwind + CSS vars (Instagram/Atlassian tokens) | StyleSheet + `theme/` (Instagram/Atlassian) |

**Backend:** `BACKEND/` – Express, Prisma, Socket.IO. All APIs under `/api/*`.

---

## 2. Folder Structure (Current)

### FRONTEND (web)
```
FRONTEND/src/
├── store/           # Redux: authSlice, accountSlice
├── hooks/           # useFeed, useMessages, useNotifications, useExploreSearch, useCurrentAccount, etc.
├── workflows/       # feedWorkflow, messageWorkflow, createPostWorkflow, exploreWorkflow, etc.
├── services/        # api.ts, socket.ts, upload
├── components/     # ui/, layout/, feed/, auth/, profile/, job/, business/
├── pages/           # auth/, home/, profile/, messages/, notifications/, explore/, create/, settings/, job/, commerce/, etc.
└── App.tsx          # Routes, QueryClient, Toaster, ProtectedRoute
```

### MOBILE (Expo)
```
MOBILE/src/
├── context/         # AuthContext (token, user, login, logout)
├── config/          # api.ts (API_BASE)
├── theme/           # colors, theme (Instagram/Atlassian)
├── navigation/      # RootNavigator, AuthStack, MainTabs, HomeStack, ProfileStack, JobStack, etc.
├── screens/         # auth/, personal/, shared/, business/, creator/, job/
├── components/     # instagram/, atlassian/, shared/, ui/
└── App.tsx          # SafeAreaProvider, AuthProvider, NavigationContainer, RootNavigator
```

---

## 3. Blueprint Mapping: What Exists vs What to Build

### 3.1 Authentication
| Item | Web (FRONTEND) | Mobile (MOBILE) |
|------|----------------|-----------------|
| Phone input + send code | ✅ `Register.tsx` → `POST /api/auth/send-verification-code` | ✅ `RegisterScreen.tsx` |
| Verify code + login/register | ✅ `PhoneVerification.tsx` → `POST /api/auth/verify-code` | ✅ Auth flow in context |
| Login (password) | ✅ `Login.tsx` → `POST /api/auth/login` | ✅ `LoginScreen.tsx` |
| Token persistence | localStorage | AsyncStorage (AuthContext) |
| **Next:** RTK Query on mobile for auth API + cache | – | Optional: add `authApi` + Redux |

### 3.2 Account Management (Profile, Settings)
| Item | Web | Mobile |
|------|-----|--------|
| Profile view | ✅ `Profile.tsx` (personal/creator/business/job) | ✅ `ProfileScreen.tsx` |
| Edit profile | ✅ `EditProfile.tsx` → PATCH account/user | ✅ `EditProfileScreen.tsx` |
| Settings list | ✅ `Settings.tsx` (sections + search) | ✅ `SettingsScreen.tsx` |
| Blocked / Muted / Privacy | ✅ BlockedAccounts, MutedAccounts, PrivacySettings + workflows | Implement or link to same APIs |
| **Next:** Ensure every account-management function in blueprint has a screen + API call | See blueprint §4.1 | Same |

### 3.3 Content Creation
| Item | Web | Mobile |
|------|-----|--------|
| Create post | ✅ `CreatePost.tsx` (media, caption, hashtags, advanced) | ✅ `CreatePostScreen.tsx` |
| Create story | ✅ `CreateStory.tsx` | ✅ `CreateStoryScreen.tsx` |
| Media upload | ✅ `services/api.ts` uploadFile, createPostWorkflow | Use API_BASE + upload endpoint |
| **Next:** Product tagging (Business), branded content (Creator) | Wire in create post | Same |

### 3.4 Engagement (Feed, Like, Comment, Share)
| Item | Web | Mobile |
|------|-----|--------|
| Home feed | ✅ `Home.tsx` + useFeed, refresh, Loading/Error/Empty | ✅ `HomeScreen.tsx` (static or API) |
| Like/save post | ✅ useFeed handleLike, handleSave → feedWorkflow | Wire to `POST/DELETE /api/posts/:id/like` |
| Comments | ✅ PostCard, getComments, addComment (workflows) | Post detail screen + comments API |
| Share to DM / story | ✅ shareWorkflow | Implement share sheet + APIs |
| **Next:** Optimistic like on mobile; real-time feed updates | – | Add refetch after like/post |

### 3.5 Direct Messages
| Item | Web | Mobile |
|------|-----|--------|
| Thread list | ✅ `Messages.tsx` + useMessages, refreshThreads | ✅ `MessagesScreen.tsx` |
| Thread view + send | ✅ useThread, send, refreshThreads after send | ✅ `MessageThreadScreen.tsx` |
| Voice, media, GIF | ✅ Messages.tsx (voice upload, media) | Implement with API_BASE |
| **Next:** Real-time (socket) on mobile when backend emits | Socket in FRONTEND | Add socket client when backend ready |

### 3.6 Notifications
| Item | Web | Mobile |
|------|-----|--------|
| List + tabs | ✅ `Notifications.tsx` + useNotifications, refresh | ✅ `NotificationsScreen.tsx` |
| Mark read / all read | ✅ markRead, markAllRead | Same APIs |

### 3.7 Business (Commerce)
| Item | Web | Mobile |
|------|-----|--------|
| Commerce hub | ✅ `Commerce.tsx` (dashboard, terms, links) | ✅ `CommerceScreen.tsx`, `BusinessDashboardScreen.tsx` |
| Products, orders, shop settings | ✅ CommerceProducts, CommerceOrders, CommerceShopSettings | Stubs or links |
| **Next:** Full product CRUD, order status, returns (blueprint §4.7) | commerceWorkflow + screens | Same APIs |

### 3.8 Creator
| Item | Web | Mobile |
|------|-----|--------|
| Creator screens | ✅ CreatorEarnings, CreatorSubscribers, ContentCalendar, etc. | ✅ SubscribersScreen, EarningsScreen, ContentScreen, ToolsScreen |
| **Next:** Subscriptions, gifts, branded content (blueprint §4.8) | Wire APIs | Same |

### 3.9 Job (24 Tools)
| Item | Web | Mobile |
|------|-----|--------|
| Job layout (sidebar + content) | ✅ `Job.tsx` (breadcrumbs, nav, routes) | ✅ JobStack, JobHomeScreen, JobListScreen |
| TRACK, FLOW, KNOW, CODE, etc. | ✅ Track, Flow, Know, Code, Compass, Build, Atlas, Alert, Status, etc. | Placeholders; can deep-link to web or implement natively |
| **Next:** Ensure each job tool has loading/error/empty + API (blueprint §4.9) | Use shared ui (LoadingState, ErrorState, EmptyState) | Same pattern |

---

## 4. Step-by-Step: What to Do Next

### Phase 1: Foundation (already largely done)
- [x] Auth flow (web + mobile)
- [x] Redux (web) / AuthContext (mobile) for auth
- [x] Bottom tabs (web: nav links; mobile: MainTabs)
- [x] Profile + Edit Profile
- [x] Basic feed + create post
- [ ] **Optional (mobile):** Add Redux Toolkit + RTK Query for API cache and mutations (see blueprint §6).

### Phase 2: Social Features
- [x] Feed refresh after create post (web)
- [x] Messages: refresh thread list after send (web)
- [x] Notifications: refresh button + realtime subscription (web)
- [ ] **Mobile:** Wire HomeScreen to real feed API; add refresh and loading/error/empty.
- [ ] **Both:** Ensure Stories viewer/creator call correct APIs; add real-time where needed.

### Phase 3: Business & Creator
- [ ] Business: Product catalog, order management, returns, seller analytics (screens + workflows).
- [ ] Creator: Subscriptions, branded content, content scheduler (screens + APIs).

### Phase 4: Job Tools
- [ ] Each job tool (TRACK, KNOW, CODE, FLOW, etc.): ensure screen exists, uses shared Loading/Error/Empty, and refetches after mutations (see `docs/UI_AND_API_CONNECTIONS.md`).

### Phase 5: Polish
- [ ] E2E tests, performance (virtualized lists, image caching), dark mode, accessibility.

---

## 5. Adding RTK Query to Mobile (Optional)

To align with the blueprint’s recommendation (Redux Toolkit + RTK Query):

1. **Install**
   ```bash
   cd MOBILE && npm install @reduxjs/toolkit react-redux
   ```

2. **Create API + store**
   - `src/app/store.ts` – configureStore with api reducer + middleware.
   - `src/services/apiClient.ts` – createApi with fetchBaseQuery, baseUrl from `config/api.ts`, prepareHeaders with token from Redux.

3. **Auth slice**
   - Keep AuthContext for token persistence (AsyncStorage) and initial hydration, or move token into Redux and persist with redux-persist.

4. **Inject endpoints**
   - authApi (login, register, verify)
   - accountApi (getMe, updateProfile)
   - feedApi, messageApi, etc. (mirror FRONTEND workflows with RTK Query mutations/queries).

5. **Use in screens**
   - Replace manual fetch with useGetFeedQuery, useLikePostMutation, etc.
   - Use loading/error from RTK Query; use shared LoadingState/ErrorState/EmptyState components.

---

## 6. API Base URLs

- **Web:** `process.env.REACT_APP_API_URL || 'http://localhost:5007/api'` (see FRONTEND vite.config and .env).
- **Mobile:** `process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5007/api'` (MOBILE/src/config/api.ts). For device, set to machine IP or deployed backend.

---

## 7. Key Docs

- **Blueprint (this repo):** `docs/MOxE_UI_DESIGN_BLUEPRINT.md`
- **UI & API connections (web):** `docs/UI_AND_API_CONNECTIONS.md`
- **Data flow & why updates weren’t updating:** `docs/DATA_FLOW_AND_UI_UPDATES.md`
- **Backend routes:** `BACKEND/src/routes/`

Use the blueprint tables to verify every function has a UI component and an API endpoint; use this implementation guide to advance web and mobile in parallel and to add RTK Query on mobile when you want caching and optimistic updates.
