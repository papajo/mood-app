#!/bin/bash

# Quick script to test MoodApp as PWA on iPhone
# No Xcode needed!

echo "📱 Testing MoodApp as PWA on iPhone"
echo "======================================"
echo ""

# Check if servers are running
echo "Checking if servers are running..."

# Check backend
if ! curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "⚠️  Backend server not running"
    echo "   Starting backend server..."
    cd server
    npm start > /tmp/moodapp-server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    sleep 3
    echo "✅ Backend server started (PID: $SERVER_PID)"
else
    echo "✅ Backend server is running"
fi

# Check frontend
if ! curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "⚠️  Frontend server not running"
    echo "   Starting frontend server..."
    npm run dev > /tmp/moodapp-frontend.log 2>&1 &
    FRONTEND_PID=$!
    sleep 3
    echo "✅ Frontend server started (PID: $FRONTEND_PID)"
else
    echo "✅ Frontend server is running"
fi

# Get Mac IP
echo ""
echo "🔍 Finding your Mac's IP address..."
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    IP=$(ipconfig getifaddr en0)
fi

if [ -z "$IP" ]; then
    IP=$(ipconfig getifaddr en1)
fi

if [ -n "$IP" ]; then
    echo "✅ Your Mac's IP: $IP"
    echo ""
    echo "📱 On your iPhone:"
    echo "   1. Make sure iPhone and Mac are on same WiFi network"
    echo "   2. Open Safari on iPhone"
    echo "   3. Go to: http://$IP:5174"
    echo "   4. Tap Share button (square with arrow)"
    echo "   5. Tap 'Add to Home Screen'"
    echo "   6. App will install as PWA!"
    echo ""
    echo "🌐 Or scan this QR code (if you have qrencode):"
    if command -v qrencode &> /dev/null; then
        qrencode -t ANSI "http://$IP:5174"
    else
        echo "   Install qrencode for QR code: brew install qrencode"
    fi
    echo ""
    echo "💡 Tips:"
    echo "   - App works offline after first load"
    echo "   - Looks and feels like native app"
    echo "   - No App Store needed for testing!"
    echo ""
    echo "🛑 To stop servers:"
    echo "   pkill -f 'node.*server/index.js'"
    echo "   pkill -f 'vite'"
else
    echo "❌ Could not determine IP address"
    echo "   Please check your network connection"
fi
