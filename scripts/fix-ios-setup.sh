#!/bin/bash

# Fix iOS Development Setup Issues

echo "🔧 Fixing iOS Development Setup"
echo "================================"
echo ""

# Check if Xcode is installed
XCODE_PATH="/Applications/Xcode.app"
if [ ! -d "$XCODE_PATH" ]; then
    echo "❌ Xcode is not installed!"
    echo ""
    echo "Please install Xcode:"
    echo "1. Open Mac App Store"
    echo "2. Search for 'Xcode'"
    echo "3. Click 'Get' or 'Install'"
    echo "4. Wait for installation (this takes 30-60 minutes)"
    echo "5. Open Xcode once to accept license"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

echo "✅ Xcode found at: $XCODE_PATH"

# Fix xcode-select path
echo ""
echo "🔧 Setting Xcode as active developer directory..."
sudo xcode-select --switch "$XCODE_PATH/Contents/Developer"

if [ $? -eq 0 ]; then
    echo "✅ Xcode developer directory set"
else
    echo "❌ Failed to set developer directory"
    echo "You may need to run: sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    exit 1
fi

# Accept Xcode license
echo ""
echo "📝 Accepting Xcode license..."
sudo xcodebuild -license accept 2>/dev/null || echo "⚠️  License may need manual acceptance"

# Check for CocoaPods
echo ""
if command -v pod &> /dev/null; then
    echo "✅ CocoaPods installed: $(pod --version)"
else
    echo "📦 Installing CocoaPods..."
    echo "   This may take a few minutes..."
    
    # Check if gem is available
    if ! command -v gem &> /dev/null; then
        echo "❌ Ruby/gem not found. Installing via Homebrew..."
        if ! command -v brew &> /dev/null; then
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
        brew install ruby
    fi
    
    # Install CocoaPods
    sudo gem install cocoapods
    
    if [ $? -eq 0 ]; then
        echo "✅ CocoaPods installed successfully"
    else
        echo "❌ Failed to install CocoaPods"
        echo "Try manually: sudo gem install cocoapods"
        exit 1
    fi
fi

# Verify setup
echo ""
echo "🔍 Verifying setup..."
echo "Xcode path: $(xcode-select -p)"
echo "Xcode version: $(xcodebuild -version | head -1)"
echo "CocoaPods: $(pod --version)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run ios:open"
echo "2. Or manually:"
echo "   npm run build"
echo "   npx cap sync ios"
echo "   npx cap open ios"
