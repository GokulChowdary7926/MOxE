# Cursor AI Prompt: Safe, Automated Codebase Cleanup with Guardrails

Use this prompt when you want to clean up the MOxE codebase (remove unused code, junk files, and duplicates) **without breaking functionality**. It encodes a safe, step-by-step process with strong guardrails.

The key principles:

- **Never delete without checking references**
- **Always work on a backup branch**
- **Test after every batch of changes**
- **Log everything in a dated cleanup report**
- **When in doubt, keep it**

The full prompt (from your last message) defines:

1. **Safety requirements**
   - Golden rules
   - Files/folders that must never be deleted (docs, source, configs, prisma, env templates).
   - Lists of file types that are always safe to delete automatically (`.DS_Store`, logs, editor backups, etc.).

2. **Phase 1 – Setup**
   - Create a `cleanup-YYYYMMDD` branch.
   - Create `docs/CLEANUP_REPORT_YYYYMMDD.md` with:
     - Cleanup categories checklist.
     - Files/Folders/Code cleanup logs.
     - Verification results section.

3. **Phase 2 – Automated safe cleanup**
   - Shell commands to remove OS junk, logs, editor backups.
   - Remove empty directories (excluding `node_modules`, `.git`, build outputs).
   - Instructions to document this step in the cleanup report.

4. **Phase 3 – ESLint auto-fix**
   - Add `eslint-plugin-unused-imports`.
   - Configure ESLint rules to automatically remove unused imports/variables.
   - Run ESLint `--fix` for frontend and backend.
   - Manually run the app and verify critical flows afterwards.

5. **Phase 4 – Duplicate code detection (manual review)**
   - Install and run `jscpd` on `FRONTEND/src` and `BACKEND/src`.
   - For each real duplicate:
     - Extract to a shared utility/component.
     - Update imports.
     - Log in the cleanup report.

6. **Phase 5 – Dead file detection**
   - `scripts/find-unused-files.js` to find potentially unused files in:
     - `FRONTEND/src/components`, `hooks`, `utils`, `services`, `contexts`
     - `BACKEND/src/services`, `utils`
   - Manual review rules:
     - Only delete files with zero imports and no dynamic usage.
     - Update cleanup report with each deletion and verification notes.

7. **Phase 6 – Commented-out code cleanup**
   - Grep scripts to find large commented blocks and suspicious single-line comments.
   - Guidance on when to delete vs keep commented code:
     - Delete old implementations and debug logs.
     - Keep explanatory/TODO/documentation comments.

8. **Phase 7 – Folder structure cleanup**
   - Commands to inspect folder layout and detect duplicates.
   - Patterns to merge or remove redundant folders (e.g., `utils/helpers` vs `utils`).
   - Logging folder moves/merges in the report.

9. **Phase 8 – Final verification**
   - `scripts/verify-after-cleanup.js` running:
     - TypeScript check
     - ESLint
     - Frontend build
     - Backend build
   - List of critical routes to verify manually (Home, Feed, Profile, Job tools, Commerce).
   - Template for final verification section in the cleanup report.

10. **Phase 9 – Commit & PR**
    - Commit message template and push instructions for the cleanup branch.

11. **Command summary**
    - One block with all key commands (junk removal, ESLint, jscpd, unused-files script, commented-code search, verification script, commit).

### How to use this file

1. When you’re ready to run a cleanup, open this file and paste the full prompt into Cursor as your instruction context.
2. Follow the phases in order; do **not** skip the tests or the cleanup report.
3. Only delete files/functions when they clearly meet the “safe to delete” criteria.
4. Keep all alignment docs (`docs/*.md`), blueprints, and core source files unless you have very strong evidence they are obsolete.

This keeps MOxE’s cleanup process aggressive but safe, with a durable paper trail in `docs/CLEANUP_REPORT_YYYYMMDD.md`.

