# How To Use Expo (iOS + Android)

This repo is a Vite web app. Expo requires a separate React Native project. Create it inside this repo (e.g. `expo-app/`) and run from there.

## 1) Create the Expo project

```bash
cd /Volumes/Projects/mood-app
npx create-expo-app expo-app
```

## 2) Install deps

```bash
cd /Volumes/Projects/mood-app/expo-app
npm install
```

## 3) Start Expo

```bash
npx expo start -c
```

`-c` clears Metro cache and fixes stale-module errors.

## 4) iOS (Expo Go)

1. Install **Expo Go** from the App Store.
2. Ensure your phone and dev machine are on the same Wi‑Fi.
3. Open Expo Go and scan the QR code from the terminal.

If QR scan fails:
- Press `w` in the Expo terminal to switch to LAN mode.
- Try `npx expo start --tunnel`.

## 5) Android (Expo Go)

1. Install **Expo Go** from Google Play.
2. Same Wi‑Fi as dev machine.
3. Scan QR code from the terminal (Camera app or Expo Go scanner).

If QR scan fails:
- Use `npx expo start --tunnel`.

## 6) Common Errors

### “Unable to resolve module ./node_modules/expo/AppEntry”
You are running Expo from the repo root (no Expo deps).
Fix:
```bash
cd /Volumes/Projects/mood-app/expo-app
npm install
npx expo start -c
```

### “Metro bundler stuck / old JS”
```bash
npx expo start -c
```

### “Cannot connect to Metro”
- Same Wi‑Fi
- Try tunnel mode: `npx expo start --tunnel`

## 7) What the Expo Welcome Screen Steps Mean

When you first open a new Expo project, you’ll see the starter screen with 3 steps.

### Step 1: “Try it”
**Meaning:** It’s telling you which file to edit to see changes live.  
**What to do:** Open `expo-app/app/(tabs)/index.tsx` and change some text. Save → your app refreshes.

### Step 2: “Explore”
**Meaning:** The template includes a second tab with example content.  
**What to do:** Tap the “Explore” tab on the device to see the sample screen.

### Step 3: “Get a fresh start”
**Meaning:** This is **optional**. It removes the template/demo code and gives you a clean app structure.  
**What to do if you want a clean slate:**
```bash
cd /Volumes/Projects/mood-app/expo-app
npm run reset-project
```
This moves the example app into `app-example/` and creates a fresh `app/` folder you can build on.  
If you **don’t** want to reset, just ignore Step 3.

## 7) API URL

For real devices, use your LAN IP:

```
http://<your-ip>:3002
```

You can hardcode this in the Expo app (for now) or load from `.env`.
