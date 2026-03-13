# MOxE TRACK, TRACK Recruiter & WORK — Implementation Verification Checklist

This document verifies that **MOxE TRACK**, **MOxE TRACK Recruiter**, and **MOxE WORK** are implemented completely in the codebase (backend APIs + frontend UI).  
Reference: **MOXE_JOB_ACCOUNT_FUNCTIONAL_GUIDE.md** (TRACK = agile projects; TRACK Recruiter = recruitment pipeline; WORK = business projects, task lists, Gantt).

---

## 1. MOxE TRACK (Applications & Job Postings & Pipelines)

*Applications (candidate apply), job postings (public + internal), and pipelines (stages).*

| Feature / Sub-feature | Backend | Frontend | Status |
|----------------------|---------|----------|--------|
| **Applications** | | | |
| List applications | `GET /track/applications` | Track.tsx (Applications tab) | ✅ |
| Get application by id | `GET /track/applications/:id` | TrackApplicationDetail.tsx | ✅ |
| Apply to job (public) | `POST /track/apply/:jobPostingId` | Track.tsx apply flow | ✅ |
| **Pipelines** | | | |
| List pipelines | `GET /track/pipelines` | Track.tsx (Pipelines tab) | ✅ |
| Create pipeline | `POST /track/pipelines` | Track.tsx create pipeline | ✅ |
| Update pipeline stages | `PATCH /track/pipelines/:id/stages` | Track.tsx "Edit stages" modal | ✅ |
| **Job postings** | | | |
| List jobs (filter status, myOnly) | `GET /track/jobs` | Track.tsx (Jobs tab) | ✅ |
| Get job by id | `GET /track/jobs/:id` | Track.tsx, TrackJobRecruiter | ✅ |
| Get job by slug (public) | `GET /track/jobs/by-slug/:slug` | Public apply flow | ✅ |
| Create job | `POST /track/jobs` | Track.tsx create job form | ✅ |
| Update job | `PATCH /track/jobs/:id` | Track.tsx (edit job) | ✅ |
| Publish job | `POST /track/jobs/:id/publish` | Track.tsx publish | ✅ |
| Suggest job titles | `GET /track/jobs/suggest-titles` | (optional) | ✅ backend |
| **Supporting** | | | |
| Accounts for assignment | `GET /track/accounts-for-assignment` | Used in job/recruiter UIs | ✅ |
| Departments | `GET /track/departments` | (optional) | ✅ backend |

---

## 2. MOxE TRACK Recruiter (Candidates, Interviews, Offers)

*Candidate pipeline per job: list, add, move, notes, rate, source, interviews, decision, reject, email, offers.*

| Feature / Sub-feature | Backend | Frontend | Status |
|----------------------|---------|----------|--------|
| **Candidates** | | | |
| List candidates by job | `GET /track/jobs/:id/candidates` | TrackJobRecruiter.tsx | ✅ |
| Get candidate (application/recruitment) | `GET /track/candidates/:kind/:id` | TrackJobRecruiter detail drawer | ✅ |
| Move candidate (stage) | `PATCH /track/candidates/:kind/:id/move` | Stage dropdown + reason | ✅ |
| Add notes (append, noteType) | `PATCH /track/candidates/:kind/:id/notes` | Notes textarea + "Add note" | ✅ |
| Rate candidate | `PATCH /track/candidates/:kind/:id/rate` | 1–5 stars + justification | ✅ |
| Set/update source | `PATCH /track/candidates/:kind/:id/source` | Source field in detail drawer (edit on blur) | ✅ |
| Add candidate (manual) | `POST /track/jobs/:id/candidates` | Add candidate modal (with source) | ✅ |
| Bulk move candidates | `POST /track/jobs/:id/candidates/bulk-move` | Bulk select + target stage | ✅ |
| Import template CSV | `GET /track/jobs/:id/candidates/import/template` | Download template | ✅ |
| Import candidates CSV | `POST /track/jobs/:id/candidates/import` | Import CSV modal | ✅ |
| **Interviews** | | | |
| Create interview | `POST /track/interviews` | Schedule interview modal | ✅ |
| Get interview | `GET /track/interviews/:id` | Shown in candidate detail | ✅ |
| Add feedback | `POST /track/interviews/:id/feedback` | FeedbackForm in drawer | ✅ |
| Get feedback / aggregated | `GET /track/interviews/:id/feedback` | InterviewFeedbackAggregated | ✅ |
| Send calendar invites | `POST /track/interviews/:id/send-invites` | "Send calendar invites" | ✅ |
| Set interviewers | `PATCH /track/interviews/:id/interviewers` | Backend only | ⚪ Optional UI |
| Mark interview complete | `PATCH /track/interviews/:id/complete` | Backend only | ⚪ Optional UI |
| Set feedback form type | `PATCH /track/interviews/:id/feedback-form` | Set on create | ⚪ Optional UI |
| **Decision & Reject** | | | |
| Decision (Advance/Offer/Hold) | `POST /track/candidates/:kind/:id/decision` | Decision modal | ✅ |
| Reject (with template) | `POST /track/candidates/:kind/:id/reject` | Reject modal | ✅ |
| **Email** | | | |
| Send email to candidate | `POST /track/candidates/:kind/:id/email` | Send email modal (template/subject/body) | ✅ |
| **Offers** | | | |
| Create offer | `POST /track/candidates/:kind/:id/offer` | Offer modal | ✅ |
| Get offer for candidate | `GET /track/candidates/:kind/:id/offer` | Shown in drawer | ✅ |
| Send offer | `POST /track/offers/:id/send` | Send / Send & email | ✅ |
| Set outcome (Accepted/Declined) | `PATCH /track/offers/:id/outcome` | Mark Accepted / Declined | ✅ |
| **Job description** | | | |
| View job description | (from job) | JobDescriptionView in TrackJobRecruiter | ✅ |

