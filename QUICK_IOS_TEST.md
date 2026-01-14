# 🚀 Quick Start: Test on iPhone

## Fastest Method (5 minutes)

### 1. Prerequisites Check
```bash
# Are you on a Mac?
# Do you have Xcode installed?
xcode-select --version

# Is your iPhone connected via USB?
# Is your iPhone unlocked?
```

### 2. Build and Open
```bash
# From project root
npm run build
npx cap sync ios
npx cap open ios
```

### 3. In Xcode (2 minutes)
1. **Select your iPhone** from device dropdown (top toolbar)
2. **Click Play button** (▶️) or press `Cmd + R`
3. **Wait for build** (first time takes 2-3 minutes)

### 4. On iPhone (1 minute)
1. If prompted: **Settings → General → VPN & Device Management**
2. Tap your developer account
3. Tap **"Trust [Your Name]"**
4. If iOS 16+: Enable **Developer Mode**
   - Settings → Privacy & Security → Developer Mode → ON
   - Restart iPhone
5. App should launch automatically!

## Troubleshooting

**"No devices found"**
- Unlock iPhone
- Trust computer on iPhone
- Try different USB cable

**"Signing requires development team"**
- Xcode → Preferences → Accounts
- Add your Apple ID
- Select team in Signing & Capabilities

**"Untrusted Developer"**
- Settings → General → VPN & Device Management
- Trust your developer account

## Network Testing

If API calls fail, update API URL to your Mac's IP:

```bash
# Find Mac IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env
VITE_API_URL=http://YOUR_MAC_IP:3001

# Rebuild
npm run build
npx cap sync ios
```

## That's It! 🎉

Your app should now be running on your iPhone.

For detailed instructions, see: **IOS_TESTING_GUIDE.md**
