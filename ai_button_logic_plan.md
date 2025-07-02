# AI Button Logic and Tooltip Fix Plan

This plan outlines the necessary changes to fix issues with AI button interactivity and tooltip visibility in the session wizard.

## Problem Statement

1.  **Tooltip Issue:** Tooltips on `AIAssistButton`s from previous, inactive steps appear when hovered, which is not desired. They should only appear on the active step when a condition (like an empty text field) makes the button temporarily unusable.
2.  **Button Click Issue:** The "Help Me Nuudle" button and other AI buttons can be clicked even when the user is not on the corresponding step of the wizard.

## Core Strategy

The solution is to make the AI button components "step-aware" by passing them the current step of the wizard and the step they belong to. This allows the components to internally manage their enabled/disabled state and tooltip visibility with more precision.

## Implementation Details

### 1. `frontend/src/components/AIComponents.tsx`

-   **Modify `HelpMeNuudleButtonProps` and `AIAssistButton` props:**
    -   Add `currentStep: number;`
    -   Add `buttonStep: number;`

-   **Update `HelpMeNuudleButton` and `AIAssistButton` Components:**
    -   Implement new internal logic to determine the button's state and tooltip visibility.

    ```tsx
    // Example logic for both components
    const isCorrectStep = currentStep === buttonStep;
    const isButtonDisabled = !isCorrectStep || disabled || isLoading;
    const tooltipShouldBeEnabled = isCorrectStep && disabled && !isLoading;

    // In the return statement:
    // <Tooltip text="..." isDisabled={tooltipShouldBeEnabled}>
    //   <button disabled={isButtonDisabled} ...>
    ```

### 2. `frontend/src/app/SessionWizard.tsx`

-   **Update All `HelpMeNuudleButton` and `AIAssistButton` Instances:**
    -   For each button, pass the new props: `currentStep={step}` and `buttonStep={/* The step number for that button */}`.
    -   Remove the `step !== <stepNumber>` checks from the `disabled` prop for each of these buttons. The logic is now encapsulated within the component.

#### Example Change in `SessionWizard.tsx` for Step 1:

**Before:**
```tsx
<AIAssistButton
  stage="root_cause"
  // ...
  disabled={step !== 1 || causes.filter(c => c.cause.trim()).length < 1 || !ai.canUseAI}
  // ...
/>
```

**After:**
```tsx
<AIAssistButton
  stage="root_cause"
  // ...
  disabled={causes.filter(c => c.cause.trim()).length < 1 || !ai.canUseAI}
  currentStep={step}
  buttonStep={1}
  // ...
/>
```

This pattern will be applied to all AI buttons in the wizard.

## Expected Outcome

-   Buttons on inactive steps will be disabled and will not show a tooltip on hover.
-   Buttons on the active step will be enabled or disabled based on the relevant conditions (e.g., text input).
-   Tooltips on the active step will only appear if the button is disabled due to a condition on that step, correctly guiding the user.