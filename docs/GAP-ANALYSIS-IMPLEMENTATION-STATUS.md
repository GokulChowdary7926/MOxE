# Gap Analysis – Implementation Status (MOxE Codebase)

This document reconciles the **Comprehensive Gap Analysis** (Business, Creator, Job specs) with the **current MOxE codebase** and lists what was fixed or clarified.

---

## Already implemented (verify in app)

Many items in the gap analysis are **already implemented** in this repo. Use this as a checklist.

### Volume 1: Basic social

| Spec item | Status | Where in codebase |
|-----------|--------|-------------------|
| **1.1.2.3 Remove followers** | ✅ | `Followers.tsx` – "Remove" per follower; `DELETE /follow/followers/:followerId`; **Privacy** now links to profile followers. |
| **1.1.1.9 Pronouns** | ✅ | `EditProfile.tsx`, Onboarding, Account schema `pronouns`. |
| **1.1.2.4 Search visibility** | ✅ | `PrivacySettings.tsx` – dropdown; `Account.searchVisibility`; `explore.service` filters. |
| **1.1.2.5 Activity status** | ✅ | `PrivacySettings` – show activity toggle; `showActivityStatus`, `lastActiveAt`; auth middleware updates `lastActiveAt`. |
| **1.4 Save & collections** | ✅ | Save post; create/list/update/delete collections; **FeedPost** “Save” opens collection picker; `SavedCollections.tsx`, `SharedCollection.tsx`. |
| **1.5 Voice messages** | ✅ | Messages – Record button (MediaRecorder), send VOICE; playback &lt;audio&gt;. |
| **1.5 GIFs, reactions, mute, pin, groups** | ✅ | message.routes, group.routes; Messages.tsx (GIF, reactions, mute, pin). |
| **1.6 Block, restrict, mute, report, hidden words** | ✅ | privacy.routes; BlockedList, RestrictedList, MutedList; report.routes; HiddenWordsSettings; post/message filters. |
| **1.7 Quiet mode** | ✅ | **Added** – `QuietModeSettings.tsx` (enable, start/end time, days); PATCH `accounts/me`; link from Notifications. |

### Volume 2: Personal

| Spec item | Status | Where in codebase |
|-----------|--------|-------------------|
| Close Friends | ✅ | closeFriend.routes; CloseFriendsList, CloseFriendsAdd. |
| Favorites feed | ✅ | GET `/posts/feed/favorites`; `FavoritesFeed.tsx`; link from Privacy. |
| Archive | ✅ | archive.routes; Archive.tsx; archived + recently deleted. |

### Volume 3: Business

| Spec item | Status | Where in codebase |
|-----------|--------|-------------------|
| **3.1 Switch to Business** | ✅ | AccountSettings – “Switch to Business”; PATCH accountType. |
| **3.1 Category, contact, hours, multiple links** | ✅ | AccountSettings – Business/Creator section: category, contact (email, phone, address), business hours, action buttons; schema + PATCH. **Accounts Centre** now has “Account type & profile” → AccountSettings. |
| **3.5 Product tagging** | ✅ | PostSharePage – product tag picker (Business); productTags in POST /posts; ProductTag, ProductTagClick. |
| Commerce, orders, returns, settlements | ✅ | commerce.routes, BusinessDashboard, Checkout, etc. |

### Volume 4: Innovative (partial)

| Spec item | Status | Where in codebase |
|-----------|--------|-------------------|
| Nearby, SOS, Proximity, Streaks, View once | ✅ | location, safety, proximity, streak routes; corresponding pages. |

---

## Changes made in this session

1. **Privacy (Remove followers & Follow requests)**  
   - “Remove followers” row in Privacy now **links** to `/profile/:username/followers` (own profile) so users can remove followers.  
   - “Follow requests” row **links** to `/follow/requests`.

2. **Privacy discoverability**  
   - Settings → “Privacy” row added (to `/settings/privacy`) with subtitle for search visibility, activity status, remove followers, story.

3. **Business / Account discoverability**  
   - Accounts Centre → “Account type & profile” row added (to `/settings/account`) so Business/Creator profile (category, contact, hours, action buttons) is easy to find.

4. **Quiet mode (1.7)**  
   - New **QuietModeSettings** page: enable/disable, start time, end time, days.  
   - Saves `quietModeEnabled`, `quietModeStart`, `quietModeEnd`, `quietModeDays` via PATCH `accounts/me`.  
   - Route: `/settings/notifications/quiet-mode`.  
   - Notifications settings: “Quiet mode” added at top of list.

---

## Still missing (high level)

- **Creator**: Subscription tiers CRUD, subscriber management, badges/gifts, exclusive content, creator payouts, branded content (partial in places).  
- **Job**: Dual profile UI, professional profile fields, job search, applications, recruiter tools, company pages (backend/partial in places).  
- **Business**: Full seller verification flow, full analytics UI, Live Shopping replay with product overlay (replay has sidebar products).  
- **Innovative**: Real-time translation, screenshot protection, full voice commands.

The codebase is **further along** than a “15–20% complete” reading of the spec suggests; the gap docs were written against a different or older baseline. Use this file and `MOxE-Gap-Analysis.md` together for prioritization.
