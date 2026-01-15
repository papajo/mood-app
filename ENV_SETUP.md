# Environment Configuration

This document describes how to configure environment variables for MoodMingle.

## Frontend Configuration

The frontend uses Vite's environment variable system. Variables must be prefixed with `VITE_` to be accessible in the browser.

### Setup

1. Create a `.env` file in the root directory (same level as `package.json`)
2. Add your configuration variables:

```env
# API Server URL
VITE_API_URL=http://localhost:3002

# Socket.io Server URL (optional, defaults to VITE_API_URL)
VITE_SOCKET_URL=http://localhost:3002
```

### Available Variables

- `VITE_API_URL` - The base URL for the API server (default: `http://localhost:3002`)
- `VITE_SOCKET_URL` - The URL for Socket.io connections (defaults to `VITE_API_URL` if not set)

### Usage in Code

The frontend uses a centralized config file at `src/config/api.js`:

```javascript
import { API_URL, SOCKET_URL } from './config/api';
```

## Backend Configuration

The backend uses `dotenv` to load environment variables from a `.env` file.

### Setup

1. Create a `.env` file in the `server/` directory
2. Add your configuration variables:

```env
# Server Port
PORT=3002

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5174

# Database Path
DB_PATH=./moodmingle.db
```

### Available Variables

- `PORT` - The port the server will listen on (default: `3002`)
- `FRONTEND_URL` - The frontend URL for CORS configuration (default: `http://localhost:5174`)
- `DB_PATH` - Path to the SQLite database file (default: `./moodmingle.db`)

## Development vs Production

### Development
- Use default values or local `.env` files
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3002`

### Production
- Set environment variables in your hosting platform
- Update `VITE_API_URL` to your production API URL
- Update `FRONTEND_URL` in backend to your production frontend URL
- Ensure CORS is properly configured

## Security Notes

- Never commit `.env` files to version control
- `.env.example` files are provided as templates
- Use different values for development and production
- Keep sensitive data out of environment variables (use proper secrets management in production)

