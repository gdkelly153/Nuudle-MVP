# Plan: Neural Network Animation for Brain Icon

This document outlines the plan to replace the current glimmer animation with a more engaging neural network activation animation for the AI component's brain icon.

## Phase 1: CSS Animation

1.  **Remove Existing Animation**: Remove the `glimmer-effect` class from the `Brain` icon in `frontend/src/components/AIComponents.tsx` and delete the corresponding CSS from `frontend/src/app/globals.css`.
2.  **Create New CSS Animation**: Create a new set of CSS classes and keyframe animations in `frontend/src/app/globals.css` to achieve the "neural activation" effect. This will involve using a combination of `box-shadow` and pseudo-elements (`::before`, `::after`) to create the appearance of small dots of light tracing paths across the brain icon.
3.  **Apply New Animation**: Apply the new CSS classes to the `Brain` icon in `frontend/src/components/AIComponents.tsx`.

## Phase 2: Icon Positioning

1.  **Adjust Icon Position**: Modify the inline styles on the `div` wrapping the `Brain` icon in `frontend/src/components/AIComponents.tsx` to shift it up and to the left, so the center of the brain overlaps the top-left corner of the button.

## Workflow Diagram

```mermaid
graph TD
    A[Start] --> B{Remove glimmer-effect};
    B --> C{Create neural-activation CSS};
    C --> D{Apply new CSS classes};
    D --> E{Adjust icon position};
    E --> F[Finish];