# Session Summary and History Fix Plan

This document outlines the plan to fix the broken session history page and implement a new session summary feature.

### **Part 1: Fix Session History & Unify Routing**

The immediate priority is to fix the blank history page and improve the project's structure by consolidating the routing logic.

1.  **Delete Redundant Pages Router File:**
    *   The file at `frontend/src/pages/historypage.tsx` uses the older Next.js Pages Router, while the rest of the application uses the modern App Router. This file is the source of the bug. It will be deleted to avoid confusion and conflicts.

2.  **Create New App Router History Page:**
    *   A new file will be created at `frontend/src/app/history/page.tsx`.
    *   This new page will be a server-side rendered component that correctly fetches the list of all sessions from the Python data backend using the `GET /api/sessions` endpoint.
    *   It will then map over the returned sessions and use the existing `SessionCard.tsx` component to display each one, restoring the history functionality.

3.  **Update Submission Redirect:**
    *   In `frontend/src/app/SessionWizard.tsx`, the `handleSubmit` function will be modified. The line `window.location.href = "/historypage";` will be changed to `window.location.href = "/history";` to ensure users are redirected to the new, correct history page after submitting a session.

### **Part 2: Implement the Session Summary Experience**

With the history page fixed, I will implement the summary feature in two parts: a detailed summary page for each session and an immediate pop-up modal upon session completion.

1.  **Create Detailed Session Summary Page:**
    *   A new dynamic route will be created at `frontend/src/app/session/[id]/page.tsx`.
    *   This page will be responsible for displaying a full, detailed summary of a single session. When a user navigates to, for example, `/session/123`, this page will:
        1.  Fetch the specific session data from the Python backend (`GET /api/sessions/123`).
        2.  Make a request to the Node.js AI backend (`POST /api/summarize-session`) with the session data to get a deep, analytical summary.
        3.  Render both the user's original inputs and the AI-generated insights in a well-designed layout.
        4.  Include "Download as PDF" and "Share" buttons, powered by `jspdf` and `html2canvas`.

2.  **Create a Session Summary Modal Component:**
    *   A new reusable component will be created at `frontend/src/components/SessionSummaryModal.tsx`.
    *   This modal will serve as an immediate confirmation pop-up after a user submits a session.

3.  **Update Submission Flow to Show Modal:**
    *   The `handleSubmit` function in `frontend/src/app/SessionWizard.tsx` will be enhanced.
    *   After successfully saving the session to the Python backend, it will **not** immediately redirect.
    *   Instead, it will trigger the `SessionSummaryModal` to appear. The modal will show a brief confirmation and a button like "View Your Summary".
    *   Clicking this button will navigate the user to the detailed summary page (`/session/[id]`) for the session they just completed.

### Architecture Diagram

```mermaid
graph TD
    subgraph Frontend
        A[SessionWizard] -- Submit --> B{handleSubmit};
        B -- 1. Save Session --> C[Python Backend];
        B -- 2. Show Modal --> D[SessionSummaryModal];
        D -- View Summary --> E[Detailed Session Page: /session/[id]];
        F[History Page: /history] -- Link --> E;
    end

    subgraph Backends
        C(POST /api/sessions);
        G(GET /api/sessions);
        H(GET /api/sessions/:id);
        I(POST /api/summarize-session);
    end

    subgraph Data Flow
        E -- Fetch Session Data --> C;
        E -- Fetch AI Summary --> I;
        F -- Fetch All Sessions --> G;
    end

    C --> H;
    G --> C;