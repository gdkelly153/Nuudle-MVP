# Plan to Prevent Actions on Inactive Steps

The goal is to apply a consistent pattern across the `SessionWizard` component to ensure that user interactions are only processed on the currently active step.

### 1. Step 2: "What's your role?"
- Modify the `handlePerpetuationSelection` function to check if the current step is active before making any changes.
- The "None of these are actively contributing to the problem" checkbox will be disabled unless Step 2 is active.

### 2. Step 3: "What can you do about it?"
- Update the `handleSolutionSelection` function to ensure it only responds to clicks when Step 3 is the active step.

### 3. Step 4: "What worries you?"
- Adjust the `handleFearSelection` function to only allow selecting items when the user is on Step 4.
- The "I'm not worried about taking any of these actions" checkbox will also be disabled when Step 4 is inactive.

### 4. Step 5: "Action Plan"
- Update the `handleActionSelection` function to only register selections when the user is on the final action plan step.

This approach will create a more robust and predictable user experience by ensuring that only the active step in the wizard can be modified.

### Diagram

```mermaid
graph TD
    subgraph User Interaction
        A[User clicks element in a step]
    end
    subgraph System Logic
        B{Is the step active?}
    end
    subgraph Result
        C[Action is processed]
        D[Action is ignored]
    end

    A --> B
    B -- Yes --> C
    B -- No --> D