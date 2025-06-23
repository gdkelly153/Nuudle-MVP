# Formatting and Functionality Improvements - Plan

This document outlines the plan to address six formatting and functionality improvements in the Nuudle session wizard.

### Investigation Summary

1.  **Button Text Layout:** The landing page buttons are constrained by their container's default width, causing text to wrap.
2.  **Header Hierarchy Spacing:** The spacing for the main title and subheader is controlled by `margin-top` and `margin-bottom` in the `.subheader` and `.step-container h1` classes.
3.  **Add Period:** This is a simple text change in the `SessionWizard` component.
4.  **Update Instructional Text:** This is another text change in the `SessionWizard` component.
5.  **Reduce AI Button Spacing:** The spacing is controlled by the `margin-top` on the `.ai-button-container` and the `cause-assumption-pair` container for Step 1.
6.  **AI Content Auto-Minimize:** The `useAIAssistant` hook manages the AI response state, but it doesn't currently cache responses by stage or automatically dismiss them on navigation.

---

### Proposed Plan

Here is a step-by-step plan to resolve these issues.

```mermaid
graph TD
    subgraph "Part 1: UI & Text"
        A[Start] --> B{Add `.landing-button` class to widen buttons};
        B --> C{Adjust `.subheader` margins for hierarchy};
        C --> D{Add period to "Think Smarter."};
        D --> E{Update instructional text in Step 1};
        E --> F{Reduce `margin-top` on AI button containers};
    end

    subgraph "Part 2: Caching & State"
        G[Start] --> H{Modify `useAIAssistant` to store responses in an object keyed by stage};
        H --> I{Update `requestAssistance` to check cache before fetching};
        I --> J{Add `useEffect` in `SessionWizard` to dismiss AI card on step change};
        J --> K[End: Caching implemented, card auto-minimizes];
    end
```

### Detailed Breakdown

#### Part 1: UI and Text Changes

*   **Goal:** Implement all visual and text-based adjustments.
*   **Actions:**
    1.  **Button Text Layout:** In `frontend/src/app/globals.css`, create a new `.landing-button` class with a `min-width` sufficient to prevent text wrapping. Then apply this class to both the "Help Me Nuudle" and "Begin" buttons in `frontend/src/app/SessionWizard.tsx`.
    2.  **Header Hierarchy Spacing:** In `frontend/src/app/globals.css`, adjust the `margin-top` and `margin-bottom` on the `.subheader` class to create the desired visual hierarchy.
    3.  **Add Period:** In `frontend/src/app/SessionWizard.tsx`, change `"Think Smarter"` to `"Think Smarter."`.
    4.  **Update Instructional Text:** In `frontend/src/app/SessionWizard.tsx`, replace the existing instructional text with the new version.
    5.  **Reduce AI Button Spacing:** In `frontend/src/app/globals.css`, reduce the `margin-top` for the `.ai-button-container` and the `.cause-assumption-pair.mt-2` selector to bring the AI buttons closer to their content.

#### Part 2: AI Response Caching and Auto-Minimization

*   **Goal:** Cache AI responses by stage and hide them when the user navigates away.
*   **Actions:**
    1.  **Implement Caching:** In `frontend/src/components/AIComponents.tsx`, change the `currentResponse` state in the `useAIAssistant` hook from a single object to a dictionary (e.g., `{ [stage: string]: { response: string; interactionId: number } | null }`).
    2.  **Check Cache:** Update the `requestAssistance` function to first check if a response for the given stage already exists in the cache. If it does, it will be displayed immediately without a new API call.
    3.  **Auto-Minimize:** In `frontend/src/app/SessionWizard.tsx`, add a `useEffect` hook that triggers on `step` change and calls the `ai.dismissResponse()` function to hide the AI card.