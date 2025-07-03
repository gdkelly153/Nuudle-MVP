# Session Summary Final Refinement Plan (v9)

## Objective
This plan outlines the definitive and final steps to resolve the persistent issue of the bottom border of the "Moving Forward" section being clipped in light mode.

## Root Cause Analysis
After extensive analysis and eliminating all other possibilities, the root cause has been identified as a browser rendering issue tied to the background colors of the parent and child elements within a scrollable container.

- **The Scenario:** A scrolling container (`.summary-content`) has `overflow-y: auto`. Its last child (`.conclusion-section`) has a border.
- **The Bug Trigger (Light Mode):** In light mode, both the container and the child are assigned the same background color (`var(--bg-secondary)`, which is `#ffffff`). In this specific scenario, the browser incorrectly fails to render the child's bottom border, as it gets clipped or painted over by the parent's background/padding area.
- **Why It Works in Dark Mode:** In dark mode, a specific override gives the child (`.conclusion-section`) a *different* background color (`var(--bg-primary)`, `#333333`) from its parent (`#2a2a2a`). This difference forces the browser to use a correct rendering path, and the border is displayed properly.

## Definitive Solution: Mirror the Dark Mode Fix
The solution is to replicate the condition that works in dark mode for the light mode. We will explicitly set a different background color for the `.conclusion-section` in the base theme, preventing the browser rendering bug.

We will use `var(--bg-primary)` which is a visually indistinct off-white, so the appearance will be preserved while fixing the underlying rendering issue.

**File:** `frontend/src/app/globals.css`

```css
/* Add this new rule */
.conclusion-section {
  background: var(--bg-primary); /* Use primary background to differ from parent */
  border: 2px solid var(--golden-mustard);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
}
```
This will override the default `background: var(--bg-secondary)` that it inherits, making it different from `.summary-content` and forcing the border to render correctly. This is the most precise and logical solution based on the evidence.