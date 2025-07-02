# Plan to Fix Frontend to Backend Connection Issue

The frontend application is failing to connect to the backend API because the Python server responsible for handling session data is not running, and the frontend code has a hardcoded URL.

### 1. System Architecture Overview

The application consists of three services:

*   **Frontend (`frontend/`)**: A Next.js application that should be running on `localhost:3000`.
*   **AI Service (`api/`)**: A Node.js Express server running on `localhost:3001`.
*   **Session Backend (`backend/`)**: A Python FastAPI server intended to run on `localhost:8000`.

**Diagram:**

```mermaid
graph TD
    A[Frontend on localhost:3000] -->|AI Features| B(Node.js AI Service on localhost:3001);
    A -->|Save/Load Sessions| C(Python Backend on localhost:8000);
    C --> D[SQLite Database (nuudle.db)];
```

### 2. The Problem

The `fetch` request in `frontend/src/app/SessionWizard.tsx` is trying to connect to `http://localhost:8000/api/sessions`, but the Python server at that address is not running.

### 3. The Solution

The plan to fix this involves three steps:

**Step 1: Run the Python Backend Server**
The Python server needs to be started. This will involve:
1.  Installing the required Python packages (`fastapi`, `uvicorn`, `pydantic`, `python-multipart`).
2.  Running the server using `uvicorn`.

**Step 2: Correct the API Endpoint in the Frontend**
The hardcoded API URL in `frontend/src/app/SessionWizard.tsx` will be replaced with an environment variable to make it more configurable.
1.  Create a `.env.local` file in the `frontend` directory.
2.  Add the variable `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3.  Update the `fetch` call in `SessionWizard.tsx` to use this environment variable.

**Step 3: Update the CORS Policy in the Python Backend**
The CORS policy in `backend/main.py` will be updated to allow requests from the frontend's origin.
1.  Modify the `origins` list in `main.py` to include `http://localhost:3000`.

This plan will ensure all services can communicate correctly.