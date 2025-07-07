# 🚀 Deployment Guide - Critical Setup for Data Persistence

## ⚠️ CRITICAL: Persistent Disk Setup (REQUIRED)

**The most important step to prevent data loss is setting up a persistent disk.**

### 1. Create Persistent Disk in Render Dashboard

1. **Go to your Render dashboard**
2. **Select your backend service**
3. **Navigate to "Disks" tab**
4. **Click "Add Disk"**
5. **Configure the disk:**
   - **Name**: `nuudle-data`
   - **Mount Path**: `/var/data`
   - **Size**: `1 GB` (minimum, can be increased later)
6. **Save the disk configuration**

**⚠️ WITHOUT THIS STEP, ALL USER DATA WILL BE LOST WHEN THE SERVER RESTARTS!**

### 2. Required Environment Variables for Production

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

### 1. Set Up Persistent Disk (CRITICAL - Do this first!)
Follow the "Persistent Disk Setup" instructions above.

### 2. Configure Root Directory and Start Command (CRITICAL)
**You must configure both the Root Directory and Start Command in your Render dashboard:**

#### Step A: Set Root Directory
1. Go to your Render dashboard
2. Select your backend service
3. Navigate to "Settings" tab
4. Find the "Root Directory" field
5. **Set it to:** `backend`
6. **Save changes**

#### Step B: Set Start Command
1. In the same Settings tab
2. Find the "Start Command" field
3. **Replace the current command with:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. **Save changes**

**⚠️ IMPORTANT**:
- The **Root Directory** setting tells Render to run everything from the `backend` folder
- The **Start Command** should NOT include `cd backend &&` because we're already in that directory
- This ensures the application can find the database file and all dependencies

### 3. Set Environment Variables in Render Dashboard
1. Go to your Render dashboard
2. Select your backend service
3. Navigate to "Environment" tab
4. Add the `SECRET_KEY` variable with a secure value
5. Save changes

### 4. Deploy the Latest Changes
The latest commit includes:
- ✅ **Persistent database storage** - Database now stored in `/var/data/nuudle.db`
- ✅ Fixed SECRET_KEY to use environment variable
- ✅ Removed destructive table initialization
- ✅ Safe database table creation with `IF NOT EXISTS`
- ✅ Automatic fallback for local development

### 5. Verify Deployment
After deployment, test that:
- Users can register and login
- Sessions persist across server restarts
- No data loss occurs during server sleep/wake cycles
- Database file is created in `/var/data/nuudle.db`
- No "unable to open database file" errors in logs

## How the Persistent Storage Fix Works

### Problem Before:
- Database stored in ephemeral filesystem (`nuudle.db` in working directory)
- When server goes to sleep, filesystem is wiped clean
- All user accounts and sessions lost permanently
- Users had to recreate accounts with same credentials

### Solution Now:
- Database stored in persistent disk (`/var/data/nuudle.db`)
- Persistent disk survives server restarts and sleep cycles
- All user data and sessions preserved permanently
- Smart fallback to local storage for development

### Code Logic:
```python
# Production: Use persistent disk if available
DATABASE_PATH = "/var/data/nuudle.db" if os.path.exists("/var/data") or os.getenv("RENDER") else "nuudle.db"
```

## Database Migration Notes

The current SQLite implementation will work for development and small-scale production. For larger scale, consider migrating to PostgreSQL:

1. **Current State**: SQLite with persistent file storage
2. **Future Enhancement**: PostgreSQL for better scalability and reliability
3. **Migration Path**: The table structures are compatible for easy migration

## Security Considerations

- ✅ **Persistent data storage** - Database survives server restarts
- ✅ SECRET_KEY now uses environment variable
- ✅ Database tables use safe initialization
- ✅ No more random key generation on restart
- ✅ User data persists across server restarts
- ✅ Smart fallback for development environments

## Testing the Fix

You can verify the fix works by:
1. **Deploy with persistent disk configured**
2. Creating a user account
3. Creating a session
4. Waiting for server to restart (or manually restart in Render dashboard)
5. Logging in with same credentials (should work!)
6. Verifying session data is still available
7. Check that database file exists at `/var/data/nuudle.db`

## Troubleshooting

### "unable to open database file" Error
**Problem**: SQLite can't create/access the database file during startup
**Root Cause**: Permission error - application cannot create the `/var/data` directory
**Solution**:
1. **CRITICAL**: Update the Start Command in Render dashboard to: `mkdir -p /var/data && uvicorn main:app --host 0.0.0.0 --port $PORT`
2. The `mkdir -p /var/data` command creates the directory with proper permissions before the app starts
3. Verify these settings in Render dashboard:
   - **Root Directory**: `backend`
   - **Start Command**: `mkdir -p /var/data && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Persistent disk mounted** at `/var/data`
4. **Redeploy the service**

### If users still lose data:
1. **Check persistent disk is properly mounted** at `/var/data`
2. **Verify disk has sufficient space** (at least 100MB free)
3. **Check Render logs** for database connection errors
4. **Ensure SECRET_KEY environment variable is set**

### If deployment fails:
1. **Verify persistent disk configuration** in Render dashboard
2. **Check that mount path is exactly** `/var/data`
3. **Ensure disk is attached to the correct service**
4. **Confirm Start Command includes** `cd backend &&`

### Common Configuration Issues:
- ❌ **Wrong**: Root Directory not set, Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- ✅ **Correct**: Root Directory: `backend`, Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### If you see "No such file or directory" error:
This means you have `cd backend &&` in your start command but Root Directory is already set to `backend`. Remove the `cd backend &&` part from the start command.

The previous issue where users had to "recreate accounts with the same credentials" should now be **completely resolved** with proper persistent disk setup.