---

## 3. MOxE TRACK (Agile — Projects, Board, Backlog, Sprints, Issues)

*Agile project management: projects, Kanban board, backlog, sprints, issues, labels, capacity, archive, import.*

| Feature / Sub-feature | Backend | Frontend | Status |
|----------------------|---------|----------|--------|
| **Projects** | | | |
| List projects | `GET /track/projects` | Track.tsx (Projects tab) | ✅ |
| Get project | `GET /track/projects/:projectId` | TrackProjectDetail.tsx | ✅ |
| Create project | `POST /track/projects` | Track.tsx | ✅ |
| Update project | `PATCH /track/projects/:projectId` | TrackProjectDetail | ✅ |
| Delete project | `DELETE /track/projects/:projectId` | TrackProjectDetail | ✅ |
| **Board** | | | |
| Get board (with filters) | `GET /track/projects/:projectId/board` | Board view | ✅ |
| Export board (CSV/JSON) | `GET /track/projects/:projectId/board/export` | Export | ✅ |
| Update column | `PATCH /track/columns/:columnId` | Column edit | ✅ |
| **Backlog** | | | |
| Get backlog | `GET /track/projects/:projectId/backlog` | Backlog view | ✅ |
| Reorder backlog | `POST /track/projects/:projectId/issues/reorder` | Drag reorder | ✅ |
| Archive issues | `POST /track/projects/:projectId/issues/archive` | Bulk archive | ✅ |
| Get archived issues | `GET /track/projects/:projectId/issues/archived` | Archived list + unarchive | ✅ |
| Unarchive issue | `PATCH /track/issues/:issueId/unarchive` | Unarchive action | ✅ |
| **Issues** | | | |
| Create issue | `POST /track/projects/:projectId/issues` | Add issue (board/backlog) | ✅ |
| Get issue | `GET /track/issues/:issueId` | Issue detail | ✅ |
| Update issue | `PATCH /track/issues/:issueId` | Edit issue / quick edit | ✅ |
| Move issue (column/rank) | `PATCH /track/issues/:issueId/move` | Board drag | ✅ |
| Delete issue | `DELETE /track/issues/:issueId` | Delete | ✅ |
| Bulk update issues | `PATCH /track/projects/:projectId/issues/bulk` | Bulk modal | ✅ |
| Import issues CSV | `POST /track/projects/:projectId/issues/import` | Import modal | ✅ |
| Split issue | `POST /track/issues/:issueId/split` | Split modal | ✅ |
| **Labels** | | | |
| List labels | `GET /track/projects/:projectId/labels` | Labels | ✅ |
| Create label | `POST /track/projects/:projectId/labels` | New label | ✅ |
| Update label | `PATCH /track/labels/:labelId` | Edit label | ✅ |
| Delete label | `DELETE /track/labels/:labelId` | Delete label | ✅ |
| Add label to issue | `POST /track/issues/:issueId/labels` | Issue detail | ✅ |
| Remove label from issue | `DELETE /track/issues/:issueId/labels/:labelId` | Issue detail | ✅ |
| **Attachments** | | | |
| Add attachment | `POST /track/issues/:issueId/attachments` | Issue detail | ✅ |
| Delete attachment | `DELETE /track/attachments/:attachmentId` | Issue detail | ✅ |
| **Sprints** | | | |
| List sprints | `GET /track/projects/:projectId/sprints` | Sprints view | ✅ |
| Create sprint | `POST /track/projects/:projectId/sprints` | New sprint form | ✅ |
| Start sprint | `PATCH /track/sprints/:sprintId/start` | Start sprint | ✅ |
| Complete sprint | `PATCH /track/sprints/:sprintId/complete` | Complete sprint | ✅ |
| Add issue to sprint | `POST /track/issues/:issueId/sprint` | Add to sprint | ✅ |
| **Capacity** | | | |
| Capacity (velocity, recommended) | `GET /track/projects/:projectId/capacity` | Capacity display | ✅ |

---

