# Demo User Account

A demo user has been created for easy testing of the authentication system.

## Login Credentials

- **Email**: `demo@moodmingle.com`
- **Password**: `demo123`
- **Username**: `demo`

## How to Use

1. Open the MoodMingle app
2. You'll see the login screen
3. Enter the demo credentials above
4. Click "Sign In"
5. You'll be logged in and can test all features

## Creating Additional Demo Users

To create more demo users or recreate the demo user, run:

```bash
cd server
node create_demo_user.js
```

The script will:
- Check if a demo user already exists
- Create a new demo user if one doesn't exist
- Display the credentials

## Notes

- The demo user is a regular user account (not an admin)
- You can create additional accounts using the signup form
- The demo password is intentionally simple for testing purposes
- In production, you should use stronger passwords
