# MOxE Mobile (Android & iOS)

Mobile UI rebuilt from scratch with **Instagram-style** and **Atlassian-style** design for all account types.

## Run

- **iOS:** `npm run ios`
- **Android:** `npm run android`
- **Dev server only:** `npm start`

## Backend / API

- **Env:** `EXPO_PUBLIC_API_URL=http://YOUR_IP:5007/api`
- **Default:** `http://localhost:5007/api`

## Account types & UI

- **Personal:** Instagram-style Home (feed + stories), Explore, Reels, Profile, Messages.
- **Business:** Atlassian-style Dashboard (Insights, Commerce, Team, Promotions).
- **Creator:** Instagram-style Creator hub (Subscribers, Earnings, Content, Tools).
- **Job:** Atlassian-style Job hub (Track, Know, Flow, Code, Build, Status, Alert) with list/detail screens.

Shared across accounts: **Messages**, **Profile** (with Settings, Switch account type, Log out).

## Auth

- **Login:** `POST /api/auth/login` with `{ loginId, password }`; token and optional user/accountType stored.
- **Register:** `POST /api/auth/register` with `{ email, username, password, accountType }` (accountType: PERSONAL | BUSINESS | CREATOR | JOB).
- Token sent as `Authorization: Bearer <token>` for protected endpoints.

## Navigation

- **Root:** Auth stack (Splash → Login | Register) or Main tabs.
- **Main tabs:** Home (account-aware), Explore, Job (stack), Messages, Profile (stack: Profile → Settings, Switch account).

## Node

Expo/React Native 0.83 expects **Node >= 20.19.4**. Use `nvm use 20` if needed.
