# Plan to Update the Nuudle Session Wizard

This document outlines the plan to make two changes to the Nuudle session wizard in the Next.js application.

## Part 1: Text Change

The first change is a simple text update in the "What you can do about it?" step of the wizard.

**File to Modify:** `frontend/src/app/page.tsx`

**Current Text:**
```html
List up to five potential actions you can take for the
selected causal factor.
```

**New Text:**
```html
List up to five steps you can take to address the root cause you selected.
```

## Part 2: Flow Change

The second change is to modify the user flow of the wizard to allow users to go back from the "Fear Naming" step to the "What you can do about it?" step and be able to edit their answers.

**File to Modify:** `frontend/src/app/page.tsx`

**The Problem:**
Currently, when a user clicks the "Back" button on the "Fear Naming" step (Step 3), they are taken back to the "What you can do about it?" step (Step 2), but the component is still in "selection mode." This prevents the user from editing their previous answers or adding new ones.

**The Solution:**
I will implement a new `handleBack` function that will be called when the "Back" button on the "Fear Naming" step is clicked. This function will:
1.  Decrement the `step` state variable to navigate to the previous step.
2.  Set the `promptForSolutionSelection` state variable to `false`.

This will return the "What you can do about it?" step to its initial "input mode," allowing the user to freely edit their answers, add new ones, or select a different one to proceed with. No data will be lost in this process.

### Flow Diagram

Here is a Mermaid diagram illustrating the new flow:

```mermaid
graph TD
    subgraph "Step 2: What you can do about it?"
        direction LR
        InputMode["Input & Edit Mode<br/>(promptForSolutionSelection = false)"]
        SelectMode["Selection Mode<br/>(promptForSolutionSelection = true)"]
        InputMode --"Click 'Next'"--> SelectMode
    end

    subgraph "Step 3: Fear Naming"
        FearNaming["Fear Naming Screen"]
    end

    SelectMode --"Select an Action"--> FearNaming
    FearNaming --"Click 'Back' (New Logic)"--> InputMode