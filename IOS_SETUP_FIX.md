# 🔧 Fixing iOS Development Setup

## Current Issue

You're seeing these errors:
- `xcode-select: error: tool 'xcodebuild' requires Xcode`
- `CocoaPods is not installed`

## Quick Fix

Run the automated fix script:
```bash
./scripts/fix-ios-setup.sh
```

## Manual Fix

### Step 1: Install Xcode (if not installed)

1. **Open Mac App Store**
2. **Search for "Xcode"**
3. **Click "Get" or "Install"**
4. **Wait for installation** (30-60 minutes, ~12GB download)
5. **Open Xcode once** to accept license agreement
6. **Install additional components** if prompted

### Step 2: Set Xcode as Active Developer Directory

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Step 3: Accept Xcode License

```bash
sudo xcodebuild -license accept
```

### Step 4: Install CocoaPods

```bash
sudo gem install cocoapods
```

If you get permission errors:
```bash
# Install via Homebrew instead
brew install cocoapods
```

### Step 5: Verify Setup

```bash
# Check Xcode
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer

xcodebuild -version
# Should show Xcode version

# Check CocoaPods
pod --version
# Should show version number
```

### Step 6: Retry iOS Setup

```bash
npm run ios:open
```

## Alternative: Use Command Line Tools Only (Limited)

If you can't install full Xcode, you can use Command Line Tools, but you'll be limited:

```bash
# Install command line tools
xcode-select --install

# But this won't work for full iOS app development
# You need full Xcode for device testing
```

## Troubleshooting

### "Xcode not found"
- Make sure Xcode is in `/Applications/Xcode.app`
- If installed elsewhere, use: `sudo xcode-select --switch /path/to/Xcode.app/Contents/Developer`

### "CocoaPods installation fails"
- Try: `sudo gem install cocoapods -n /usr/local/bin`
- Or: `brew install cocoapods` (if using Homebrew)

### "Permission denied"
- Use `sudo` for xcode-select and gem install
- Or install CocoaPods via Homebrew (no sudo needed)

### "License not accepted"
- Open Xcode manually
- Accept license when prompted
- Or run: `sudo xcodebuild -license accept`

## After Fixing

Once setup is complete:
```bash
# Build and sync
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Then in Xcode:
1. Select your iPhone
2. Click Play (▶️)
3. Trust developer on iPhone

## Need Help?

- Check `IOS_TESTING_GUIDE.md` for full instructions
- Check `QUICK_IOS_TEST.md` for quick reference
