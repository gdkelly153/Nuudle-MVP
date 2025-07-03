# Final Plan: True Icon Overlay

**Goal:** Position the brain icon so it visually overlaps the top-left corner of the AI buttons.

**Strategy:** Use the "Sibling Overlay" structure with the correct positioning classes to achieve the overlap effect.

**Implementation Steps:**
1.  **Action:** Modify `frontend/src/components/AIComponents.tsx` for both the `HelpMeNuudleButton` and `AIAssistButton` components.
2.  **Structure:**
    *   Ensure the parent `div` has `relative` positioning.
    *   The `<button>` and `<Brain>` icon will be siblings inside this `div`.
    *   The `<Brain>` icon will have the classes `absolute top-1 left-1` to position it slightly inset over the button's top-left corner.
3.  **Sizing:** Re-apply the `px-4 py-2` padding classes to the AI buttons to ensure consistent sizing.