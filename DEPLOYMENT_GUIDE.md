# 🚀 Deployment Guide - Critical Environment Variables

## Required Environment Variables for Production

### Backend Environment Variables

The following environment variables **MUST** be set in your Render dashboard for the backend service:

#### 1. SECRET_KEY (CRITICAL)
```
SECRET_KEY=your_secure_secret_key_here_minimum_32_characters_long
```

**⚠️ IMPORTANT**: 
- This key is used to sign JWT authentication tokens
- Must be the same across all server restarts to maintain user sessions
- Should be a long, random string (minimum 32 characters)
- **Never change this in production** or all users will be logged out

**Example secure key generation:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2. CLAUDE_API_KEY (Already configured)
```
CLAUDE_API_KEY=your_claude_api_key_here
```

## Render Deployment Steps

### 1. Set Environment Variables in Render Dashboard
1. Go to your Render dashboard
2. Select your backend service
3. Navigate to "Environment" tab
4. Add the `SECRET_KEY` variable with a secure value
5. Save changes

### 2. Deploy the Latest Changes
The latest commit includes:
- ✅ Fixed SECRET_KEY to use environment variable
- ✅ Removed destructive table initialization
- ✅ Safe database table creation with `IF NOT EXISTS`

### 3. Verify Deployment
After deployment, test that:
- Users can register and login
- Sessions persist across server restarts
- No data loss occurs during server sleep/wake cycles

## Database Migration Notes

The current SQLite implementation will work for development and small-scale production. For larger scale, consider migrating to PostgreSQL:

1. **Current State**: SQLite with persistent file storage
2. **Future Enhancement**: PostgreSQL for better scalability and reliability
3. **Migration Path**: The table structures are compatible for easy migration

## Security Considerations

- ✅ SECRET_KEY now uses environment variable
- ✅ Database tables use safe initialization
- ✅ No more random key generation on restart
- ✅ User data persists across server restarts

## Testing the Fix

You can verify the fix works by:
1. Creating a user account
2. Creating a session
3. Waiting for server to restart (or manually restart)
4. Logging in with same credentials
5. Verifying session data is still available

The previous issue where users had to "recreate accounts with the same credentials" should now be completely resolved.