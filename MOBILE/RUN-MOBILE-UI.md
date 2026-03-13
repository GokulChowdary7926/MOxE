# See the new MOxE mobile UI (Instagram + Atlassian)

The **new mobile UI** lives in this folder (`MOBILE/`). It is **not** the web app in `FRONTEND/`.

## 1. Open the MOBILE project

In your editor/terminal, go to the **MOBILE** folder:

```bash
cd MOBILE
```

(or `cd "MOxE Application/MOxE/MOBILE"` from your workspace root)

## 2. Install (if needed)

```bash
npm install
```

## 3. Run with cache cleared (so you see latest UI)

If the UI looks unchanged, clear the Metro/Expo cache and start:

```bash
npm run start:clear
```

Then:

- **iOS simulator:** press `i` in the terminal, or run `npm run ios:clear`
- **Android emulator:** press `a` in the terminal, or run `npm run android:clear`
- **Expo Go on device:** scan the QR code

## 4. What you should see

- **Splash:** Black background, violet “m” logo, “One platform. One you.”
- **Login:** Black background, violet logo, title “MOxE”, subtitle “Mobile — Instagram & Atlassian UI”, dark inputs, blue Log In.
- **After login (Feed tab):** Top bar with **MOxE** logo + icons (+, shop, bell, grid, gear), **story strip** (“Your story” + circles), then **“No posts yet”** / “Start following people to see their posts!”
- **Bottom tabs:** Feed | Explore | Map | Messages | Profile | Job (active tab in **violet**).

If you see a **white or light theme**, or a **browser** layout, you are in the **web app** (`FRONTEND/`). Run the app from **MOBILE** as above.

## 5. Quick commands (from MOBILE folder)

| Command              | What it does                    |
|----------------------|----------------------------------|
| `npm run start:clear`| Start dev server, clear cache   |
| `npm run ios:clear`  | iOS simulator, clear cache      |
| `npm run android:clear` | Android emulator, clear cache |
