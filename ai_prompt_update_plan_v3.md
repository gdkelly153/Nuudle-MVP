# AI Prompt Update Plan (v3)

## Goal

The objective is to fix the bug where the `{{painPoint}}` placeholder is not being replaced in the `perpetuation` AI prompt, causing the literal string to appear in the user-facing text.

## Analysis

The root cause of the issue is that the frontend is not sending the `painPoint` data to the backend during the `perpetuation` stage. When the backend constructs the AI prompt, the `{{painPoint}}` placeholder is never replaced, leading to the AI including the raw placeholder in its response.

The previous change to the `systemPrompt` is a good safeguard but did not address this specific data flow issue.

## The Fix

The solution is to update the frontend code in `frontend/src/app/SessionWizard.tsx` to include the `painPoint` when it calls the AI for the `perpetuation` stage. This will ensure the placeholder is correctly replaced with the user's problem statement before the prompt is sent to the AI.

### Proposed Change in `frontend/src/app/SessionWizard.tsx`

I will modify the `AIAssistButton` for the `perpetuation` stage to include `painPoint` in the `requestAssistance` call.

*   **Current Code (around line 638):**
    ```typescript
    onRequest={() => ai.requestAssistance("perpetuation", perpetuations.map(p => p.text).join(', '), { perpetuations })}
    ```

*   **Proposed Code:**
    ```typescript
    onRequest={() => ai.requestAssistance("perpetuation", perpetuations.map(p => p.text).join(', '), { painPoint, perpetuations })}
    ```

This change is targeted and directly resolves the bug identified in the screenshot.