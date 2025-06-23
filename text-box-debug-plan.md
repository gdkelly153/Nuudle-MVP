# Text Box Sizing Debugging and Implementation Plan

## Problem

Multiple attempts to fix the text box auto-sizing issue have failed. The root cause is suspected to be a conflict between the AI button and text box styling.

## Deep Dive & Isolation Testing Plan

This plan will follow a rigorous, step-by-step isolation testing approach to identify and fix the root cause of the issue.

1.  **Step 1: Isolate and Test by Disabling AI Button Auto-Sizing**
    *   Comment out the `display: inline-block;` rule from the `.ai-button-wrapper` class in `frontend/src/app/globals.css`.
    *   This will completely disable the "shrink-to-fit" behavior for the AI buttons, allowing us to test the hypothesis that this is the source of the interference.

2.  **Step 2: Re-evaluate and Implement a Robust Layout**
    *   After Step 1, we will assess the text box behavior. Regardless of the outcome, it is clear the current flexbox layout is too fragile.
    *   We will refactor the `.cause-assumption-pair` container to use `display: grid` with `grid-template-columns: 1fr 1fr;`. This will create two perfectly equal, responsive columns that are not affected by their content's size.

3.  **Step 3: Ensure Final Text Box Integrity**
    *   Verify that the `.auto-resizing-textarea` styles are set to `width: 100%` and `box-sizing: border-box` to ensure they correctly fill their new grid column.
    *   Add `overflow-wrap: break-word;` to the text area styles to prevent any text overflow issues.

4.  **Step 4: Re-enable AI Button Sizing Safely**
    *   Once the text box layout is stable, we will safely re-enable the `display: inline-block` on the `.ai-button-wrapper`. Since the main layout will now be controlled by CSS Grid, this style should no longer cause any conflicts.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Hypothesis: AI Button style is the root cause};
    B --> C{Step 1: Comment out `display: inline-block` on `.ai-button-wrapper`};
    C --> D{Step 2: Refactor `.cause-assumption-pair` to use CSS Grid};
    D --> E{Step 3: Ensure `textarea` styles are correct for grid layout};
    E --> F{Step 4: Safely re-enable AI button sizing};
    F --> G[End: Stable, isolated, and predictable layout];