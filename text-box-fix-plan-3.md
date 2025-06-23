# Text Box Sizing Fix Plan (Version 3)

## Problem

The previous flexbox-based approach to fix the text box sizing issue was unsuccessful. It created two new critical issues:

1.  **Width Shrinking (Ongoing)**: The "Contributing Cause" text box is still much narrower than it should be.
2.  **NEW ISSUE - Text Overflow**: The "Potential Assumption" text box is extending beyond the screen boundaries.

## Root Cause

The flexbox approach is fundamentally flawed for this use case. A different strategy is required to ensure consistent and responsive column widths.

## New Plan

This plan abandons the flexbox approach in favor of explicit, responsive widths.

1.  **Remove Flawed Flexbox Styles**: Remove the `flex-grow: 1` and `flex-shrink: 0` properties from the `.cause-column` and `.assumption-column` classes in `frontend/src/app/globals.css`.

2.  **Implement Explicit Column Widths**: Set an explicit width for the `.cause-column` and `.assumption-column` classes using `width: calc(50% - 5px)`. This will create two equal-width columns with a `10px` gap between them.

3.  **Prevent Text Box Overflow**: Add `max-width: 100%` to the `.auto-resizing-textarea` class to ensure that the text boxes never exceed the width of their parent columns.

4.  **Enable Word Wrapping**: Add `overflow-wrap: break-word` to the `.auto-resizing-textarea` class to prevent long words from causing the text boxes to overflow.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Abandon Flawed Flexbox Approach};
    B --> C{Implement Explicit Column Widths};
    C --> D{Prevent Text Box Overflow};
    D --> E{Enable Word Wrapping};
    E --> F[End];