# MOxE Job Account — Feature Checklist (Guide → Codebase)

This checklist maps the **COMPLETE MOxE JOB ACCOUNT FUNCTIONAL GUIDE** to the codebase.  
**Job account:** Paid tier only ($10/month), **Purple Verification Badge**, 10GB base storage, all Personal features + 24 professional tools.  
**Account limits:** Up to **2 job accounts** + **1 personal account** per phone number.

---

## Tier & Badge (per guide)

| Item | Guide | Implementation |
|------|--------|----------------|
| Free tier | ❌ No free tier — Job is premium only | `account.service`: JOB sets tier FREE on convert; **guide specifies paid-only** — gate Job creation/access by paid tier when enforcing spec |
| Paid tier | $10/month, full 24 tools, Purple Badge | No separate "Job tier" in `SUBSCRIPTION_TIERS`; can use THICK or dedicated Job tier later |
| **Purple Verification Badge** | Shown when verified + paid; trust signal for recruiters | `verifiedBadge` is single boolean; **UI** can show **Purple** badge for JOB and **Blue** for Creator/Business when rendering |
| 10GB base storage | Included in $10/month | Storage limits in upload/storage logic; 10GB for Job to be enforced per guide |
| 2 job + 1 personal per phone | Account limits | `account.service` `isValidAccountCombination` — verify max 2 JOB + 1 PERSONAL per phone |

---

## Section 0: Personal Account Features (Included in Job)

Job accounts include **all** MOxE Personal account features (Sections 1–7 of the guide). Same backend/frontend as Personal; no account-type gate for these.

| Area | Backend | Frontend | Status |
|------|---------|----------|--------|
| Account management, privacy, notifications | Account, updateAccount, notificationPrefs | EditProfile (Job form), Settings → Privacy | ✅ |
| Posts, Stories, Reels (create, edit, caption, like, comment, share) | post, story, reel services | CreatePost, CreateStory, CreateReel, Feed | ✅ |
| Save & Collections | collection.routes, saved | canSavedCollections for JOB; Profile "Saved", /saved | ✅ |
| Close Friends | closeFriend.routes | canCloseFriends for JOB; Profile "Close Friends" | ✅ |
| Story Highlights | highlight.routes | Profile highlights, /profile/highlights | ✅ |
| Archive | archive.routes | Profile "Archive", /archive | ✅ |
| Direct Messages | message.routes | Messages | ✅ |
| Block, restrict, mute, report, hidden words | block, report, Account hiddenWords | Settings → Blocked, Hidden words, Safety | ✅ |

**Capabilities:** `capabilities.ts` JOB has `canCloseFriends: true`, `canSavedCollections: true`, `maxLinks: 5`, `canSchedulePosts: true`.

---

## Section 8: Job Account Setup & Verification

