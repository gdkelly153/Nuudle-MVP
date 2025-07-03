# Plan: Adjust Neural Animation Positioning

This document outlines the plan to adjust the horizontal positioning of the neural animations to -60% without affecting the brain icon or any other elements.

## Analysis

Based on the analysis of `frontend/src/app/globals.css` and `frontend/src/components/BrainIconWithAnimation.tsx`, the "neural animations" are controlled by the `.neural-network-brain` class and the associated `radiate-*` keyframes. The horizontal positioning of the entire animation container is set on the `.neural-network-brain` class itself.

## Proposed Change

1.  **Target File:** `frontend/src/app/globals.css`
2.  **Target CSS Rule:** The `.neural-network-brain` selector at line 685.
3.  **Change:** Modify the `transform` property to change the horizontal positioning.
    *   **Current:** `transform: translate(-55%, -60%);`
    *   **Proposed:** `transform: translate(-60%, -60%);`

This change will shift the neural animation slightly to the left, as requested, without altering the position of the parent brain icon or any other component.

## Diagram

```mermaid
graph TD
    A[Start] --> B{Analyze `globals.css`};
    B --> C{Identify `.neural-network-brain` style};
    C --> D{Locate `transform: translate(-55%, -60%)`};
    D --> E{Plan: Change to `transform: translate(-60%, -60%)`};
    E --> F[Present Plan for Approval];
    F --> G{User Approves?};
    G -- Yes --> H[Switch to Code Mode & Apply Change];
    G -- No --> I[Re-evaluate Plan];
    H --> J[End];
    I --> B;