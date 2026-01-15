---
description: Run the MoodApp application on Mobile (iOS/Android)
---

To run MoodApp on a mobile simulator or device:

1.  **Build the Web App**
    ```bash
    npm run build
    ```
    (This updates the `dist` folder which Capacitor syncs)

2.  **Sync with Native**
    ```bash
    npx cap sync
    ```

3.  **Run on Android**
    ```bash
    npx cap open android
    ```
    This opens Android Studio. Run the app from there.

4.  **Run on iOS (Mac Only)**
    ```bash
    npx cap open ios
    ```
    This opens Xcode. Run the app from there.

**Prerequisites:**
- For Android: Android Studio installed.
- For iOS: Xcode and CocoaPods installed (`sudo gem install cocoapods`).
