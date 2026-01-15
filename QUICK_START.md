# Quick Start Guide 🚀

## Testing the App in Cursor

The servers should now be running! Here's how to access and test the app:

### Access the Application

1. **Frontend (React App)**
   - Open your browser and navigate to: **http://localhost:5174**
   - This is the main MoodMingle application

2. **Backend API**
   - API server is running on: **http://localhost:3002**
   - You can test API endpoints directly

### What to Test

#### 1. **Initial Load**
   - The app should load and automatically create a user
   - You'll see the mood tracker at the top

#### 2. **Mood Selection**
   - Click on any of the 5 moods (😊 Vibing, 😌 Chill, ⚡ Hyped, 😔 Low, 🥰 Love)
   - Your mood will be saved to the database

#### 3. **Match Feed**
   - After selecting a mood, go to the "Feed" tab
   - You'll see other users (if any) with the same mood
   - Try opening multiple browser tabs to see multiple users!

#### 4. **Vibe Rooms (Chat)**
   - Select a mood, then go to the "Rooms" tab
   - Type a message and send it
   - Open another browser tab/window to see real-time chat
   - Try typing - you'll see "is typing..." indicators!

#### 5. **Mood Boosters**
   - Go to the "Boost" tab
   - See quotes and GIFs tailored to your current mood

#### 6. **Journal**
   - Go to the "Journal" tab
   - Write a journal entry and save it
   - View your past entries

#### 7. **User Profile**
   - Click the profile button (👤) in the top right
   - Edit your status and avatar URL
   - Save your changes

### Testing Multi-User Experience

To test the full experience:

1. **Open Multiple Browser Windows/Tabs**
   - Window 1: http://localhost:5174
   - Window 2: http://localhost:5174 (incognito or different browser)
   - Each will create a different user

2. **Test Real-time Features**
   - Select the same mood in both windows
   - Go to "Rooms" tab in both
   - Send messages and see them appear in real-time
   - Type in one window - see typing indicator in the other!

3. **Test Matching**
   - Set the same mood in both windows
   - Go to "Feed" tab - you should see each other!

### API Testing

You can also test the API directly:

```bash
# Get all users matching a mood
curl http://localhost:3002/api/users/match/happy

# Create a user
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "TestUser"}'
```

### Troubleshooting

**If servers aren't running:**
```bash
# Start backend (in server directory)
cd server
npm start

# Start frontend (in root directory)
npm run dev
```

**If you see CORS errors:**
- Make sure backend is running on port 3002
- Check that FRONTEND_URL in server/.env matches your frontend URL

**If database errors:**
- The database is created automatically on first run
- If issues persist, delete `server/moodmingle.db` to reset

### Stopping the Servers

Press `Ctrl+C` in the terminal where the servers are running, or:
```bash
# Kill processes on ports
lsof -ti:3002 | xargs kill -9
lsof -ti:5174 | xargs kill -9
```

---

**Enjoy testing MoodMingle!** 🎉

