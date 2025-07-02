### **Final Plan**

#### **1. Update UI Text**

*   **File to Modify:** `frontend/src/app/SessionWizard.tsx`
*   **Action:** I will locate the `<h2>` element on the initial screen and change its content from "Think Smarter." to "Mind Matters.".

#### **2. Enhance AI Prompts**

*   **File to Modify:** `api/services/aiService.js`
*   **Actions:**
    *   **For the `identify_assumptions` prompt:** I will add an introductory paragraph explaining what assumptions are, how they are shaped by bias, and why it's important to validate them.
    *   **For the `perpetuation` prompt:** I will add an introductory paragraph about the value of self-reflection in uncovering behaviors that may contribute to a problem.

#### **3. Re-style "What's your role?" Step**

*   **File to Modify:** `frontend/src/app/SessionWizard.tsx`
*   **Actions:**
    *   I will modify the mapping of the `perpetuations` array in the "selection" phase of Step 2.
    *   Each user-entered item will be wrapped in a container styled to look like the read-only text boxes from the previous steps.
    *   The actual `<input type="checkbox">` will be visually hidden but remain functional for state management.
    *   The container itself will be made clickable to toggle the selection state.
    *   A green checkmark icon will be conditionally displayed to the left of the text box when it is selected.
    *   The final option, "None of these are actively contributing to the problem," will remain as a standard, visible checkbox and label.