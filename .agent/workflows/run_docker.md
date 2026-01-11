---
description: Run the MoodMingle application with Docker (Production/Dev Hybrid)
---

To run MoodMingle with a Persistent PostgreSQL database, use Docker Compose.

1. **Stop any running servers**
   Ensure you don't have the local node servers running on ports 3001 or 5173.

2. **Start the Application**
   Run the following command in the project root:
   ```bash
   docker-compose up --build
   ```

3. **Access the App**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: Exposed on port 5432 (user: postgres, pass: password)

4. **Shutdown**
   To stop and preserve data:
   ```bash
   docker-compose down
   ```
   To stop and **delete data**:
   ```bash
   docker-compose down -v
   ```
