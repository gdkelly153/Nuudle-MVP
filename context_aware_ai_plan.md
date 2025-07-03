# Plan to Improve AI Context-Awareness

**Objective:** Refine the "Help me Nuudle" functionality to be context-aware, ensuring the AI does not ask for information the user has already provided.

**1. Create a New Context-Aware AI Prompt**

I will modify `api/services/aiService.js` to add a new prompt named `problem_articulation_context_aware`. This new prompt will instruct the AI to:

*   **Analyze** the user's input (`{{userInput}}`).
*   **Identify** which of the "what, where, when, and who" details are already provided.
*   **Ask** clarifying questions that focus *only* on the information that is actually missing.
*   If the user has provided sufficient detail, the AI will be instructed to ask more insightful, open-ended questions to encourage deeper reflection, rather than asking for basic facts it already has.

Here is a Mermaid diagram illustrating the new, improved logic:

```mermaid
graph TD
    A[User clicks "Help me Nuudle"] --> B{Problem statement has enough detail?};
    B -- No --> C[Use existing "problem_articulation_intervention" prompt];
    B -- Yes --> D[Use NEW "problem_articulation_context_aware" prompt];
    C --> E[AI asks for basic context];
    D --> F[AI analyzes input and asks only for *missing* context];
    E --> G[User provides more context];
    F --> G;
```

**2. Update the Frontend to Use the New Prompt**

I will then update `frontend/src/app/SessionWizard.tsx` to use this new, smarter prompt. The `onClick` handler for the `HelpMeNuudleButton` will be modified to incorporate the same logic as the "Begin" button, using the `isProblemSimplistic` function to decide which prompt to use.

This will ensure that the AI is always context-aware and provides a much more helpful and intelligent response.