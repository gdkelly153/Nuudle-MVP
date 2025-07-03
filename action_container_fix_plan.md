# Plan: Update Contributing Cause Highlighting

The goal is to change the blue border that appears on the "Contributing Cause" container to a golden mustard color, and have it behave like the other text boxes in the app when they are clicked.

## Action Items

1.  **Modify the CSS in `frontend/src/app/SessionWizard.tsx`**:
    *   Edit the inline `<style>` block.
    *   Target the `.container-highlighted` class.
    *   Change the `border` property from the current blue color to use the `--golden-mustard` variable.
    *   Add a `box-shadow` property using the `--golden-mustard-focus` variable to create the "glow" effect, which will make it match the behavior of the textareas when they are focused.

## Diagram

```mermaid
graph TD
    subgraph "SessionWizard.tsx"
        direction LR
        A[style tag] --> B[`.container-highlighted` class];
    end

    subgraph "globals.css"
        direction LR
        C[--golden-mustard] --> D[#C6A55F]
        E[--golden-mustard-focus] --> F[rgba(198, 165, 95, 0.2)]
    end

    B -- "uses variables from" --> C & E

    subgraph "Result"
        G["Golden mustard border and glow on container"]
    end

    B --> G
