# Final Plan to Restart Local Environment

You are very close. The previous errors were caused by a typo and running a command in the wrong directory. This plan provides the final, corrected commands to get both servers running properly.

### **Instructions**

You will need two separate terminals.

**In Terminal 1 (for the Backend):**

1.  **Navigate to the project's ROOT directory.**
    ```bash
    # If you are in the 'frontend' directory, go back one level
    cd /Users/garrettkelly/Desktop/Nuudle/nuudle
    ```

2.  **Activate the Python virtual environment.**
    ```bash
    source .venv/bin/activate
    ```

3.  **Run the backend server with the corrected command.** (Note the `uvicorn` spelling).
    ```bash
    python3 -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
    ```

---

**In Terminal 2 (for the Frontend):**

1.  **Navigate to the `frontend` directory.**
    ```bash
    cd /Users/garrettkelly/Desktop/Nuudle/nuudle/frontend
    ```

2.  **Run the frontend development server.**
    ```bash
    npm run dev
    ```

### **Expected Outcome**

After running these commands in their respective terminals, your local backend server will be running at `http://localhost:8000` and your frontend application will be accessible at `http://localhost:3000`. The application should now load correctly.