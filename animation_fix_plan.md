# Plan to Fix Brain Icon Animation Positioning

## 1. The Problem

The animation behind the brain icon is not correctly centered, and its paths are biased.

*   The animation's center point appears to be misaligned with the icon's center.
*   The animation particles are not distributed evenly, favoring the bottom-right quadrant.

## 2. The Cause

Analysis of `frontend/src/components/BrainIconWithAnimation.tsx` and `frontend/src/app/globals.css` points to two root causes:

*   **Centering Issue:** The `.brain-icon` is not explicitly centered within its container (`.brain-icon-wrapper`), while the animation element (`.neural-network-brain`) is. This creates a positional mismatch, making the animation appear off-center relative to the icon.
*   **Animation Path Bias:** The `@keyframes` rules that define the particle movements contain `translate` values that are not symmetrically distributed, causing the visual bias to the bottom-right.

## 3. The Plan

The following changes will be made to `frontend/src/app/globals.css` to resolve these issues.

### Step 1: Center the Brain Icon

Modify the `.brain-icon` style to center it within its wrapper. This will align it perfectly with the animation, which is already centered in the same wrapper. This change involves setting its `position` to `absolute` and adding transform properties for centering.

```diff
--- a/frontend/src/app/globals.css
+++ b/frontend/src/app/globals.css
@@ -868,7 +868,11 @@
 }
 
 .brain-icon {
-  position: relative;
+  position: absolute;
+  top: 50%;
+  left: 50%;
+  transform: translate(-50%, -50%);
   z-index: 10;
 }
```

### Step 2: Rebalance the Animation Keyframes

Rewrite the five `radiate-*` keyframes to ensure the animation covers all four corners of the icon equally. The new paths will be symmetrical, sending particles to the top-left, top-right, bottom-left, and bottom-right quadrants in a balanced way.

The planned implementation for the new keyframes:

```css
@keyframes radiate-1 {
  0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
  25% { opacity: 1; transform: scale(1) translate(-15px, -15px); }
  50% { opacity: 1; transform: scale(1) translate(15px, 15px); }
  75% { opacity: 0.5; transform: scale(0.8) translate(0, 0); }
  100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
}

@keyframes radiate-2 {
  0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
  25% { opacity: 1; transform: scale(1) translate(15px, -15px); }
  50% { opacity: 1; transform: scale(1) translate(-15px, 15px); }
  75% { opacity: 0.5; transform: scale(0.8) translate(0, 0); }
  100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
}

@keyframes radiate-3 {
  0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
  25% { opacity: 1; transform: scale(1) translate(-12px, 0); }
  50% { opacity: 1; transform: scale(1) translate(12px, 0); }
  75% { opacity: 0.5; transform: scale(0.8) translate(0, 0); }
  100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
}

@keyframes radiate-4 {
  0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
  25% { opacity: 1; transform: scale(1) translate(0, -12px); }
  50% { opacity: 1; transform: scale(1) translate(0, 12px); }
  75% { opacity: 0.5; transform: scale(0.8) translate(0, 0); }
  100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
}

@keyframes radiate-5 {
  0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
  25% { opacity: 1; transform: scale(1) translate(8px, 8px); }
  50% { opacity: 1; transform: scale(1) translate(-8px, -8px); }
  75% { opacity: 0.5; transform: scale(0.8) translate(0, 0); }
  100% { opacity: 0; transform: scale(0.5) translate(0, 0); }
}
```

## 4. Diagram

This diagram illustrates how the component alignment will be corrected.

```mermaid
graph TD
    subgraph Before
        A[brain-icon-wrapper]
        A -- contains --> B(brain-icon at top-left)
        A -- contains --> C(neural-network-brain at center)
    end
    subgraph After
        D[brain-icon-wrapper]
        D -- contains --> E(brain-icon at center)
        D -- contains --> F(neural-network-brain at center)
    end

    B -. misaligned with .-> C;
    E -- perfectly aligned with --> F;