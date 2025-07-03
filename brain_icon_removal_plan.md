# Plan to Remove Brain Icon from AI Buttons

The goal of this task is to remove the brain icon that appears during the "Nuudling..." transition state when an AI button is clicked.

## Analysis

The brain icon is rendered in two components within `frontend/src/components/AIComponents.tsx`:

1.  `HelpMeNuudleButton`: This component displays a brain icon next to the "Nuudling..." text and also has an absolutely positioned brain icon as an overlay.
2.  `AIAssistButton`: This component has an absolutely positioned brain icon overlay.

## Proposed Changes

1.  **Modify `HelpMeNuudleButton`:**
    *   Remove the `<Brain>` component from the loading state.
    *   Remove the `div` containing the brain icon overlay.

2.  **Modify `AIAssistButton`:**
    *   Remove the `div` containing the brain icon overlay.

This will result in a consistent, text-only "Nuudling..." loading state for all AI-powered buttons.

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{User clicks AI Button};
    B --> C{Current: 'Nuudling...' state shows Brain Icon};
    C --> D[Plan: Remove Brain Icon from `HelpMeNuudleButton`];
    C --> E[Plan: Remove Brain Icon from `AIAssistButton`];
    D --> F{New: 'Nuudling...' state shows text only};
    E --> F;
    F --> G[End];