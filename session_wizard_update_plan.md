# Session Wizard Update Plan

This document outlines the plan to update the Session Wizard component based on user feedback.

### 1. Update Placeholder Text

*   **File:** `frontend/src/app/SessionWizard.tsx`
*   **Line:** 368
*   **Change:** Modify the `placeholder` attribute of the initial `textarea` from "What problem would you like to work through?" to "What problem would you like to work through today?".

### 2. Standardize Spacing

*   **Goal:** Ensure consistent spacing between step headers and italicized descriptions across all steps.
*   **Method:** Apply the `step-description` class to the labels in each relevant step, replacing the `input-label` class. This will standardize the `margin-bottom` to `1rem`.
*   **File:** `frontend/src/app/SessionWizard.tsx`
*   **Locations:**
    *   **Step 1:** The `<label>` at line 408.
    *   **Step 3:** The `<label>` at line 615.
    *   **Step 5:** The `<label>` at line 862.

### 3. Adjust Step 1 Italicized Text

*   **File:** `frontend/src/app/SessionWizard.tsx`
*   **Line:** 411
*   **Change:**
    *   Remove the `<br /><br />` tags to eliminate the large paragraph gap.
    *   Wrap the second sentence in a `<span>` element and apply an inline style for a left margin (e.g., `style={{ marginLeft: '1em' }}`) to create an indent.

### Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Update Placeholder Text};
    B --> C{Standardize Spacing};
    C --> D{Adjust Step 1 Text};
    D --> E[Finish];

    subgraph "File: frontend/src/app/SessionWizard.tsx"
        B --> B1("Line 368: Change placeholder text");
        C --> C1("Line 408: Change label class to 'step-description'");
        C --> C2("Line 615: Change label class to 'step-description'");
        C --> C3("Line 862: Change label class to 'step-description'");
        D --> D1("Line 411: Remove <br> tags and add indented <span>");
    end