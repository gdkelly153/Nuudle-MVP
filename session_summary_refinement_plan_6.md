# Session Summary Refinement Plan 6.0 (The Final One)

This plan will definitively resolve the border cutoff issue and the modal close button layering.

## 1. "Moving Forward" Border Cutoff

*   **Goal:** Ensure the bottom border is fully visible.
*   **Root Cause:** The `.summary-section:last-child` selector removes the `border-bottom` but not the `padding-bottom`, which pushes the border out of view.
*   **Solution:**
    *   In `globals.css`, modify the `.summary-section:last-child` rule to remove the `padding-bottom`.

## 2. Modal Close Button

*   **Goal:** Ensure the "X" button is layered on top of the session summary card.
*   **Solution:**
    *   Increase the `z-index` of the `.modal-close-button` to `10`.