## 4. MOxE WORK (Business Projects, Task Lists, Gantt)

*Business project planning: projects, task lists, tasks, checklist, comments, attachments, dependencies, Gantt, critical path.*

| Feature / Sub-feature | Backend | Frontend | Status |
|----------------------|---------|----------|--------|
| **Projects** | | | |
| List projects | `GET /work/projects` | Work.tsx | ✅ |
| Get project (by id or slug) | `GET /work/projects/:idOrSlug` | WorkProjectDetail.tsx | ✅ |
| Create project | `POST /work/projects` | New project modal (name, type, dates, budget, breakdown, goals) | ✅ |
| Update project | `PATCH /work/projects/:id` | Header edit | ✅ |
| Delete project | `DELETE /work/projects/:id` | Delete project button | ✅ |
| **Members** | | | |
| Add member (with role) | `POST /work/projects/:id/members` | Team add + role dropdown | ✅ |
| Remove member | `DELETE /work/projects/:id/members/:accountId` | Remove in team | ✅ |
| **Task lists** | | | |
| Create task list | `POST /work/task-lists` | Add list | ✅ |
| Update task list (name) | `PATCH /work/task-lists/:id` | Rename list (inline edit) | ✅ |
| Delete task list | `DELETE /work/task-lists/:id` | Delete list | ✅ |
| **Tasks** | | | |
| Create task | `POST /work/tasks` | Add task (title, description, due, start, duration, priority, assignee) | ✅ |
| Get task (checklist, comments, attachments) | `GET /work/tasks/:id` | Task panel | ✅ |
| Update task | `PATCH /work/tasks/:id` | Task panel (description, progress, due, start, duration, status) | ✅ |
| Complete task | `POST /work/tasks/:id/complete` | Complete action | ✅ |
| Delete task | `DELETE /work/tasks/:id` | Delete task | ✅ |
| **Checklist** | | | |
| Add checklist item | `POST /work/tasks/:id/checklist` | Add item | ✅ |
| Toggle checklist item | `PATCH /work/checklist/:itemId` | Toggle | ✅ |
| **Comments** | | | |
| Add comment | `POST /work/tasks/:id/comments` | Add comment | ✅ |
| **Attachments** | | | |
| Add attachment | `POST /work/tasks/:id/attachments` | Upload then add | ✅ |
| Delete attachment | `DELETE /work/attachments/:attachmentId` | Delete in list | ✅ |
| **Dependencies** | | | |
| Set dependency (predecessor/successor, type) | `POST /work/dependencies` | Gantt tab dependency dropdowns + Set | ✅ |
| **Gantt** | | | |
| Get Gantt data (with critical path) | `GET /work/projects/:id/gantt` | Gantt tab | ✅ |
| Critical path highlight | (in getProjectGantt) | Gantt tab criticalTaskIds | ✅ |
| Export Gantt CSV | (frontend from Gantt data) | Export CSV button | ✅ |
| Print Gantt | (frontend) | Print button | ✅ |
| **Assignment** | | | |
| Accounts for assignment | `GET /work/accounts-for-assignment` | Assignee dropdown | ✅ |

---

## 5. Routes & Entry Points

| Area | Route | Component |
|------|--------|-----------|
| Track home | `/job/track` | Track.tsx (Applications, Jobs, Pipelines, Projects) |
| Application detail | `/job/track/application/:id` | TrackApplicationDetail.tsx |
| Job recruiter | `/job/track/job/:jobId` | TrackJobRecruiter.tsx |
| Agile project | `/job/track/project/:projectId` | TrackProjectDetail.tsx |
| Work home | `/job/work` | Work.tsx |
| Work project | `/job/work/project/:idOrSlug` | WorkProjectDetail.tsx |
| Job home | `/job` | JobHome.tsx (cards: Track, Work, etc.) |

---

## 6. Summary

- **MOxE TRACK (Applications, Jobs, Pipelines):** Implemented; pipelines editable (stages); applications list/detail and apply flow; job CRUD + publish.
- **MOxE TRACK Recruiter:** Implemented; candidates (list, add, move, notes, rate, **source**), interviews (create, feedback, send invites), decision, reject, email, offers (create, send, outcome); bulk move; import CSV. Optional: interview complete, interviewers, feedback-form PATCH in UI.
- **MOxE TRACK (Agile):** Implemented; projects, board, backlog, sprints, issues, labels, attachments, archive, import, capacity, column edit, split.
- **MOxE WORK:** Implemented; projects (with budget breakdown, goals, team, delete), task lists (rename, delete), tasks (full CRUD, checklist, comments, attachments, status, progress), dependencies, Gantt (critical path, export CSV, print).

All core features, sub-features, and functions for **MOxE TRACK**, **MOxE TRACK Recruiter**, and **MOxE WORK** are implemented and wired end-to-end. The only optional gaps are recruiter UI for **Set interviewers**, **Mark interview complete**, and **Change feedback form** (all have backend support).
