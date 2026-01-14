#!/bin/bash

# Quick setup script for iOS device testing

echo "📱 Setting up iOS Device Testing"
echo "================================"
echo ""

# Check if on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: iOS development requires macOS"
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode not found. Please install Xcode from Mac App Store"
    exit 1
fi

echo "✅ Xcode found: $(xcodebuild -version | head -1)"
echo ""

# Check for CocoaPods (required for Capacitor iOS)
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    sudo gem install cocoapods
else
    echo "✅ CocoaPods found: $(pod --version)"
fi

echo ""
echo "🔨 Building app..."
npm run build

echo ""
echo "🔄 Syncing with Capacitor..."
npx cap sync ios

echo ""
echo "📦 Installing iOS dependencies..."
cd ios/App
pod install
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx cap open ios"
echo "2. In Xcode:"
echo "   - Select your iPhone from device dropdown"
echo "   - Click Play button (▶️) to build and run"
echo "3. On iPhone:"
echo "   - Trust the developer (Settings → General → VPN & Device Management)"
echo "   - Enable Developer Mode if iOS 16+ (Settings → Privacy & Security)"
echo ""
echo "📖 For detailed instructions, see: IOS_TESTING_GUIDE.md"
