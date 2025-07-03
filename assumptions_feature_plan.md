# Plan: Revamp "Help me identify assumptions" Feature

This document outlines the plan to update the "Help me identify assumptions" feature in the Nuudle application.

## 1. Keep the Frontend Description

The user-facing description for the `identify_assumptions` stage will remain unchanged.

-   **File:** `frontend/src/components/AIComponents.tsx`
-   **Line:** 96
-   **Description:** "AI will help you identify potential assumptions in your stated causes."

## 2. Remove User Input Requirement

The "Help me identify assumptions" button will be enabled even if the user has not entered any text into the assumptions text box. The content of the text box will still be passed to the backend, even if it's an empty string.

## 3. Adapt Backend Logic

The backend service will be updated to handle requests for the `identify_assumptions` stage.

-   **File:** `api/services/aiService.js` (likely)
-   **Logic:** The service will use the `sessionContext` (containing the problem statement and causes) and the `userInput` from the assumptions text box (which can be empty) to generate insights.

## 4. Refine AI Prompt

A new AI prompt will be created with the following instructions:

1.  Review the user's problem statement and list of causes from the session context.
2.  Brainstorm and suggest potential unstated assumptions the user might be making.
3.  If the user has provided their own assumptions (`userInput` is not empty), analyze them for relevance and accuracy.