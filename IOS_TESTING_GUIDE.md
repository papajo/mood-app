# 📱 Testing MoodMingle on iPhone Device

## Prerequisites

### Required
- **Mac computer** (required for iOS development)
- **Xcode** (latest version from Mac App Store)
- **Apple Developer Account** (free for development, $99/year for App Store)
- **iPhone** (iOS 13+)
- **USB cable** to connect iPhone to Mac

### Optional but Recommended
- **TestFlight** account (for beta testing)
- **Apple Developer Program** membership ($99/year)

## Method 1: Direct Device Testing (Development)

### Step 1: Install Xcode
```bash
# Download from Mac App Store
# Or check if already installed:
xcode-select --version
```

### Step 2: Build the App
```bash
# From project root
npm run build
npx cap sync ios
```

### Step 3: Open in Xcode
```bash
npx cap open ios
```

This opens the project in Xcode.

### Step 4: Configure Signing

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple ID)
   - If you don't have a team, click "Add Account" and sign in with your Apple ID
6. Xcode will automatically create a provisioning profile

### Step 5: Connect Your iPhone

1. Connect iPhone to Mac via USB
2. Unlock your iPhone
3. Trust the computer if prompted
4. In Xcode, select your iPhone from the device dropdown (top toolbar)
   - It should show: "iPhone (Your Name's iPhone)"

### Step 6: Build and Run

1. Click the **Play** button (▶️) in Xcode, or press `Cmd + R`
2. First time: You may need to trust the developer on your iPhone
   - Go to: Settings → General → VPN & Device Management
   - Tap your developer account
   - Tap "Trust [Your Name]"
3. The app will build and install on your iPhone
4. The app should launch automatically

### Step 7: Enable Developer Mode (iOS 16+)

If you see "Developer Mode" prompt:
1. Go to: Settings → Privacy & Security → Developer Mode
2. Toggle **Developer Mode** ON
3. Restart your iPhone
4. Confirm when prompted

## Method 2: TestFlight (Beta Testing)

### Step 1: Prepare for TestFlight

```bash
# Build production version
npm run build
npx cap sync ios
npx cap open ios
```

### Step 2: Archive the App

1. In Xcode, select **Any iOS Device** from device dropdown
2. Go to **Product → Archive**
3. Wait for archive to complete
4. **Organizer** window will open

### Step 3: Upload to App Store Connect

1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Next**
5. Select **Upload**
6. Click **Next**
7. Select your distribution options
8. Click **Upload**
9. Wait for upload to complete (may take 10-20 minutes)

### Step 4: Configure TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app (or create new app)
3. Go to **TestFlight** tab
4. Wait for processing (can take 30-60 minutes)
5. Add **Internal Testers** (up to 100)
   - Add your Apple ID email
6. Or add **External Testers** (up to 10,000)
   - Requires App Review (24-48 hours)

### Step 5: Install TestFlight

1. On your iPhone, install **TestFlight** app from App Store
2. Open TestFlight
3. Accept invitation email (if external tester)
4. Tap **Install** next to MoodMingle
5. App installs and can be launched

## Method 3: Wireless Testing (iOS 9+)

### Enable Wireless Debugging

1. Connect iPhone via USB first
2. In Xcode, go to **Window → Devices and Simulators**
3. Select your iPhone
4. Check **"Connect via network"**
5. Disconnect USB cable
6. iPhone should still appear in device list
7. You can now build wirelessly!

## Troubleshooting

### Issue: "No devices found"
**Solution:**
- Ensure iPhone is unlocked
- Trust the computer on iPhone
- Check USB cable (try different cable)
- Restart Xcode
- Restart iPhone

### Issue: "Signing requires a development team"
**Solution:**
- Add your Apple ID in Xcode → Preferences → Accounts
- Select team in Signing & Capabilities
- If free account: Limited to 3 apps, 7-day certificates

