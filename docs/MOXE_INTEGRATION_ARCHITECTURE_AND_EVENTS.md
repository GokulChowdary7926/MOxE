# MOxE Integration Architecture & Event Catalog

Cross-tool integration patterns and event catalog for MOxE Job tools and internal sync.

---

## 1. Cross-Tool Integration Patterns

| Pattern | Example | Implementation | Strength |
|---------|---------|----------------|----------|
| **Bidirectional sync** | TRACK ↔ CODE (issues ↔ PRs, branches) | MOxE INTEGRATION tool; link issues to branches/PRs; status sync | Design goal; verify in job.routes and UI. |
| **Unidirectional trigger** | TRACK → ALERT (e.g. issue created → notify on-call) | Event or webhook from TRACK to ALERT | To be configured in INTEGRATION. |
| **Embedded content** | VIDEO in TRACK (attach recording to issue) | Link or embed VIDEO resource in TRACK issue | Link by resource ID. |
| **Activity aggregation** | All → TEAMS | Activity feed from TRACK, FLOW, CODE, etc. | TEAMS dashboard consumes events. |
| **Unified identity** | All → PROFILE | Central account; Job dual profile (professional_section, personal_section) | High; implemented. |
| **Cross-tool search** | All → SEARCH | Search index across KNOW, CODE, issues | To be verified. |

---

## 2. MOxE INTEGRATION Tool

- **Purpose:** Configure sync rules and automations between Job tools (e.g. TRACK ↔ CODE, TRACK ↔ KNOW).
- **Implementation:** Document or implement as one of:
  - **Rules engine:** Stored rules (e.g. “When TRACK issue status → In Progress, create CODE branch”); executed by a job or on event.
  - **Event bus:** Internal events (e.g. `track.issue.updated`) published to a queue; subscribers (CODE, BUILD, etc.) react.
  - **API gateway:** No separate engine; each tool calls the other’s API when needed; INTEGRATION UI only configures which links to create.
- **Sync rules (target):**
  - TRACK issue status → In Progress: create CODE branch (optional), link branch to issue.
  - CODE PR merged: update linked TRACK issue status (e.g. Done).
  - WORK project completed: create KNOW retrospective page (optional).
- **Operational:** Rule storage (DB or config), execution (sync vs async), and sync logs for troubleshooting to be defined per implementation.

---

## 3. Event Catalog (Recommended)

Events below support webhooks (ALGORITHMS_AND_WORKFLOWS §18) and internal cross-tool sync.

| Event | Description | Payload (minimal) |
|-------|-------------|-------------------|
| **post.created** | New post published | postId, accountId, createdAt |
| **post.deleted** | Post removed | postId, accountId |
| **user.follow** | Follow relationship created | followerId, followingId, createdAt |
| **order.paid** | Commerce order paid | orderId, buyerId, sellerId, amount, createdAt |
| **track.issue.created** | TRACK issue created | issueId, projectId, accountId, createdAt |
| **track.issue.updated** | TRACK issue updated (e.g. status) | issueId, changes, updatedAt |
| **code.pull_request.merged** | CODE PR merged | pullRequestId, repoId, branch, mergedAt |
| **code.branch.created** | CODE branch created | branchId, repoId, name, createdAt |
| **flow.card.moved** | FLOW card moved column | cardId, boardId, fromColumnId, toColumnId, updatedAt |
| **know.page.created** | KNOW page created | pageId, spaceId, accountId, createdAt |
| **live.started** | Live stream started | liveId, accountId, startedAt |
| **live.ended** | Live stream ended | liveId, accountId, endedAt |

**Usage:** Backend publishes to an internal event bus or queue; webhook service and MOxE INTEGRATION (if event-driven) subscribe. Webhooks: POST to configured URL with payload + signature (e.g. HMAC).

---

## 4. Linked Items (UI)

- **TRACK:** Show linked CODE branches/PRs, KNOW pages, VIDEO recordings in issue detail.
- **CODE:** Show linked TRACK issues on PR/branch.
- **KNOW:** Show linked TRACK issues or WORK projects on page.
- **Consistency:** Prefer a shared “links” or “related items” API (e.g. `GET /api/job/links?entityType=issue&entityId=...`) or per-tool link tables; resolve and display in each tool’s UI.

---

## 5. Next Steps

1. Implement or document MOxE INTEGRATION (rules storage, execution, logs).
2. Add event publishing for key actions (track.issue.*, code.pull_request.*, etc.) if moving to event-driven sync.
3. Implement webhook delivery (signature, retry, logging) per ALGORITHMS_AND_WORKFLOWS §18.
4. Verify and document TRACK ↔ CODE and TRACK ↔ KNOW linking in job.routes and frontend.
