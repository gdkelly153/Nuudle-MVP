# Text Box Sizing Final Fix Plan

## Problem

The text box auto-sizing issue persists, causing both shrinking and text overflow. The root cause has been identified as a lack of width constraints on the `.item-text` divs in Step 3.

## Root Cause Analysis

The problem is not with the `textarea` elements or a conflict with the AI buttons. The issue is specific to **Step 3**, where the text from Step 1 is displayed inside `<div>` elements with the class `.item-text`. These `.item-text` divs lack the necessary CSS to constrain their width within the grid columns, causing them to overflow or shrink based on their content.

## The Definitive Fix

This plan will surgically target the correct elements and establish a robust, unbreakable two-column layout.

1.  **Solidify the Grid Layout**: We will ensure the `.cause-assumption-pair` container uses `display: grid` and `grid-template-columns: 1fr 1fr`, which is the correct modern approach for this layout. We will remove any conflicting `flex` properties from its children (`.cause-column`, `.assumption-column`).

2.  **Constrain the Display Divs**: This is the key step. We will apply `width: 100%` and `box-sizing: border-box` to the `.item-text` class. This forces the divs to respect the boundaries of their parent grid column, guaranteeing they are always the same size and never overflow.

3.  **Ensure Vertical-Only Sizing**: The `height: auto` and `min-height: 75px` properties on `.item-text` will continue to allow the boxes to grow vertically to fit their content, while the `width` properties lock their horizontal size. This perfectly matches the requirement.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Identify Root Cause: `.item-text` in Step 3 lacks width constraints};
    B --> C{Step 1: Solidify CSS Grid on `.cause-assumption-pair` container};
    C --> D{Step 2: Apply `width: 100%` & `box-sizing: border-box` to `.item-text`};
    D --> E{Step 3: Verify vertical-only auto-sizing is preserved};
    E --> F[End: Stable, predictable, and correct two-column layout];