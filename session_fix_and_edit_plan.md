# Plan: Fix Session Save Error and Add "Back to Edit" Button

This plan outlines the steps to fix the "Failed to save session" error and add a new feature that allows users to go back from the session summary page to the main wizard flow to edit their session.

## 1. Fix "Failed to save session" Error

The user is reporting a "Failed to save session" error when they click "Submit" at the end of the wizard flow. This indicates a problem with the API request to save the session data.

### Steps to Resolve:

1.  **Analyze Frontend (`frontend/src/app/page.tsx`)**:
    *   Locate the `saveSession` function.
    *   Examine the structure of the data being sent to the backend.
    *   Verify that the API endpoint and request method are correct.

2.  **Analyze Backend (`backend/main.py`)**:
    *   Review the `/api/sessions` endpoint.
    *   Check the data model to ensure it matches the data being sent from the frontend.
    *   Examine the database logic to identify any potential issues with saving the data.

3.  **Implement the Fix**:
    *   Create a diff to correct any discrepancies between the frontend and backend.
    *   Ensure the session data is saved correctly to the database.

## 2. Add "Back to Edit" Button

The user wants to be able to go back from the session summary page to the main wizard flow to edit their session.

### Steps to Implement:

1.  **Add "Back to Edit" Button to UI (`frontend/src/app/session/[id]/page.tsx`)**:
    *   Add a new "Back to Edit" button to the session summary page.
    *   Style the button to be consistent with the existing UI.

2.  **Implement Navigation Logic**:
    *   When the "Back to Edit" button is clicked, the user should be navigated back to the main wizard flow.
    *   The session data should be passed back to the wizard so it can be pre-filled.
    *   This will likely require modifications to the `SessionWizard` component to accept initial data.

Once this plan is approved, I will switch to "Code" mode to implement the changes.