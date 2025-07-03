# Project Plan: Nuudle Session Summary & Action Plan

This plan outlines the necessary steps to create a well-designed session summary page that provides users with AI-driven insights and a clear action plan.

## Part 1: Backend Enhancements

The first step is to create the necessary API endpoints and AI logic to generate the summary.

1.  **Create a New AI Summary Prompt**:
    *   In `api/services/aiService.js`, I will add a new prompt configuration named `session_summary`.
    *   This prompt will instruct the AI to analyze the complete session data and generate a structured JSON output containing:
        *   `title`: A title for the summary.
        *   `problem_overview`: A brief summary of the user's initial problem.
        *   `key_insights`: An array of AI-generated insights based on the user's inputs.
        *   `action_plan`: A recommended set of actions for the user to take.
        *   `feedback`: Constructive feedback on the user's proposed solutions.
        *   `conclusion`: An encouraging closing statement.

2.  **Develop a New AI Service Function**:
    *   I will create a new function in `api/services/aiService.js` called `getSummary`.
    *   This function will accept the full session data, use the new `session_summary` prompt, and call the Anthropic API to get the structured summary.

3.  **Add a New Backend Endpoint**:
    *   In the Python backend (`backend/main.py`), I will create a new endpoint: `GET /api/sessions/{session_id}`.
    *   This endpoint will fetch a single session's data from the `nuudle.db` database, which is more efficient than fetching all sessions.

## Part 2: Frontend Implementation

Next, I will build the user interface for displaying the summary.

1.  **Create a Dynamic Session Page**:
    *   I will create a new dynamic page at `frontend/src/app/session/[id]/page.tsx`. This page will display the summary for a specific session.

2.  **Update the History Page**:
    *   I will modify `frontend/src/pages/historypage.tsx` and the `SessionCard` component. Each session card will become a link that navigates the user to their detailed summary page (e.g., `/session/123`).

3.  **Build the Summary UI**:
    *   The new session summary page will fetch the session data from the Python backend and then call the new `getSummary` function from the AI service.
    *   It will display the structured summary in a well-designed and easy-to-read format, with distinct sections for insights, the action plan, and feedback. I will create new React components to render each part of the summary.

4.  **Implement Download and Share Functionality**:
    *   **PDF Download**: I will add a "Download as PDF" button. I'll use the `jspdf` and `html2canvas` libraries to convert the summary into a high-quality PDF document.
    *   **Social Sharing**: I will add "Share" buttons for social media platforms. These buttons will generate an image of the summary (using `html2canvas`) that users can easily share.

## Architectural Diagram

This Mermaid diagram illustrates the proposed data flow for the new feature:

```mermaid
sequenceDiagram
    participant User
    participant Browser (Frontend)
    participant Node.js API (aiService)
    participant Python API (FastAPI)
    participant Claude AI
    participant Database

    User->>Browser (Frontend): Clicks on a session in /historypage
    Browser (Frontend)->>Python API (FastAPI): GET /api/sessions/{id}
    Python API (FastAPI)->>Database: SELECT * FROM sessions WHERE id={id}
    Database-->>Python API (FastAPI): Session Data
    Python API (FastAPI)-->>Browser (Frontend): Session Data

    Browser (Frontend)->>Node.js API (aiService): POST /api/summary (with Session Data)
    Node.js API (aiService)->>Claude AI: Generate summary prompt
    Claude AI-->>Node.js API (aiService): Structured JSON Summary
    Node.js API (aiService)-->>Browser (Frontend): Structured JSON Summary

    Browser (Frontend)->>User: Displays well-designed summary page