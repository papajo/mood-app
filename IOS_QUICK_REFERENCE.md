# 📱 iPhone Testing - Quick Reference

## ⚡ Fastest Way (3 Commands)

```bash
# 1. Build and sync
npm run ios:open

# Or manually:
npm run build
npx cap sync ios
npx cap open ios
```

Then in Xcode:
1. Select your iPhone (device dropdown)
2. Click ▶️ Play button
3. Trust developer on iPhone if prompted

## 🔧 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| No devices found | Unlock iPhone, trust computer, try different USB cable |
| Signing error | Xcode → Preferences → Accounts → Add Apple ID |
| Untrusted developer | Settings → General → VPN & Device Management → Trust |
| Developer Mode (iOS 16+) | Settings → Privacy & Security → Developer Mode → ON |
| API not working | Update VITE_API_URL to Mac's IP address (not localhost) |

## 🌐 Network Setup for Device Testing

### Find Your Mac's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example output: inet 192.168.1.100
```

### Update API URL:
```bash
# Create .env file
echo "VITE_API_URL=http://192.168.1.100:3002" > .env

# Rebuild
npm run build
npx cap sync ios
```

### Or Use ngrok (External Access):
```bash
# Install ngrok
brew install ngrok

# Expose server
ngrok http 3002

# Use the https URL in .env
```

## 📋 Testing Checklist

- [ ] App launches
- [ ] User creation works
- [ ] Mood selection works
- [ ] Chat works
- [ ] Journal works
- [ ] Profile works
- [ ] UI looks correct
- [ ] No crashes

## 🎯 Step-by-Step (First Time)

1. **Connect iPhone** via USB
2. **Unlock iPhone**
3. **Trust computer** (if prompted)
4. **Run**: `npm run ios:open`
5. **In Xcode**: Select iPhone from dropdown
6. **Click Play** (▶️)
7. **On iPhone**: Trust developer
8. **App launches!** 🎉

## 📚 Full Guide

See **IOS_TESTING_GUIDE.md** for complete instructions.
