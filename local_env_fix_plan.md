# Plan to Restore Local Development Environment

This plan will guide you through the steps to fix your broken local environment by syncing it with the latest working version from your `main` git branch.

### **Problem Diagnosis**

Your production environment at `www.nuudle.ai` is working correctly, but your local environment is broken and fails to load. This indicates that your local code, dependencies, or running server instances are out of sync with the stable version in your repository.

### **Step-by-Step Fix**

Please execute these commands in your terminal from the root directory of the project (`/Users/garrettkelly/Desktop/Nuudle/nuudle`).

**1. Stop the Local Servers:**
   - First, stop the currently running (and broken) local servers. Go to each active terminal and press `Ctrl + C`.

**2. Sync with Your Git Repository:**
   - This command will fetch the latest changes from your `main` branch and reset your local files to match it exactly. This ensures your code is identical to what's running in production.
    ```bash
    git pull origin main
    ```

**3. Re-install Backend Dependencies:**
   - It's possible that Python dependencies have changed. This command ensures your local backend environment has the exact packages required by the latest code.
    ```bash
    # Ensure your virtual environment is active
    source .venv/bin/activate 
    pip install -r backend/requirements.txt
    ```

**4. Re-install Frontend Dependencies:**
   - Similarly, this command will update your frontend packages to match the project's requirements.
    ```bash
    cd frontend
    npm install
    cd .. 
    ```

**5. Restart the Servers:**
   - Now, with the code and dependencies synced, restart the backend and frontend servers in their respective terminals.

   - **Terminal 1 (Backend):**
    ```bash
    python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
    ```

   - **Terminal 2 (Frontend):**
    ```bash
    cd frontend && npm run dev
    ```

### **Expected Outcome**

After completing these steps, your local environment should be fully restored and functional, mirroring the working state of your production application. The main page at `http://localhost:3000` should load correctly.