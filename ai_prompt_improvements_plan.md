### **Objective 1: Refine "Help Me Nuudle" AI Interaction Logic**

The goal is to create two distinct AI responses for the initial problem articulation step, depending on how the user interacts with the UI.

1.  **Direct "Help Me Nuudle" Click:** When the user proactively clicks the "Help Me Nuudle" button, the AI should immediately analyze their problem statement and ask clarifying questions without the "Before we begin..." preamble.
2.  **"Begin" Button Intervention:** When the user clicks "Begin" with a problem statement that lacks context (as determined by the existing `isProblemSimplistic` function), the AI will intervene with a response that *does* start with "Before we begin...".

This logic can be visualized as follows:

```mermaid
graph TD
    A[User is on Step 0 with a problem statement] --> B{User Clicks a Button};
    B --> C[Help Me Nuudle];
    B --> D{Begin};

    C --> E[Trigger AI with 'direct' prompt];
    E --> F[AI responds with direct analysis & questions];

    D --> G{Is problem statement simplistic?};
    G -- Yes --> H[Trigger AI with 'intervention' prompt];
    H --> I[AI responds with 'Before we begin...' preamble];
    G -- No --> J[Proceed to Step 1];

    subgraph AI Prompts
        direction LR
        P1[Direct Prompt: "Your statement is '...'. To help clarify, could you tell me..."]
        P2[Intervention Prompt: "Before we begin... To help clarify, could you tell me..."]
    end

    E --> P1;
    H --> P2;
```

### **Objective 2: Enhance "Help me with potential actions" AI Response**

The AI response for this step will be updated to provide a more comprehensive analysis. It will first reflect on the user's drafted actions and then encourage them to explore other possibilities based on the context they've provided throughout the session.

The response will be structured with two distinct sections:

*   **Reflecting on Your Actions:** This section will contain the current functionality, asking questions to deepen the user's thinking about their existing ideas.
*   **Exploring Other Possibilities:** This new section will ask open-ended questions that prompt the user to consider other actions based on the initial problem, identified causes, and their own contributing behaviors (`perpetuations`).

---

### **Implementation Plan**

To achieve this, I will make changes in two key files:

1.  **Backend Prompt Updates (`api/services/aiService.js`):**
    *   I will create two distinct prompts for `problem_articulation`:
        *   A **`problem_articulation_direct`** prompt for the "Help Me Nuudle" button.
        *   A **`problem_articulation_intervention`** prompt that includes the "Before we begin..." text for the "Begin" button intervention.
    *   I will update the **`potential_actions`** prompt to include the two-part structure described above, ensuring it leverages the full session context, including `causes` and `perpetuations`.

2.  **Frontend Logic Updates (`frontend/src/app/SessionWizard.tsx`):**
    *   In the `startSession` function, the AI call triggered by a simplistic problem will be updated to use the new `problem_articulation_intervention` prompt.
    *   The `onClick` handler for the `HelpMeNuudleButton` will be changed to call the new `problem_articulation_direct` prompt.
    *   The `AIAssistButton` for the `potential_actions` stage will be updated to pass the user's selected `perpetuations` as part of the context to the AI service.

This plan will create a more nuanced and context-aware AI assistant that better supports the user's journey through the Nuudle process.