# Step 3 Formatting Fix Plan

## Problem Analysis

The formatting difference between Step 1 and Step 3 stems from the use of different and undefined CSS classes.

1.  **In Step 1 (`SessionWizard.tsx`)**, the two-column layout for "Contributing Cause" and "Potential Assumption" is created using the CSS classes `cause-assumption-pair`, `cause-column`, and `assumption-column`. These classes are well-defined in `globals.css` to use a flexbox layout, which correctly places the two text areas side-by-side.

2.  **In Step 3 (`SessionWizard.tsx`)**, when displaying the selected causes and assumptions, the code attempts to replicate this layout using different class names: `step3-display-pair` and `step3-display-column`.

The core issue is that **`step3-display-pair` and `step3-display-column` have no corresponding styles defined in `globals.css`**. Without the necessary flexbox properties, the browser defaults to a standard block layout, stacking the "Contributing Cause" and "Potential Assumption" divs vertically instead of placing them side-by-side.

## Proposed Plan

To resolve this, I will align the class names used in Step 3 with the existing, functional styles from Step 1.

1.  **Modify `SessionWizard.tsx`:** I will update the JSX in Step 3 to reuse the CSS classes from Step 1.
    *   Replace `step3-display-pair` with `cause-assumption-pair`.
    *   Replace the first `step3-display-column` with `cause-column`.
    *   Replace the second `step3-display-column` with `assumption-column`.

This change will apply the correct two-column flexbox styling to the display elements in Step 3, making their layout identical to the input layout in Step 1.

### Diagram

```mermaid
graph TD
    subgraph Before (Incorrect)
        A["div.selectable-box.cause-assumption-box"] --> B["div.step3-display-pair"];
        B --> C["div.step3-display-column (Cause)"];
        B --> D["div.step3-display-column (Assumption)"];
    end

    subgraph After (Correct)
        E["div.selectable-box.cause-assumption-box"] --> F["div.cause-assumption-pair"];
        F --> G["div.cause-column"];
        F --> H["div.assumption-column"];
    end

    style B fill:#ffcccc,stroke:#333,stroke-width:2px
    style C fill:#ffcccc,stroke:#333,stroke-width:2px
    style D fill:#ffcccc,stroke:#333,stroke-width:2px

    style F fill:#ccffcc,stroke:#333,stroke-width:2px
    style G fill:#ccffcc,stroke:#333,stroke-width:2px
    style H fill:#ccffcc,stroke:#333,stroke-width:2px