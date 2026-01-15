# Expo Setup (Mobile)

This repo is a Vite web app. To run it inside **Expo Go**, you need a separate Expo project. The recommended path is to create an Expo app inside this repo (e.g. `expo-app/`) and port screens/components over time.

## 1) Create the Expo app

Run locally (outside of Cursor tooling):

```bash
cd /Volumes/Projects/mood-app
npx create-expo-app expo-app
```

## 2) Start Expo

```bash
cd /Volumes/Projects/mood-app/expo-app
npx expo start
```

Scan the QR code with the **Expo Go** app on iOS/Android.

## 3) Connect to the existing backend

In the Expo app, set your API/Socket URLs to your LAN IP:

```
http://<your-ip>:3002
```

You can add a small config helper in the Expo project later, e.g. `expo-app/src/config/api.ts`.

## 4) Porting plan (high level)

- Start with auth screens (Login/Signup)
- Then MatchFeed + Notifications
- Then VibeRoom (private chat)
- Recreate styling with React Native components or a UI kit

## Notes

- This Expo project is separate from the current Vite app.
- Capacitor folders already exist in this repo; Expo uses a different stack.
- If you need App Store / Play Store builds, use EAS:
  - `npm install -g eas-cli`
  - `eas login`
  - `eas build:configure`
  - `eas build --platform ios` / `eas build --platform android`
