# MOxE Job Account — Verification & Tier

This document states how the **MOxE Job Account** aligns with the **COMPLETE MOxE JOB ACCOUNT FUNCTIONAL GUIDE**.

---

## Tier

- **No Free Tier.** Job Accounts are **premium only**.
- **Paid Tier:** $10/month. Full access to all 24 professional tools, **Purple Verification Badge** (when verified), 10GB base cloud storage, priority support.
- Account limits: up to **2 job accounts** + **1 personal account** per phone number.

---

## Purple Verification Badge

- The **Purple Verification Badge** (purple checkmark ✓) is used for **Job accounts** to indicate:
  - Identity has been verified
  - Paid subscriber status
  - Trust signal for recruiters and employers
  - Priority in search results
  - Enhanced impersonation protection
- **Implementation note:** The backend uses a single `verifiedBadge` boolean. The **UI** should render a **Purple** badge for JOB accounts and **Blue** for Creator/Business when displaying verification. Verification flow (request/approve) can be shared; badge color is account-type-specific in the frontend.

---

## Personal Foundation

Job Accounts include **all** MOxE Personal account features (account management, posts, stories, reels, engagement, save & collections, close friends, highlights, archive, DMs, privacy & safety, notifications). Same routes and capabilities as Personal; see **JOB_ACCOUNT_FEATURE_CHECKLIST.md** Section 0.

---

## 24 Professional Tools

Per the functional guide, Job Paid includes full access to: TRACK, TRACK Recruiter, WORK, KNOW, CODE, STATUS, FLOW, ACCESS, ALERT, BUILD, COMPASS, ATLAS, VIDEO, CHAT, SOURCE, CODE SEARCH, AI, STRATEGY, ANALYTICS, PROFILE, INTEGRATION, SCRUM, TEAMS, DOCS. Implementation status: **JOB_ACCOUNT_FEATURE_CHECKLIST.md**.

---

## References

- **MOXE_JOB_ACCOUNT_FUNCTIONAL_GUIDE.md** — Full Job account spec (structure, tier, 24 tools, storage, summary).
- **JOB_ACCOUNT_FEATURE_CHECKLIST.md** — Map of guide to codebase and implementation status.
