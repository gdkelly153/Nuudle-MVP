# Plan to Fix AI Button Formatting

This document outlines the plan to fix the AI button alignment and font size issues in the Nuudle application.

## 1. AI Button Alignment

**Problem:** The AI buttons are currently centered between the "Contributing Cause" and "Potential Assumption" input boxes.

**Solution:** Each AI button should be left-aligned with its respective content box.

*   **"Help me discover overlooked causes"** should be left-aligned with the "Contributing Cause" box.
*   **"Help me identify assumptions"** should be left-aligned with the "Potential Assumption" box.

To achieve this, the JSX structure in `frontend/src/app/SessionWizard.tsx` will be modified. Each `AIAssistButton` will be moved into the same two-column layout as the input fields.

## 2. AI Button Font Size

**Problem:** The AI button text is too large.

**Solution:** The AI button font size should match the italicized instruction text throughout the app (e.g., *"We live in a casual universe..."*).

The styling for the `AIAssistButton` in `frontend/src/components/AIComponents.tsx` will be updated to use a smaller font size, making the buttons more subtle and visually consistent.

## 3. Visual Result

The expected outcome is:

*   Each AI button positioned directly under its content area.
*   Left-aligned with its respective input box.
*   Smaller, more subtle text that matches the instructional text sizing.
*   A clear visual hierarchy showing they are optional helpers.

## Mermaid Diagram of Structural Change

```mermaid
graph TD
    subgraph Before
        A[form-content] --> B(causes-container);
        A --> C{flex space-x-2 mt-4};
        C --> D[AIAssistButton - Cause];
        C --> E[AIAssistButton - Assumption];
    end

    subgraph After
        F[form-content] --> G(causes-container);
        F --> H(cause-assumption-pair);
        H --> I(cause-column);
        I --> J[AIAssistButton - Cause];
        H --> K(assumption-column);
        K --> L[AIAssistButton - Assumption];
    end

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px