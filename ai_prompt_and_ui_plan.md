# AI Prompt and UI Enhancement Plan

This document outlines the plan to improve the AI prompts and user interface based on recent feedback.

## High-Level Plan

The plan is divided into two main parts:
1.  **AI Prompt Engineering:** Revise the core prompts in `api/services/aiService.js` to align with the desired tone, personality, and analytical depth.
2.  **Frontend UI/UX Refinements:** Adjust the React components in the `frontend` directory to fix visual inconsistencies and improve component behavior.

### Mermaid Diagram

```mermaid
graph TD
    A[Start: Review User Feedback] --> B{Categorize Tasks};
    B --> C[AI Prompt Engineering];
    B --> D[Frontend UI/UX];

    subgraph AI Prompt Engineering
        C --> C1[Revise "identify assumptions" prompt];
        C --> C2[Revise "reflect on my role" prompt];
        C --> C3[Update all prompts to address all user inputs];
        C --> C4[Enhance "process my concerns" prompt logic];
    end

    subgraph Frontend UI/UX
        D --> D1[Fix AI response visibility (remove max-height)];
        D --> D2[Standardize feedback button size];
        D --> D3[Correct tooltip display logic];
    end

    C1 & C2 & C3 & C4 --> E[Backend Changes Complete];
    D1 & D2 & D3 --> F[Frontend Changes Complete];

    E & F --> G[Final Review & Testing];
    G --> H[Solution Implemented];
```

## Detailed Breakdown

### Part 1: AI Prompt Engineering (File: `api/services/aiService.js`)

1.  **"Help me identify assumptions" (`identify_assumptions`):** Rewrite this prompt to be more conversational. The new prompt will guide the AI to:
    *   Acknowledge and evaluate the reasonableness of *all* user-provided assumptions.
    *   Assess each assumption's relevance to the associated cause.
    *   Provide gentle, insightful reasoning.
    *   Suggest concrete steps the user can take to validate or invalidate their assumptions.

2.  **"Help me reflect on my role" (`perpetuation`):** Replace the current intro with more direct and empowering language to make the prompt feel more like a collaborative tool.

3.  **"Help me discover overlooked causes" (`root_cause`) & General Prompt Update:** Modify the `root_cause` prompt and review all other prompts to ensure they analyze and respond to *all* items the user has entered (e.g., all causes, all assumptions), rather than focusing on just one.

4.  **"Help me process my concerns" (`action_planning`):** Enhance this prompt to instruct the AI to analyze the complete context of the user's input for each fear (the fear, the mitigation plan, and the contingency plan) and evaluate the coherence and potential effectiveness of the plans.

### Part 2: Frontend UI/UX Refinements

1.  **AI Response Visibility (File: `frontend/src/components/AIComponents.tsx`):** Remove the `max-h-96` class from the AI response card to allow the container to dynamically resize and prevent text truncation.

2.  **Button Size Consistency (Files: `frontend/src/components/AIComponents.tsx`, `frontend/src/app/globals.css`):**
    *   Add a common CSS class, `feedback-button`, to both the "This helps" and "Not helpful" buttons.
    *   Define a style for `.feedback-button` in `globals.css` to set a consistent `min-width` and padding.

3.  **Tooltip Behavior (File: `frontend/src/components/AIComponents.tsx`):**
    *   Modify the `isDisabled` prop on the `Tooltip` component within `HelpMeNuudleButton` and `AIAssistButton`.
    *   The new logic will be `isDisabled={disabled && !isLoading}` to ensure the tooltip only shows when the button is disabled due to missing user input.