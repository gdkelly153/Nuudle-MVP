# AI Button Critical Fixes - Plan

This document outlines the plan to address three critical issues related to the AI buttons in the Nuudle session wizard.

### Investigation Summary

1.  **AI Button Availability:** The root cause is a state flag `isEnabled` in the `useAIAssistant` hook. It's initialized to `false` and only set to `true` when the "Help me Nuudle" button is clicked on the landing page. Subsequent AI buttons are conditionally rendered based on this flag, so they don't appear if the first button isn't clicked.
2.  **Brain Icon Size:** Both the main `HelpMeNuudleButton` and the subsequent `AIAssistButton` components use a hardcoded size of `32px` for the brain icon's container. The animation is also based on this size.
3.  **AI Button Positioning:** The subsequent AI buttons are placed inside a generic `button-container` class which is styled with `justify-content: center`, overriding any attempts to left-align them. The layout structure isn't set up to align the buttons with the content boxes above them.

---

### Proposed Plan

Here is a step-by-step plan to resolve these issues.

```mermaid
graph TD
    subgraph "Issue 1: Availability Logic"
        A[Start] --> B{Change `isEnabled` default to `true`};
        B --> C{Remove `setIsEnabled` from initial button's `onClick`};
        C --> D{Add `disabled={step !== currentStep}` to all AI buttons};
        D --> E{Remove conditional `ai.isEnabled &&` render checks};
        E --> F[End: Buttons always visible, only active on current step];
    end

    subgraph "Issue 2: Icon Scaling"
        G[Start] --> H{In `AIAssistButton`, halve icon container `width` & `height` to `16px`};
        H --> I{Adjust icon's `top`/`left` position for new size};
        I --> J{Apply `transform: scale(0.5)` to the animation container};
        J --> K[End: Subsequent icons are 50% smaller, animation scales proportionally];
    end

    subgraph "Issue 3: Positioning"
        L[Start] --> M{Create new `.ai-button-container` CSS class with `justify-content: flex-start`};
        M --> N{Replace reused `.button-container` with new class for AI buttons in wizard};
        N --> O{Adjust layout for Step 1 buttons to use new container};
        O --> P[End: AI buttons are left-aligned under content boxes];
    end
```

### Detailed Breakdown

#### Part 1: Fix AI Button Availability Logic

*   **Goal:** AI buttons will be visible on every step, but only interactive on the current step.
*   **Actions:**
    1.  **Enable AI by Default:** In `frontend/src/components/AIComponents.tsx`, change the `isEnabled` state in the `useAIAssistant` hook to be `true` by default.
    2.  **Enforce Step-Specific Interaction:** In `frontend/src/app/SessionWizard.tsx`, update the `disabled` property of each `AIAssistButton` to include a check (`step !== X`) ensuring it's only active on its designated step.
    3.  **Cleanup:** Remove the now-redundant `ai.setIsEnabled(true)` call from the landing page button and the `ai.isEnabled &&` conditional rendering wrappers.

#### Part 2: Fix Brain Icon Size Scaling

*   **Goal:** Reduce the brain icon size by 50% for all AI buttons after the landing page.
*   **Actions:**
    1.  **Resize Icon:** In `frontend/src/components/AIComponents.tsx`, modify the `AIAssistButton` component, changing the icon container's `width` and `height` from `32px` to `16px` and adjusting its absolute positioning.
    2.  **Scale Animation:** Apply a `transform: 'scale(0.5)'` style to the `neural-network-brain` `div` within the `AIAssistButton` to ensure the animation scales down proportionally with the icon.

#### Part 3: Fix AI Button Positioning

*   **Goal:** Position AI buttons to be left-aligned directly under their associated content.
*   **Actions:**
    1.  **Create Dedicated Container Style:** In `frontend/src/app/globals.css`, add a new `.ai-button-container` class with `display: flex` and `justify-content: flex-start`.
    2.  **Apply New Style:** In `frontend/src/app/SessionWizard.tsx`, replace the incorrect `.button-container` with the new `.ai-button-container` for all `AIAssistButton` instances in steps 2, 3, and 4.
    3.  **Adjust Step 1 Layout:** For the unique two-button layout in Step 1, wrap the existing `cause-assumption-pair` `div` in the new `.ai-button-container` to enforce proper left alignment for the group.