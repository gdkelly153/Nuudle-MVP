# Final UI Fix Plan: The Sibling Overlay

**Goal:** Achieve a true icon overlay by separating the icon from the button's layout context.

**Strategy:** Implement the user's specified JSX structure, which places the button and the icon as siblings within a shared relative container.

**Implementation Steps:**
1.  **Action:** Modify `frontend/src/components/AIComponents.tsx` for both the `HelpMeNuudleButton` and `AIAssistButton` components.
2.  **Structure:**
    *   Wrap the existing `<button>` in a new `<div className="relative inline-block">`.
    *   Remove any `relative` positioning classes from the `<button>` itself.
    *   Place the `<Brain>` icon as a direct sibling to the `<button>`, inside the new wrapper `div`.
    *   Apply the specified classes to the `<Brain>` icon: `absolute -top-1 -left-1 w-3 h-3`.
3.  **Verification:** After the changes are applied, the user will be asked to perform a final hard refresh to confirm the layout is correct.