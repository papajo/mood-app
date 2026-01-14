# MoodMingle 🌈

A social mood-matching application that connects people based on their current emotional state. Share your vibe, find your tribe, and connect with others who are feeling the same way.

![MoodMingle](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Node](https://img.shields.io/badge/Node-18+-339933)

## ✨ Features

- **Mood Tracking** - Express your current emotional state with 5 different moods (Vibing, Chill, Hyped, Low, Love)
- **Real-time Matching** - Find others who share your current mood
- **Vibe Rooms** - Join mood-based chat rooms for real-time conversations
- **Mood Boosters** - Get inspired with quotes and GIFs tailored to your mood
- **Personal Journal** - Keep a private journal to reflect on your feelings
- **Beautiful UI** - Modern glassmorphism design with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Socket.io Client** - Real-time communication
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite** - Database
- **Socket.io** - Real-time WebSocket communication
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Git** (for cloning)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd MoodMingle
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

## ⚙️ Configuration

### Environment Variables

See [ENV_SETUP.md](./ENV_SETUP.md) for detailed environment variable configuration.

**Quick Setup:**

1. **Frontend** (optional - defaults work for development):
   Create `.env` in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

2. **Backend** (optional - defaults work for development):
   Create `.env` in the `server/` directory:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   DB_PATH=./moodmingle.db
   ```

## 🏃 Running the Application

### Development Mode

You need to run both the frontend and backend servers.

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite default).

Open your browser and navigate to `http://localhost:5173`

### Production Build

**Build Frontend:**
```bash
npm run build
```

The built files will be in the `dist/` directory.

**Run Backend:**
```bash
cd server
npm start
```

## 📁 Project Structure

```
MoodMingle/
├── server/                 # Backend server
│   ├── index.js           # Express server & API routes
│   ├── package.json       # Server dependencies
│   └── moodmingle.db      # SQLite database (auto-created)
├── src/                    # Frontend source
│   ├── components/        # React components
│   │   ├── Journal.jsx
│   │   ├── Layout.jsx
│   │   ├── MatchFeed.jsx
│   │   ├── MoodBooster.jsx
│   │   ├── MoodTracker.jsx
│   │   └── VibeRoom.jsx
│   ├── config/            # Configuration files
│   │   └── api.js         # API URL configuration
│   ├── constants/         # Shared constants
│   │   └── moods.js       # Mood definitions
│   ├── contexts/          # React contexts
│   │   └── UserContext.jsx # User state management
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── package.json           # Frontend dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── README.md              # This file
```

## 🔌 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### User Management

**Create/Get User**
```http
POST /api/users
Content-Type: application/json

{
  "username": "string",
  "avatar": "string" (optional)
}
```

**Get User by ID**
```http
GET /api/users/:id
```

**Update User**
```http
PATCH /api/users/:id
Content-Type: application/json

{
  "status": "string" (optional),
  "avatar": "string" (optional)
}
```

#### Mood Management

**Get User's Latest Mood**
```http
GET /api/mood/:userId
```

**Set User's Mood**
```http
POST /api/mood
Content-Type: application/json

{
  "userId": number,
  "moodId": "string"
}
```

#### User Matching

**Get Users Matching Mood**
```http
GET /api/users/match/:moodId
```

Returns users with the specified mood who were active in the last hour.

#### Journal

**Get User's Journal Entries**
```http
GET /api/journal/:userId
```

**Save Journal Entry**
```http
POST /api/journal
Content-Type: application/json

{
  "userId": number,
  "text": "string",
  "date": "string",
  "time": "string"
}
```

#### Messages

**Get Room Messages**
```http
GET /api/messages/:roomId
```

### WebSocket Events

**Join Room**
```javascript
socket.emit('join_room', roomId)
```

**Send Message**
```javascript
socket.emit('send_message', {
  roomId: string,
  userId: number,
  user: string,
  text: string,
  time: string
})
```

**Receive Message**
```javascript
socket.on('receive_message', (data) => {
  // data: { id, roomId, userId, user, text, time }
})
```

## 🎨 Features in Detail

### Mood Tracking
- Select from 5 moods: 😊 Vibing, 😌 Chill, ⚡ Hyped, 😔 Low, 🥰 Love
- Mood is saved to your profile and used for matching
- Mood history is tracked in the database

### Match Feed
- See other users who share your current mood
- View user profiles with avatars and status
- Like users and start conversations
- Real-time updates as users change moods

### Vibe Rooms
- Join mood-based chat rooms
- Real-time messaging with Socket.io
- Message history persistence
- User identification in messages

### Mood Boosters
- Inspirational quotes tailored to your mood
- Animated GIFs to lift your spirits
- Content updates based on your current emotional state

### Journal
- Private journal entries
- Timestamp tracking
- Personal reflection space
- Entry history

## 📱 Testing on iPhone

**Quick Start:**
```bash
npm run ios:open
```

Then in Xcode:
1. Select your iPhone from device dropdown
2. Click Play button (▶️)
3. Trust developer on iPhone if prompted

**For detailed instructions:** See [IOS_TESTING_GUIDE.md](./IOS_TESTING_GUIDE.md)

**Quick Reference:** See [QUICK_IOS_TEST.md](./QUICK_IOS_TEST.md)

## 🧪 Development

### Code Quality

**Linting:**
```bash
npm run lint
```

### Testing

**Frontend Tests (Vitest):**
```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

**Backend Tests (Jest):**
```bash
cd server
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
```

Test files are located in:
- Frontend: `src/**/__tests__/`
- Backend: `server/__tests__/`

### Database

The SQLite database (`moodmingle.db`) is automatically created on first server start. Tables include:
- `users` - User accounts
- `mood_logs` - Mood history
- `journal_entries` - Journal entries
- `messages` - Chat messages

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New API Endpoint**: Add to `server/index.js`
3. **New Database Table**: Add to `initializeTables()` in `server/index.js`
4. **New Constant**: Add to `src/constants/`

## 🐛 Troubleshooting

### Server won't start
- Check if port 3001 is available
- Verify Node.js version (18+)
- Check server logs for errors
- Ensure database file permissions

### Frontend can't connect to API
- Verify backend server is running
- Check `VITE_API_URL` in `.env`
- Check CORS configuration in server
- Verify network/firewall settings

### Database errors
- Delete `moodmingle.db` to reset database
- Check file permissions
- Verify SQLite3 is installed

### Socket.io connection issues
- Verify `VITE_SOCKET_URL` matches backend URL
- Check CORS settings in server
- Ensure Socket.io version compatibility

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with React and Express
- Icons by Lucide
- Animations by Framer Motion
- Styling with Tailwind CSS

## 📧 Support

For issues and questions, please open an issue on the repository.

---

**Made with ❤️ for connecting people through shared emotions**

