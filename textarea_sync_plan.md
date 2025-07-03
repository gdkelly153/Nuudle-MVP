# Plan to Synchronize Text Area Heights

The goal is to ensure that when either the "Contributing Cause" or "Potential Assumption" text area expands vertically, the adjacent text area expands to the same height simultaneously.

### 1. Update `useLayoutEffect` Hook

The `useLayoutEffect` hook in `frontend/src/app/SessionWizard.tsx` will be modified to handle the initial rendering and subsequent state updates for the paired text areas.

- The hook will iterate through the `causeTextAreaRefs`.
- For each pair of "Contributing Cause" and "Potential Assumption" text areas, it will calculate the maximum `scrollHeight` between the two.
- Both text areas in the pair will then be set to this maximum height.
- The existing logic for other auto-resizing text areas will be preserved.

### 2. Enhance `syncTextareaHeights` Function

The `syncTextareaHeights` function in `frontend/src/app/SessionWizard.tsx` will be updated to provide real-time synchronization as the user types.

- The function will be modified to accept the index of the cause and the specific field ("cause" or "assumption") being edited.
- When a user types in either text area, the function will identify its corresponding pair using the `causeTextAreaRefs`.
- It will then calculate the maximum required height and apply it to both text areas in the pair instantly.

### Mermaid Diagram

```mermaid
graph TD
    subgraph Real-time Sync (onInput)
        A[User types in a textarea] --> B{Is it a paired textarea?};
        B -- Yes --> C[Find the corresponding textarea in the pair];
        C --> D[Calculate the maximum height needed for both];
        D --> E[Apply the new height to both textareas];
        B -- No --> F[Resize only the single textarea];
    end

    subgraph Initial Render & State Change (useLayoutEffect)
        G[Component Renders or Updates] --> H[The useLayoutEffect hook is triggered];
        H --> I[Find all paired textareas];
        I --> J[For each pair, calculate and apply the max height];
        H --> K[Find all other resizable textareas];
        K --> L[Resize each one individually];
    end