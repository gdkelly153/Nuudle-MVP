### Plan to Update Text Box Height

1.  **Analysis:** The goal is to change the default height of the text boxes in the Nuudle interface from `72px` (two lines) to `36px` (one line). The height is being set dynamically by the `syncTextareaHeights` function within the `SessionWizard.tsx` file. This function reads the `min-height` property from the CSS, which is currently `72px`.

2.  **Proposed Change:** I will modify the `syncTextareaHeights` function to ignore the CSS `min-height` value and use a hardcoded value of `36` instead. This will ensure that all text boxes default to a single-line height, while still allowing them to expand as the user types. This change is purely in the JavaScript logic, as you requested.

3.  **Implementation Steps:**
    *   In `frontend/src/app/SessionWizard.tsx`, I will locate the `syncTextareaHeights` function.
    *   I will replace the three instances where `minHeight` is parsed from the computed style with the number `36`.

### Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Analyze Request: Change textarea height from 72px to 36px};
    B --> C{Locate `syncTextareaHeights` in `SessionWizard.tsx`};
    C --> D{Identify `minHeight` calculation from CSS};
    D --> E{Plan: Replace CSS `minHeight` with hardcoded `36`};
    E --> F[Propose plan to user];
    F --> G{User Approval};
    G --> H[Switch to 'code' mode];
    H --> I[Implement the change];
    I --> J[End];