# 🎯 Heart & Private Chat Testing Guide

## ⚡ Quick Start
1. **Open app**: `http://localhost:5173`
2. **Two tabs needed** for testing
3. **Use user switcher**: `switchUser(1)` and `switchUser(2)`

## ❤️ Testing Heart Notifications

### Step-by-Step:
1. **Both users** set mood to "Happy" 😊
2. **User 1** clicks heart ❤️ on User 2's profile
3. **User 2** should see:
   - 🔔 Bell icon shows "1" badge
   - Click bell → See heart notification
   - "Luna_Starlight sent you a heart! ❤️"

### Expected UI Elements:
- **Sender**: Heart button turns pink when clicked
- **Receiver**: Bell badge increases, notification appears
- **Notifications Tab**: Shows hearts with sender info

## 💬 Testing Private Chat Requests

### Step-by-Step:
1. **User 1** clicks chat bubble 💬 on User 2's profile
2. **User 2** gets notification instantly
3. **User 2** opens notifications → "Chat Requests" tab
4. **User 2** clicks ✅ (accept) or ❌ (reject)
5. **Both users** get confirmation

### Expected UI Elements:
- **Requester**: Chat button shows loading spinner ⏳
- **Receiver**: Gets "X wants to start private chat" notification
- **Response**: Accept/reject buttons in notification panel

## 🔍 Debugging Steps

### If notifications don't appear:

#### 1. Check Console Logs:
```javascript
// Open browser console (F12)
// Look for:
// ✓ "User connected: [socket-id]"
// ✓ "User [username] joined room: [mood]"
// ✗ Any red error messages
```

#### 2. Verify Socket Connection:
```javascript
// In browser console:
window.socket?.connected  // Should be true
window.socket?.id         // Should show socket ID
```

#### 3. Check Network Tab:
- Open DevTools → Network tab
- Look for failed requests to `/api/heart` or `/api/private-chat/*`
- Check WebSocket connection status

#### 4. Manual API Testing:
```bash
# Test heart notification directly:
curl -X POST http://localhost:3001/api/heart \
  -H "Content-Type: application/json" \
  -d '{"senderId": 1, "receiverId": 2}'

# Response should be:
{"success":true,"message":"Heart sent successfully"}

# Test chat request:
curl -X POST http://localhost:3001/api/private-chat/request \
  -H "Content-Type: application/json" \
  -d '{"requesterId": 1, "requestedId": 2}'
```

#### 5. Check Database:
```bash
cd server && sqlite3 moodmingle.db "SELECT * FROM heart_notifications;"
cd server && sqlite3 moodmingle.db "SELECT * FROM private_chat_requests;"
```

## 🐛 Common Issues & Fixes

### Issue: "See console logs but no UI"
**Cause**: Socket.io connected but React not updated
**Fix**: 
1. Check if NotificationProvider wraps components
2. Refresh page completely (Ctrl+F5)
3. Clear browser cache

### Issue: "Badge doesn't update"
**Cause**: State not updating
**Fix**:
1. Check `useNotifications()` hook usage
2. Verify `addNotification()` function calls
3. Look for React error boundaries

### Issue: "Requests stuck pending"
**Cause**: Missing response handler
**Fix**:
1. Check `/api/private-chat/respond` endpoint
2. Verify `requestId` matches database ID
3. Check user permissions (requested_id must match)

## ✅ Success Indicators

### Working Correctly When:
- ✅ Heart button changes color instantly
- ✅ Bell badge appears within 1 second
- ✅ Notification panel opens smoothly
- ✅ Chat request shows accept/reject buttons
- ✅ Both users get real-time updates
- ✅ Database entries created successfully
- ✅ No console errors
- ✅ UI remains responsive

## 📱 Testing Multiple Scenarios

### Scenario 1: Mutual Hearts
1. User 1 hearts User 2
2. User 2 hearts User 1  
3. Both should see notifications

### Scenario 2: Chat Room Creation
1. User 1 requests chat with User 2
2. User 2 accepts request
3. Both should get "Private chat started" notification
4. Private room should be accessible

### Scenario 3: Multiple Users
1. User 1 hearts User 2
2. User 1 hearts User 3
3. User 2 and User 3 should get separate notifications

## 🎪 Final Verification

Run this complete test sequence:
```javascript
// In browser console:
// 1. Test hearts
fetch('/api/heart', {
  method: 'POST', 
  body: JSON.stringify({senderId: 1, receiverId: 2})
});

// 2. Test chat requests  
fetch('/api/private-chat/request', {
  method: 'POST',
  body: JSON.stringify({requesterId: 1, requestedId: 2})
});

// 3. Check responses
fetch('/api/hearts/2').then(r => r.json());  // Should show heart
fetch('/api/private-chat/requests/2').then(r => r.json());  // Should show request
```

All features should work seamlessly! 🎉