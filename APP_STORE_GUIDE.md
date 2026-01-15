# App Store & Play Store Submission Guide

## 📱 Pre-Submission Checklist

### iOS App Store (via Capacitor)

#### 1. App Icons
- [ ] Create 1024x1024px app icon
- [ ] Generate all required sizes (see `scripts/generate-icons.js`)
- [ ] Place icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- [ ] Test icon on device

#### 2. Splash Screens
- [ ] Create splash screen images for all device sizes
- [ ] Update `ios/App/App/Assets.xcassets/Splash.imageset/`
- [ ] Test splash screen appearance

#### 3. App Information
- [ ] App Name: "MoodApp"
- [ ] Bundle ID: `com.moodapp.app` (update in Xcode if needed)
- [ ] Version: Update in `package.json` and `ios/App/App/Info.plist`
- [ ] Build Number: Increment for each submission

#### 4. Required Files
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Description (up to 4000 characters)
- [ ] Keywords (up to 100 characters)
- [ ] Screenshots (various device sizes)
- [ ] App Preview Video (optional but recommended)

#### 5. Capabilities & Permissions
- [ ] Review Info.plist for required permissions
- [ ] Add usage descriptions for any permissions used
- [ ] Test permission requests

#### 6. Build & Test
```bash
# Build for iOS
npm run build
npx cap sync ios
npx cap open ios

# In Xcode:
# 1. Select your development team
# 2. Archive the app (Product > Archive)
# 3. Upload to App Store Connect
```

### Android Play Store (via Capacitor)

#### 1. App Icons
- [ ] Create 512x512px app icon
- [ ] Generate adaptive icon (foreground + background)
- [ ] Place in `android/app/src/main/res/mipmap-*/ic_launcher.png`
- [ ] Update `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

#### 2. Splash Screens
- [ ] Create splash screen for various densities
- [ ] Update splash screen resources

#### 3. App Information
- [ ] Package Name: `com.moodapp.app`
- [ ] Version Code: Increment in `android/app/build.gradle`
- [ ] Version Name: Update in `android/app/build.gradle`

#### 4. Required Files
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Description (up to 4000 characters)
- [ ] Short Description (up to 80 characters)
- [ ] Screenshots (phone, tablet, TV, Wear)
- [ ] Feature Graphic (1024x500px)
- [ ] App Icon (512x512px)

#### 5. Permissions
- [ ] Review `AndroidManifest.xml`
- [ ] Add permission justifications
- [ ] Test permission requests

#### 6. Build & Test
```bash
# Build for Android
npm run build
npx cap sync android
npx cap open android

# In Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Create release keystore (first time only)
# 3. Build release AAB
# 4. Upload to Play Console
```

## 📋 App Store Listing Content

### App Description Template

```
MoodApp - Connect Through Your Emotions

Find your tribe based on how you're feeling right now. MoodApp is a social app that connects people through shared emotional states.

✨ Features:
• Express your current mood with 5 beautiful options
• Find others who share your vibe in real-time
• Join mood-based chat rooms for instant connections
• Get personalized mood boosters (quotes & GIFs)
• Keep a private journal to reflect on your feelings
• Beautiful glassmorphism design

🎯 Perfect for:
• Meeting like-minded people
• Finding support when you need it
• Sharing positive energy
• Connecting authentically

Privacy-focused and ad-free. Your emotions, your connections, your way.
```

### Keywords (iOS)
```
mood, social, connect, emotions, chat, support, community, mental health, wellness, feelings
```

### Screenshots Needed
- iPhone 6.7" (iPhone 14 Pro Max)
- iPhone 6.5" (iPhone 11 Pro Max)
- iPhone 5.5" (iPhone 8 Plus)
- iPad Pro 12.9"
- Android Phone (various sizes)
- Android Tablet

## 🔒 Privacy & Legal

### Privacy Policy Requirements
Must include:
- What data is collected
- How data is used
- Data storage and security
- User rights
- Contact information

### Terms of Service
Must include:
- User responsibilities
- Content policies
- Service limitations
- Dispute resolution

## 📊 Analytics & Monitoring

Consider adding:
- Firebase Analytics (optional)
- Crash reporting (Sentry, Bugsnag)
- Performance monitoring

## 🚀 Submission Process

### iOS
1. Create App Store Connect account
2. Create new app listing
3. Upload build via Xcode or Transporter
4. Complete app information
5. Submit for review (typically 1-3 days)

### Android
1. Create Google Play Console account
2. Create new app
3. Upload AAB file
4. Complete store listing
5. Submit for review (typically 1-7 days)

## 📝 Version Management

Update version in:
- `package.json` (version field)
- `ios/App/App/Info.plist` (CFBundleShortVersionString)
- `android/app/build.gradle` (versionName, versionCode)

## ✅ Final Checklist

Before submission:
- [ ] All features tested on real devices
- [ ] No console errors in production build
- [ ] Privacy policy and terms published
- [ ] App icons and screenshots ready
- [ ] App description and metadata complete
- [ ] Build tested on multiple devices
- [ ] Performance optimized
- [ ] Security review completed