### Issue: "Untrusted Developer"
**Solution:**
- Settings → General → VPN & Device Management
- Tap developer account
- Tap "Trust"

### Issue: "Developer Mode Required" (iOS 16+)
**Solution:**
- Settings → Privacy & Security → Developer Mode
- Toggle ON
- Restart iPhone

### Issue: Build fails with code signing error
**Solution:**
```bash
# Clean build folder
# In Xcode: Product → Clean Build Folder (Shift+Cmd+K)

# Or via command line:
cd ios/App
xcodebuild clean
```

### Issue: App crashes on launch
**Solution:**
1. Check Xcode console for errors
2. Verify API URL is correct
3. Check network permissions
4. Ensure server is running (for localhost testing, use your Mac's IP)

## Testing Checklist

### Basic Functionality
- [ ] App launches without crashing
- [ ] User creation works
- [ ] Mood selection works
- [ ] Navigation between tabs works
- [ ] Profile view works

### Network Features
- [ ] API calls work (may need to update API_URL for device)
- [ ] Socket.io connections work
- [ ] Real-time chat works
- [ ] Matching works

### UI/UX
- [ ] Layout looks correct on iPhone
- [ ] Touch interactions work
- [ ] Keyboard appears correctly
- [ ] Safe areas respected (notch, home indicator)
- [ ] Animations smooth

### Performance
- [ ] App loads quickly
- [ ] No lag when switching tabs
- [ ] Chat messages appear instantly
- [ ] No memory leaks

## Updating API URL for Device Testing

If testing against local server, update API URL:

### Option 1: Use Mac's IP Address
```bash
# Find your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example: 192.168.1.100
# Update in .env:
VITE_API_URL=http://192.168.1.100:3001
```

### Option 2: Use ngrok (for external testing)
```bash
# Install ngrok
brew install ngrok

# Expose local server
ngrok http 3001

# Use the ngrok URL in .env
VITE_API_URL=https://your-ngrok-url.ngrok.io
```

### Option 3: Deploy to Test Server
Deploy backend to a test server and use that URL.

## Quick Start Commands

```bash
# 1. Build and sync
npm run build
npx cap sync ios

# 2. Open in Xcode
npx cap open ios

# 3. In Xcode:
#    - Select your iPhone
#    - Click Play button (▶️)
#    - Trust developer on iPhone if needed
```

## Testing Different iPhone Models

### Test on Multiple Devices
1. Connect different iPhones
2. Select device from dropdown in Xcode
3. Build and run on each device
4. Test especially:
   - iPhone SE (small screen)
   - iPhone 14 Pro Max (large screen)
   - iPhone with notch
   - iPhone with home button

### Using Simulators
```bash
# List available simulators
xcrun simctl list devices

# Or in Xcode: Product → Destination → iOS Simulator
```

## Debugging on Device

### View Console Logs
1. In Xcode, open **Console** (View → Debug Area → Activate Console)
2. Select your device from device dropdown
3. Filter by your app name
4. See real-time logs

### Breakpoints
1. Set breakpoints in Xcode
2. Run in debug mode
3. Step through code
4. Inspect variables

### Network Debugging
```bash
# Use Charles Proxy or Proxyman
# Or check Xcode Network Inspector
# Window → Devices and Simulators → Your Device → Open Console
```

## Preparing for App Store

### Before Submission
1. Test on real device (not just simulator)
2. Test all features thoroughly
3. Test on different iOS versions if possible
4. Test with different network conditions
5. Test offline functionality
6. Check for crashes (use Xcode Organizer → Crashes)

### Required Testing
- [ ] App launches successfully
- [ ] All features work
- [ ] No crashes
- [ ] Performance is acceptable
- [ ] UI looks correct
- [ ] Network features work
- [ ] Privacy permissions work correctly

## Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [Xcode Help](https://help.apple.com/xcode/)

---

**Pro Tip**: Always test on a real device before submitting to App Store. Simulators don't catch all device-specific issues!
