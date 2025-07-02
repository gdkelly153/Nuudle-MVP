# Plan: Add Brain Animation

This plan details the steps to add a "neural network lighting up" animation to every brain icon in the application, using the existing `.neural-network-brain` animation.

### 1. Refactor Icon Components in `frontend/src/components/AIComponents.tsx`

The `HelpMeNuudleButton` and `AIAssistButton` components will be updated to include a container for the brain icon and its animation. This ensures the animation is properly positioned behind the icon.

**`HelpMeNuudleButton` Component:**

```tsx
// Before
<div className="help-me-nuudle-button-container inline-block">
  <Brain className="brain-icon text-blue-600" size={20} />
  <button ... />
</div>

// After
<div className="help-me-nuudle-button-container inline-block">
  <div className="brain-icon-container">
    <Brain className="brain-icon text-blue-600" size={20} />
    <div className="neural-network-brain">
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
    </div>
  </div>
  <button ... />
</div>
```

**`AIAssistButton` Component:**

```tsx
// Before
<div className="ai-button-wrapper relative inline-block">
  <Brain className="brain-icon text-blue-600" size={16} />
  <button ... />
</div>

// After
<div className="ai-button-wrapper relative inline-block">
  <div className="brain-icon-container">
    <Brain className="brain-icon text-blue-600" size={16} />
    <div className="neural-network-brain">
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
      <div className="light-particle"></div>
    </div>
  </div>
  <button ... />
</div>
```

### 2. Update Styles in `frontend/src/app/globals.css`

New CSS rules will be added and existing ones will be modified to position the animation correctly.

-   **`.brain-icon-container`**: A new class for a relative container to hold both the icon and the animation.
-   **`.brain-icon`**: Its positioning will be adjusted to be centered within the new container.
-   **`.neural-network-brain`**: This will be modified to ensure it is centered behind the icon and scales correctly with the icon size.
-   **`z-index`**: The `z-index` of the icon and animation will be adjusted to ensure the animation is rendered behind the icon.

### Mermaid Diagram

This diagram illustrates the final component structure and styling dependencies:

```mermaid
graph TD
    subgraph frontend/src/components/AIComponents.tsx
        A[HelpMeNuudleButton] --> B(brain-icon-container);
        C[AIAssistButton] --> B;
        B --> D[Brain];
        B --> E[neural-network-brain];
    end

    subgraph frontend/src/app/globals.css
        F[.brain-icon-container] --> G[.brain-icon];
        F --> H[.neural-network-brain];
    end

    style B fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
    style E fill:#cfc,stroke:#333,stroke-width:2px