#!/bin/bash

# Generate all app icons and splash screens
# Requires ImageMagick: brew install imagemagick (Mac) or apt-get install imagemagick (Linux)

echo "🎨 Generating MoodMingle App Assets"
echo "===================================="

ICONS_DIR="public/icons"
SPLASH_DIR="public/splash"

# Create directories
mkdir -p "$ICONS_DIR"
mkdir -p "$SPLASH_DIR"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Installing..."
    echo "   Mac: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    echo "   Or use online tool: https://realfavicongenerator.net/"
    exit 1
fi

# Check if source icon exists
SOURCE_ICON="$ICONS_DIR/icon-template.svg"
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Source icon not found: $SOURCE_ICON"
    echo "   Run: node scripts/create-icons.js first"
    exit 1
fi

echo "📱 Generating app icons..."

# Generate all icon sizes
for size in 72 96 128 144 152 192 384 512; do
    OUTPUT="$ICONS_DIR/icon-${size}x${size}.png"
    convert "$SOURCE_ICON" -resize "${size}x${size}" -background none "$OUTPUT"
    echo "  ✅ Generated: icon-${size}x${size}.png"
done

# Generate 1024x1024 for App Store
convert "$SOURCE_ICON" -resize "1024x1024" -background none "$ICONS_DIR/icon-1024x1024.png"
echo "  ✅ Generated: icon-1024x1024.png (App Store)"

echo ""
echo "🖼️  Generating splash screens..."

# Splash screen sizes (iOS)
IOS_SPLASH_SIZES=(
    "640x1136:iPhone SE"
    "750x1334:iPhone 8"
    "828x1792:iPhone XR"
    "1125x2436:iPhone X"
    "1242x2208:iPhone 8 Plus"
    "1242x2688:iPhone XS Max"
    "1536x2048:iPad"
    "2048x2732:iPad Pro"
)

# Splash screen sizes (Android)
ANDROID_SPLASH_SIZES=(
    "320x480:mdpi"
    "480x800:hdpi"
    "720x1280:xhdpi"
    "960x1600:xxhdpi"
    "1280x1920:xxxhdpi"
)

# Create splash screen template
SPLASH_SVG="$SPLASH_DIR/splash-template.svg"
cat > "$SPLASH_SVG" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="2048" height="2732" viewBox="0 0 2048 2732" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="2048" height="2732" fill="url(#splashGrad)"/>
  
  <!-- App Icon -->
  <circle cx="1024" cy="1000" r="200" fill="url(#grad1)">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
      </linearGradient>
    </defs>
  </circle>
  <text x="1024" y="1080" font-size="300" text-anchor="middle" fill="white">😊</text>
  
  <!-- App Name -->
  <text x="1024" y="1400" font-size="120" font-weight="bold" text-anchor="middle" fill="white" font-family="system-ui">MoodMingle</text>
  <text x="1024" y="1500" font-size="60" text-anchor="middle" fill="#94a3b8" font-family="system-ui">Connect Through Moods</text>
</svg>
EOF

# Generate iOS splash screens
for size_info in "${IOS_SPLASH_SIZES[@]}"; do
    IFS=':' read -r size name <<< "$size_info"
    IFS='x' read -r width height <<< "$size"
    OUTPUT="$SPLASH_DIR/ios-splash-${width}x${height}.png"
    convert "$SPLASH_SVG" -resize "${width}x${height}" "$OUTPUT"
    echo "  ✅ Generated iOS: $name (${width}x${height})"
done

# Generate Android splash screens
for size_info in "${ANDROID_SPLASH_SIZES[@]}"; do
    IFS=':' read -r size density <<< "$size_info"
    IFS='x' read -r width height <<< "$size"
    OUTPUT="$SPLASH_DIR/android-splash-${density}.png"
    convert "$SPLASH_SVG" -resize "${width}x${height}" "$OUTPUT"
    echo "  ✅ Generated Android: $density (${width}x${height})"
done

echo ""
echo "✨ All assets generated successfully!"
echo ""
echo "Next steps:"
echo "1. Review generated icons in: $ICONS_DIR"
echo "2. Review splash screens in: $SPLASH_DIR"
echo "3. Update Capacitor config if needed"
echo "4. Test on devices"
