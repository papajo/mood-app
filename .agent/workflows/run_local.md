---
description: Run the MoodApp application locally
---

To run MoodApp locally, you need to start both the frontend and backend servers.

1. **Start the Backend Server**
   Open a terminal and run:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   The server will start on http://localhost:3002.

2. **Start the Frontend Application**
   Open a second terminal window anywhere in the project and run:
   ```bash
   npm install
   npm run dev
   ```
   The frontend will start on http://localhost:5174.

3. **Access the App**
   Open your browser and navigate to http://localhost:5174.

**Note:** The backend uses a local SQLite database file `moodapp.db` in the `server` directory, which is created automatically if it doesn't exist.
