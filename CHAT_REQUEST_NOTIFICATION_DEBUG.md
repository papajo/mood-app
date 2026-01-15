# Chat Request Notification Debugging

## Issue
Chat request notifications are not appearing on the bell icon, even though:
- Heart notifications work fine
- Alert shows on sender side
- Socket notification is being sent

## Fixes Applied

### 1. **Immediate Unread Count Update**
- Added immediate `setUnreadCount` increment when chat request is added via socket
- This ensures the bell icon updates immediately, even before API fetch

### 2. **Enhanced Logging**
- Added comprehensive logging throughout the notification flow:
  - When socket notification is received
  - When chat request is added to state
  - When unread count is incremented
  - When requests are merged
  - When unread count is recalculated

### 3. **Improved Merge Logic**
- Better tracking of how many requests are added from state vs API
- Logs the merge process for debugging

### 4. **Increased Fetch Delay**
- Increased delay before `fetchChatRequests` from 500ms to 1000ms
- Gives server more time to process the request

## Debugging Steps

1. **Check Browser Console:**
   - `"Chat request received via socket:"` - confirms socket notification arrived
   - `"Adding new chat request to state:"` - confirms state update
   - `"Incremented unread count: X"` - confirms count update
   - `"Merged chat requests: X total"` - shows merge result
   - `"Recalculating unread count:"` - shows recalculation

2. **Check Server Logs:**
   - `"Emitting chat request notification to user X"` - confirms emission
   - `"User X registered with socket Y"` - confirms user registration

3. **Verify Socket Connection:**
   - In browser console: `window.socket.connected` should be `true`
   - Check if user is registered: Look for registration logs

## Common Issues

1. **Socket not connected**: User needs to be logged in and socket initialized
2. **User not registered**: Socket needs to emit `register_user` event
3. **State overwritten**: `fetchChatRequests` might be overwriting state too quickly
4. **Date filtering**: Requests older than 24 hours are filtered out

## Next Steps if Still Not Working

1. Check if socket event listener is set up correctly
2. Verify the event name matches: `private_chat_request_${userId}`
3. Check if `addNotification` is being called
4. Verify `chatRequests` state is being updated
5. Check if `unreadCount` is being updated
