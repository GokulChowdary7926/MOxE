# MOxE – Agent and developer guidelines

When working on MOxE, follow the same **workflow, APIs, architecture, and plan** as the Instagram and Atlassian alignment targets. Use the sources below for every change in the listed areas.

## Instagram-like features (Personal, Creator)

- **Scope:** Home (feed), Explore, Reels, Map, Messages, Profile; Stories; Posts (create, like, comment, save); DMs; Activity; Notifications; Settings (account stack).
- **Workflow and API:** Follow [docs/ALGORITHMS_AND_WORKFLOWS.md](docs/ALGORITHMS_AND_WORKFLOWS.md) for the relevant section (auth, feed, story, post, like, comment, message, etc.). Use Standard Error Responses and the described request/response shapes.
- **UI:** Follow [docs/MOxE_UI_DESIGN_BLUEPRINT.md](docs/MOxE_UI_DESIGN_BLUEPRINT.md). Use **moxe-\*** tokens (e.g. `bg-moxe-surface`, `text-moxe-textSecondary`, `border-moxe-border`, `text-moxe-primary` for links/active tab). Use **getApiBase()** and **getToken()** from `FRONTEND/services/api` for all API calls; do not use `import.meta.env.VITE_API_URL` directly in feature code.

## Business / Job features (Atlassian-like)

- **Scope:** Business dashboard, Commerce (seller), Job tools (Track, Flow, Know, Code, Build, Status, etc.).
- **Workflow and API:** Same as above (ALGORITHMS_AND_WORKFLOWS.md and blueprint). Respect capability checks (e.g. canCommerce, canLive).
- **UI:** Follow [docs/MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md](docs/MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md). Use **Atlassian-style** tokens: `#172B4D` (text primary), `#5E6C84` (secondary), `#DFE1E6` (border), `#0052CC` (primary blue), `#2684FF` (hover), `#F4F5F7` (surface). Use **JobPageContent** and **getApiBase()** for Job pages. Do **not** use Instagram primary blue (`#0095f6` / moxe-primary) for primary actions in Business/Job screens.

## API changes

- When adding or changing an API, check [docs/MOxE_END_TO_END_BLUEPRINT.md](docs/MOxE_END_TO_END_BLUEPRINT.md) “Current codebase vs blueprint” and [docs/ALGORITHMS_AND_WORKFLOWS.md](docs/ALGORITHMS_AND_WORKFLOWS.md) so the route, method, and request/response stay aligned with the workflow.
- Backend routes live in `BACKEND/src/routes/*.routes.ts`. Use consistent error body: `{ error: string, code?: string, requestId?: string }` and status codes from the workflow doc (400, 401, 403, 404, 409, 429, 500).

## Single source of truth

- **Full alignment guide:** [docs/DEVELOPER_ALIGNMENT_INSTAGRAM_ATLASSIAN.md](docs/DEVELOPER_ALIGNMENT_INSTAGRAM_ATLASSIAN.md) – workflow-to-code mapping, per-feature checklist, API gaps, theme boundary. Refer to it for any doubt about “same workflow, same APIs, same architecture.”
