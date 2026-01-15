# Socket User Mapping Fix

## Issue
- Chat request notifications don't work - no indication on bell icon even after refresh
- Heart notifications work but require refresh
- Alert shows on sender side only

## Root Cause
The socket server was using `io.emit()` which broadcasts to ALL connected clients. While the event name was user-specific (`private_chat_request_${userId}`), there was no guarantee the recipient's socket was listening for that event, or that the user ID matched correctly.

The main issues were:
1. **No user-to-socket mapping**: Server didn't know which socket belonged to which user
2. **No user registration**: Clients never told the server their user ID
3. **Broadcast instead of targeted**: Using `io.emit()` sends to everyone, not specific users

## Solution
Implemented a proper user-to-socket mapping system:

### 1. **User Socket Map** (server/index.js)
- Created `userSocketMap` to track which sockets belong to which users
- Users can have multiple sockets (multiple tabs/devices)

### 2. **User Registration** (server/index.js)
- Added `register_user` socket event handler
- When user connects, they register their user ID
- Socket joins a user-specific room: `user_${userId}`
- Also registers when joining a mood room

### 3. **Targeted Notifications** (server/index.js)
- Changed from `io.emit()` to `io.to('user_${userId}').emit()`
- Sends to user-specific room (more reliable)
- Keeps `io.emit()` as fallback for compatibility

### 4. **Client Registration** (src/App.jsx)
- When socket connects, automatically registers user ID
- Also registers if socket already exists when user logs in
- Ensures server knows which socket belongs to which user

## Changes Made

### `server/index.js`
```javascript
// Map user IDs to socket IDs
const userSocketMap = new Map();

// Register user when they identify themselves
socket.on('register_user', (data) => {
    const userId = data.userId;
    socket.join(`user_${userId}`);
    // Track in map
});

// Send to user-specific room
io.to(`user_${userId}`).emit(`private_chat_request_${userId}`, notification);
```

### `src/App.jsx`
```javascript
window.socket.on('connect', () => {
    // Register user ID with socket server
    if (user && user.id) {
        window.socket.emit('register_user', { userId: user.id });
    }
});
```

## Testing

1. **Send chat request:**
   - User A sends request to User B
   - User B should see notification immediately (no refresh needed)
   - Bell icon should show unread count

2. **Check server logs:**
   - `"User X registered with socket Y"` - when user connects
   - `"Emitting chat request notification to user X"` - when sending

3. **Check browser console:**
   - `"Registered user ID with socket: X"` - when registering
   - `"Chat request received:"` - when notification arrives

## Benefits
- **Targeted delivery**: Notifications go directly to the right user
- **Multiple devices**: User can be connected from multiple tabs/devices
- **Reliable**: Uses Socket.io rooms which are more reliable than event name matching
- **Fallback**: Still emits globally as backup
