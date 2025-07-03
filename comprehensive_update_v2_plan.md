# Comprehensive Update Plan V2

This document outlines the plan to implement a series of UI and functionality improvements to the Nuudle application.

---

## Part 1: AI Button UI Enhancements

**Goal:** Standardize the behavior of all AI buttons to match the landing page's "Help me Nuudle" button. This includes maintaining the brain icon's position during the loading state, removing the redundant icon, and ensuring consistent font and button sizing.

**File to Modify:** `frontend/src/components/AIComponents.tsx`

**Plan:**

1.  **Persistent Brain Icon:** Modify the `AIAssistButton` component to render the corner brain icon regardless of the `isLoading` state. This will ensure the icon remains visible when the button text changes to "Nuudling...".
2.  **Remove Redundant Icon:** Remove the inline `Brain` icon that currently appears next to the "Nuudling..." text.
3.  **Consistent Font Size:** Adjust the CSS for the "Nuudling..." text to match the default font size of the button's text.
4.  **Stable Button Size:** Ensure the button's dimensions do not change when transitioning to the loading state. This may involve setting a fixed width and height.

```mermaid
graph TD
    A[AI Button Clicked] --> B{isLoading?};
    B -- Yes --> C[Show "Nuudling..." text];
    C --> D[Keep corner brain icon visible];
    D --> E[Ensure button size is static];
    B -- No --> F[Show default button text];
    F --> D;
```

---

## Part 2: Revert and Fix "What's your role?" Step

**Goal:** Correct the layout of the "What's your role?" step by reverting unintended changes and applying the desired modification only to the "None of these..." option.

**File to Modify:** `frontend/src/app/SessionWizard.tsx`

**Plan:**

1.  **Restore Read-Only Containers:** Re-wrap each read-only perpetuation text box in its original `div` container with the `perpetuation-checkbox-container` class.
2.  **Remove Incorrect Elements:** Delete the erroneously added text boxes and checkboxes associated with the read-only items.
3.  **Isolate "None of these..." Checkbox:** For the "None of these are actively contributing to the problem" option, remove the surrounding `div` container to make it a standalone checkbox and label.

---

## Part 3: AI Prompt Response Enhancement

**Goal:** Ensure the AI's response comprehensively analyzes every piece of user input for a given step.

**File to Modify:** `api/services/aiService.js`

**Plan:**

1.  **Review Prompt Templates:** Examine the prompt templates for `root_cause`, `identify_assumptions`, `potential_actions`, and `perpetuation`.
2.  **Modify Prompt Logic:** Change the prompt instructions from a fixed structure (e.g., `[Analysis for item 1]`, `[Analysis for item 2]`) to a dynamic one that explicitly instructs the AI to iterate through and address *all* user-provided items.
3.  **Investigate Input Summarization:** The `summarizeUserInput` function may be truncating input. I will investigate its impact and confirm with you before making changes to it.

---

## Part 4: Add Introductory Sentence for Role Reflection

**Goal:** Add a sentence to the "Help me reflect on my potential role" section to explain the value of the exercise.

**File to Modify:** `frontend/src/app/SessionWizard.tsx`

**Plan:**

1.  **Locate Section:** Find the `h1` element for the "If you were to perpetuate the problem, what actions could you take?" step.
2.  **Insert Explanatory Text:** Add a sentence to the description paragraph (`<p className="step-description">`) that clarifies the purpose of this reflection, drawing from the existing description in `AIComponents.tsx`. The text will be similar to: "Reflecting on these potential actions helps to uncover the behaviors and patterns that keep the problem in place, which is a crucial step towards solving it."

---

## Part 5: Language Change: "Nuudle AI Suggestion" to "Nuddle AI"

**Goal:** Update the branding of the AI responses.

**File to Modify:** `frontend/src/components/AIComponents.tsx`

**Plan:**

1.  **Find and Replace:** In the `AIResponseCard` component, locate the `span` containing "Nuudle AI Suggestion" and change the text to "Nuddle AI".

---

## Part 6: Add "Possible Action" Label

**Goal:** Add a descriptive label for the action text boxes in the "What can you do about it?" section.

**File to Modify:** `frontend/src/app/SessionWizard.tsx`

**Plan:**

1.  **Locate Action Text Area:** Find the `action-textarea-container` div in step 3.
2.  **Insert Label:** Add a `<label>` element with the text "Possible Action" above the `textarea`.
3.  **Style Label:** Apply CSS to the new label to center it and ensure proper spacing, consistent with other labels in the step.

```mermaid
sequenceDiagram
    participant User
    participant SessionWizard
    User->>SessionWizard: Clicks on a Contributing Cause
    SessionWizard->>SessionWizard: Renders action textarea
    SessionWizard->>SessionWizard: Adds "Possible Action" label above textarea
    SessionWizard-->>User: Displays labeled textarea