### Plan: UI and Logic Updates

1.  **Objective:** Implement styling, text, and logic changes based on user feedback across multiple steps of the wizard.
2.  **Files to Modify:**
    *   `frontend/src/app/page.tsx`
    *   `frontend/src/app/globals.css`

---

### Step 0: Initial Screen

*   **Spacing:** Add more space between "Nuudle" and "Question. Understand. Know.".
    *   **Action:** In `frontend/src/app/globals.css`, I will add `margin-top: 1rem;` to the `.subheader` style definition.
*   **Placeholder Text:** Center the placeholder text "What problem are you trying to solve?".
    *   **Action:** In `frontend/src/app/globals.css`, I will add a new style to center the placeholder text for the `auto-resizing-textarea` class.
*   **Button Text:** Change "Start Session" to "Onward!".
    *   **Action:** In `frontend/src/app/page.tsx`, I will update the text inside the button.

### Step 1: Causal Factors

*   **Validation Logic:** Only require the *first* causal factor text box to be filled before the "Next" button is enabled. The assumption field will not be required.
    *   **Action:** In `frontend/src/app/page.tsx`, I will modify the `disabled` logic for the "Next" button in this step.

### Step 5: Action Plan

*   **Header Text:** Change "Stop Nuudling, Start Dooing." to "Stop Nuudling. Start Doodling.".
    *   **Action:** In `frontend/src/app/page.tsx`, I will update the `h1` text.
*   **Label Text:** Change "What's your next step?" to "The most important step is always the next one. What's yours?".
    *   **Action:** In `frontend/src/app/page.tsx`, I will update the `label` text.

---

### Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Review Feedback};
    B --> C{Plan Styling Changes};
    C --> C1[Add margin to subheader];
    C --> C2[Center placeholder text];
    B --> D{Plan Text Changes};
    D --> D1["Start Session" -> "Onward!"];
    D --> D2["Stop Nuudling, Start Dooing." -> "Stop Nuudling. Start Doodling."];
    D --> D3["What's your next step?" -> "The most important step..."];
    B --> E{Plan Logic Changes};
    E --> E1[Update Step 1 'Next' button validation];
    C1 & C2 --> F{Update \`globals.css\`};
    D1 & D2 & D3 & E1 --> G{Update \`page.tsx\`};
    F & G --> H{Switch to Code Mode};
    H --> I[Implement All Changes];
    I --> J[End];