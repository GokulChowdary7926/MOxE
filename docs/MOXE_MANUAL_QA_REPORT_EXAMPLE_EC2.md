# MOxE Manual QA Report (Example - EC2)

## Run Metadata

- Date: 2026-04-17
- Environment: EC2
- Build/Commit: Local workspace build (latest tested state)
- Tester: QA Team (example)
- Device/OS/Browser: macOS + Chrome/Safari (example)
- API Base URL: `http://13.126.171.152/api`
- Overall Status: CONDITIONAL GO

## Severity Legend

- `S1` Critical: core flow broken, data loss, security issue
- `S2` High: major feature unusable, no workaround
- `S3` Medium: feature partially works, workaround exists
- `S4` Low: cosmetic/minor UX issue

## Feature Test Matrix

| ID | Feature Area | Test Case | Expected Result | Actual Result | Status (PASS/FAIL/BLOCKED) | Severity (if fail) | Bug ID | Owner | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-001 | Auth | Login, reload, continue session | User remains authenticated; no repeated 401 calls | Passed in automation and local validation | PASS |  |  | FE/BE | Playwright + backend logs |
| F-002 | Auth | Logout and login again | Clean logout and successful re-login | Passed in automation | PASS |  |  | FE | Playwright |
| F-003 | Username Validation | Create username: `a`, `abc_123`, `name.test` | Accepted and saved | Validation logic updated and tested | PASS |  |  | FE/BE | Unit tests + manual spot check |
| F-004 | Username Validation | Create username invalid: uppercase/special chars/>30 chars | Rejected with correct validation message | Rejected as expected | PASS |  |  | FE/BE | Unit tests |
| F-005 | Display Name Validation | Set display name length 1 to 64 | Accepted | Accepted as expected | PASS |  |  | FE/BE | Unit tests |
| F-006 | Display Name Validation | Set display name >64 or empty | Rejected with correct validation message | Rejected as expected | PASS |  |  | FE/BE | Unit tests |
| F-007 | Feed/Post | Create post (image/video) | Publish succeeds and appears in feed/profile | Pass in e2e seeded flow; no regression found | PASS |  |  | FE/BE | Playwright phase4 |
| F-008 | Reels | Create reel and open in reels feed | Reel visible and playable | Reel flow stable in e2e scope | PASS |  |  | FE/BE | Playwright + unit coverage |
| F-009 | Reels Volume | Toggle mute/unmute across reel changes | Audio state updates correctly, no stuck mute | Feature patched; needs final production device sweep | PASS |  |  | FE | Manual sanity |
| F-010 | Stories | Create story and view from second account | Story visible in tray/viewer | Story APIs healthy in e2e; no visible regressions | PASS |  |  | FE/BE | Playwright logs |
| F-011 | Live | Start/end live and check replay availability | Live state transitions correctly; replay per configuration | Backend service tests passing; manual prod run pending | BLOCKED |  |  | BE | No dedicated e2e live scenario yet |
| F-012 | Notes | Create note and check in messages inbox | Note visible in inbox as expected | Logic patched and tested in service scope | PASS |  |  | FE/BE | Unit tests + regression run |
| F-013 | Comments | Add comment to post from second account | Comment is persisted and visible after refresh | Comment service and policy tests pass | PASS |  |  | FE/BE | Unit tests |
| F-014 | Nearby Messaging | Send nearby message A->B in same radius | Message appears on other account quickly | Socket/history patches applied; local/e2e stable | PASS |  |  | FE/BE | Unit + runtime logs |
| F-015 | Nearby Retention | Refresh/rejoin after 1-2 minutes and later checks | Nearby messages remain available up to 24h | TTL/max-history logic tested; 24h wall-clock manual pending | BLOCKED |  |  | FE/BE | Unit test covers retention logic |
| F-016 | SOS Alerts | Trigger SOS from account with emergency contacts | Contacts receive SOS notification immediately | Quiet-mode bypass patch and tests pass | PASS |  |  | BE | `safety.service` tests |
| F-017 | SOS without Geolocation | Deny geolocation and trigger SOS | SOS still sends without coordinates | Fallback path implemented and validated | PASS |  |  | FE/BE | FE logic + BE tests |
| F-018 | Upload Limits | Upload larger media files near expected limit | Upload succeeds; no 413 errors | Infra-dependent; requires Nginx limit confirmation on live EC2 | BLOCKED |  |  | DevOps | Needs manual infra validation |
| F-019 | Media Rendering | Open feed/reels/stories/messages thumbnails and media | No broken URLs/404; media loads correctly | URL normalization patches in place; no regression in test env | PASS |  |  | FE/BE | Service tests + e2e checks |
| F-020 | Geolocation HTTP | Access map/nearby on HTTP | Graceful fallback message; app stable | Browser blocks geolocation on HTTP by design; app now degrades gracefully | PASS |  |  | FE | Manual check |
| F-021 | Geolocation HTTPS | Access map/nearby on HTTPS | Geolocation works and map updates accurately | Pending TLS/domain rollout for production verification | BLOCKED |  |  | DevOps/FE | Requires HTTPS deployment |

## Defect Log

| Bug ID | Title | Severity | Feature Area | Repro Steps | Expected | Actual | Environment | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|
| BUG-EC2-001 | HTTPS not enabled for geolocation-required flows | S2 | Map / Nearby | Open map/nearby on public HTTP URL | Full geolocation support | Browser blocks geolocation on insecure origin | EC2 | DevOps | Open |
| BUG-EC2-002 | Large media upload infra check pending | S2 | Upload | Upload large media file near max limit | Upload accepted | Not fully validated on current EC2 config run | EC2 | DevOps | Open |

## Sign-off

- QA Sign-off: Pending
- Engineering Sign-off: Pending
- Product Sign-off: Pending
- Release Decision: Conditional Go

