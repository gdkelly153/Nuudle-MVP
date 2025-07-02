# Plan to Standardize "None of the Above" Checkbox

## 1. Analyze Existing Code

- **File:** `frontend/src/app/SessionWizard.tsx`
- **File:** `frontend/src/app/globals.css`
- **Observation:** The "What's your role?" section uses a `div` for its "None of the above" option, while the "Name your fear" section uses a standard HTML checkbox and label. The global stylesheet provides a design system with variables for colors, fonts, and other properties.

## 2. Identify Inconsistency

The current implementation of the "None of the above" option in the "What's your role?" section is functionally and visually inconsistent with the rest of the application, leading to a poor user experience.

## 3. Proposed Change

Refactor the "What's your role?" section to use a standard checkbox and label, and add a new, globally-accessible CSS class to ensure all checkboxes in the application share a consistent, on-brand appearance.

## 4. Implementation Details

### CSS Updates

- In `frontend/src/app/globals.css`, add a new class named `.custom-checkbox` that styles the checkbox to align with the application's theme. This class will be designed for reusability across the application.

### Component Refactoring

- In `frontend/src/app/SessionWizard.tsx`, replace the `div` element for the "None of the above" option with a new block containing an `<input type="checkbox">` and a `<label>`.
- The new checkbox will be assigned the `.custom-checkbox` class to ensure it is styled correctly.
- The checkbox's state will be connected to the `handlePerpetuationSelection('none')` function to maintain existing functionality.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Analyze SessionWizard.tsx & globals.css};
    B --> C{Identify UI inconsistencies};
    C --> D{Plan: Standardize all checkboxes};
    D --> E{Add '.custom-checkbox' class to globals.css};
    D --> F{Refactor "What's your role?" section};
    F --> G{Replace 'div' with styled checkbox and label};
    G --> H{Connect checkbox to state logic};
    E & H --> I[End];