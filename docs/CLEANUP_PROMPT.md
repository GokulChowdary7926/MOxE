## Cursor AI Prompt: Clean Up Unwanted/Duplicate Files, Folders, and Code

You are a codebase cleanup expert. Perform a comprehensive cleanup of the MOxE project by removing unwanted files, folders, documentation, duplicate content, and redundant lines. Follow these rules strictly:

### SAFETY REQUIREMENTS
1. NEVER delete files without first checking if they're referenced anywhere
2. Create a backup branch before any deletions: `git checkout -b cleanup-YYYYMMDD`
3. After each major deletion, run the project to ensure it still works
4. Log all deletions in a cleanup report file: `docs/CLEANUP_REPORT_YYYYMMDD.md`

### PHASE 1: IDENTIFY UNWANTED FILES/FOLDERS

Follow the exact phases, commands, and rules from the long cleanup prompt provided in the conversation (Phase 1–8: unused files, duplicates, unwanted folders, docs, dead code, configs, cleanup script, verification, and report). Run these commands **locally in your terminal** (not inside the app) so you can inspect their output and decide what to delete.

Keep this file as the canonical reference for future cleanups; when running an actual cleanup, always:

- Start from a clean git state
- Create a backup branch
- Update `CLEANUP_REPORT_YYYYMMDD.md` with every deletion
- Re‑run `npm run dev`, tests, and builds after each batch of removals

