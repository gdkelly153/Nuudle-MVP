# Plan to Revert and Fix Brain Icon Animation

This document outlines the plan to fix the brain icon and animation issue by reverting to the strategy described in `comprehensive_update_plan.md`.

## 1. Analysis

The current implementation in `frontend/src/components/AIComponents.tsx` uses a complex and broken animation with `light-particle` elements. The intended solution, as described in `comprehensive_update_plan.md` and defined in `frontend/src/app/globals.css`, uses a simpler and more effective `brain-pulse` CSS animation.

## 2. Implementation Plan

The fix will be implemented by modifying the `HelpMeNuudleButton` and `AIAssistButton` components in `frontend/src/components/AIComponents.tsx`.

### `HelpMeNuudleButton` Component
- **Remove Old Animation:** Delete the `div` container with the `neural-network-brain` class and its five `light-particle` children.
- **Implement New Animation:**
    - Wrap the `Brain` icon in a new `div` positioned absolutely in the top-left corner of the button.
    - Conditionally apply the `brain-pulsing` class to the `Brain` icon itself only when `isLoading` is `true`.
    - The icon size will be `w-4 h-4`.

### `AIAssistButton` Component
- **Remove Old Animation:** Perform the same removal of the `neural-network-brain` `div` and its children.
- **Implement New Animation:**
    - Add a new `div` to wrap the `Brain` icon, positioned absolutely in the top-left.
    - Conditionally apply the `brain-pulsing` class to the `Brain` icon when `isLoading` is `true`.
    - Preserve the existing size classes (`w-3 h-3`) to keep the icon 25% smaller than the main button's icon.

## 3. Logic Diagram

```mermaid
graph TD
    subgraph AI Button Components
        A[isLoading state] -- true --> B(Apply `.brain-pulsing` class);
        A -- false --> C(Static Brain Icon);
        B --> D{Brain Icon};
        C --> D;
    end

    subgraph CSS Animation
        E[`.brain-pulsing` class] --> F(animation: brain-pulse);
        F --> G(`@keyframes brain-pulse`);
        G --> H(Uses `drop-shadow` for glowing effect);
    end

    B --> E;
```

This plan will result in the brain icon being correctly overlaid on the top-left of the buttons, with a centered pulsing glow animation behind it only during the loading state.