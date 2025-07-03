# Plan: Rework Brain Icon and Animation

This document outlines the plan to rework the brain icon and its animation from scratch, based on new user feedback. The goal is to use the `neural-network-brain` animation with specific positioning requirements.

## 1. Deletion of Existing Code

The first step is to completely remove the current brain icon implementation from both the `HelpMeNuudleButton` and `AIAssistButton` components in `frontend/src/components/AIComponents.tsx`. This provides a clean slate for the new implementation.

## 2. New Implementation Strategy

A new structure will be added to both AI button components to handle the icon and its animation.

### Key Requirements:
- **Positioning:** The center of the brain icon must be positioned at the exact top-left corner of the button. This will be achieved using `position: absolute`, `top: 0`, `left: 0`, and `transform: translate(-50%, -50%)`.
- **Animation:** The `neural-network-brain` animation (using `light-particle` elements) will be implemented. This animation will only be visible when the button's `isLoading` state is `true`.
- **Layering:** The brain icon must appear on top of the animation. This will be handled using `z-index`.

### Component Structure:
The JSX will be structured as follows:
1.  A main container `div` for the icon and animation, positioned as described above.
2.  Inside this container:
    *   The `Brain` icon component with a `z-index` to keep it on top.
    *   A conditional `div` with the class `neural-network-brain` that renders only when `isLoading` is true. This div will contain the five `light-particle` children required for the animation.

## 3. Visual Logic Diagram

```mermaid
graph TD
    subgraph AI Button Component
        A[Button Wrapper: `position: relative`] --> B(Icon/Animation Container);
        B -- CSS --> C{position: absolute; top: 0; left: 0; transform: translate(-50%, -50%)};
        B --> D(Brain Icon);
        D -- CSS --> E[z-index: 20];
        B --> F{isLoading?};
        F -- Yes --> G[Animation Div: `.neural-network-brain`];
        G -- Contains --> H[5x `.light-particle` divs];
        H -- Animates via --> I[@keyframes `radiate-*`];
        F -- No --> J[Animation is hidden];
    end
```

This plan ensures all new requirements are met precisely.