| Sub-Component | Guide | Backend | Frontend | Status |
|---------------|--------|---------|----------|--------|
| 8.1.1 Switch to Job | convertToJobAccount, dual sections, preserve followers | account.service PATCH accountType JOB (tier currently set FREE) | Convert to Job flow if present; otherwise Settings | ⚠️ Partial (convert exists; “suggest categorization” / dual sections per guide TBD) |
| 8.1.2 Professional section | Current role, experience, education, skills, portfolio, certs, languages, volunteer | Account / Profile fields for Job | EditProfileJobFields.tsx | ⚠️ Partial (Job fields exist; full professional subsection list per guide to be aligned) |
| 8.1.3 Personal section | Personal bio, interests, family, life milestones, granular visibility | Account / Profile | EditProfileJobFields, profile visibility | ⚠️ Partial |
| 8.1.4 **Purple Verification Badge** | verifyIdentity, verifyEmployment, verifyPaidSubscription; show next to username | VerificationRequest, verification.service (currently grants single verifiedBadge) | JobProfile + PostCard: **Purple** (#a855f7) for JOB when verifiedBadge | ✅ E2E |

---

## The 24 Professional Job Tools (Guide → Codebase)

| # | Tool | Guide Scope | Backend | Frontend | Status |
|---|------|-------------|---------|----------|--------|
| 1 | **MOxE TRACK** (Agile PM) | Projects, issues, sprints, boards, backlog | JobPosting, Pipeline, JobApplication; TrackProject, TrackIssue, TrackSprint, TrackLabel, TrackAttachment; track-agile.service; job.routes Track | Track.tsx (Applications, Jobs, Pipelines, **Projects**), TrackProjectDetail (board, backlog, sprints, labels, attachments, filter/export, bulk, CSV import) | ✅ E2E |
| 2 | **MOxE TRACK Recruiter** | Requisitions, candidate pipeline, interviews | Same as above + stages | Track, pipelines | ✅ E2E (pipelines/stages; recruiter-specific UI/templates TBD) |
| 3 | **MOxE WORK** (Business planning) | Business projects, task lists, Gantt | work.service; job.routes /work/* | Work.tsx, WorkProjectDetail (projects, task lists, tasks, checklist, comments, attachments, Gantt, dependencies, critical path) | ✅ E2E |
| 4 | **MOxE KNOW** (Knowledge base) | Spaces, pages, search | Company, CompanyReview, SalaryEntry, CareerResource, InterviewPrep; know.service | Know.tsx, job/know | ✅ Partial (companies, reviews, salary, resources; not full wiki/spaces/pages) |
| 5 | **MOxE CODE** (Code hosting) | Repos, PRs, code review | — | — | ❌ Not started |
| 6 | **MOxE STATUS** (System status) | Status page, incidents | — | — | ❌ Not started |
| 7 | **MOxE FLOW** (Visual tasks) | Boards, lists, cards | FlowBoard, FlowColumn, FlowCard; flow.service | Flow.tsx (boards, columns, cards, **drag-and-drop** move, edit card/board), JobKanban.tsx, job/flow | ✅ E2E |
| 8 | **MOxE ACCESS** (SSO, MFA, user mgmt) | User provisioning, SSO, MFA | — | — | ❌ Not started |
| 9 | **MOxE ALERT** (On-call) | Schedules, alert routing | — | — | ❌ Not started |
| 10 | **MOxE BUILD** (CI/CD) | Pipelines, build execution | — | — | ❌ Not started |
| 11 | **MOxE COMPASS** (Service catalog) | Service registration, health | — | — | ❌ Not started |
| 12 | **MOxE ATLAS** (Goal tracking) | OKRs, key results, progress | — | — | ❌ Not started |
| 13 | **MOxE VIDEO** (Screen recording) | Recording, video management | — | — | ❌ Not started |
| 14 | **MOxE CHAT** (Chat ticketing) | Tickets from chat, notifications | — | — | ❌ Not started |
| 15 | **MOxE SOURCE** (Git GUI) | Clone, commit, push | — | — | ❌ Not started |
| 16 | **MOxE CODE SEARCH** | Code search across repos | — | — | ❌ Not started |
| 17 | **MOxE AI** (AI assistant) | Content generation, data analysis | — | — | ❌ Not started |
| 18 | **MOxE STRATEGY** (Portfolio) | Initiatives, portfolio dashboard | — | — | ❌ Not started |
| 19 | **MOxE ANALYTICS** (Cross-tool) | Tool usage, custom reports | — | — | ❌ Not started |
| 20 | **MOxE PROFILE** (Unified identity) | Unified profile, privacy across tools | Account, profile | EditProfile, JobProfile | ⚠️ Partial (single profile; “unified across all tools” per guide TBD) |
| 21 | **MOxE INTEGRATION** (Cross-tool sync) | Link TRACK ↔ CODE etc. | — | — | ❌ Not started |
| 22 | **MOxE SCRUM** (Automated Scrum) | Sprint planning, standup bot, retro | — | — | ❌ Not started |
| 23 | **MOxE TEAMS** (Collaboration hub) | Activity feed, team metrics | — | — | ❌ Not started |
| 24 | **MOxE DOCS** (Document editing) | Docs, real-time collaboration | — | — | ❌ Not started |

---

## Backend API (Job)

- **/api/job** `job.routes.ts`:  
  **Track:** GET/POST applications, GET applications/:id, POST apply/:jobPostingId, GET/POST pipelines, GET jobs (myOnly, status), GET jobs/:id, POST jobs.  
  **Know:** GET/POST companies, GET companies/:slug, POST companies/:companyId/reviews, POST companies/:companyId/salaries, GET resources, GET/POST interview-preps, POST career-resources.  
  **Flow:** GET/POST/PATCH/DELETE boards, GET boards/:boardId, POST boards/:boardId/columns, PATCH/DELETE columns/:columnId, POST columns/:columnId/cards, PATCH/DELETE cards/:cardId, PATCH cards/:cardId/move.
- **Capabilities:** `canTrack`, `canKnow`, `canFlow`, `canDualProfile`, `canJobFeed`, `canNetworking` for JOB in `capabilities.ts`.

---

## Frontend Routes (Job)

- `/job` → Job (layout with Track, Know, Flow, Kanban, Wellness)
- `/job/track` → Track (applications, jobs, pipelines, **projects**)
- `/job/track/application/:id` → TrackApplicationDetail
- `/job/track/project/:projectId` → TrackProjectDetail (board, backlog, sprints, issues, labels, attachments, filter/export, bulk, CSV import)
- `/job/know` → Know (companies, reviews, resources)
- `/job/flow` → Flow (boards)
- `/job/kanban` → JobKanban
- `/job/wellness` → JobWellness
- `/profile` (when accountType JOB) → JobProfile

---

## Summary

- **Personal foundation (Section 0):** Implemented for Job via same routes and capabilities (saved, close friends, highlights, archive, DMs, etc.).
- **Job setup (Section 8):** Partially implemented (convert to JOB, Job profile fields); **Purple Verification Badge** and paid-only tier to be enforced and displayed per guide.
- **24 tools:** **3 implemented E2E** (TRACK including agile, KNOW, FLOW including drag-and-drop); **20 not started** (WORK, CODE, STATUS, ACCESS, ALERT, BUILD, COMPASS, ATLAS, VIDEO, CHAT, SOURCE, CODE SEARCH, AI, STRATEGY, ANALYTICS, INTEGRATION, SCRUM, TEAMS, DOCS; PROFILE partial).
- **Canonical spec:** See **MOXE_JOB_ACCOUNT_FUNCTIONAL_GUIDE.md** for full feature, sub-feature, function, sub-function, component, sub-component descriptions and examples.
