# Chat Request Notification Debugging

## Issues Found and Fixed

### 1. **Date Format Mismatch**
**Problem**: API returns SQLite timestamp format (`"2026-01-15 01:48:15"`) but frontend expects ISO format.

**Fix**: Convert SQLite timestamps to ISO format in API response.

### 2. **Enhanced Logging**
Added comprehensive logging to track:
- When chat requests are fetched from API
- When socket notifications are received
- Date parsing issues
- User registration with socket

## Testing Steps

1. **Open browser console** on recipient's side
2. **Send chat request** from sender
3. **Check console for**:
   - `"Registered user ID with socket: X"` - confirms user is registered
   - `"Chat request received via socket:"` - confirms socket notification arrived
   - `"Fetched chat requests:"` - confirms API fetch happened
   - `"Filtered recent chat requests: X out of Y"` - shows filtering results
   - `"Adding new chat request to state:"` - confirms state update

4. **Check server logs for**:
   - `"User X registered with socket Y"` - confirms registration
   - `"Emitting chat request notification to user X"` - confirms emission
   - `"Fetched X pending chat requests for user Y"` - confirms API call

## System Message TTL / Mobile Notes

### Symptoms
- System message ("sent you a chat request" / "accepted your chat request") reappears after it should expire.
- Mobile shows a stale timestamp (ex: `2:41 PM`) for system messages.

### Root Cause
- Some mobile browsers fail to parse SQLite timestamps (`YYYY-MM-DD HH:MM:SS`).
- Expired system messages can linger in client state or be re-fetched from the server.

### Fix Summary
- Server filters expired system messages before returning `/api/messages/:roomId` and `/api/messages/undelivered/:userId`.
- Client filters and removes expired system messages on every merge and before caching.
- Timestamp parsing now normalizes SQLite format to ISO.

### Debug Flags
- Enable overlay: `localStorage.setItem('MM_DEBUG', '1')` then refresh.
- Disable overlay: `localStorage.removeItem('MM_DEBUG')` then refresh.

### Verification Checklist
1. System messages auto-expire after ~2 minutes.
2. Refreshing does not bring expired system messages back.
3. Mobile and desktop both show consistent behavior.

## Common Issues

1. **Socket not registered**: Check if `register_user` event is being sent
2. **Date parsing fails**: Check if `createdAt` is in correct format
3. **Request filtered out**: Check if request is within 24 hours
4. **State not updating**: Check if `addNotification` is being called

## Next Steps if Still Not Working

1. Verify socket connection: `window.socket.connected` should be `true`
2. Verify user registration: Check server logs for registration
3. Verify event listener: Check if `private_chat_request_${userId}` listener is set up
4. Test API directly: `curl http://localhost:3002/api/private-chat/requests/101`
5. Check network tab: Verify socket events are being received
