# Authentication System Guide

## Overview
MoodApp now supports user authentication with email/password signup and login. Users can create accounts, sign in, and access all features securely.

## Features

### Backend
- **Signup Endpoint**: `POST /api/auth/signup`
  - Requires: `username`, `email`, `password`
  - Returns: JWT token and user data
  - Validates: username (3-30 chars, alphanumeric + _ -), email format, password (min 6 chars)
  - Hashes passwords with bcrypt (10 salt rounds)

- **Login Endpoint**: `POST /api/auth/login`
  - Requires: `email`, `password`
  - Returns: JWT token and user data
  - Verifies password against stored hash

- **Verify Endpoint**: `GET /api/auth/verify`
  - Protected route (requires JWT token in Authorization header)
  - Returns: Current user data if token is valid

- **JWT Authentication**
  - Tokens expire in 7 days (configurable via `JWT_EXPIRES_IN` env var)
  - Secret key: `JWT_SECRET` env var (defaults to dev key)
  - Middleware: `authenticateToken` for protecting routes

### Frontend
- **Login Component** (`src/components/Login.jsx`)
  - Email and password input
  - Error handling
  - Link to signup

- **Signup Component** (`src/components/Signup.jsx`)
  - Username, email, password, and confirm password
  - Client-side validation
  - Link to login

- **UserContext Updates**
  - `isAuthenticated`: Boolean indicating auth status
  - `login(userData, token)`: Function to log in user
  - `logout()`: Function to log out user
  - `verifyAuth()`: Checks token validity on app load

- **App.jsx Updates**
  - Shows login/signup screen when user is not authenticated
  - Shows main app when authenticated
  - Supports switching between login and signup views

## Database Changes

The `users` table now includes:
- `email VARCHAR(255) UNIQUE` - User's email address
- `password_hash TEXT` - Bcrypt hashed password

Migration runs automatically on server start (adds columns if they don't exist).

## Environment Variables

### Server (`server/.env`)
```env
JWT_SECRET=your-secret-key-here  # Change in production!
JWT_EXPIRES_IN=7d                # Token expiration (default: 7 days)
```

## Usage

### For Users

1. **Sign Up**:
   - Click "Sign up" on the login screen
   - Enter username (3-30 chars, letters, numbers, _, -)
   - Enter email address
   - Enter password (min 6 characters)
   - Confirm password
   - Click "Create Account"

2. **Log In**:
   - Enter email address
   - Enter password
   - Click "Sign In"

3. **Log Out**:
   - Open Profile (click profile icon in header)
   - Click "Logout" button

### For Developers

#### Testing Authentication

```bash
# Signup
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Verify Token
curl -X GET http://localhost:3002/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Protecting Routes

```javascript
import { authenticateToken } from './server/index.js';

app.get('/api/protected-route', authenticateToken, async (req, res) => {
  // req.user contains decoded JWT payload
  const userId = req.user.userId;
  // ... your logic
});
```

#### Using Auth in Frontend

```javascript
import { useUser } from './contexts/UserContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useUser();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.username}!</div>;
}
```

## Security Notes

1. **Password Security**: Passwords are hashed with bcrypt (10 salt rounds)
2. **JWT Tokens**: Stored in localStorage (consider httpOnly cookies for production)
3. **Email Validation**: Server-side email format validation
4. **Username Validation**: Prevents SQL injection and XSS via strict character limits
5. **Token Expiration**: Tokens expire after 7 days (configurable)

## Backward Compatibility

- Guest users (created via old `/api/users` endpoint) can still exist
- Old localStorage data is preserved but won't auto-login
- Users must sign up/login to access the app

## Next Steps

1. Add password reset functionality
2. Add email verification
3. Add "Remember Me" option
4. Consider OAuth providers (Google, Facebook, etc.)
5. Add rate limiting for auth endpoints
6. Move JWT tokens to httpOnly cookies for better security
