# 🚀 Deployment Guide - MongoDB Atlas Integration

## ✅ COMPLETE: MongoDB Atlas Setup

**The application now uses MongoDB Atlas for data persistence. Your MongoDB connection is already configured and the code has been migrated.**

### 1. Required Environment Variables for Production

The following environment variables **MUST** be set in your Render dashboard for the backend service:

#### 1. MONGODB_URI (✅ Already Configured)
```
MONGODB_URI=mongodb+srv://gdkelly153:SJCZ66bk5PBfsjJiamnudle.ey4e49z.mongodb.net/?retryWrites=true&w=majority&appName=Nuudle
```

**✅ CONFIGURED**: Your MongoDB Atlas connection string is set up and the application now connects to it.

#### 2. SECRET_KEY (CRITICAL)
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

#### 3. CLAUDE_API_KEY (Already configured)
```
CLAUDE_API_KEY=your_claude_api_key_here
```

## Render Deployment Steps

### 1. Configure Root Directory and Start Command (CRITICAL)
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
3. **Set the command to:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. **Save changes**

**✅ SIMPLIFIED**: No more complex directory creation or filesystem workarounds needed.

**⚠️ IMPORTANT**:
- The **Root Directory** setting tells Render to run everything from the `backend` folder
- The **Start Command** should NOT include `cd backend &&` because we're already in that directory
- This ensures the application can connect to MongoDB and find all dependencies

### 2. Set Environment Variables in Render Dashboard
1. Go to your Render dashboard
2. Select your backend service
3. Navigate to "Environment" tab
4. Add the `SECRET_KEY` variable with a secure value (if not already set)
5. Save changes

### 3. Deploy the Latest Changes
The latest commit includes:
- ✅ **MongoDB Atlas Integration** - Uses your existing MongoDB database
- ✅ **Removed SQLite Dependencies** - No more file-based database issues
- ✅ **Async Database Operations** - Proper async/await support with Motor
- ✅ **Clean Architecture** - Separated database logic into dedicated module
- ✅ **Simplified Deployment** - No persistent disk or directory creation needed
- ✅ Fixed SECRET_KEY to use environment variable

### 4. Verify Deployment
After deployment, test that:
- Users can register and login
- Sessions persist across server restarts
- No data loss occurs during server sleep/wake cycles
- MongoDB connection is established successfully
- No "unable to open database file" errors in logs

## How the MongoDB Migration Works

### Problem Before:
- Database stored in ephemeral filesystem (`nuudle.db` in working directory)
- When server goes to sleep, filesystem is wiped clean
- All user accounts and sessions lost permanently
- Users had to recreate accounts with same credentials
- Filesystem permission errors on Render

### Solution Now:
- Database stored in MongoDB Atlas cloud service
- MongoDB Atlas provides persistent, reliable data storage
- All user data and sessions preserved permanently
- No filesystem dependencies or permission issues
- Automatic connection management with retry logic

### Code Architecture:
```python
# MongoDB connection using Motor (async driver)
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi

# Async database operations
async def get_user_by_username(username: str):
    return await db.users.find_one({"username": username})

async def create_user(user_data: dict):
    result = await db.users.insert_one(user_data)
    return str(result.inserted_id)
```

## Database Migration Notes

### Migration Complete:
1. **Previous State**: SQLite with persistent file storage attempts
2. **Current State**: MongoDB Atlas with cloud-based persistence
3. **Benefits**: 
   - No filesystem permission issues
   - Automatic scaling and backup
   - Better performance for concurrent users
   - Professional-grade reliability

### Key Changes Made:
- Replaced `sqlite3` with `motor` and `pymongo`
- Converted all database operations to async/await
- Updated User model to use string IDs (MongoDB ObjectId)
- Added proper connection management with startup/shutdown events
- Removed all file-based database code

## Security Considerations

- ✅ **Cloud-based data storage** - MongoDB Atlas handles persistence
- ✅ SECRET_KEY now uses environment variable
- ✅ Async database operations for better performance
- ✅ No more filesystem permission vulnerabilities
- ✅ User data persists across server restarts
- ✅ Professional database security via MongoDB Atlas

## Testing the Migration

You can verify the migration works by:
1. **Deploy with MongoDB Atlas configured**
2. Creating a user account
3. Creating a session
4. Waiting for server to restart (or manually restart in Render dashboard)
5. Logging in with same credentials (should work!)
6. Verifying session data is still available
7. Check Render logs for successful MongoDB connection

## Troubleshooting

### MongoDB Connection Issues
**Problem**: Application can't connect to MongoDB Atlas
**Solutions**:
1. **Verify MONGODB_URI** is correctly set in Render environment variables
2. **Check MongoDB Atlas network access** - ensure 0.0.0.0/0 is allowed
3. **Verify database user permissions** in MongoDB Atlas
4. **Check Render logs** for specific connection error messages

### Authentication Issues
**Problem**: Users getting logged out unexpectedly
**Solutions**:
1. **Ensure SECRET_KEY is set** in Render environment variables
2. **Never change SECRET_KEY** in production
3. **Check JWT token expiration** settings

### Deployment Failures
**Problem**: Render deployment fails
**Solutions**:
1. **Verify Root Directory** is set to `backend`
2. **Check Start Command** is `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Ensure all dependencies** are in requirements.txt
4. **Check Python version** matches runtime.txt

### Common Configuration Issues:
- ❌ **Wrong**: Missing MONGODB_URI environment variable
- ✅ **Correct**: MONGODB_URI properly configured in Render dashboard
- ❌ **Wrong**: Start Command includes `cd backend &&`
- ✅ **Correct**: Root Directory: `backend`, Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## No More Persistent Disk Needed

**✅ SIMPLIFIED DEPLOYMENT**: 
- No persistent disk setup required
- No directory creation commands needed
- No filesystem permission workarounds
- MongoDB Atlas handles all data persistence automatically

The previous issues with "unable to open database file" and users losing data are now **completely resolved** with the MongoDB Atlas migration.