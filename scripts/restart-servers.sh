#!/bin/bash

# Quick script to restart both servers

echo "🔄 Restarting MoodMingle Servers..."
echo ""

# Kill existing processes
echo "Stopping existing servers..."
pkill -f vite
pkill -f "node.*server/index.js"
sleep 2

# Start backend
echo "Starting backend server..."
cd server
npm start > /tmp/moodmingle-server.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# Start frontend
echo "Starting frontend server..."
npm run dev > /tmp/moodmingle-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# Check status
echo ""
echo "Checking server status..."

if lsof -i :3002 > /dev/null 2>&1; then
    echo "✅ Backend running on port 3002"
else
    echo "❌ Backend failed to start"
    echo "   Check: tail -f /tmp/moodmingle-server.log"
fi

if lsof -i :5174 > /dev/null 2>&1; then
    echo "✅ Frontend running on port 5174"
    echo ""
    echo "📱 Access from iPhone:"
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    if [ -n "$IP" ]; then
        echo "   http://$IP:5174"
    fi
else
    echo "❌ Frontend failed to start"
    echo "   Check: tail -f /tmp/moodmingle-frontend.log"
fi

echo ""
echo "📋 Server PIDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop: pkill -f vite && pkill -f 'node.*server/index.js'"
