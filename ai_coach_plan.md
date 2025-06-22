# Final Plan: Implement the AI Critical Thinking Coach

This plan outlines the creation of a multi-stage AI coaching service with robust features for rate limiting, cost tracking, and response validation.

---

## Architecture Overview

```mermaid
sequenceDiagram
    participant User
    participant Frontend (React @ port 3000)
    participant Backend (Node.js @ port 3001)
    participant AIService (in backend/services)
    participant External AI Provider

    User->>Frontend (React @ port 3000): Clicks "AI Assist" button for a specific stage
    Frontend (React @ port 3000)->>Backend (Node.js @ port 3001): POST /api/ai/assist with { stage: "...", context: "..." }
    Backend (Node.js @ port 3001)->>AIService (in backend/services): invoke getAssistance(stage, context)
    AIService (in backend/services)->>External AI Provider: Sends prompt tailored to the stage
    External AI Provider-->>AIService (in backend/services): Returns a clarifying question
    AIService (in backend/services)-->>Backend (Node.js @ port 3001): Returns validated question
    Backend (Node.js @ port 3001)-->>Frontend (React @ port 3000): Responds with { question: "..." }
    Frontend (React @ port 3000)->>User: Displays question in the correct UI section
```

---

## Phase 1: Backend API (Node.js & Express)

1.  **Create AI Service Directory and File:**
    *   Create a new directory: `backend/services/`
    *   Inside, create a file named `aiService.js`. This module will handle the different workflow stages (`problem_articulation`, `root_cause`, etc.) and export a `getAssistance(stage, context)` function.

2.  **Update API Server (`api/server.js`):**
    *   **Import AI Service:** Import the service using the relative path `../backend/services/aiService.js`.
    *   **Add New API Route:** Create a `POST /api/ai/assist` endpoint.
    *   **Rate Limiting:** Use the `rate-limiter-flexible` package to prevent API abuse.
    *   **Cost Tracking:** Use the `sqlite3` package to create and log to a new database at `api/usage.db`. A new table, `api_usage`, will store `timestamp`, `stage`, and `tokens_used`.
    *   **Response Validation:** Ensure the response from the AI service is valid before sending it to the frontend.

3.  **Update Environment Variables:**
    *   Add `AI_PROVIDER_API_KEY` to `api/.env`.

---

## Phase 2: Frontend Integration (React)

1.  **Add "AI Assist" Buttons to Multiple UI Stages:**
    *   In `frontend/src/app/page.tsx`, add an "AI Assist" button to each relevant workflow stage (Problem Articulation, Root Cause, etc.).

2.  **Implement Frontend Logic:**
    *   In `frontend/src/app/page.tsx`, the button's handler function will call the `POST /api/ai/assist` endpoint with the correct `stage` and context, and display the returned question.