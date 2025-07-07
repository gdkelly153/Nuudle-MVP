### **Final Plan: AI-Powered Adaptive Feedback Loop**

**Objective:** To create a fully context-aware AI summary that maintains consistency with past AI interactions and provides balanced, adaptive feedback. The AI will praise users for incorporating its suggestions and challenge them to reflect when valuable feedback appears to have been missed.

**1. Frontend Changes (`SessionWizard.tsx`):**
*   **Detailed Interaction Logging:** The `aiInteractionLog` state will store objects containing: `{ stage: string, userInputBefore: any, aiResponse: string }`.
*   **Snapshot on Request:** When `requestAssistance` is called, it will capture the relevant user input (e.g., the `causes` array) and store it as `userInputBefore` in the log entry.

**2. Backend Changes (`aiService.js`):**
*   **Update `getSummary`:** The function will accept the new, detailed `aiInteractionLog`.
*   **"Adaptive Feedback" Prompt:** The `session_summary` prompt will be enhanced with a two-part directive for the `feedback` section:
    *   **For `feedback.strengths`:**
        > "Review the `aiInteractionLog`. For each interaction, compare the `userInputBefore` with the user's final input for that section. If you detect a meaningful improvement after your feedback was provided (e.g., the user added more detail or refined a vague concept), you **must** celebrate this as a key strength. Provide specific examples."
    *   **For `feedback.areas_for_growth`:**
        > "Conversely, if your previous `aiResponse` provided specific, actionable suggestions that were not incorporated into the user's final input in any discernible way, you **must** gently point this out as an area for growth. Frame it as a missed opportunity for reflection. For example: 'In the 'Root Causes' step, the AI suggested exploring [specific idea], but this doesn't seem to be reflected in your final list. This might be a valuable area to revisit to ensure you're addressing the deepest possible drivers of your problem.'"

**3. Final Plan Diagram:**

```mermaid
graph TD
    subgraph "During Session"
        A[User clicks "AI Assist"] --> B{Capture `userInputBefore`};
        B --> C{Call AI, get `aiResponse`};
        C --> D[Log `{stage, userInputBefore, aiResponse}`];
    end

    subgraph "End of Session"
        E[User clicks "Submit"] --> F{Send final inputs AND detailed log to backend};
        F --> G{Summary AI compares `userInputBefore` with final inputs};
        G --> H{If improvement, praise in "Strengths"};
        G --> I{If feedback missed, challenge in "Areas for Growth"};
        H & I --> J[Generate consistent and adaptive summary];
    end

    J --> K[End: User receives a summary that provides a balanced feedback loop];