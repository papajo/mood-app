# Test Account Information

## Existing Test Account

There is already a test account in the database:

- **Email**: `test@test.com`
- **Password**: `test123`
- **Username**: `testuser`

## Resetting Test Account Password

If you need to reset the password for a test account, use the reset script:

```bash
cd server
node reset_test_account.js <email> <new_password>
```

Example:
```bash
node reset_test_account.js test@test.com test123
```

## Common Issues

### "Email already registered" Error

If you see this error when trying to sign up:
- The email is already in use
- Try logging in instead with that email
- Or use a different email address

### "Invalid email or password" Error

If you see this error when trying to log in:
- Double-check the email and password
- Make sure you're using the correct credentials
- Use the reset script to set a new password if needed

## Demo Account

For quick testing, use the demo account:
- **Email**: `demo@moodapp.com`
- **Password**: `demo123`
- **Username**: `demo`
