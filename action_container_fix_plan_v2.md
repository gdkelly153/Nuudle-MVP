# Revised Plan to Fix Action Container Persistence and Text Loss

The goal is to decouple the visibility of the action box from the data it contains, so closing it only hides it, and the text is preserved unless manually cleared.

### 1. Introduce New State for Visibility
A new state variable, `openActionBoxIds`, will be added to specifically track which "Possible Action" text boxes are currently visible. This will be separate from the `solutions` state that holds the text.

### 2. Refactor `handleSolutionSelection()`
This function will now manage both highlighting and visibility.
- When a user clicks a "Contributing Cause" or "Potential Assumption" container, its ID will be added to the `openActionBoxIds` array, making the corresponding "Possible Action" box appear.
- The `highlightedContainerId` will be set to the ID of the most recently clicked container.

### 3. Refactor `removeSolutionAction()`
This function will be modified to only hide the action box, not delete its content.
- When the user clicks the 'x' button on a "Possible Action" box, it will remove the item's ID from the `openActionBoxIds` array, hiding the box.
- Crucially, it will **not** remove the item from the `solutions` state object. This ensures that if the user re-opens the action box, their previous text will still be there.
- The highlight will be removed if the closed box was the one that was highlighted.

### 4. Update Rendering Logic
The part of the code that displays the "Possible Action" box will be changed to use the new `openActionBoxIds` state to control whether the box is shown or hidden.

### Diagram of the New Flow

```mermaid
graph TD
    subgraph "Initial State"
        A[solutions: {}, openActionBoxIds: [], highlighted: null]
    end

    subgraph "1. User clicks Cause 1"
        B(Click Cause 1) --> C{handleSolutionSelection('cause1')};
        C --> D{State Change: openActionBoxIds: ['cause1'], highlighted: 'cause1'};
        D --> E[Action Box 1 appears & is highlighted];
    end

    subgraph "2. User types in Action Box 1"
        F(Type "My Action") --> G{handleSolutionActionChange('cause1', 'My Action')};
        G --> H{State Change: solutions: {cause1: "My Action"}};
    end

    subgraph "3. User clicks Cause 2"
        I(Click Cause 2) --> J{handleSolutionSelection('cause2')};
        J --> K{State Change: openActionBoxIds: ['cause1', 'cause2'], highlighted: 'cause2'};
        K --> L[Action Box 1 & 2 are visible. Box 2 is now highlighted.];
    end

    subgraph "4. User closes Action Box 1"
        M(Click 'x' on Box 1) --> N{removeSolutionAction('cause1')};
        N --> O{State Change: openActionBoxIds: ['cause2']};
        O --> P[Action Box 1 disappears. Text "My Action" is preserved in the solutions state.];
    end

    subgraph "5. User re-clicks Cause 1"
        Q(Click Cause 1) --> R{handleSolutionSelection('cause1')};
        R --> S{State Change: openActionBoxIds: ['cause2', 'cause1'], highlighted: 'cause1'};
        S --> T[Action Box 1 reappears with "My Action" text and is highlighted.];
    end