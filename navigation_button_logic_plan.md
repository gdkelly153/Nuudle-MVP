# Navigation Button Logic and Tooltip Fix Plan

This plan outlines the necessary changes to fix issues with the "Begin" and "Next" button interactivity and tooltip visibility in the session wizard.

## Problem Statement

Following the fix for the AI buttons, the same issues have been identified for the main navigation buttons:

1.  **Tooltip Issue:** Tooltips on "Next" buttons for inactive steps appear when hovered. They should only appear on the active step when a condition (like an empty text field) prevents the user from proceeding.
2.  **Button Click Issue:** The "Begin" button on Step 0 and "Next" buttons on other steps can be clicked even when the user is not on the corresponding active step.

## Core Strategy

The solution is to apply the same "step-aware" logic to the main navigation buttons that was applied to the AI buttons. This involves refining the conditions for the `disabled` prop on the `<button>` and the `isDisabled` prop on the `<Tooltip>`.

## Implementation Details

All changes will be in `frontend/src/app/SessionWizard.tsx`.

### General Logic Pattern

For each "Begin" and "Next" button:

-   **Button `disabled` prop:** Will be set to `true` if the current step is not the button's step, OR if the original condition for disabling is met.
    -   `disabled={step !== <buttonStep> || <original_condition>}`
-   **Tooltip `isDisabled` prop:** Will be set to `true` only if the current step IS the button's step, AND the original condition for showing the tooltip is met.
    -   `isDisabled={step === <buttonStep> && <original_condition>}`

### Specific Changes by Step

-   **Step 0 (Begin Button):**
    -   `disabled` will be `step !== 0 || !painPoint.trim()`
    -   `isDisabled` for the tooltip will be `step === 0 && !painPoint.trim()`

-   **Step 1 (Next Button):**
    -   `disabled` will be `step !== 1 || (causes.length > 0 && causes[0].cause.trim() === "")`
    -   `isDisabled` for the tooltip will be `step === 1 && (causes.length > 0 && causes[0].cause.trim() === "")`

-   **Step 2 (Next Button - Input Phase):**
    -   `disabled` will be `step !== 2 || (perpetuations.length > 0 && perpetuations[0].text.trim() === "")`
    -   `isDisabled` for the tooltip will be `step === 2 && (perpetuations.length > 0 && perpetuations[0].text.trim() === "")`

-   **Step 2 (Next Button - Selection Phase):**
    -   `disabled` will be `step !== 2 || selectedPerpetuations.length === 0`
    -   `isDisabled` for the tooltip will be `step === 2 && selectedPerpetuations.length === 0`

-   **Step 3 (Next Button):**
    -   `disabled` will be `step !== 3 || (Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== ""))`
    -   `isDisabled` for the tooltip will be `step === 3 && (Object.keys(solutions).length === 0 || !Object.values(solutions).some((action) => action.trim() !== ""))`

-   **Step 4 (Next Button):**
    -   `disabled` will be `step !== 4 || (!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))`
    -   `isDisabled` for the tooltip will be `step === 4 && (!notWorried && !Object.values(fears).some((fear) => fear.name.trim() !== "" && fear.mitigation.trim() !== "" && fear.contingency.trim() !== ""))`

## Expected Outcome

-   "Begin" and "Next" buttons on inactive steps will be disabled and will not show a tooltip on hover.
-   Tooltips on the active step will only appear if the button is disabled due to a condition on that step, correctly guiding the user.