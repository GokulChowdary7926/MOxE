# MOxE Manual QA Report Template

## Run Metadata

- Date:
- Environment: (Local / EC2 / Staging / Production)
- Build/Commit:
- Tester:
- Device/OS/Browser:
- API Base URL:
- Overall Status: (PASS / FAIL / BLOCKED)

## Severity Legend

- `S1` Critical: core flow broken, data loss, security issue
- `S2` High: major feature unusable, no workaround
- `S3` Medium: feature partially works, workaround exists
- `S4` Low: cosmetic/minor UX issue

## Feature Test Matrix

| ID | Feature Area | Test Case | Expected Result | Actual Result | Status (PASS/FAIL/BLOCKED) | Severity (if fail) | Bug ID | Owner | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F-001 | Auth | Login, reload, continue session | User remains authenticated; no repeated 401 calls |  |  |  |  |  |  |
| F-002 | Auth | Logout and login again | Clean logout and successful re-login |  |  |  |  |  |  |
| F-003 | Username Validation | Create username: `a`, `abc_123`, `name.test` | Accepted and saved |  |  |  |  |  |  |
| F-004 | Username Validation | Create username invalid: uppercase/special chars/>30 chars | Rejected with correct validation message |  |  |  |  |  |  |
| F-005 | Display Name Validation | Set display name length 1 to 64 | Accepted |  |  |  |  |  |  |
| F-006 | Display Name Validation | Set display name >64 or empty | Rejected with correct validation message |  |  |  |  |  |  |
| F-007 | Feed/Post | Create post (image/video) | Publish succeeds and appears in feed/profile |  |  |  |  |  |  |
| F-008 | Reels | Create reel and open in reels feed | Reel visible and playable |  |  |  |  |  |  |
| F-009 | Reels Volume | Toggle mute/unmute across reel changes | Audio state updates correctly, no stuck mute |  |  |  |  |  |  |
| F-010 | Stories | Create story and view from second account | Story visible in tray/viewer |  |  |  |  |  |  |
| F-011 | Live | Start/end live and check replay availability | Live state transitions correctly; replay per configuration |  |  |  |  |  |  |
| F-012 | Notes | Create note and check in messages inbox | Note visible in inbox as expected |  |  |  |  |  |  |
| F-013 | Comments | Add comment to post from second account | Comment is persisted and visible after refresh |  |  |  |  |  |  |
| F-014 | Nearby Messaging | Send nearby message A->B in same radius | Message appears on other account quickly |  |  |  |  |  |  |
| F-015 | Nearby Retention | Refresh/rejoin after 1-2 minutes and later checks | Nearby messages remain available up to 24h |  |  |  |  |  |  |
| F-016 | SOS Alerts | Trigger SOS from account with emergency contacts | Contacts receive SOS notification immediately |  |  |  |  |  |  |
| F-017 | SOS without Geolocation | Deny geolocation and trigger SOS | SOS still sends without coordinates |  |  |  |  |  |  |
| F-018 | Upload Limits | Upload larger media files near expected limit | Upload succeeds; no 413 errors |  |  |  |  |  |  |
| F-019 | Media Rendering | Open feed/reels/stories/messages thumbnails and media | No broken URLs/404; media loads correctly |  |  |  |  |  |  |
| F-020 | Geolocation HTTP | Access map/nearby on HTTP | Graceful fallback message; app stable |  |  |  |  |  |  |
| F-021 | Geolocation HTTPS | Access map/nearby on HTTPS | Geolocation works and map updates accurately |  |  |  |  |  |  |

## Defect Log

| Bug ID | Title | Severity | Feature Area | Repro Steps | Expected | Actual | Environment | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|
| BUG-001 |  |  |  |  |  |  |  |  | Open |
| BUG-002 |  |  |  |  |  |  |  |  | Open |
| BUG-003 |  |  |  |  |  |  |  |  | Open |

## Sign-off

- QA Sign-off:
- Engineering Sign-off:
- Product Sign-off:
- Release Decision: (Go / No-Go / Conditional Go)

