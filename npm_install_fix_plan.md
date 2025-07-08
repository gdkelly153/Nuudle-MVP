# Plan to Fix Frontend `npm install` Failure

This plan provides the steps to resolve the `npm install` error. The error occurred because the command was run from the wrong directory.

### **Problem Diagnosis**

The error `ENOENT: no such file or directory, open '/Users/garrettkelly/Desktop/Nuudle/nuudle/package.json'` confirms that `npm` could not find the `package.json` file. This is because the command was executed in the project's root directory, but the frontend's `package.json` is located inside the `frontend` subdirectory.

### **Step-by-Step Fix**

Please execute these commands in your terminal.

**1. Navigate to the Frontend Directory:**
   - This is the most important step. You must be inside the `frontend` directory before running `npm` commands.
    ```bash
    cd frontend
    ```

**2. (Optional but Recommended) Clean Install:**
   - This command will delete the potentially corrupted `node_modules` folder and `package-lock.json` file to ensure a clean slate.
    ```bash
    rm -rf node_modules package-lock.json
    ```

**3. Run `npm install`:**
   - Now that you are in the correct directory, this command will find the `package.json` and install the dependencies correctly.
    ```bash
    npm install
    ```

**4. Return to the Root Directory:**
   - After the installation is complete, navigate back to the project's root directory.
    ```bash
    cd ..
    ```

### **Next Steps**

Once `npm install` completes successfully, you can proceed with restarting your local servers as described in the `local_env_fix_plan.md`.