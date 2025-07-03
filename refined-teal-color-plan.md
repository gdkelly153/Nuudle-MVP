# Plan to Integrate "Refined Balance Teal"

This plan outlines the steps to integrate the new "Refined Balance Teal" color into the Nuudle color system. The goal is to apply this color to checkmark components to create a consistent "progress/completion" signal.

## Mermaid Diagram

```mermaid
graph TD
    subgraph 1. Update Color System
        A[Add Teal CSS Variables in globals.css]
        B[Create .text-progress-complete utility class]
        C[Create .bg-progress-complete-light utility class]
    end

    subgraph 2. Apply New Color
        D[Update SessionWizard.tsx] --> E[Change Check icon to use .text-progress-complete]
        F[Update AIComponents.tsx] --> G[Change Feedback CheckCircle to use .text-progress-complete]
        F --> H[Change SuggestedCause component to use new background and text colors]
    end

    1. Update Color System --> 2. Apply New Color
```

## Detailed Steps:

1.  **Update `frontend/src/app/globals.css`:**
    *   Add the new CSS variables for "Refined Balance Teal" to the `:root` element.
    *   Create two new utility classes, `.text-progress-complete` and `.bg-progress-complete-light`, to apply the new color and a light background variant for consistency.

2.  **Update `frontend/src/app/SessionWizard.tsx`:**
    *   Find the `Check` icon used for perpetuation selection (around line 1005) and change its `className` from `text-green-600` to the new `text-progress-complete` class.

3.  **Update `frontend/src/components/AIComponents.tsx`:**
    *   For the "Thanks for your feedback!" message (around line 219), update the `CheckCircle` icon to use the `text-progress-complete` class.
    *   For the `SuggestedCause` component (around line 296), update the styling for the "added" state to use the new `.bg-progress-complete-light` and `text-progress-complete` classes, ensuring the checkmark and its background are consistent with the new color.