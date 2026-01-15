# Chat Request Notification Fix

## Issue
- Heart notifications work fine from either side ✓
- Chat request notifications don't work - no indication on bell icon
- Chat requested alert shows up on sender side only

## Root Cause
When a chat request notification arrives via socket:
1. `addNotification` adds the request to state and increments unread count
2. `fetchChatRequests` is called immediately after
3. `fetchChatRequests` **replaces** the entire `chatRequests` state with server data
4. This overwrites the socket notification that was just added
5. The unread count recalculation uses only the fetched requests, losing the socket notification

## Fixes Applied

### 1. **Delay fetchChatRequests call** (`NotificationButton.jsx`)
- Added 500ms delay before calling `fetchChatRequests` after socket notification
- Gives server time to process the request before fetching

### 2. **Merge instead of replace** (`NotificationContext.jsx`)
- Changed `fetchChatRequests` to merge fetched requests with existing state
- Preserves socket notifications that haven't been fetched yet
- Sorts merged requests by createdAt descending

### 3. **Proper unread count recalculation** (`NotificationContext.jsx`)
- Updated `addNotification` to recalculate unread count when adding chat request
- Uses merged requests for recalculation in `fetchChatRequests`
- Added logging to track unread count changes

### 4. **Better logging**
- Added console logs to track when chat requests are added
- Logs when duplicates are skipped
- Logs unread count recalculation

## Changes Made

### `src/components/NotificationButton.jsx`
```javascript
// Added delay before fetching
setTimeout(() => {
    fetchChatRequests(user.id);
}, 500);
```

### `src/contexts/NotificationContext.jsx`
```javascript
// Merge instead of replace
setChatRequests(prev => {
    const merged = [...recentRequests];
    prev.forEach(req => {
        if (!merged.some(r => r.id === req.id)) {
            merged.push(req);
        }
    });
    // Recalculate with merged requests
    setNotifications(currentHearts => {
        recalculateUnreadCount(currentHearts, merged);
        return currentHearts;
    });
    return merged;
});
```

## Testing

1. **Send chat request:**
   - User A sends chat request to User B
   - User B should see:
     - Bell icon shows unread count (red badge)
     - Chat request appears in notification panel
     - No page refresh needed

2. **Check console logs:**
   - `"Chat request received:"` - when socket notification arrives
   - `"Adding new chat request to state:"` - when adding to state
   - `"Recalculating unread count:"` - when updating count
   - `"Fetched chat requests:"` - when fetching from server

## Debugging

If notifications still don't appear:
1. Check browser console for socket connection: `window.socket.connected`
2. Verify socket event listener is set up: `"Listening for notifications for user X"`
3. Check server logs for: `"Emitting chat request notification to user X"`
4. Verify request exists in database: `SELECT * FROM private_chat_requests WHERE requested_id = X`
