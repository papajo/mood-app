#!/bin/bash

# Get Mac's local IP address for device testing

echo "🔍 Finding your Mac's IP address..."
echo ""

# Try different methods
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    # Alternative method
    IP=$(ipconfig getifaddr en0)
fi

if [ -z "$IP" ]; then
    # Try en1 (WiFi alternative)
    IP=$(ipconfig getifaddr en1)
fi

if [ -n "$IP" ]; then
    echo "✅ Your Mac's IP address: $IP"
    echo ""
    echo "📝 Update your .env file:"
    echo "   VITE_API_URL=http://$IP:3002"
    echo ""
    echo "Or add to .env:"
    echo "   echo 'VITE_API_URL=http://$IP:3002' >> .env"
    echo ""
    echo "Then rebuild:"
    echo "   npm run build"
    echo "   npx cap sync ios"
else
    echo "❌ Could not determine IP address"
    echo "Please check your network connection"
    echo ""
    echo "Manual method:"
    echo "1. System Preferences → Network"
    echo "2. Select your connection (WiFi/Ethernet)"
    echo "3. Note the IP address"
fi
