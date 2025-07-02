# Plan: Revert and Fix AI Button Icon

**Goal:** Fix the icon's size and position by correcting the obvious errors in the current code, using logical deductions from previously reviewed plans. This plan aims to revert the component to its correct state from yesterday.

## Analysis of Discrepancies

1.  **Incorrect Positioning:**
    *   **Current Code:** The `neural-network-brain` `div` uses `absolute -top-1 -left-1`.
    *   **Problem:** This is causing the icon to be completely misplaced.
    *   **Evidence:** The `true_overlay_plan.md` specifies using `absolute top-1 left-1`. Given that the current state is broken, it is highly probable that `top-1 left-1` is the correct value that was in place yesterday.

2.  **Inconsistent Sizing:**
    *   **Current Code:** The `HelpMeNuudleButton` icon is `w-4 h-4`, but the `AIAssistButton` icon is `w-3 h-3`.
    *   **Problem:** This inconsistency was likely introduced by the faulty change.
    *   **Evidence:** The `ui_fix_plan.md` had a specific goal to standardize all brain icons to `w-4 h-4` for visual consistency.

## Proposed Changes to `frontend/src/components/AIComponents.tsx`

Based on this analysis, the following precise changes will be made to revert the component to its correct state:

1.  **For the `HelpMeNuudleButton`:**
    *   Change the positioning class on the `neural-network-brain` `div` from `-top-1 -left-1` to `top-1 left-1`.

2.  **For the `AIAssistButton`:**
    *   Change the sizing class on the `neural-network-brain` `div` and the `Brain` icon from `w-3 h-3` to `w-4 h-4`.
    *   Change the positioning class on the `neural-network-brain` `div` from `-top-1 -left-1` to `top-1 left-1`.

## Visual Plan

This diagram illustrates the intended changes to the CSS classes for the icon container.

```mermaid
graph TD
    subgraph "Discrepancy Analysis"
        A[Current Broken State] --> B{Positioning: `-top-1 -left-1`};
        A --> C{Sizing: Inconsistent (`w-4`/`w-3`)};
    end
    subgraph "Proposed Fix"
        D[Corrected State] --> E{Positioning: `top-1 left-1`};
        D --> F{Sizing: Standardized (`w-4 h-4`)};
    end
    B --> E;
    C --> F;